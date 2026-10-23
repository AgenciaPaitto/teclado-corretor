/**
 * Escolha do idioma do usuário e de onde ele vende (moeda + idioma das
 * mensagens ao cliente). Mesmo estilo compacto do seletor de ramo.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LANGUAGES, t } from '../../i18n';
import type { Lang } from '../../i18n';
import { MARKETS } from '../../i18n/markets';
import type { MarketId } from '../../i18n/markets';
import { glassBorder, makeStyles, radius, spacing } from '../../keyboard/theme';

function Chip({ label, detail, selected, onPress, testID }: { label: string; detail?: string; selected: boolean; onPress: () => void; testID?: string }) {
  const styles = useStyles();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}>
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
      {detail ? (
        <Text style={[styles.detail, selected && styles.labelSelected]} numberOfLines={1}>
          {detail}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** Português · English · Español (cada um escrito no próprio idioma). */
export function LanguagePicker({ value, onChange }: { value: Lang; onChange: (lang: Lang) => void }) {
  const styles = useStyles();
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {LANGUAGES.map(l => (
        <Chip key={l.id} testID={`lang-${l.id}`} label={l.label} selected={l.id === value} onPress={() => onChange(l.id)} />
      ))}
    </View>
  );
}

const LANGUAGE_NAME: Record<Lang, string> = { pt: 'Português', en: 'English', es: 'Español' };

/** País + moeda + idioma das mensagens ("United States · USD · English"). */
export function MarketPicker({ value, onChange }: { value: MarketId; onChange: (id: MarketId) => void }) {
  const styles = useStyles();
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup">
      {MARKETS.map(m => (
        <Chip
          key={m.id}
          testID={`market-${m.id}`}
          label={m.country}
          detail={`${m.currency} · ${LANGUAGE_NAME[m.language]}`}
          selected={m.id === value}
          onPress={() => onChange(m.id)}
        />
      ))}
    </View>
  );
}

/** Texto curto do mercado escolhido ("Brasil · BRL · Português"). */
export function marketSummary(id: MarketId): string {
  const m = MARKETS.find(x => x.id === id) ?? MARKETS[0];
  return t('{country} · {currency}', { country: m.country, currency: m.currency });
}

const useStyles = makeStyles(colors => ({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
  label: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  labelSelected: { color: colors.primaryText, fontWeight: '600' },
  detail: { fontSize: 12, color: colors.textMuted },
}));
