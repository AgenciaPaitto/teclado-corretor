/**
 * Dados iniciais (demo) — Produtos com fotos/vídeos em nuvem, atalhos de texto e áudio, agenda e CRM.
 */
import type { KeyboardData } from '../types';

export const SEED_DATA: KeyboardData = {
  broker: {
    name: 'Ana Souza',
    creci: '123456-F',
    agency: 'Prime Imóveis',
    phone: '(11) 98888-7777',
  },
  theme: 'dark',
  folders: [
    {
      id: 'villa-bella',
      name: 'Condomínio Villa Bella',
      neighborhood: 'Alphaville',
      products: [
        {
          id: 'vb-01',
          title: 'Casa térrea 3 suítes',
          price: 1850000,
          shortDescription: '320 m², piscina, espaço gourmet, 4 vagas.',
          datasheetUrl: 'https://primeimoveis.com.br/imovel/vb-01',
          bedrooms: 3,
          areaM2: 320,
          dealType: 'venda',
          photos: [
            {
              id: 'p1',
              type: 'image',
              title: 'Fachada frontal',
              url: 'https://storage.googleapis.com/imoveis-cdn/vb01/fachada.jpg',
            },
            {
              id: 'p2',
              type: 'image',
              title: 'Living integrado',
              url: 'https://storage.googleapis.com/imoveis-cdn/vb01/living.jpg',
            },
            {
              id: 'p3',
              type: 'image',
              title: 'Área gourmet e piscina',
              url: 'https://storage.googleapis.com/imoveis-cdn/vb01/piscina.jpg',
            },
          ],
          videos: [
            {
              id: 'v1',
              type: 'video',
              title: 'Tour completo em vídeo',
              url: 'https://storage.googleapis.com/imoveis-cdn/vb01/tour.mp4',
              duration: '1:45',
            },
          ],
        },
        {
          id: 'vb-02',
          title: 'Sobrado 4 dormitórios com vista',
          price: 2400000,
          shortDescription: '410 m², vista para o lago, energia solar.',
          datasheetUrl: 'https://primeimoveis.com.br/imovel/vb-02',
          bedrooms: 4,
          areaM2: 410,
          dealType: 'venda',
          photos: [
            {
              id: 'p4',
              type: 'image',
              title: 'Vista panorâmica do lago',
              url: 'https://storage.googleapis.com/imoveis-cdn/vb02/lago.jpg',
            },
          ],
          videos: [],
        },
      ],
    },
    {
      id: 'residencial-central',
      name: 'Residencial Central',
      neighborhood: 'Centro',
      products: [
        {
          id: 'rc-01',
          title: 'Apartamento 2 dormitórios mobiliado',
          price: 3200,
          shortDescription: '68 m², varanda, 1 vaga, próximo ao metrô.',
          datasheetUrl: 'https://primeimoveis.com.br/imovel/rc-01',
          bedrooms: 2,
          areaM2: 68,
          dealType: 'locacao',
          photos: [
            {
              id: 'p5',
              type: 'image',
              title: 'Varanda gourmet',
              url: 'https://storage.googleapis.com/imoveis-cdn/rc01/varanda.jpg',
            },
          ],
          videos: [],
        },
      ],
    },
  ],
  shortcuts: {
    texts: [
      {
        id: 't1',
        title: 'Saudação inicial',
        text: 'Olá, tudo bem? Aqui é a Ana Souza da Prime Imóveis. Como posso te auxiliar na busca do seu imóvel?',
      },
      {
        id: 't2',
        title: 'Agendamento de visita',
        text: 'Perfeito. Tenho disponibilidade para visita amanhã às 10h ou às 15h. Qual horário fica mais conveniente para você?',
      },
      {
        id: 't3',
        title: 'Chave Pix imobiliária',
        text: 'Chave Pix (CNPJ): 12.345.678/0001-90 — Prime Imóveis Consultoria Ltda.',
      },
      {
        id: 't4',
        title: 'Documentos para contrato',
        text: 'Documentos necessários:\n- RG e CPF\n- Comprovante de residência atualizado\n- Comprovante de renda dos 3 últimos meses\n- Certidão de estado civil',
      },
    ],
    audios: [
      {
        id: 'a1',
        title: 'Apresentação cordial',
        duration: '0:24',
        audioUrl: 'https://storage.googleapis.com/imoveis-cdn/audios/apresentacao-ana.mp3',
        transcript: 'Oi, tudo bem? Vi seu interesse no imóvel e gravei este áudio para me apresentar...',
      },
      {
        id: 'a2',
        title: 'Explicação sobre documentação',
        duration: '0:42',
        audioUrl: 'https://storage.googleapis.com/imoveis-cdn/audios/doc-explicacao.mp3',
        transcript: 'Sobre a documentação, é super simples. Você pode me enviar fotos legíveis pelo WhatsApp mesmo...',
      },
    ],
  },
  agenda: [
    {
      id: 'ag-1',
      client: 'Carlos Oliveira',
      productTitle: 'Casa térrea 3 suítes (Villa Bella)',
      datetime: 'Amanhã, 10:00',
      status: 'confirmada',
    },
    {
      id: 'ag-2',
      client: 'Juliana Mendes',
      productTitle: 'Apartamento mobiliado (Residencial Central)',
      datetime: 'Sexta-feira, 15:30',
      status: 'agendada',
    },
  ],
  crm: [
    {
      id: 'crm-1',
      clientName: 'Carlos Oliveira',
      phone: '(11) 99876-5432',
      stage: 'Visita Agendada',
      lastContact: 'Hoje, 14:32',
    },
    {
      id: 'crm-2',
      clientName: 'Mariana Duarte',
      phone: '(11) 98765-4321',
      stage: 'Proposta',
      lastContact: 'Ontem',
    },
  ],
};
