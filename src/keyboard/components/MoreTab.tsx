import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { upcoming } from '../../agenda/agenda';
import type { SegmentProfile } from '../../segments/segments';
import type { CRMLead, MoreSubMenu, ScheduleItem, ThemePreference } from '../../types';
import { glassBorder, makeStyles, radius, spacing, touchTarget, useColors } from '../theme';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { Icon, IconTile } from './Icon';
import { KeyboardAgenda } from './KeyboardAgenda';
import { KeyboardCRM } from './KeyboardCRM';

const THEME_LABEL: Record<ThemePreference, string> = {
  light: 'CLARO',
  dark: 'ESCURO',
  system: 'SISTEMA',
};

interface Props {
  agenda: ScheduleItem[];
  crm: CRMLead[];
  /** Ramo do usuário: etapas do funil e mensagem de retorno do CRM. */
  segment: SegmentProfile;
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  onInsert: (text: string) => void;
  /** CRM e Agenda abrem com o teclado em tela grande. */
  onExpandedChange: (expanded: boolean) => void;
  /** Releitura dos dados depois de gravar um cliente ou compromisso. */
  onDataChanged: () => void;
}

/**
 * Aba "Mais" — Agenda e CRM (em tela grande), Configurações e Diagnóstico.
 */
export function MoreTab({ agenda = [], crm = [], segment, theme, onThemeChange, onInsert, onExpandedChange, onDataChanged }: Props) {
  const colors = useColors();
  const styles = useStyles();

  const backBar = (title: string) => (
    <Pressable onPress={() => setSelectedSubMenu(null)} style={styles.breadcrumb}>
      <Icon name="voltar" size={18} color={colors.textMuted} />
      <Text style={styles.back}>Voltar</Text>
      <Text style={styles.crumbTitle}>{title}</Text>
    </Pressable>
  );
  const [selectedSubMenu, setSelectedSubMenu] = useState<MoreSubMenu>(null);
  /** CRM → "Agendar": a agenda abre já com o cliente. */
  const [scheduleFor, setScheduleFor] = useState<CRMLead | null>(null);

  const big = selectedSubMenu === 'crm' || selectedSubMenu === 'agenda';
  /** Enviou para a conversa: fecha a tela grande e mostra a conversa de novo. */
  const sendAndClose = (text: string) => {
    onInsert(text);
    setScheduleFor(null);
    setSelectedSubMenu(null);
  };
  useEffect(() => {
    onExpandedChange(big);
  }, [big, onExpandedChange]);
  // Sair da aba Mais com o CRM aberto: o teclado volta ao normal
  useEffect(() => () => onExpandedChange(false), [onExpandedChange]);

  // Se nenhum submenu estiver aberto, exibe as opções do segundo menu
  if (!selectedSubMenu) {
    const safeAgenda = agenda || [];
    const safeCrm = crm || [];
    return (
      <ScrollView contentContainerStyle={styles.menuContainer} keyboardShouldPersistTaps="always">
        <Pressable
          testID="more-btn-agenda"
          style={styles.menuOption}
          onPress={() => setSelectedSubMenu('agenda')}>
          <IconTile name="calendario" size={36} />
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Agenda</Text>
            <Text style={styles.menuSubtitle}>Calendário de reuniões e tarefas</Text>
          </View>
          <Text style={styles.menuMeta}>{upcoming(safeAgenda, Infinity).length} próximos</Text>
        </Pressable>

        <Pressable
          testID="more-btn-crm"
          style={styles.menuOption}
          onPress={() => setSelectedSubMenu('crm')}>
          <IconTile name="clientes" size={36} />
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>CRM</Text>
            <Text style={styles.menuSubtitle}>Clientes e funil de vendas</Text>
          </View>
          <Text style={styles.menuMeta}>{safeCrm.length} clientes</Text>
        </Pressable>

        <Pressable
          testID="more-btn-settings"
          style={styles.menuOption}
          onPress={() => setSelectedSubMenu('settings')}>
          <IconTile name="configuracoes" size={36} />
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Configurações</Text>
            <Text style={styles.menuSubtitle}>Aparência do teclado (Claro, Escuro ou Padrão)</Text>
          </View>
          <Text style={styles.menuMeta}>{THEME_LABEL[theme]}</Text>
        </Pressable>

        <Pressable
          testID="more-btn-diagnostics"
          style={styles.menuOption}
          onPress={() => setSelectedSubMenu('diagnostics')}>
          <IconTile name="dados" size={36} />
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Diagnóstico</Text>
            <Text style={styles.menuSubtitle}>O que o campo em foco aceita: texto, fotos, GIFs</Text>
          </View>
        </Pressable>
      </ScrollView>
    );
  }

  // 1. AGENDA (tela grande)
  if (selectedSubMenu === 'agenda') {
    return (
      <KeyboardAgenda
        agenda={agenda}
        leads={crm}
        presetClient={scheduleFor}
        onInsert={sendAndClose}
        onChanged={onDataChanged}
        onClose={() => {
          setScheduleFor(null);
          setSelectedSubMenu(null);
        }}
      />
    );
  }

  // 2. CRM (tela grande)
  if (selectedSubMenu === 'crm') {
    return (
      <KeyboardCRM
        segment={segment}
        leads={crm}
        agenda={agenda}
        onInsert={sendAndClose}
        onChanged={onDataChanged}
        onClose={() => setSelectedSubMenu(null)}
        onSchedule={lead => {
          setScheduleFor(lead);
          setSelectedSubMenu('agenda');
        }}
      />
    );
  }

  // 3. SUBMENU: DIAGNÓSTICO (formatos aceitos pelo campo em foco)
  if (selectedSubMenu === 'diagnostics') {
    return (
      <View style={styles.flex}>
        {backBar('Diagnóstico')}
        <DiagnosticsPanel onInsert={onInsert} />
      </View>
    );
  }

  // 4. SUBMENU: CONFIGURAÇÕES (APARÊNCIA DO TECLADO)
  return (
    <View style={styles.flex}>
      {backBar('Aparência do Teclado')}

      <ScrollView contentContainerStyle={styles.themeOptionsContainer} keyboardShouldPersistTaps="always">
        <Text style={styles.themeSectionTitle}>Tema da Interface</Text>

        {(
          [
            { key: 'light', label: 'Modo Claro' },
            { key: 'dark', label: 'Modo Escuro' },
            { key: 'system', label: 'Padrão do Sistema' },
          ] as const
        ).map(opt => {
          const isSelected = theme === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[styles.themeOptionRow, isSelected && styles.themeOptionRowActive]}
              onPress={() => onThemeChange(opt.key)}>
              <Text style={[styles.themeOptionText, isSelected && styles.themeOptionTextActive]}>
                {opt.label}
              </Text>
              {isSelected && <Icon name="check" size={18} color={colors.primaryText} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles(colors => ({
  flex: { flex: 1 },
  list: { padding: spacing.sm },
  empty: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: spacing.xl },
  menuContainer: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    ...glassBorder(colors),
    padding: spacing.md,
    borderRadius: radius.md,
  },
  menuInfo: { flex: 1 },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  menuMeta: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: touchTarget,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bg,
  },
  back: { color: colors.textMuted, fontWeight: '600', fontSize: 13, marginRight: spacing.sm },
  crumbTitle: { color: colors.text, fontWeight: '600', fontSize: 15, flex: 1 },
  themeOptionsContainer: {
    padding: spacing.md,
    gap: 10,
  },
  themeSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  themeOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    ...glassBorder(colors),
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  themeOptionRowActive: {
    backgroundColor: colors.primarySoft,
  },
  themeOptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  themeOptionTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
}));
