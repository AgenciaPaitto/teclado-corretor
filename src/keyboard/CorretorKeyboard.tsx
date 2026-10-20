/**
 * CorretorKeyboard.tsx — Componente RAIZ do teclado (Minimalista).
 * Menu com os botões do sistema mantido SEMPRE VISÍVEL abaixo do teclado:
 * Produtos, Atalhos, Copilot e Mais.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { KeyboardBridge } from '../native/KeyboardBridge';
import type { KeyboardData, MainSystemTab, ThemePreference } from '../types';
import { AICopilotTab } from './components/AICopilotTab';
import { KeyboardSwitchTab } from './components/KeyboardSwitchTab';
import { MoreTab } from './components/MoreTab';
import { ProductsTab } from './components/ProductsTab';
import { ShortcutsTab } from './components/ShortcutsTab';
import { SystemMenuBar } from './components/SystemMenuBar';
import { useKeyboardData } from './hooks/useKeyboardData';
import { makeStyles, radius, ThemeProvider } from './theme';

interface ErrorBoundaryState {
  hasError: boolean;
  error: string | null;
}

class KeyboardErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error: error instanceof Error ? error.message : String(error) };
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
  onThemeChange: (theme: ThemePreference) => void;
}

function CorretorKeyboardContent({ data, onThemeChange }: ContentProps) {
  const styles = useStyles();
  const [tab, setTab] = useState<MainSystemTab>('products');
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      setToast(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      Animated.timing(toastOpacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
      toastTimer.current = setTimeout(() => {
        Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
          setToast(null),
        );
      }, 1200);
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

  // A troca para o teclado padrão (Gboard etc.) acontece somente pelo botão
  // "Alternar Teclado" dentro da aba — assim as teclas rápidas ficam acessíveis.
  const handleTabChange = useCallback((newTab: MainSystemTab) => {
    setTab(newTab);
  }, []);

  return (
    <View style={styles.root} testID="corretor-keyboard">
      {/* Área de conteúdo do sistema */}
      <View style={styles.content}>
        {tab === 'keyboard' && <KeyboardSwitchTab onInsert={insert} />}
        {tab === 'products' && <ProductsTab folders={data.folders} onInsert={insert} />}
        {tab === 'shortcuts' && <ShortcutsTab shortcuts={data.shortcuts} broker={data.broker} onInsert={insert} />}
        {tab === 'copilot' && <AICopilotTab onInsert={insert} />}
        {tab === 'more' && (
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

      {/* Menu com os botões do sistema SEMPRE VISÍVEL abaixo do teclado */}
      <SystemMenuBar active={tab} onChange={handleTabChange} />
    </View>
  );
}

export default function CorretorKeyboard() {
  const { data, setTheme } = useKeyboardData();
  return (
    <ThemeProvider preference={data.theme}>
      <KeyboardErrorBoundary>
        <CorretorKeyboardContent data={data} onThemeChange={setTheme} />
      </KeyboardErrorBoundary>
    </ThemeProvider>
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
    backgroundColor: colors.toastBg,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 7,
    zIndex: 99,
  },
  toastText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
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
