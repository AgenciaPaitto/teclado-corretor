/**
 * Agenda no app — o mesmo calendário do teclado (mesmos compromissos).
 * Tela principal: calendário + compromissos do dia; cadastro em submenu.
 */
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { TIME_SLOTS, addDays, busyDays, formatDayLong, itemsOn, newAgendaId, todayISO } from '../../agenda/agenda';
import { Repo } from '../../storage/storage';
import type { AgendaKind, CRMLead, ScheduleItem } from '../../types';
import { Icon } from '../../keyboard/components/Icon';
import { ChoiceRow } from '../../keyboard/components/KeyboardForm';
import { MonthCalendar, monthOf } from '../../keyboard/components/MonthCalendar';
import { makeStyles, radius, spacing, touchTarget, typography, useColors } from '../../keyboard/theme';
import { Button, Card, CardText, CardTitle, Page, ScreenTitle, SubHeader } from '../components/ui';
import { useStoredList } from '../hooks/useStoredList';

interface Props {
  /** Veio da ficha do cliente ("Agendar"): abre o cadastro já com ele. */
  presetClientId?: string | null;
}

export function AgendaScreen({ presetClientId }: Props) {
  const [agenda, reload] = useStoredList(Repo.getAgenda);
  const [selected, setSelected] = useState(todayISO());
  const [view, setView] = useState(() => monthOf(todayISO()));
  const [form, setForm] = useState<{ item: ScheduleItem | null } | null>(() => (presetClientId ? { item: null } : null));
  const busy = useMemo(() => busyDays(agenda), [agenda]);

  if (form) {
    return (
      <AgendaForm
        item={form.item}
        date={form.item?.date ?? selected}
        leads={Repo.getCRM()}
        presetClientId={form.item ? null : presetClientId ?? null}
        onBack={() => setForm(null)}
        onSave={item => {
          Repo.saveAgendaItem(item);
          reload();
          setSelected(item.date);
          setView(monthOf(item.date));
          setForm(null);
        }}
        onDelete={id => {
          Repo.deleteAgendaItem(id);
          reload();
          setForm(null);
        }}
      />
    );
  }

  const dayItems = itemsOn(agenda, selected);
  return (
    <Page>
      <ScreenTitle title="Agenda" subtitle="Reuniões e tarefas, também no teclado." />
      <Card>
        <MonthCalendar view={view} onViewChange={setView} selected={selected} onSelect={setSelected} busy={busy} />
      </Card>

      <Card>
        <CardTitle>{formatDayLong(selected)}</CardTitle>
        {dayItems.length === 0 ? <CardText>Nada marcado neste dia.</CardText> : null}
        {dayItems.map(item => (
          <AgendaRow
            key={item.id}
            item={item}
            onToggle={() => {
              Repo.saveAgendaItem({ ...item, done: !item.done });
              reload();
            }}
            onPress={() => setForm({ item })}
          />
        ))}
        <Button label="Novo compromisso" icon="adicionar" onPress={() => setForm({ item: null })} />
      </Card>
    </Page>
  );
}

function AgendaRow({ item, onToggle, onPress }: { item: ScheduleItem; onToggle: () => void; onPress: () => void }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={[styles.row, item.done && styles.rowDone]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.done }}
        hitSlop={8}
        style={[styles.check, item.done && styles.checkOn]}
        onPress={onToggle}>
        {item.done && <Icon name="check" size={14} color={colors.onPrimary} />}
      </Pressable>
      <Pressable style={styles.flex} onPress={onPress}>
        <Text style={[styles.rowTitle, item.done && styles.rowTitleDone]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {item.kind === 'meeting' ? 'Reunião' : 'Tarefa'}
          {item.time ? ` · ${item.time}` : ' · dia todo'}
          {item.clientName ? ` · ${item.clientName}` : ''}
        </Text>
      </Pressable>
      <Icon name="avancar" size={18} color={colors.textMuted} />
    </View>
  );
}

function AgendaForm({
  item,
  date: initialDate,
  leads,
  presetClientId,
  onBack,
  onSave,
  onDelete,
}: {
  item: ScheduleItem | null;
  date: string;
  leads: CRMLead[];
  presetClientId: string | null;
  onBack: () => void;
  onSave: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  const preset = leads.find(l => l.id === presetClientId);
  const [kind, setKind] = useState<AgendaKind>(item?.kind ?? 'meeting');
  const [title, setTitle] = useState(item?.title ?? (preset ? `Reunião com ${preset.clientName}` : ''));
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(item?.time ?? '');
  const [clientId, setClientId] = useState(item?.clientId ?? preset?.id ?? '');

  const save = () => {
    if (!title.trim()) {
      Alert.alert('Atenção', 'Dê um título ao compromisso.');
      return;
    }
    const client = leads.find(l => l.id === clientId);
    onSave({
      id: item?.id ?? newAgendaId(),
      kind,
      title: title.trim(),
      date,
      time: time || undefined,
      clientId: client?.id,
      clientName: client?.clientName,
      notes: notes.trim() || undefined,
      done: item?.done ?? false,
    });
  };

  return (
    <Page>
      <SubHeader title={item ? 'Editar compromisso' : 'Novo compromisso'} onBack={onBack} />
      <Card>
        <ChoiceRow
          onCard
          options={[
            { value: 'meeting' as AgendaKind, label: 'Reunião' },
            { value: 'task' as AgendaKind, label: 'Tarefa' },
          ]}
          value={kind}
          onChange={setKind}
        />
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Título" placeholderTextColor={colors.textMuted} />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Observação (opcional)"
          placeholderTextColor={colors.textMuted}
          multiline
        />
      </Card>

      <Card>
        <CardTitle>Dia e horário</CardTitle>
        <View style={styles.dateRow}>
          <Pressable accessibilityLabel="Dia anterior" hitSlop={8} style={styles.dateNav} onPress={() => setDate(d => addDays(d, -1))}>
            <Icon name="voltar" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.dateText}>{formatDayLong(date)}</Text>
          <Pressable accessibilityLabel="Próximo dia" hitSlop={8} style={styles.dateNav} onPress={() => setDate(d => addDays(d, 1))}>
            <Icon name="avancar" size={20} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ChoiceRow onCard options={[{ value: '', label: 'Dia todo' }, ...TIME_SLOTS.map(t => ({ value: t, label: t }))]} value={time} onChange={setTime} />
        </ScrollView>
      </Card>

      {leads.length > 0 && (
        <Card>
          <CardTitle>Cliente</CardTitle>
          <ChoiceRow onCard options={[{ value: '', label: 'Nenhum' }, ...leads.map(l => ({ value: l.id, label: l.clientName }))]} value={clientId} onChange={setClientId} />
        </Card>
      )}

      <Button label="Salvar" onPress={save} />
      {item && (
        <Button
          label="Excluir compromisso"
          variant="danger"
          onPress={() =>
            Alert.alert('Excluir compromisso', `Deseja excluir "${item.title}"?`, [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Excluir', style: 'destructive', onPress: () => onDelete(item.id) },
            ])
          }
        />
      )}
    </Page>
  );
}

const useStyles = makeStyles(colors => ({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowDone: { opacity: 0.6 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowTitleDone: { textDecorationLine: 'line-through' },
  rowMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget + 4,
    fontSize: 15,
  },
  textArea: { minHeight: 80, paddingTop: spacing.md, textAlignVertical: 'top' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    minHeight: touchTarget + 4,
    paddingHorizontal: spacing.sm,
  },
  dateNav: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dateText: { ...typography.button, color: colors.text },
}));
