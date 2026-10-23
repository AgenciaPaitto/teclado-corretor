import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { MainSystemTab } from '../../types';
import { makeStyles, radius, touchTarget, useColors } from '../theme';
import type { IconName } from './Icon';
import { Icon } from './Icon';

const BUTTONS: Array<{ key: MainSystemTab; label: string; icon: IconName }> = [
  // Alterna entre a área do corretor e o teclado de letras próprio
  { key: 'keyboard', label: 'ABC', icon: 'teclado' },
  { key: 'products', label: 'Produtos', icon: 'arquivos' },
  { key: 'shortcuts', label: 'Atalhos', icon: 'atalhos' },
  { key: 'copilot', label: 'IA', icon: 'ia' },
  { key: 'more', label: 'Mais', icon: 'mais' },
];

interface Props {
  active: MainSystemTab;
  onChange: (tab: MainSystemTab) => void;
}

/**
 * Menu com os botões do sistema mantido SEMPRE VISÍVEL no topo do teclado.
 * Botões: ABC (teclado de letras), Produtos, Atalhos, IA, Mais — cada um com
 * o ícone e a cor funcional do manual; o item ativo ganha o fundo coral suave.
 */
export const SystemMenuBar = memo(({ active, onChange }: Props) => {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.bar} testID="system-menu-bar">
      {BUTTONS.map(btn => {
        const selected = btn.key === active;
        return (
          <Pressable
            key={btn.key}
            testID={`system-btn-${btn.key}`}
            accessibilityRole="tab"
            accessibilityLabel={btn.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(btn.key)}
            style={({ pressed }) => [styles.tab, selected && styles.tabActive, pressed && styles.pressed]}>
            <Icon name={btn.icon} size={20} color={btn.key === 'keyboard' ? colors.iconNeutral : undefined} />
            <Text style={[styles.label, selected && styles.labelActive]}>{btn.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const useStyles = makeStyles(colors => ({
  bar: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tab: {
    flex: 1,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.text,
    fontWeight: '600',
  },
}));
