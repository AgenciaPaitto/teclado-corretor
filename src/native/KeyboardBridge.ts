/**
 * Wrapper tipado sobre o NativeModule `KeyboardBridge` (Kotlin / Swift).
 *
 * Centraliza a ponte nativa para que os componentes React nunca acessem
 * NativeModules diretamente — facilita testes (mock) e futura migração para
 * TurboModules (basta trocar a implementação deste arquivo).
 */
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

interface KeyboardBridgeNative {
  insertText(text: string): Promise<boolean>;
  deleteBackward(): Promise<boolean>;
  sendEnter(): Promise<boolean>;
  switchKeyboard(): Promise<boolean>;
  getTargetApp(): Promise<string | null>;
  isKeyboardContext(): Promise<boolean>;
  isKeyboardEnabled(): Promise<boolean>;
  isKeyboardSelected(): Promise<boolean>;
  openInputMethodPicker(): Promise<boolean>;
  openKeyboardSettings(): Promise<boolean>;
}

export interface KeyboardShowEvent {
  targetPackage: string | null;
  restarting: boolean;
  inputType?: number;
}

const Native: KeyboardBridgeNative | undefined = NativeModules.KeyboardBridge;

if (!Native && __DEV__) {
  console.warn(
    `[KeyboardBridge] módulo nativo não encontrado (${Platform.OS}). ` +
      'Verifique se KeyboardBridgePackage foi registrado no MainApplication.',
  );
}

const emitter = Native ? new NativeEventEmitter(NativeModules.KeyboardBridge) : null;

const noop = async () => false;

export const KeyboardBridge = {
  /** Injeta texto no campo ativo (InputConnection.commitText / insertText). */
  insertText: (text: string) => (Native ? Native.insertText(text) : noop()),
  deleteBackward: () => (Native ? Native.deleteBackward() : noop()),
  sendEnter: () => (Native ? Native.sendEnter() : noop()),
  /** Volta ao teclado de digitação padrão (tecla 🌐). */
  switchKeyboard: () => (Native ? Native.switchKeyboard() : noop()),
  getTargetApp: () => (Native ? Native.getTargetApp() : Promise.resolve(null)),
  isKeyboardContext: () => (Native ? Native.isKeyboardContext() : Promise.resolve(false)),
  /** Verifica se o Teclado do Corretor está ativado no sistema */
  isKeyboardEnabled: () => (Native ? Native.isKeyboardEnabled() : Promise.resolve(false)),
  /** Verifica se o Teclado do Corretor é o teclado selecionado atualmente */
  isKeyboardSelected: () => (Native ? Native.isKeyboardSelected() : Promise.resolve(false)),
  /** Abre o seletor rápido de teclados do sistema */
  openInputMethodPicker: () => (Native ? Native.openInputMethodPicker() : noop()),
  /** Abre as configurações de teclado do sistema */
  openKeyboardSettings: () => (Native ? Native.openKeyboardSettings() : noop()),

  onKeyboardShow(cb: (e: KeyboardShowEvent) => void) {
    const sub = emitter?.addListener('onKeyboardShow', cb);
    return () => sub?.remove();
  },
  onKeyboardHide(cb: () => void) {
    const sub = emitter?.addListener('onKeyboardHide', cb);
    return () => sub?.remove();
  },
};

export const WHATSAPP_PACKAGES = ['com.whatsapp', 'com.whatsapp.w4b'];
