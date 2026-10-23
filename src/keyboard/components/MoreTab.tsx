import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import type { CRMLead, MoreSubMenu, ScheduleItem, ThemePreference } from '../../types';
import { makeStyles, radius, spacing, touchTarget, useColors } from '../theme';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { Icon, IconTile } from './Icon';
import { ItemCard } from './ItemCard';

const THEME_LABEL: Record<ThemePreference, string> = {
  light: 'CLARO',
  dark: 'ESCURO',
  system: 'SISTEMA',
};

interface Props {
  agenda: ScheduleItem[];
  crm: CRMLead[];
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  onInsert: (text: string) => void;
}

/**
 * Aba "Mais" — Submenu com Agenda, CRM e Configurações (Aparência do Teclado).
 */
export function MoreTab({ agenda, crm, theme, onThemeChange, onInsert }: Props) {
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

  // Se nenhum submenu estiver aberto, exibe as opções do segundo menu
  if (!selectedSubMenu) {
    return (
      <ScrollView contentContainerStyle={styles.menuContainer} keyboardShouldPersistTaps="always">
        <Pressable
          testID="more-btn-agenda"
          style={styles.menuOption}
          onPress={() => setSelectedSubMenu('agenda')}>
          <IconTile name="calendario" size={36} />
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Agenda</Text>
            <Text style={styles.menuSubtitle}>Próximas visitas agendadas e compromissos</Text>
          </View>
          <Text style={styles.menuMeta}>{agenda.length} itens</Text>
        </Pressable>

        <Pressable
          testID="more-btn-crm"
          style={styles.menuOption}
          onPress={() => setSelectedSubMenu('crm')}>
          <IconTile name="clientes" size={36} />
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>CRM</Text>
            <Text style={styles.menuSubtitle}>Funil de atendimento e acompanhamento de leads</Text>
          </View>
          <Text style={styles.menuMeta}>{crm.length} leads</Text>
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

  // 1. SUBMENU: AGENDA
  if (selectedSubMenu === 'agenda') {
    return (
      <View style={styles.flex}>
        {backBar('Agenda de Visitas')}
        <FlatList
          data={agenda}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ItemCard
              testID={`agenda-${item.id}`}
              title={`${item.client} — ${item.productTitle}`}
              subtitle={`${item.datetime} • Status: ${item.status}`}
              icon="calendario"
              onPress={() =>
                onInsert(
                  `Olá, ${item.client}! Confirmando nossa visita ao ${item.productTitle} agendada para ${item.datetime}.`,
                )
              }
            />
          )}
        />
      </View>
    );
  }

  // 2. SUBMENU: CRM
  if (selectedSubMenu === 'crm') {
    return (
      <View style={styles.flex}>
        {backBar('CRM de Leads')}
        <FlatList
          data={crm}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ItemCard
              testID={`crm-${item.id}`}
              title={item.clientName}
              subtitle={`Etapa: ${item.stage} • Contato: ${item.lastContact}`}
              meta={item.phone}
              icon="clientes"
              onPress={() =>
                onInsert(
                  `Olá, ${item.clientName}! Como estão seus planos para o imóvel? Estou à disposição para tirar qualquer dúvida!`,
                )
              }
            />
          )}
        />
      </View>
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
  menuContainer: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
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
