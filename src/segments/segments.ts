/**
 * Perfis de ramo — o que muda no app conforme o negócio de quem vende.
 * ---------------------------------------------------------------------------
 * Um único app; cada ramo é só configuração: nomes das telas, campos dos
 * produtos, preço, etapas do CRM, mensagem de retorno e orientação da IA.
 * O ramo "general" é o app genérico (qualquer produto ou serviço) e vale
 * sempre que o ramo for desconhecido.
 *
 * Fora daqui de propósito:
 *  - registro profissional (a maioria dos negócios atendidos é dos EUA);
 *  - dicionário do teclado: o corretor é um só, completo, para o dia a dia.
 *
 * Para criar um ramo: some o id em SegmentId (src/types), um perfil abaixo e
 * os dados de exemplo em ./demos.ts.
 *
 * Este arquivo também é lido pelo backend (orientação da IA): sem imports de
 * código, só de tipos.
 */
import type { IconName } from '../keyboard/components/Icon';
import type { Product, SegmentId } from '../types';

export interface SegmentField {
  key: string;
  label: string;
  placeholder: string;
  /** text (padrão), number (teclado numérico) ou choice (botões com as opções). */
  kind?: 'text' | 'number' | 'choice';
  options?: string[];
  /** Vai depois do valor na ficha (ex.: "m²", "km"). */
  unit?: string;
}

export interface SegmentProfile {
  id: SegmentId;
  /** Nome do ramo no cadastro. */
  label: string;
  /** Linha de apoio no cartão do cadastro. */
  description: string;
  icon: IconName;
  terms: {
    /** Nome do catálogo nos menus (app e teclado): "Imóveis", "Cardápio"... */
    catalog: string;
    /** Um item do catálogo, minúsculo: "imóvel", "plano", "item". */
    item: string;
    items: string;
  };
  examples: {
    folderName: string;
    folderDescription: string;
    itemTitle: string;
    itemDescription: string;
  };
  /** Campos extras do produto, nesta ordem. */
  fields: SegmentField[];
  price: {
    label: string;
    placeholder: string;
    /** true = pode ficar em branco ("Sob consulta"). */
    optional: boolean;
    /** Antes do valor, ex.: "a partir de". */
    prefix?: string;
    /** Depois do valor, ex.: "/mês" (pode depender do produto). */
    suffix?: string | ((p: Pick<Product, 'attributes'>) => string);
  };
  /** Etapas do funil de clientes (CRM), na ordem. */
  crmStages: string[];
  /** Mensagem ao tocar num cliente do CRM no teclado. {{cliente}} = nome dele. */
  followUp: string;
  /** Orientação extra para a IA (enviada pelo backend ao modelo). */
  aiGuidelines: string;
}

const GENERAL: SegmentProfile = {
  id: 'general',
  label: 'Geral',
  description: 'Qualquer produto ou serviço',
  icon: 'etiquetas',
  terms: { catalog: 'Produtos', item: 'produto', items: 'produtos' },
  examples: {
    folderName: 'Ex: Mais vendidos, Promoções, Serviços',
    folderDescription: 'Ex: Itens com pronta entrega',
    itemTitle: 'Ex: Kit presente',
    itemDescription: 'Detalhes, condições, prazo de entrega...',
  },
  fields: [],
  price: { label: 'Preço', placeholder: 'Ex: 89,90', optional: true },
  crmStages: ['Novo Lead', 'Em Atendimento', 'Negociação', 'Proposta', 'Fechamento'],
  followUp: 'Olá, {{cliente}}! Ficou com alguma dúvida sobre o produto? Estou à disposição para te ajudar!',
  aiGuidelines: 'Vendedor de produtos ou serviços variados. Tom simpático e direto.',
};

export const SEGMENTS: SegmentProfile[] = [
  {
    id: 'real_estate',
    label: 'Imobiliária',
    description: 'Venda e locação de imóveis',
    icon: 'casa',
    terms: { catalog: 'Imóveis', item: 'imóvel', items: 'imóveis' },
    examples: {
      folderName: 'Ex: Apartamentos, Casas, Lançamentos',
      folderDescription: 'Ex: Zona Sul',
      itemTitle: 'Ex: Apartamento 2 quartos no Centro',
      itemDescription: 'Diferenciais, condomínio, documentação...',
    },
    fields: [
      { key: 'purpose', label: 'Finalidade', placeholder: '', kind: 'choice', options: ['Venda', 'Locação'] },
      { key: 'type', label: 'Tipo', placeholder: 'Ex: Apartamento, casa, terreno' },
      { key: 'location', label: 'Bairro / região', placeholder: 'Ex: Centro' },
      { key: 'bedrooms', label: 'Quartos', placeholder: 'Ex: 3', kind: 'number' },
      { key: 'bathrooms', label: 'Banheiros', placeholder: 'Ex: 2', kind: 'number' },
      { key: 'parking', label: 'Vagas', placeholder: 'Ex: 1', kind: 'number' },
      { key: 'area', label: 'Área', placeholder: 'Ex: 85', kind: 'number', unit: 'm²' },
    ],
    price: {
      label: 'Valor',
      placeholder: 'Ex: 450.000',
      optional: true,
      suffix: p => (attributeValue(p, 'purpose') === 'Locação' ? '/mês' : ''),
    },
    crmStages: ['Novo contato', 'Visita agendada', 'Proposta', 'Documentação', 'Fechado'],
    followUp:
      'Olá, {{cliente}}! Ficou com alguma dúvida sobre o imóvel? Posso agendar uma visita para você conhecer pessoalmente.',
    aiGuidelines:
      'Imobiliária / corretor de imóveis. Destaque localização, metragem e diferenciais; ofereça agendar uma visita; nunca invente valores de condomínio, impostos ou condições de financiamento.',
  },
  {
    id: 'insurance',
    label: 'Seguros',
    description: 'Auto, vida, saúde, residencial',
    icon: 'escudo',
    terms: { catalog: 'Planos', item: 'plano', items: 'planos' },
    examples: {
      folderName: 'Ex: Auto, Vida, Residencial, Saúde',
      folderDescription: 'Ex: Planos individuais e familiares',
      itemTitle: 'Ex: Seguro Auto Completo',
      itemDescription: 'O que cobre, carências, assistências...',
    },
    fields: [
      { key: 'insurer', label: 'Seguradora', placeholder: 'Ex: Nome da seguradora' },
      { key: 'coverage', label: 'Coberturas', placeholder: 'Ex: Colisão, roubo e terceiros' },
      { key: 'deductible', label: 'Franquia', placeholder: 'Ex: R$ 2.500' },
      { key: 'term', label: 'Vigência', placeholder: 'Ex: 12 meses' },
    ],
    price: { label: 'Valor mensal', placeholder: 'Ex: 89,90', optional: true, prefix: 'a partir de', suffix: '/mês' },
    crmStages: ['Novo contato', 'Cotação', 'Proposta enviada', 'Apólice emitida', 'Renovação'],
    followUp:
      'Olá, {{cliente}}! Conseguiu ver a cotação que te enviei? Posso tirar qualquer dúvida sobre as coberturas.',
    aiGuidelines:
      'Corretor de seguros. Explique as coberturas em linguagem simples, sem jargão; nunca prometa cobertura que não esteja descrita no plano; ofereça uma cotação personalizada.',
  },
  {
    id: 'food',
    label: 'Restaurante',
    description: 'Restaurante, lanchonete, delivery',
    icon: 'talheres',
    terms: { catalog: 'Cardápio', item: 'item', items: 'itens' },
    examples: {
      folderName: 'Ex: Lanches, Pizzas, Bebidas, Sobremesas',
      folderDescription: 'Ex: Servidos até as 23h',
      itemTitle: 'Ex: X-Burguer artesanal',
      itemDescription: 'Ingredientes, acompanhamentos, adicionais...',
    },
    fields: [
      { key: 'serves', label: 'Porção', placeholder: 'Ex: Serve 2 pessoas' },
      { key: 'prepTime', label: 'Tempo de preparo', placeholder: 'Ex: 30 min' },
      { key: 'dietary', label: 'Opções', placeholder: 'Ex: Vegano, sem glúten' },
    ],
    price: { label: 'Preço', placeholder: 'Ex: 39,90', optional: false },
    crmStages: ['Novo pedido', 'Em preparo', 'Saiu para entrega', 'Entregue'],
    followUp: 'Olá, {{cliente}}! Que tal repetir o pedido hoje? Posso te mandar o cardápio do dia.',
    aiGuidelines:
      'Restaurante / delivery. Tom rápido, informal e apetitoso; informe preço e tempo de preparo; sugira uma bebida ou sobremesa como complemento; nunca invente taxa ou prazo de entrega.',
  },
  {
    id: 'legal',
    label: 'Advocacia',
    description: 'Escritórios e advogados',
    icon: 'balanca',
    terms: { catalog: 'Serviços', item: 'serviço', items: 'serviços' },
    examples: {
      folderName: 'Ex: Trabalhista, Família, Empresarial',
      folderDescription: 'Ex: Atendimento para pessoas físicas',
      itemTitle: 'Ex: Consulta inicial',
      itemDescription: 'Como funciona, documentos necessários, prazos...',
    },
    fields: [
      { key: 'practiceArea', label: 'Área', placeholder: 'Ex: Direito de família' },
      {
        key: 'format',
        label: 'Atendimento',
        placeholder: '',
        kind: 'choice',
        options: ['Presencial', 'Online', 'Presencial ou online'],
      },
      { key: 'duration', label: 'Prazo estimado', placeholder: 'Ex: 30 dias' },
    ],
    price: { label: 'Honorários', placeholder: 'Ex: 350,00', optional: true },
    crmStages: ['Novo contato', 'Consulta agendada', 'Proposta de honorários', 'Contratado', 'Em andamento'],
    followUp:
      'Olá, {{cliente}}! Ficou com alguma dúvida sobre o atendimento? Se preferir, podemos agendar uma conversa.',
    aiGuidelines:
      'Escritório de advocacia. Tom sóbrio, profissional e informativo; nunca prometa resultado de processo nem dê parecer jurídico definitivo por mensagem; evite linguagem de promoção ou pressão (no tom "persuasiva", apenas destaque a experiência e a disponibilidade); ofereça agendar uma consulta.',
  },
  {
    id: 'retail',
    label: 'Loja e varejo',
    description: 'Roupas, acessórios, eletrônicos...',
    icon: 'sacola',
    terms: { catalog: 'Produtos', item: 'produto', items: 'produtos' },
    examples: {
      folderName: 'Ex: Coleção Verão, Acessórios',
      folderDescription: 'Ex: Roupas e moda praia',
      itemTitle: 'Ex: Vestido midi floral',
      itemDescription: 'Materiais, detalhes, prazo de entrega...',
    },
    fields: [
      { key: 'sizes', label: 'Tamanhos', placeholder: 'Ex: P, M, G' },
      { key: 'colors', label: 'Cores', placeholder: 'Ex: Preto, azul, vermelho' },
      { key: 'stock', label: 'Disponibilidade', placeholder: '', kind: 'choice', options: ['Pronta entrega', 'Sob encomenda'] },
    ],
    price: { label: 'Preço', placeholder: 'Ex: 189,90', optional: false },
    crmStages: ['Novo contato', 'Em atendimento', 'Aguardando pagamento', 'Enviado', 'Entregue'],
    followUp: 'Olá, {{cliente}}! Ficou com alguma dúvida sobre o produto? Ainda tenho disponível para você.',
    aiGuidelines:
      'Loja / varejo. Tom simpático; informe tamanhos, cores e disponibilidade; ofereça as formas de pagamento e entrega; crie senso de oportunidade sem inventar estoque ou promoções.',
  },
  {
    id: 'beauty',
    label: 'Beleza e estética',
    description: 'Salão, barbearia, clínica estética',
    icon: 'tesoura',
    terms: { catalog: 'Serviços', item: 'serviço', items: 'serviços' },
    examples: {
      folderName: 'Ex: Cabelo, Unhas, Estética',
      folderDescription: 'Ex: Atendimento com hora marcada',
      itemTitle: 'Ex: Corte e escova',
      itemDescription: 'O que inclui, cuidados antes e depois...',
    },
    fields: [
      { key: 'duration', label: 'Duração', placeholder: 'Ex: 1h30' },
      { key: 'professional', label: 'Profissional', placeholder: 'Ex: Carla' },
    ],
    price: { label: 'Preço', placeholder: 'Ex: 120,00', optional: true },
    crmStages: ['Novo contato', 'Horário agendado', 'Atendido', 'Retorno'],
    followUp: 'Olá, {{cliente}}! Que tal já agendar seu próximo horário? Tenho alguns horários livres esta semana.',
    aiGuidelines:
      'Salão de beleza / estética. Tom acolhedor; informe duração e valor; ofereça horários para agendar; nunca prometa resultado estético garantido.',
  },
  {
    id: 'automotive',
    label: 'Veículos',
    description: 'Carros, motos, seminovos',
    icon: 'carro',
    terms: { catalog: 'Veículos', item: 'veículo', items: 'veículos' },
    examples: {
      folderName: 'Ex: Seminovos, 0 km, Motos',
      folderDescription: 'Ex: Revisados e com garantia',
      itemTitle: 'Ex: Hatch 1.0 completo 2022',
      itemDescription: 'Opcionais, revisões, estado de conservação...',
    },
    fields: [
      { key: 'year', label: 'Ano', placeholder: 'Ex: 2022/2023' },
      { key: 'mileage', label: 'Quilometragem', placeholder: 'Ex: 35.000', kind: 'number', unit: 'km' },
      { key: 'transmission', label: 'Câmbio', placeholder: '', kind: 'choice', options: ['Manual', 'Automático'] },
      { key: 'fuel', label: 'Combustível', placeholder: 'Ex: Flex' },
      { key: 'color', label: 'Cor', placeholder: 'Ex: Prata' },
    ],
    price: { label: 'Preço', placeholder: 'Ex: 72.900', optional: false },
    crmStages: ['Novo contato', 'Test drive', 'Proposta', 'Financiamento', 'Vendido'],
    followUp: 'Olá, {{cliente}}! Ficou com alguma dúvida sobre o veículo? Posso agendar um test drive para você.',
    aiGuidelines:
      'Loja de veículos. Destaque ano, quilometragem e opcionais; ofereça test drive e avaliação do usado na troca; nunca invente condições de financiamento.',
  },
  // O ramo geral fica por último na lista do cadastro ("Outro / Geral")
  GENERAL,
];

const BY_ID = new Map(SEGMENTS.map(s => [s.id, s]));

export function isSegmentId(value: unknown): value is SegmentId {
  return typeof value === 'string' && BY_ID.has(value as SegmentId);
}

/** Perfil do ramo; ramo desconhecido (dado antigo ou de outra versão) = geral. */
export function getSegment(id: SegmentId | string | null | undefined): SegmentProfile {
  return BY_ID.get(id as SegmentId) ?? GENERAL;
}

export function attributeValue(p: Pick<Product, 'attributes'>, key: string): string {
  return p.attributes?.find(a => a.key === key)?.value ?? '';
}

/** "imóvel" → "Imóvel" (títulos como "Novo imóvel" usam o termo como está). */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
