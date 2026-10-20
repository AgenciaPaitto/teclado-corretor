/**
 * aiService.ts — AI Copilot do teclado
 * ---------------------------------------------------------------------------
 * Fluxo:
 *   1. Lê a mensagem do cliente da Área de Transferência (Clipboard).
 *   2. Seleciona os imóveis MAIS RELEVANTES do banco local (MMKV) para não
 *      estourar tokens nem vazar o catálogo inteiro a cada chamada.
 *   3. Envia payload JSON ao backend próprio (Node.js), que chama o LLM.
 *   4. Valida a resposta e devolve 2–3 sugestões tipadas.
 *
 * 🔐 SEGURANÇA: NUNCA coloque a chave da OpenAI no app/teclado — qualquer APK
 * pode ser descompilado. O app autentica no SEU backend (Bearer JWT do login)
 * e o backend detém a OPENAI_API_KEY. Ver backend/server.ts.
 */
import Clipboard from '@react-native-clipboard/clipboard';
import type { AISuggestion, BrokerProfile, ProductFolder, SuggestionTone } from '../types';
import { Repo } from '../storage/storage';
import { formatPrice } from '../utils/formatters';

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

export const AI_CONFIG = {
  baseUrl: 'https://api.primeimoveis.com.br',
  endpoint: '/v1/copilot/suggestions',
  timeoutMs: 15_000,
  maxContextProperties: 8,
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

export interface PropertyContext {
  id: string;
  condominium: string;
  title: string;
  price: string;
  description: string;
  url: string;
}

export interface CopilotRequest {
  clientMessage: string;
  broker: Pick<BrokerProfile, 'name' | 'agency'>;
  properties: PropertyContext[];
  locale: 'pt-BR';
  maxSuggestions: number;
}

export interface CopilotResponse {
  suggestions: Array<{
    tone: SuggestionTone;
    text: string;
    referencedPropertyIds?: string[];
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
      'Copie a mensagem do cliente no WhatsApp (toque longo → Copiar) e tente novamente.',
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
export function selectRelevantProperties(
  message: string,
  folders: ProductFolder[],
  max = AI_CONFIG.maxContextProperties,
): PropertyContext[] {
  const terms = normalize(message)
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));

  const scored = folders.flatMap(f =>
    f.products.map(p => {
      const haystack = normalize(`${f.name} ${f.neighborhood ?? ''} ${p.title} ${p.shortDescription} ${p.dealType ?? ''}`);
      const score = terms.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
      const ctx: PropertyContext = {
        id: p.id,
        condominium: f.name,
        title: p.title,
        price: formatPrice(p),
        description: p.shortDescription,
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
        'X-Client': 'corretor-keyboard/1.0',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401 || res.status === 403) {
      throw new AIServiceError('UNAUTHORIZED', 'Sessão expirada. Abra o app e faça login novamente.');
    }
    if (!res.ok) {
      throw new AIServiceError('NETWORK', `Falha no servidor (HTTP ${res.status}).`);
    }
    return (await res.json()) as TRes;
  } catch (err) {
    if (err instanceof AIServiceError) throw err;
    if ((err as Error)?.name === 'AbortError') {
      throw new AIServiceError('TIMEOUT', 'A IA demorou para responder. Tente novamente.');
    }
    throw new AIServiceError('NETWORK', 'Sem conexão com a internet.');
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
    throw new AIServiceError('BAD_RESPONSE', 'Resposta inesperada da IA.');
  }
  const valid = list
    .filter(s => s && typeof s.text === 'string' && s.text.trim().length > 0)
    .slice(0, 3)
    .map((s, i) => ({
      id: `sug-${Date.now()}-${i}`,
      tone: TONES.includes(s.tone) ? s.tone : TONES[i % TONES.length],
      text: s.text.trim(),
      referencedPropertyIds: Array.isArray(s.referencedPropertyIds) ? s.referencedPropertyIds : [],
    }));

  if (valid.length === 0) {
    throw new AIServiceError('BAD_RESPONSE', 'A IA não retornou sugestões.');
  }
  return valid;
}

// ---------------------------------------------------------------------------
// Mock (offline / demo)
// ---------------------------------------------------------------------------

function mockSuggestions(req: CopilotRequest): CopilotResponse {
  const p = req.properties[0];
  return {
    suggestions: [
      {
        tone: 'cordial',
        text: `Olá, tudo bem? Sou ${req.broker.name}, da ${req.broker.agency}. Posso te enviar algumas opções alinhadas ao que você procura?`,
      },
      {
        tone: 'objetiva',
        text: p
          ? `Tenho o "${p.title}" no ${p.condominium} por ${p.price}. Ficha completa: ${p.url}`
          : 'Pode me dizer a região, número de quartos e faixa de valor?',
        referencedPropertyIds: p ? [p.id] : [],
      },
      {
        tone: 'persuasiva',
        text: 'Esse perfil de imóvel está com alta procura nesta semana. Quer agendar uma visita amanhã às 10h ou 15h?',
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
  const broker = Repo.getBroker();

  const payload: CopilotRequest = {
    clientMessage,
    broker: { name: broker.name, agency: broker.agency },
    properties: selectRelevantProperties(clientMessage, Repo.getFolders()),
    locale: 'pt-BR',
    maxSuggestions: 3,
  };

  const raw = AI_CONFIG.useMock

    ? await new Promise<CopilotResponse>(r => setTimeout(() => r(mockSuggestions(payload)), 900))
    : await postJSON<CopilotRequest, CopilotResponse>(AI_CONFIG.endpoint, payload, Repo.getAuthToken());

  return { clientMessage, suggestions: parseResponse(raw) };
}
