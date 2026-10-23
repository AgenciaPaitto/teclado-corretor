/**
 * backend/server.ts — Rota de exemplo (Node.js + Express) para a IA do KEYCON.
 *
 *   npm i express
 *   OPENAI_API_KEY=sk-... JWT_SECRET=... npx tsx backend/server.ts
 *
 * O teclado chama POST /v1/copilot/suggestions; este servidor detém a chave
 * da OpenAI e força uma saída JSON estruturada (json_schema).
 */
import express, { type Request, type Response, type NextFunction } from 'express';
// Mesmo cadastro de ramos do app (orientação da IA por ramo)
import { getSegment } from '../src/segments/segments';

const app = express();
app.use(express.json({ limit: '64kb' }));

// Autenticação simplificada — substitua por verificação real de JWT.
function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.header('authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  next();
}

/** Idioma das respostas: o de venda do usuário (campo locale do pedido). */
const LANGUAGE_NAME: Record<string, string> = {
  'pt-BR': 'português do Brasil',
  'en-US': 'inglês (English)',
  es: 'espanhol (español)',
};

const systemPrompt = (locale: string) => `Você é um assistente de vendas de um vendedor, que pode vender
qualquer produto ou serviço. Gere respostas CURTAS (máx. 3 frases) para WhatsApp, em
${LANGUAGE_NAME[locale] ?? LANGUAGE_NAME['pt-BR']}, com no máximo 1 emoji. Use SOMENTE os produtos fornecidos no
contexto; nunca invente preços, prazos ou características. Gere exatamente 3 sugestões
com tons: "cordial", "objetiva" e "persuasiva". Se citar um produto com link, inclua o link.
Os nomes dos tons no JSON ("cordial", "objetiva", "persuasiva") ficam sempre assim; só o texto muda de idioma.`;

const RESPONSE_SCHEMA = {
  name: 'copilot_suggestions',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['suggestions'],
    properties: {
      suggestions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['tone', 'text', 'referencedProductIds'],
          properties: {
            tone: { type: 'string', enum: ['cordial', 'objetiva', 'persuasiva'] },
            text: { type: 'string' },
            referencedProductIds: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
};

app.post('/v1/copilot/suggestions', auth, async (req, res) => {
  const { clientMessage, seller, products, segment, locale } = req.body ?? {};
  // Ramo desconhecido ou ausente (versão antiga do app) = geral
  const profile = getSegment(segment);
  if (typeof clientMessage !== 'string' || !clientMessage.trim()) {
    return res.status(400).json({ error: 'clientMessage obrigatório' });
  }

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.6,
        response_format: { type: 'json_schema', json_schema: RESPONSE_SCHEMA },
        messages: [
          {
            role: 'system',
            content: `${systemPrompt(typeof locale === 'string' ? locale : 'pt-BR')}\n\nRamo do negócio: ${profile.label}. ${profile.aiGuidelines}`,
          },
          {
            role: 'user',
            content: JSON.stringify({
              vendedor: seller,
              produtosDisponiveis: products,
              mensagemDoCliente: clientMessage,
            }),
          },
        ],
      }),
    });

    if (!r.ok) return res.status(502).json({ error: 'llm_error' });
    const data = await r.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    return res.json(parsed); // { suggestions: [...] }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

app.listen(process.env.PORT ?? 3333, () => console.log('Copilot API on :3333'));
