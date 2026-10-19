import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MainSystemTab } from '../../types';
import { colors, radius } from '../theme';

const TABS: Array<{ key: MainSystemTab; label: string }> = [
  { key: 'products', label: 'Produtos' },
  { key: 'shortcuts', label: 'Atalhos' },
  { key: 'copilot', label: 'Copilot' },
  { key: 'more', label: 'Mais' },
];

interface Props {
  active: MainSystemTab;
  onChange: (tab: MainSystemTab) => void;
}

export const Toolbar = memo(({ active, onChange }: Props) => (
  <View style={styles.bar}>
    {TABS.map(t => {
      const selected = t.key === active;
      return (
        <Pressable
          key={t.key}
          testID={`tab-${t.key}`}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          onPress={() => onChange(t.key)}
          style={({ pressed }) => [
            styles.tab,
            selected && styles.tabActive,
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.label, selected && styles.labelActive]}>
            {t.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
));

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    backgroundColor: colors.bg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.md,
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
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.text,
    fontWeight: '600',
  },
});
