/**
 * backend/server.ts — Rota de exemplo (Node.js + Express) para o AI Copilot.
 *
 *   npm i express
 *   OPENAI_API_KEY=sk-... JWT_SECRET=... npx tsx backend/server.ts
 *
 * O teclado chama POST /v1/copilot/suggestions; este servidor detém a chave
 * da OpenAI e força uma saída JSON estruturada (json_schema).
 */
import express, { type Request, type Response, type NextFunction } from 'express';

const app = express();
app.use(express.json({ limit: '64kb' }));

// Autenticação simplificada — substitua por verificação real de JWT.
function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.header('authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  next();
}

const SYSTEM_PROMPT = `Você é um assistente de um corretor de imóveis brasileiro.
Gere respostas CURTAS (máx. 3 frases) para WhatsApp, em português do Brasil,
com no máximo 1 emoji. Use SOMENTE os imóveis fornecidos no contexto; nunca
invente preços ou endereços. Gere exatamente 3 sugestões com tons:
"cordial", "objetiva" e "persuasiva". Se citar um imóvel, inclua o link da ficha.`;

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
          required: ['tone', 'text', 'referencedPropertyIds'],
          properties: {
            tone: { type: 'string', enum: ['cordial', 'objetiva', 'persuasiva'] },
            text: { type: 'string' },
            referencedPropertyIds: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
};

app.post('/v1/copilot/suggestions', auth, async (req, res) => {
  const { clientMessage, broker, properties } = req.body ?? {};
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
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({
              corretor: broker,
              imoveisDisponiveis: properties,
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
