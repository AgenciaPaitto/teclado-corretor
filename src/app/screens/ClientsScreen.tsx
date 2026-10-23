/**
 * Clientes (CRM) no app — mesmos dados do CRM do teclado.
 * Tela principal: busca, funil por etapa e lista; ficha e cadastro em submenus.
 */
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { formatDayLong, upcoming } from '../../agenda/agenda';
import { countByStage, initials, lastContactLabel, newLeadId, sortLeads, stagesFor } from '../../crm/crm';
import { getSegment } from '../../segments/segments';
import { Repo } from '../../storage/storage';
import type { CRMLead } from '../../types';
import { Icon } from '../../keyboard/components/Icon';
import { ChoiceRow } from '../../keyboard/components/KeyboardForm';
import { makeStyles, radius, spacing, touchTarget, typography, useColors } from '../../keyboard/theme';
import { Button, Card, CardText, CardTitle, EmptyState, Page, ScreenTitle, SubHeader } from '../components/ui';
import { useStoredList } from '../hooks/useStoredList';

interface Props {
  /** "Agendar" na ficha: abre a Agenda com o cliente. */
  onSchedule: (lead: CRMLead) => void;
}

type Section = { name: 'list' } | { name: 'detail'; id: string } | { name: 'form'; id: string | null };

export function ClientsScreen({ onSchedule }: Props) {
  const [leads, reload] = useStoredList(Repo.getCRM);
  const [section, setSection] = useState<Section>({ name: 'list' });
  const segment = getSegment(Repo.getSegment());

  const save = (lead: CRMLead) => {
    Repo.saveLead(lead);
    reload();
  };

  if (section.name === 'form') {
    const lead = section.id ? leads.find(l => l.id === section.id) ?? null : null;
    return (
      <LeadForm
        lead={lead}
        stages={segment.crmStages}
        onBack={() => setSection(lead ? { name: 'detail', id: lead.id } : { name: 'list' })}
        onSave={l => {
          save(l);
          setSection({ name: 'detail', id: l.id });
        }}
      />
    );
  }

  if (section.name === 'detail') {
    const lead = leads.find(l => l.id === section.id);
    if (lead) {
      return (
        <LeadDetail
          lead={lead}
          stages={stagesFor(segment, leads)}
          onBack={() => setSection({ name: 'list' })}
          onEdit={() => setSection({ name: 'form', id: lead.id })}
          onSave={save}
          onSchedule={() => onSchedule(lead)}
          onDelete={() =>
            Alert.alert('Excluir cliente', `Deseja excluir "${lead.clientName}"? Os compromissos dele continuam na agenda.`, [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Excluir',
                style: 'destructive',
                onPress: () => {
                  Repo.deleteLead(lead.id);
                  reload();
                  setSection({ name: 'list' });
                },
              },
            ])
          }
        />
      );
    }
  }

  return (
    <LeadList
      leads={leads}
      stages={stagesFor(segment, leads)}
      onOpen={id => setSection({ name: 'detail', id })}
      onNew={() => setSection({ name: 'form', id: null })}
    />
  );
}

function LeadList({ leads, stages, onOpen, onNew }: { leads: CRMLead[]; stages: string[]; onOpen: (id: string) => void; onNew: () => void }) {
  const colors = useColors();
  const styles = useStyles();
  const [stage, setStage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const counts = countByStage(leads);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortLeads(leads).filter(
      l => (!stage || l.stage === stage) && (!q || l.clientName.toLowerCase().includes(q) || l.phone.includes(q)),
    );
  }, [leads, stage, query]);

  if (!leads.length) {
    return (
      <Page>
        <ScreenTitle title="Clientes" />
        <EmptyState
          icon="clientes"
          title="Nenhum cliente ainda"
          text="Cadastre aqui ou direto no teclado (Mais › CRM), durante a conversa."
          actionLabel="Novo cliente"
          onAction={onNew}
        />
      </Page>
    );
  }

  return (
    <Page>
      <View style={styles.titleRow}>
        <ScreenTitle title="Clientes" subtitle={`${leads.length} no funil`} />
        <Pressable accessibilityRole="button" style={styles.addBtn} onPress={onNew}>
          <Icon name="adicionar" size={18} color={colors.onPrimary} />
          <Text style={styles.addBtnText}>Novo</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar por nome ou telefone"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
      />

      {/* Funil: quantidade por etapa (toque para filtrar) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.funnel}>
        {[null, ...stages].map((s, i) => {
          const active = stage === s;
          return (
            <Pressable
              key={s ?? 'all'}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.stage, active && styles.stageActive]}
              onPress={() => setStage(s)}>
              <Text style={[styles.stageCount, active && styles.stageTextActive]}>{s ? counts.get(s) ?? 0 : leads.length}</Text>
              <Text style={[styles.stageLabel, active && styles.stageTextActive]} numberOfLines={1}>
                {s ? `${i}. ${s}` : 'Todos'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.list}>
        {shown.length === 0 && <CardText>Nenhum cliente encontrado.</CardText>}
        {shown.map(l => (
          <Pressable key={l.id} style={({ pressed }) => [styles.leadCard, pressed && styles.pressed]} onPress={() => onOpen(l.id)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(l.clientName)}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.leadName} numberOfLines={1}>
                {l.clientName}
              </Text>
              <Text style={styles.leadMeta} numberOfLines={1}>
                {l.stage} · {lastContactLabel(l)}
              </Text>
            </View>
            <Icon name="avancar" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </Page>
  );
}

function LeadDetail({
  lead,
  stages,
  onBack,
  onEdit,
  onSave,
  onSchedule,
  onDelete,
}: {
  lead: CRMLead;
  stages: string[];
  onBack: () => void;
  onEdit: () => void;
  onSave: (l: CRMLead) => void;
  onSchedule: () => void;
  onDelete: () => void;
}) {
  const styles = useStyles();
  const next = upcoming(Repo.getAgenda().filter(a => a.clientId === lead.id), 3);
  return (
    <Page>
      <SubHeader title="Clientes" onBack={onBack} />
      <Card style={styles.profile}>
        <View style={[styles.avatar, styles.avatarLarge]}>
          <Text style={[styles.avatarText, styles.avatarTextLarge]}>{initials(lead.clientName)}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.profileName}>{lead.clientName}</Text>
          <Text style={styles.leadMeta}>{lead.phone || 'Sem telefone'}</Text>
          <Text style={styles.leadMeta}>Último contato: {lastContactLabel(lead).toLowerCase()}</Text>
        </View>
      </Card>

      <Card>
        <CardTitle>Etapa do funil</CardTitle>
        <ChoiceRow onCard options={stages.map(s => ({ value: s, label: s }))} value={lead.stage} onChange={stage => onSave({ ...lead, stage })} />
      </Card>

      <Card>
        <CardTitle>Próximos compromissos</CardTitle>
        {next.length ? (
          next.map(a => (
            <Text key={a.id} style={styles.agendaLine}>
              {formatDayLong(a.date)}
              {a.time ? ` · ${a.time}` : ''} — {a.title}
            </Text>
          ))
        ) : (
          <CardText>Nada agendado com este cliente.</CardText>
        )}
        <Button label="Agendar" variant="secondary" icon="calendario" onPress={onSchedule} />
      </Card>

      {lead.notes ? (
        <Card>
          <CardTitle>Anotações</CardTitle>
          <CardText>{lead.notes}</CardText>
        </Card>
      ) : null}

      <Button label="Registrar contato agora" icon="check" onPress={() => onSave({ ...lead, lastContactAt: new Date().toISOString() })} />
      <Button label="Editar" variant="secondary" onPress={onEdit} />
      <Button label="Excluir cliente" variant="danger" onPress={onDelete} />
    </Page>
  );
}

function LeadForm({ lead, stages, onBack, onSave }: { lead: CRMLead | null; stages: string[]; onBack: () => void; onSave: (l: CRMLead) => void }) {
  const colors = useColors();
  const styles = useStyles();
  const [name, setName] = useState(lead?.clientName ?? '');
  const [phone, setPhone] = useState(lead?.phone ?? '');
  const [notes, setNotes] = useState(lead?.notes ?? '');
  const [stage, setStage] = useState(lead?.stage ?? stages[0]);

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do cliente.');
      return;
    }
    const now = new Date().toISOString();
    onSave({
      id: lead?.id ?? newLeadId(),
      clientName: name.trim(),
      phone: phone.trim(),
      notes: notes.trim() || undefined,
      stage,
      createdAt: lead?.createdAt ?? now,
      lastContactAt: lead?.lastContactAt ?? now,
    });
  };

  const input = (label: string, value: string, onChange: (v: string) => void, placeholder: string, extra: object = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted} {...extra} />
    </View>
  );

  return (
    <Page>
      <SubHeader title={lead ? 'Editar cliente' : 'Novo cliente'} onBack={onBack} />
      <Card>
        {input('Nome', name, setName, 'Nome do cliente')}
        {input('Telefone / WhatsApp', phone, setPhone, 'Opcional', { keyboardType: 'phone-pad' })}
        {input('Anotações', notes, setNotes, 'Interesse, orçamento, preferências...', { multiline: true, style: [styles.input, styles.textArea] })}
      </Card>
      <Card>
        <CardTitle>Etapa</CardTitle>
        <ChoiceRow onCard options={stages.map(s => ({ value: s, label: s }))} value={stage} onChange={setStage} />
      </Card>
      <Button label="Salvar" onPress={save} />
    </Page>
  );
}

const useStyles = makeStyles(colors => ({
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget,
    borderRadius: radius.md,
  },
  addBtnText: { color: colors.onPrimary, ...typography.button },
  search: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget + 4,
    fontSize: 15,
  },
  funnel: { gap: spacing.sm },
  stage: {
    minWidth: 96,
    maxWidth: 160,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  stageActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  stageCount: { fontSize: 22, fontWeight: '700', color: colors.text },
  stageLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  stageTextActive: { color: colors.primaryText },
  list: { gap: spacing.sm },
  leadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarLarge: { width: 56, height: 56, borderRadius: 28 },
  avatarText: { fontSize: 15, fontWeight: '700', color: colors.primaryText },
  avatarTextLarge: { fontSize: 19 },
  leadName: { fontSize: 15, fontWeight: '600', color: colors.text },
  leadMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  profile: { flexDirection: 'row', alignItems: 'center' },
  profileName: { ...typography.title, color: colors.text },
  agendaLine: { fontSize: 14, color: colors.text },
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget + 4,
    fontSize: 15,
  },
  textArea: { minHeight: 88, paddingTop: spacing.md, textAlignVertical: 'top' },
}));
