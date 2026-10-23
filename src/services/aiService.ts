/**
 * aiService.ts — IA do teclado
 * ---------------------------------------------------------------------------
 * Fluxo:
 *   1. Lê a mensagem do cliente da Área de Transferência (Clipboard).
 *   2. Seleciona os produtos MAIS RELEVANTES do banco local (MMKV) para não
 *      estourar tokens nem vazar o catálogo inteiro a cada chamada.
 *   3. Envia payload JSON ao backend próprio (Node.js), que chama o LLM.
 *   4. Valida a resposta e devolve 2–3 sugestões tipadas.
 *
 * 🔐 SEGURANÇA: NUNCA coloque a chave da OpenAI no app/teclado — qualquer APK
 * pode ser descompilado. O app autentica no SEU backend (Bearer JWT do login)
 * e o backend detém a OPENAI_API_KEY. Ver backend/server.ts.
 */
import Clipboard from '@react-native-clipboard/clipboard';
import type { AISuggestion, ProductFolder, SegmentId, SellerProfile, SuggestionTone } from '../types';
import { getSegment } from '../segments/segments';
import { Repo } from '../storage/storage';
import { getSellingLanguage, localeOf, t, tSell } from '../i18n';
import { attributeLines, formatPrice } from '../utils/formatters';

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

export const AI_CONFIG = {
  /** Endereço do backend de IA (backend/server.ts) — troque ao publicar. */
  baseUrl: 'https://seu-servidor.com.br',
  endpoint: '/v1/copilot/suggestions',
  timeoutMs: 15_000,
  maxContextProducts: 8,
  maxMessageChars: 2_000,
  /**
   * true → responde localmente sem rede (demonstração).
   * Mantenha true até publicar o backend (backend/server.ts) e atualizar `baseUrl`.
   */
  useMock: true,
} as const;

// ---------------------------------------------------------------------------
// Contratos da API (request/response)
// ---------------------------------------------------------------------------

export interface ProductContext {
  id: string;
  /** Nome da pasta / categoria do produto. */
  folder: string;
  title: string;
  price: string;
  description: string;
  /** Características do ramo, já formatadas ("Quartos: 3", "Área: 85 m²"). */
  details: string[];
  url: string;
}

export interface CopilotRequest {
  clientMessage: string;
  seller: Pick<SellerProfile, 'name' | 'business'>;
  /** Ramo do negócio: o backend escolhe a orientação da IA por ele. */
  segment: SegmentId;
  products: ProductContext[];
  /** Idioma em que a IA responde ao cliente (o de venda): "pt-BR", "en-US" ou "es". */
  locale: string;
  maxSuggestions: number;
}

export interface CopilotResponse {
  suggestions: Array<{
    tone: SuggestionTone;
    text: string;
    referencedProductIds?: string[];
  }>;
}

export interface AnalysisResult {
  clientMessage: string;
  suggestions: AISuggestion[];
}

export type AIErrorCode =
  | 'EMPTY_CLIPBOARD'
  | 'UNAUTHORIZED'
  | 'TIMEOUT'
  | 'NETWORK'
  | 'BAD_RESPONSE';

export class AIServiceError extends Error {
  constructor(public readonly code: AIErrorCode, message: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// ---------------------------------------------------------------------------
// 1) Clipboard
// ---------------------------------------------------------------------------

/**
 * Android 10+: apenas o app em foco OU o IME padrão podem ler o clipboard —
 * como somos o IME ativo, a leitura é permitida.
 * iOS: requer "Permitir Acesso Total" (RequestsOpenAccess) no teclado.
 */
export async function readClipboardMessage(): Promise<string> {
  const hasText = await Clipboard.hasString().catch(() => true);
  const raw = hasText ? await Clipboard.getString() : '';
  const text = raw.trim().slice(0, AI_CONFIG.maxMessageChars);
  if (!text) {
    throw new AIServiceError(
      'EMPTY_CLIPBOARD',
      t('Copie a mensagem do cliente no WhatsApp (toque longo → Copiar) e tente novamente.'),
    );
  }
  return text;
}

// ---------------------------------------------------------------------------
// 2) Seleção de contexto (RAG local simplificado)
// ---------------------------------------------------------------------------

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const STOPWORDS = new Set(['de', 'da', 'do', 'e', 'o', 'a', 'um', 'uma', 'com', 'para', 'que', 'tem', 'no', 'na']);

/** Pontua produtos por sobreposição de termos com a mensagem do cliente. */
export function selectRelevantProducts(
  message: string,
  folders: ProductFolder[],
  segment: SegmentId = 'general',
  max = AI_CONFIG.maxContextProducts,
): ProductContext[] {
  const terms = normalize(message)
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));

  const scored = folders.flatMap(f =>
    f.products.map(p => {
      // No idioma de venda: é o que a IA repete para o cliente
      const details = attributeLines(p, segment, getSellingLanguage());
      const haystack = normalize(
        `${f.name} ${f.description ?? ''} ${p.title} ${p.shortDescription} ${details.join(' ')}`,
      );
      const score = terms.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
      const ctx: ProductContext = {
        id: p.id,
        folder: f.name,
        title: p.title,
        price: formatPrice(p, segment, getSellingLanguage()),
        description: p.shortDescription,
        details,
        url: p.datasheetUrl,
      };
      return { ctx, score };
    }),
  );

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(s => s.ctx);
}

// ---------------------------------------------------------------------------
// 3) HTTP
// ---------------------------------------------------------------------------

async function postJSON<TReq, TRes>(path: string, body: TReq, token?: string): Promise<TRes> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);

  try {
    const res = await fetch(`${AI_CONFIG.baseUrl}${path}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Client': 'keycon/1.0',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401 || res.status === 403) {
      throw new AIServiceError('UNAUTHORIZED', t('Sessão expirada. Abra o app e faça login novamente.'));
    }
    if (!res.ok) {
      throw new AIServiceError('NETWORK', t('Falha no servidor (HTTP {status}).', { status: res.status }));
    }
    return (await res.json()) as TRes;
  } catch (err) {
    if (err instanceof AIServiceError) throw err;
    if ((err as Error)?.name === 'AbortError') {
      throw new AIServiceError('TIMEOUT', t('A IA demorou para responder. Tente novamente.'));
    }
    throw new AIServiceError('NETWORK', t('Sem conexão com a internet.'));
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// 4) Validação da resposta (nunca confie no formato vindo de um LLM)
// ---------------------------------------------------------------------------

const TONES: SuggestionTone[] = ['cordial', 'objetiva', 'persuasiva'];

function parseResponse(json: unknown): AISuggestion[] {
  const list = (json as CopilotResponse)?.suggestions;
  if (!Array.isArray(list)) {
    throw new AIServiceError('BAD_RESPONSE', t('Resposta inesperada da IA.'));
  }
  const valid = list
    .filter(s => s && typeof s.text === 'string' && s.text.trim().length > 0)
    .slice(0, 3)
    .map((s, i) => ({
      id: `sug-${Date.now()}-${i}`,
      tone: TONES.includes(s.tone) ? s.tone : TONES[i % TONES.length],
      text: s.text.trim(),
      referencedProductIds: Array.isArray(s.referencedProductIds) ? s.referencedProductIds : [],
    }));

  if (valid.length === 0) {
    throw new AIServiceError('BAD_RESPONSE', t('A IA não retornou sugestões.'));
  }
  return valid;
}

// ---------------------------------------------------------------------------
// Mock (offline / demo)
// ---------------------------------------------------------------------------

function mockSuggestions(req: CopilotRequest): CopilotResponse {
  const p = req.products[0];
  const { item } = getSegment(req.segment, getSellingLanguage()).terms;
  return {
    suggestions: [
      {
        tone: 'cordial',
        text: tSell('Olá, tudo bem? Sou {name}, da {business}. Posso te enviar algumas opções alinhadas ao que você procura?', { name: req.seller.name, business: req.seller.business }),
      },
      {
        tone: 'objetiva',
        text: p
          ? tSell('Tenho o "{title}" por {price}.{v}', { title: p.title, price: p.price, v: p.url ? ` ${tSell('Veja mais: {url}', { url: p.url })}` : '' })
          : tSell('Pode me dizer o que você procura e a faixa de valor?'),
        referencedProductIds: p ? [p.id] : [],
      },
      {
        tone: 'persuasiva',
        text: tSell('Esse {item} está com bastante procura nesta semana. Quer que eu já veja a melhor condição para você?', { item }),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Lê o clipboard, monta o contexto e retorna as sugestões.
 * Chamado pelo botão "Analisar Mensagem Recebida" (AICopilotTab).
 */
export async function analyzeClipboardMessage(): Promise<AnalysisResult> {
  const clientMessage = await readClipboardMessage();
  const seller = Repo.getSeller();

  const payload: CopilotRequest = {
    clientMessage,
    seller: { name: seller.name, business: seller.business },
    segment: seller.segment,
    products: selectRelevantProducts(clientMessage, Repo.getFolders(), seller.segment),
    locale: localeOf(getSellingLanguage()),
    maxSuggestions: 3,
  };

  const raw = AI_CONFIG.useMock

    ? await new Promise<CopilotResponse>(r => setTimeout(() => r(mockSuggestions(payload)), 900))
    : await postJSON<CopilotRequest, CopilotResponse>(AI_CONFIG.endpoint, payload, Repo.getAuthToken());

  return { clientMessage, suggestions: parseResponse(raw) };
}
