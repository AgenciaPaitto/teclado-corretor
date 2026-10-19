/**
 * CorretorKeyboard.tsx — Componente RAIZ do teclado (Minimalista).
 * Menu com os botões do sistema mantido SEMPRE VISÍVEL abaixo do teclado:
 * Produtos, Atalhos, Copilot e Mais.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { KeyboardBridge } from '../native/KeyboardBridge';
import type { MainSystemTab } from '../types';
import { AICopilotTab } from './components/AICopilotTab';
import { MoreTab } from './components/MoreTab';
import { ProductsTab } from './components/ProductsTab';
import { ShortcutsTab } from './components/ShortcutsTab';
import { SystemMenuBar } from './components/SystemMenuBar';
import { useKeyboardData } from './hooks/useKeyboardData';
import { colors, radius } from './theme';

export default function CorretorKeyboard() {
  const { data } = useKeyboardData();
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

  return (
    <View style={styles.root} testID="corretor-keyboard">
      {/* Área de conteúdo do sistema */}
      <View style={styles.content}>
        {tab === 'products' && <ProductsTab folders={data.folders} onInsert={insert} />}
        {tab === 'shortcuts' && <ShortcutsTab shortcuts={data.shortcuts} onInsert={insert} />}
        {tab === 'copilot' && <AICopilotTab onInsert={insert} />}
        {tab === 'more' && (
          <MoreTab
            agenda={data.agenda}
            crm={data.crm}
            theme={data.theme}
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
      <SystemMenuBar active={tab} onChange={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
