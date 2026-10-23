/**
 * Modelos de domínio compartilhados entre App principal e Teclado.
 */

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  title: string;
  /** URL hospedada na nuvem (CDN / Cloud Storage - sem consumo de memória no aparelho). */
  url: string;
  thumbnailUrl?: string;
  duration?: string;
  /** Caminho no Storage quando o arquivo foi enviado pelo app (vazio = link externo). */
  storagePath?: string;
}

/**
 * Característica de um produto (ex.: "Quartos: 3", "Ano: 2022"). Os campos
 * sugeridos vêm do ramo; o rótulo fica gravado junto para a ficha continuar
 * certa mesmo se o usuário trocar de ramo depois.
 */
export interface ProductAttribute {
  key: string;
  label: string;
  value: string;
}

/** Qualquer produto ou serviço que o usuário vende. */
export interface Product {
  id: string;
  title: string;
  /** 0 = sem preço fixo ("Sob consulta"), quando o ramo permite. */
  price: number;
  shortDescription: string;
  attributes?: ProductAttribute[];
  /** Link da página do produto (loja, catálogo, Drive...). Vazio = sem link. */
  datasheetUrl: string;
  photos: MediaItem[];
  videos: MediaItem[];
}

/** Pasta / categoria de produtos (ex.: "Linha Verão", "Acessórios"). */
export interface ProductFolder {
  id: string;
  name: string;
  /** Descrição curta da pasta (opcional). */
  description?: string;
  products: Product[];
}

export interface TextShortcut {
  id: string;
  title: string;
  text: string;
}

export interface AudioShortcut {
  id: string;
  title: string;
  duration: string;
  audioUrl: string;
  transcript: string;
  /** Caminho no Storage quando o áudio foi gravado ou enviado pelo app. */
  storagePath?: string;
}

export interface ShortcutsData {
  texts: TextShortcut[];
  audios: AudioShortcut[];
}

/** Ramo do negócio, escolhido no cadastro (ver src/segments). */
export type SegmentId =
  | 'general'
  | 'real_estate'
  | 'insurance'
  | 'food'
  | 'legal'
  | 'retail'
  | 'beauty'
  | 'automotive';

/** Perfil de quem vende (usado nas mensagens prontas e na IA). */
export interface SellerProfile {
  name: string;
  /** Nome do negócio / loja / empresa. */
  business: string;
  phone: string;
  segment: SegmentId;
}

export type SuggestionTone = 'cordial' | 'objetiva' | 'persuasiva';

export interface AISuggestion {
  id: string;
  tone: SuggestionTone;
  text: string;
  referencedProductIds?: string[];
}

export type ThemePreference = 'dark' | 'light' | 'system';

export type AgendaKind = 'meeting' | 'task';

/** Compromisso da agenda: reunião (com hora) ou tarefa. Mesmo dado no app e no teclado. */
export interface ScheduleItem {
  id: string;
  kind: AgendaKind;
  title: string;
  /** Dia no formato AAAA-MM-DD. */
  date: string;
  /** HH:MM; sem hora = o dia todo. */
  time?: string;
  /** Cliente do CRM ligado ao compromisso. */
  clientId?: string;
  clientName?: string;
  notes?: string;
  done: boolean;
}

/** Cliente no funil de vendas (CRM). */
export interface CRMLead {
  id: string;
  clientName: string;
  phone: string;
  /** Uma das etapas do funil do ramo (SegmentProfile.crmStages). */
  stage: string;
  /** Último contato (ISO). */
  lastContactAt?: string;
  /** Texto livre de versões antigas ("Hoje, 14:32"). */
  lastContact?: string;
  notes?: string;
  createdAt?: string;
}

/** 4 botões principais do menu inferior fixo + tela de digitação */
export type MainSystemTab = 'products' | 'shortcuts' | 'copilot' | 'more' | 'keyboard';

export type MoreSubMenu = 'agenda' | 'crm' | 'settings' | 'diagnostics' | null;

export interface KeyboardData {
  seller: SellerProfile;
  folders: ProductFolder[];
  shortcuts: ShortcutsData;
  agenda: ScheduleItem[];
  crm: CRMLead[];
  theme: ThemePreference;
}
