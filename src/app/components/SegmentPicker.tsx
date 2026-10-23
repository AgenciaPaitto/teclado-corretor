import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SEGMENTS } from '../../segments/segments';
import type { SegmentId } from '../../types';
import { Icon } from '../../keyboard/components/Icon';
import { glassBorder, makeStyles, radius, spacing, useColors } from '../../keyboard/theme';

interface Props {
  value: SegmentId | null;
  onChange: (segment: SegmentId) => void;
}

/** Nome curto no botão (a descrição completa vai para o leitor de tela). */
const SHORT_LABEL: Partial<Record<SegmentId, string>> = {
  retail: 'Varejo',
  beauty: 'Beleza',
  general: 'Outro',
};

/**
 * Ramos em botões compactos (ícone + nome), que se acomodam em linhas.
 * O escolhido fica em coral suave. O ramo geral ("Outro") vem por último.
 */
export function SegmentPicker({ value, onChange }: Props) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {SEGMENTS.map(s => {
        const selected = s.id === value;
        return (
          <Pressable
            key={s.id}
            testID={`segment-${s.id}`}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${s.label}: ${s.description}`}
            onPress={() => onChange(s.id)}
            style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}>
            <Icon name={s.icon} size={16} color={selected ? colors.primaryText : colors.textSecondary} />
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {SHORT_LABEL[s.id] ?? s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(colors => ({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    ...glassBorder(colors),
  },
  chipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderTopColor: colors.primary,
    borderWidth: 1,
  },
  pressed: { opacity: 0.75 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.primaryText,
    fontWeight: '600',
  },
}));
