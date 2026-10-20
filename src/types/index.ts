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
}

export interface Product {
  id: string;
  title: string;
  price: number;
  shortDescription: string;
  datasheetUrl: string;
  bedrooms?: number;
  areaM2?: number;
  dealType?: 'venda' | 'locacao';
  photos: MediaItem[];
  videos: MediaItem[];
}

export interface ProductFolder {
  id: string;
  name: string;
  neighborhood?: string;
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
}

export interface ShortcutsData {
  texts: TextShortcut[];
  audios: AudioShortcut[];
}

export interface BrokerProfile {
  name: string;
  creci: string;
  agency: string;
  phone: string;
}

export type SuggestionTone = 'cordial' | 'objetiva' | 'persuasiva';

export interface AISuggestion {
  id: string;
  tone: SuggestionTone;
  text: string;
  referencedPropertyIds?: string[];
}

export type ThemePreference = 'dark' | 'light' | 'system';

export interface ScheduleItem {
  id: string;
  client: string;
  productTitle: string;
  datetime: string;
  status: 'agendada' | 'confirmada' | 'concluida';
}

export interface CRMLead {
  id: string;
  clientName: string;
  phone: string;
  stage: 'Novo Lead' | 'Em Atendimento' | 'Visita Agendada' | 'Proposta' | 'Fechamento';
  lastContact: string;
}

/** 4 botões principais do menu inferior fixo + tela de digitação */
export type MainSystemTab = 'products' | 'shortcuts' | 'copilot' | 'more' | 'keyboard';

export type MoreSubMenu = 'agenda' | 'crm' | 'settings' | 'diagnostics' | null;

export interface KeyboardData {
  broker: BrokerProfile;
  folders: ProductFolder[];
  shortcuts: ShortcutsData;
  agenda: ScheduleItem[];
  crm: CRMLead[];
  theme: ThemePreference;
}
