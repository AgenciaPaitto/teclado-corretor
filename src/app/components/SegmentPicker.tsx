import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SEGMENTS } from '../../segments/segments';
import type { SegmentId } from '../../types';
import { IconTile } from '../../keyboard/components/Icon';
import { makeStyles, radius, spacing, useColors } from '../../keyboard/theme';

interface Props {
  value: SegmentId | null;
  onChange: (segment: SegmentId) => void;
}

/** Cartões com os ramos (2 por linha). O ramo geral fica por último. */
export function SegmentPicker({ value, onChange }: Props) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
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
            style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}>
            <IconTile name={s.icon} size={36} color={selected ? colors.primary : undefined} />
            <View style={styles.info}>
              <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
                {s.id === 'general' ? 'Outro / Geral' : s.label}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {s.description}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(colors => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    // 2 colunas com o espaço do meio
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 64,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.surfaceAlt,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.75,
  },
  info: { flex: 1 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  labelSelected: {
    color: colors.primaryText,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: 1,
  },
}));
