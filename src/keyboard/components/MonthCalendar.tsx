import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MONTHS, WEEKDAYS_SHORT, monthGrid, todayISO } from '../../agenda/agenda';
import { makeStyles, onCoralText, radius, spacing, useColors } from '../theme';
import { Icon } from './Icon';

export interface CalendarMonth {
  year: number;
  /** 0 = janeiro. */
  month: number;
}

export function shiftMonth({ year, month }: CalendarMonth, delta: number): CalendarMonth {
  const m = month + delta;
  return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
}

export function monthOf(iso: string): CalendarMonth {
  const [y, m] = iso.split('-').map(Number);
  return { year: y, month: m - 1 };
}

interface Props {
  view: CalendarMonth;
  onViewChange: (view: CalendarMonth) => void;
  selected: string;
  onSelect: (iso: string) => void;
  /** Dias com compromisso em aberto (bolinha coral). */
  busy: Set<string>;
  /** Células mais baixas (teclado). */
  compact?: boolean;
}

/** Calendário do mês (domingo a sábado), usado na agenda do app e do teclado. */
export const MonthCalendar = memo(({ view, onViewChange, selected, onSelect, busy, compact }: Props) => {
  const colors = useColors();
  const styles = useStyles();
  const today = todayISO();
  const weeks = monthGrid(view.year, view.month);
  const cellHeight = compact ? 34 : 42;

  return (
    <View style={styles.root} testID="month-calendar">
      <View style={styles.header}>
        <Pressable accessibilityLabel="Mês anterior" hitSlop={10} style={styles.nav} onPress={() => onViewChange(shiftMonth(view, -1))}>
          <Icon name="voltar" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>
          {MONTHS[view.month]} {view.year}
        </Text>
        <Pressable accessibilityLabel="Próximo mês" hitSlop={10} style={styles.nav} onPress={() => onViewChange(shiftMonth(view, 1))}>
          <Icon name="avancar" size={20} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.row}>
        {WEEKDAYS_SHORT.map((d, i) => (
          <Text key={i} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      {weeks.map((week, w) => (
        <View key={w} style={styles.row}>
          {week.map((iso, i) => {
            if (!iso) return <View key={i} style={[styles.cell, { height: cellHeight }]} />;
            const isSelected = iso === selected;
            const isToday = iso === today;
            return (
              <Pressable
                key={iso}
                testID={`day-${iso}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[styles.cell, { height: cellHeight }]}
                onPress={() => onSelect(iso)}>
                <View style={[styles.day, isSelected && styles.daySelected, !isSelected && isToday && styles.dayToday]}>
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected, !isSelected && isToday && styles.dayTextToday]}>
                    {Number(iso.slice(8))}
                  </Text>
                </View>
                <View style={[styles.dot, busy.has(iso) && styles.dotOn, isSelected && busy.has(iso) && styles.dotOnSelected]} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
});

const useStyles = makeStyles(colors => ({
  root: { gap: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  nav: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: colors.textMuted, paddingVertical: 4 },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  day: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.primary },
  dayToday: { borderWidth: 1.5, borderColor: colors.primary },
  dayText: { fontSize: 14, color: colors.text },
  dayTextSelected: { color: colors.onPrimary, fontWeight: '700', ...onCoralText },
  dayTextToday: { color: colors.primaryText, fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  dotOn: { backgroundColor: colors.primary },
  dotOnSelected: { backgroundColor: colors.primary },
}));
