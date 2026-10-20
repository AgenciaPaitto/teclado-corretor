/**
 * CorretorKeyboard.tsx — Componente RAIZ do teclado (Minimalista).
 * Menu com os botões do sistema mantido SEMPRE VISÍVEL no topo do teclado:
 * ABC (teclado de letras próprio), Produtos, Atalhos, Copilot e Mais.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { KeyboardBridge } from '../native/KeyboardBridge';
import { LoginRequiredPanel } from './components/LoginRequiredPanel';
import type { KeyboardData, MainSystemTab, ThemePreference } from '../types';
import { AICopilotTab } from './components/AICopilotTab';
import { MoreTab } from './components/MoreTab';
import { ProductsTab } from './components/ProductsTab';
import { ShortcutsTab } from './components/ShortcutsTab';
import { SystemMenuBar } from './components/SystemMenuBar';
import { TypingKeyboard } from './components/TypingKeyboard';
import { useKeyboardData } from './hooks/useKeyboardData';
import { makeStyles, radius, ThemeProvider } from './theme';

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Garante ponto final para juntar duas frases no aviso. */
function sentence(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

// Erros JS não tratados também vão para o diagnóstico nativo do teclado.
// O tratamento padrão do React Native continua sendo chamado.
const defaultErrorHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  KeyboardBridge.reportError(`${isFatal ? '[fatal] ' : ''}${describeError(error)}`);
  defaultErrorHandler(error, isFatal);
});

interface ErrorBoundaryState {
  hasError: boolean;
  error: string | null;
}

class KeyboardErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error: describeError(error) };
  }

  componentDidCatch(error: unknown) {
    KeyboardBridge.reportError(describeError(error));
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          message={this.state.error}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  const styles = useStyles();
  return (
    <View style={[styles.root, styles.errorContainer]}>
      <Text style={styles.errorTitle}>Teclado do Corretor</Text>
      <Text style={styles.errorSubtitle}>{message || 'Erro ao inicializar visualização'}</Text>
      <Text style={styles.errorButton} onPress={onRetry}>
        Tentar novamente
      </Text>
    </View>
  );
}

interface ContentProps {
  data: KeyboardData;
  /** Mesmo login do app (armazenamento compartilhado). */
  loggedIn: boolean;
  onThemeChange: (theme: ThemePreference) => void;
}

function CorretorKeyboardContent({ data, loggedIn, onThemeChange }: ContentProps) {
  const styles = useStyles();
  const [tab, setTab] = useState<MainSystemTab>('products');
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Evita disparar vários downloads ao tocar repetidas vezes. */
  const sending = useRef(false);
  /** Última aba da área do corretor — o botão ABC volta para ela. */
  const lastCorretorTab = useRef<MainSystemTab>('products');

  useEffect(() => {
    KeyboardBridge.notifyReady();
  }, []);

  const showToast = useCallback(
    (msg: string, durationMs = 1200) => {
      setToast(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      Animated.timing(toastOpacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
      toastTimer.current = setTimeout(() => {
        Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
          setToast(null),
        );
      }, durationMs);
    },
    [toastOpacity],
  );

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const insert = useCallback(
    async (text: string) => {
      try {
        const ok = await KeyboardBridge.insertText(text);
        showToast(ok ? 'Inserido' : 'Campo indisponível');
      } catch {
        showToast('Não foi possível inserir');
      }
    },
    [showToast],
  );

  /**
   * Foto direto na conversa (mesmo recurso dos GIFs do Gboard). Se o app não
   * aceitar imagem ou o link não for de um arquivo, insere o link como antes.
   */
  const sendImage = useCallback(
    async (url: string, title: string) => {
      if (sending.current) {
        showToast('Aguarde o envio anterior');
        return;
      }
      sending.current = true;
      showToast('Baixando foto...', 30000);
      let reason: string;
      try {
        const result = await KeyboardBridge.commitImage(url, title);
        if (result === 'sent') {
          showToast('Foto enviada para a conversa');
          return;
        }
        reason = result === 'unsupported' ? 'Este app não recebe fotos pelo teclado' : 'O app recusou a foto';
      } catch (e) {
        reason = describeError(e);
      } finally {
        sending.current = false;
      }
      const ok = await KeyboardBridge.insertText(`[Foto] ${title}: ${url}`).catch(() => false);
      showToast(ok ? `${sentence(reason)} Link inserido.` : reason, 4000);
    },
    [showToast],
  );

  /**
   * Áudio, vídeo e várias fotos: baixa e abre o compartilhamento do Android
   * (direto no app em foco, quando possível). Se falhar, insere o texto/link.
   */
  const shareMedia = useCallback(
    async (urls: string[], fallbackText: string) => {
      if (sending.current) {
        showToast('Aguarde o envio anterior');
        return;
      }
      sending.current = true;
      showToast(urls.length > 1 ? `Baixando ${urls.length} arquivos...` : 'Baixando arquivo...', 60000);
      try {
        await KeyboardBridge.shareMedia(urls);
        showToast('Escolha a conversa para enviar', 2500);
      } catch (e) {
        const reason = describeError(e);
        const ok = await KeyboardBridge.insertText(fallbackText).catch(() => false);
        showToast(ok ? `${sentence(reason)} Link inserido.` : reason, 4000);
      } finally {
        sending.current = false;
      }
    },
    [showToast],
  );

  // ABC alterna entre a área do corretor e o teclado de letras (como no simulador).
  // A troca para outro teclado do sistema (Gboard etc.) fica na tecla 🌐.
  const handleTabChange = useCallback((newTab: MainSystemTab) => {
    setTab(current => {
      if (newTab === 'keyboard' && current === 'keyboard') return lastCorretorTab.current;
      if (newTab !== 'keyboard') lastCorretorTab.current = newTab;
      return newTab;
    });
  }, []);

  return (
    <View style={styles.root} testID="corretor-keyboard">
      {/* Menu com os botões do sistema SEMPRE VISÍVEL no topo */}
      <SystemMenuBar active={tab} onChange={handleTabChange} />

      {/* Área de conteúdo: teclado de letras ou área do corretor */}
      <View style={styles.content}>
        {tab === 'keyboard' && <TypingKeyboard />}
        {/* Sem login no app, a área do corretor fica bloqueada (o ABC continua livre) */}
        {tab !== 'keyboard' && !loggedIn && <LoginRequiredPanel />}
        {loggedIn && tab === 'products' && (
          <ProductsTab folders={data.folders} onInsert={insert} onSendImage={sendImage} onShare={shareMedia} />
        )}
        {loggedIn && tab === 'shortcuts' && (
          <ShortcutsTab shortcuts={data.shortcuts} broker={data.broker} onInsert={insert} onShare={shareMedia} />
        )}
        {loggedIn && tab === 'copilot' && <AICopilotTab onInsert={insert} />}
        {loggedIn && tab === 'more' && (
          <MoreTab
            agenda={data.agenda}
            crm={data.crm}
            theme={data.theme}
            onThemeChange={onThemeChange}
            onInsert={insert}
          />
        )}

        {toast && (
          <Animated.View pointerEvents="none" style={[styles.toast, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toast}</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function KeyboardRoot() {
  const { data, loggedIn, setTheme } = useKeyboardData();
  return (
    <ThemeProvider preference={data.theme}>
      <CorretorKeyboardContent data={data} loggedIn={loggedIn} onThemeChange={setTheme} />
    </ThemeProvider>
  );
}

// O ErrorBoundary fica por fora de tudo: um erro ao ler os dados ou o tema
// mostra a mensagem em vez de deixar o teclado em branco.
export default function CorretorKeyboard() {
  return (
    <KeyboardErrorBoundary>
      <KeyboardRoot />
    </KeyboardErrorBoundary>
  );
}

const useStyles = makeStyles(colors => ({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    maxWidth: '90%',
    backgroundColor: colors.toastBg,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 7,
    zIndex: 99,
  },
  toastText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  errorSubtitle: {
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorButton: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    padding: 8,
  },
}));
