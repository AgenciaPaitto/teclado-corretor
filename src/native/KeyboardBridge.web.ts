/**
 * KeyboardBridge — versão WEB (usada só no site de testes, via Vite).
 *
 * No celular, o teclado escreve no campo do WhatsApp pelo Android/iOS. Na web,
 * a página de testes registra aqui um "host" (o campo de mensagem da conversa
 * simulada) e o teclado escreve nele. Mesma API do KeyboardBridge.ts.
 */
export interface KeyboardShowEvent {
  targetPackage: string | null;
  restarting: boolean;
  inputType?: number;
}

export type CommitImageResult = 'sent' | 'unsupported' | 'failed';

export interface InputContext {
  before: string;
  inputType: number;
}

export interface SelectionChangeEvent {
  start?: number;
  end?: number;
}

/** Campo de texto que recebe o que o teclado digita (a conversa de teste). */
export interface WebKeyboardTarget {
  insert(text: string): void;
  /** Apaga 1 caractere; false quando não há o que apagar. */
  deleteBackward(): boolean;
  enter(): void;
  /** Texto antes do cursor no campo de teste. */
  textBeforeCursor(): string;
}

let target: WebKeyboardTarget | null = null;
let openAppHandler: (() => void) | null = null;
let expandHandler: ((expanded: boolean) => void) | null = null;
const showListeners = new Set<(e: KeyboardShowEvent) => void>();
const hideListeners = new Set<() => void>();
const selectionListeners = new Set<(e: SelectionChangeEvent) => void>();

/** Usado pela página de testes para conectar a conversa simulada ao teclado. */
export const WebKeyboardHost = {
  attach(t: WebKeyboardTarget) {
    target = t;
    return () => {
      if (target === t) target = null;
    };
  },
  /** O teclado "apareceu" (recarrega catálogo, atalhos e login). */
  show() {
    showListeners.forEach(cb => cb({ targetPackage: 'com.whatsapp', restarting: false }));
  },
  hide() {
    hideListeners.forEach(cb => cb());
  },
  /** O cursor do campo de teste mudou por fora do teclado (clique, colar...). */
  selectionChanged() {
    selectionListeners.forEach(cb => cb({}));
  },
  /** O que fazer quando o teclado pede para abrir o app (ex.: login). */
  onOpenApp(handler: () => void) {
    openAppHandler = handler;
  },
  /** A página de teste aumenta a área do teclado (CRM e Agenda em tela grande). */
  onExpandedChange(handler: (expanded: boolean) => void) {
    expandHandler = handler;
  },
};

const unavailable = (what: string) =>
  Promise.reject(new Error(`${what} funciona só no celular. Use "segurar" para enviar o link.`));

export const KeyboardBridge = {
  insertText: async (text: string) => {
    if (!target) return false;
    target.insert(text);
    return true;
  },
  deleteBackward: async () => (target ? target.deleteBackward() : false),
  sendEnter: async () => {
    target?.enter();
    return !!target;
  },
  getInputContext: async (): Promise<InputContext> => ({
    before: target ? target.textBeforeCursor().slice(-200) : '',
    inputType: 1,
  }),
  replaceTextBeforeCursor: async (count: number, text: string) => {
    if (!target) return false;
    for (let i = 0; i < count; i++) target.deleteBackward();
    target.insert(text);
    return true;
  },
  // No celular, a tecla 🌐 troca para outro teclado do sistema
  switchKeyboard: async () => false,
  /** Página de teste: o teclado cresce sobre a conversa, como no celular. */
  setExpanded: async (expanded: boolean) => {
    expandHandler?.(expanded);
    return !!expandHandler;
  },
  getTargetApp: async (): Promise<string | null> => (target ? 'com.whatsapp' : null),
  isKeyboardContext: async () => !!target,
  isKeyboardEnabled: async () => false,
  isKeyboardSelected: async () => false,
  openInputMethodPicker: async () => false,
  openKeyboardSettings: async () => false,
  notifyReady: () => {},
  reportError: (message: string) => console.error('[KEYCON]', message),
  // Na web o campo de teste só aceita texto: fotos caem no envio do link
  getContentMimeTypes: async (): Promise<string[]> => [],
  commitImage: async (_url: string, _description: string): Promise<CommitImageResult> => 'unsupported',
  shareMedia: (_urls: string[]): Promise<'direct' | 'chooser'> => unavailable('O compartilhamento de arquivos'),
  // Na web os arquivos não são guardados no aparelho
  prefetchMedia: async (_urls: string[]) => 0,
  openApp: async () => {
    openAppHandler?.();
    return !!openAppHandler;
  },

  onKeyboardShow(cb: (e: KeyboardShowEvent) => void) {
    showListeners.add(cb);
    return () => {
      showListeners.delete(cb);
    };
  },
  onKeyboardHide(cb: () => void) {
    hideListeners.add(cb);
    return () => {
      hideListeners.delete(cb);
    };
  },
  onSelectionChange(cb: (e: SelectionChangeEvent) => void) {
    selectionListeners.add(cb);
    return () => {
      selectionListeners.delete(cb);
    };
  },
};

export const WHATSAPP_PACKAGES = ['com.whatsapp', 'com.whatsapp.w4b'];
