import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MainSystemTab } from '../../types';
import { colors, radius } from '../theme';

const BUTTONS: Array<{ key: MainSystemTab; label: string }> = [
  { key: 'keyboard', label: 'Teclado' },
  { key: 'products', label: 'Produtos' },
  { key: 'shortcuts', label: 'Atalhos' },
  { key: 'copilot', label: 'Copilot' },
  { key: 'more', label: 'Mais' },
];

interface Props {
  active: MainSystemTab;
  onChange: (tab: MainSystemTab) => void;
}

/**
 * Menu com os botões do sistema mantido SEMPRE VISÍVEL abaixo do teclado.
 * Substitui os botões anteriores de ABC/Espaço/Backspace/Enter na mesma área.
 * Botões: Teclado, Produtos, Atalhos, Copilot, Mais.
 */
export const SystemMenuBar = memo(({ active, onChange }: Props) => (
  <View style={styles.bar} testID="system-menu-bar">
    {BUTTONS.map(btn => {
      const selected = btn.key === active;
      return (
        <Pressable
          key={btn.key}
          testID={`system-btn-${btn.key}`}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          onPress={() => onChange(btn.key)}
          style={({ pressed }) => [
            styles.tab,
            selected && styles.tabActive,
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.label, selected && styles.labelActive]}>
            {btn.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
));

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 5,
    gap: 4,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: colors.surfaceAlt,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  labelActive: {
    color: colors.text,
    fontWeight: '600',
  },
});
