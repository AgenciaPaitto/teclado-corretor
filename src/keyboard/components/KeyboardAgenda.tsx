/**
 * Agenda no teclado expandido: calendário do mês, compromissos do dia e
 * cadastro de reunião ou tarefa. Grava no mesmo lugar que a Agenda do app.
 */
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import {
  TIME_SLOTS,
  addDays,
  busyDays,
  confirmationMessage,
  formatDayLong,
  itemsOn,
  newAgendaId,
  todayISO,
} from '../../agenda/agenda';
import { Repo } from '../../storage/storage';
import type { AgendaKind, CRMLead, ScheduleItem } from '../../types';
import { makeStyles, radius, spacing, touchTarget, useColors } from '../theme';
import { Icon } from './Icon';
import { Header } from './KeyboardCRM';
import { ChoiceRow, KeyboardFormField, KeyboardFormKeys, useKeyboardForm } from './KeyboardForm';
import type { FormFieldSpec } from './KeyboardForm';
import { MonthCalendar, monthOf } from './MonthCalendar';

interface Props {
  agenda: ScheduleItem[];
  leads: CRMLead[];
  onInsert: (text: string) => void;
  onClose: () => void;
  onChanged: () => void;
  /** Veio do CRM ("Agendar"): abre direto o cadastro com o cliente. */
  presetClient?: CRMLead | null;
}

export function KeyboardAgenda({ agenda, leads, onInsert, onClose, onChanged, presetClient }: Props) {
  const [selected, setSelected] = useState(todayISO());
  const [view, setView] = useState(() => monthOf(todayISO()));
  const [form, setForm] = useState<{ item: ScheduleItem | null } | null>(() => (presetClient ? { item: null } : null));

  if (form) {
    return (
      <AgendaForm
        item={form.item}
        date={form.item?.date ?? selected}
        leads={leads}
        presetClient={form.item ? null : presetClient ?? null}
        onCancel={() => setForm(null)}
        onDeleted={() => {
          onChanged();
          setForm(null);
        }}
        onSaved={item => {
          Repo.saveAgendaItem(item);
          onChanged();
          setSelected(item.date);
          setView(monthOf(item.date));
          setForm(null);
        }}
      />
    );
  }

  return (
    <AgendaCalendar
      agenda={agenda}
      selected={selected}
      onSelect={setSelected}
      view={view}
      onViewChange={setView}
      onClose={onClose}
      onNew={() => setForm({ item: null })}
      onEdit={item => setForm({ item })}
      onToggle={item => {
        Repo.saveAgendaItem({ ...item, done: !item.done });
        onChanged();
      }}
      onInsert={onInsert}
    />
  );
}

function AgendaCalendar({
  agenda,
  selected,
  onSelect,
  view,
  onViewChange,
  onClose,
  onNew,
  onEdit,
  onToggle,
  onInsert,
}: {
  agenda: ScheduleItem[];
  selected: string;
  onSelect: (iso: string) => void;
  view: ReturnType<typeof monthOf>;
  onViewChange: (v: ReturnType<typeof monthOf>) => void;
  onClose: () => void;
  onNew: () => void;
  onEdit: (item: ScheduleItem) => void;
  onToggle: (item: ScheduleItem) => void;
  onInsert: (text: string) => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  const busy = useMemo(() => busyDays(agenda), [agenda]);
  const dayItems = itemsOn(agenda, selected);

  return (
    <View style={styles.flex}>
      <Header title="Agenda" onBack={onClose} actionLabel="Novo" onAction={onNew} />
      <FlatList
        data={dayItems}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="always"
        ListHeaderComponent={
          <View style={styles.calendarBox}>
            <MonthCalendar view={view} onViewChange={onViewChange} selected={selected} onSelect={onSelect} busy={busy} compact />
            <Text style={styles.dayTitle}>{formatDayLong(selected)}</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Nada marcado neste dia. Toque em "Novo" para agendar.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.item, item.done && styles.itemDone]}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.done }}
              hitSlop={8}
              style={[styles.check, item.done && styles.checkOn]}
              onPress={() => onToggle(item)}>
              {item.done && <Icon name="check" size={14} color={colors.onPrimary} />}
            </Pressable>
            <Pressable style={styles.flex} onPress={() => onEdit(item)}>
              <Text style={[styles.itemTitle, item.done && styles.itemTitleDone]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.itemMeta} numberOfLines={1}>
                {item.kind === 'meeting' ? 'Reunião' : 'Tarefa'}
                {item.time ? ` · ${item.time}` : ' · dia todo'}
                {item.clientName ? ` · ${item.clientName}` : ''}
              </Text>
            </Pressable>
            {item.kind === 'meeting' && !item.done && (
              <Pressable accessibilityLabel="Enviar confirmação" style={styles.send} onPress={() => onInsert(confirmationMessage(item))}>
                <Icon name="respostas" size={16} color={colors.primaryText} />
                <Text style={styles.sendText}>Confirmar</Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  );
}

const AGENDA_FIELDS: FormFieldSpec[] = [
  { key: 'title', label: 'Título', placeholder: 'Ex.: Reunião de apresentação' },
  { key: 'notes', label: 'Observação', placeholder: 'Opcional' },
];

function AgendaForm({
  item,
  date: initialDate,
  leads,
  presetClient,
  onCancel,
  onDeleted,
  onSaved,
}: {
  item: ScheduleItem | null;
  date: string;
  leads: CRMLead[];
  presetClient: CRMLead | null;
  onCancel: () => void;
  onDeleted: () => void;
  onSaved: (item: ScheduleItem) => void;
}) {
  const colors = useColors();
  const styles = useStyles();
  const [kind, setKind] = useState<AgendaKind>(item?.kind ?? 'meeting');
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState<string>(item?.time ?? '');
  const [clientId, setClientId] = useState<string>(item?.clientId ?? presetClient?.id ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const form = useKeyboardForm(AGENDA_FIELDS, {
    title: item?.title ?? (presetClient ? `Reunião com ${presetClient.clientName}` : ''),
    notes: item?.notes ?? '',
  });
  const title = form.values.title.trim();

  const save = () => {
    if (!title) return;
    const client = leads.find(l => l.id === clientId);
    onSaved({
      id: item?.id ?? newAgendaId(),
      kind,
      title,
      date,
      time: time || undefined,
      clientId: client?.id,
      clientName: client?.clientName,
      notes: form.values.notes.trim() || undefined,
      done: item?.done ?? false,
    });
  };

  return (
    <View style={styles.flex}>
      <Header title={item ? 'Editar compromisso' : 'Novo compromisso'} onBack={onCancel} actionLabel="Salvar" onAction={save} disabled={!title} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.form} keyboardShouldPersistTaps="always">
        <ChoiceRow
          options={[
            { value: 'meeting' as AgendaKind, label: 'Reunião' },
            { value: 'task' as AgendaKind, label: 'Tarefa' },
          ]}
          value={kind}
          onChange={setKind}
        />
        {AGENDA_FIELDS.map(f => (
          <KeyboardFormField key={f.key} spec={f} value={form.values[f.key] ?? ''} active={form.active === f.key} onPress={() => form.setActive(f.key)} />
        ))}

        {/* Dia: setas para trocar sem abrir outro calendário */}
        <View style={styles.dateRow}>
          <Pressable accessibilityLabel="Dia anterior" hitSlop={8} style={styles.dateNav} onPress={() => setDate(d => addDays(d, -1))}>
            <Icon name="voltar" size={18} color={colors.text} />
          </Pressable>
          <Text style={styles.dateText}>{formatDayLong(date)}</Text>
          <Pressable accessibilityLabel="Próximo dia" hitSlop={8} style={styles.dateNav} onPress={() => setDate(d => addDays(d, 1))}>
            <Icon name="avancar" size={18} color={colors.text} />
          </Pressable>
        </View>

        <Text style={styles.section}>Horário</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always">
          <ChoiceRow options={[{ value: '', label: 'Dia todo' }, ...TIME_SLOTS.map(t => ({ value: t, label: t }))]} value={time} onChange={setTime} />
        </ScrollView>

        {leads.length > 0 && (
          <>
            <Text style={styles.section}>Cliente</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always">
              <ChoiceRow options={[{ value: '', label: 'Nenhum' }, ...leads.map(l => ({ value: l.id, label: l.clientName }))]} value={clientId} onChange={setClientId} />
            </ScrollView>
          </>
        )}

        {item && (
          <Pressable
            style={styles.deleteBtn}
            onPress={() => {
              if (!confirmDelete) return setConfirmDelete(true);
              Repo.deleteAgendaItem(item.id);
              onDeleted();
            }}>
            <Text style={styles.deleteText}>{confirmDelete ? 'Toque de novo para excluir' : 'Excluir compromisso'}</Text>
          </Pressable>
        )}
      </ScrollView>
      <KeyboardFormKeys sink={form.sink} activeKey={form.active} />
    </View>
  );
}

const useStyles = makeStyles(colors => ({
  flex: { flex: 1 },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  calendarBox: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, marginBottom: spacing.xs },
  dayTitle: { fontSize: 14, fontWeight: '600', color: colors.text, paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  empty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: touchTarget + 12,
  },
  itemDone: { opacity: 0.6 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  itemTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemTitleDone: { textDecorationLine: 'line-through' },
  itemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  send: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    minHeight: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  sendText: { fontSize: 12, fontWeight: '600', color: colors.primaryText },
  form: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  section: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: spacing.xs },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    minHeight: touchTarget,
  },
  dateNav: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 15, fontWeight: '600', color: colors.text },
  deleteBtn: { alignSelf: 'center', padding: spacing.md },
  deleteText: { fontSize: 14, fontWeight: '600', color: colors.danger },
}));
