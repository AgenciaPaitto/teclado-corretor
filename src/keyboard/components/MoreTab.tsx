import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CRMLead, MoreSubMenu, ScheduleItem, ThemePreference } from '../../types';
import { Repo } from '../../storage/storage';
import { colors, radius, spacing } from '../theme';
import { ItemCard } from './ItemCard';

interface Props {
  agenda: ScheduleItem[];
  crm: CRMLead[];
  theme: ThemePreference;
  onThemeChange?: (theme: ThemePreference) => void;
  onInsert: (text: string) => void;
}

/**
 * Aba "Mais" — Submenu com Agenda, CRM e Configurações (Aparência do Teclado).
 */
export function MoreTab({ agenda, crm, theme, onThemeChange, onInsert }: Props) {
  const [selectedSubMenu, setSelectedSubMenu] = useState<MoreSubMenu>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemePreference>(theme);

  const handleSelectTheme = (t: ThemePreference) => {
    setCurrentTheme(t);
    Repo.setTheme(t);
    onThemeChange?.(t);
  };

  // Se nenhum submenu estiver aberto, exibe as opções do segundo menu
  if (!selectedSubMenu) {
    return (
      <View style={styles.menuContainer}>
        <Pressable
          testID="more-btn-agenda"
          style={styles.menuOption}
          onPress={() => setSelectedSubMenu('agenda')}>
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
          <View style={styles.menuInfo}>
            <Text style={styles.menuTitle}>Configurações</Text>
            <Text style={styles.menuSubtitle}>Aparência do teclado (Claro, Escuro ou Padrão)</Text>
          </View>
          <Text style={styles.menuMeta}>{currentTheme.toUpperCase()}</Text>
        </Pressable>
      </View>
    );
  }

  // 1. SUBMENU: AGENDA
  if (selectedSubMenu === 'agenda') {
    return (
      <View style={styles.flex}>
        <Pressable onPress={() => setSelectedSubMenu(null)} style={styles.breadcrumb}>
          <Text style={styles.back}>Voltar</Text>
          <Text style={styles.crumbTitle}>Agenda de Visitas</Text>
        </Pressable>
        <FlatList
          data={agenda}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ItemCard
              testID={`agenda-${item.id}`}
              title={`${item.client} — ${item.productTitle}`}
              subtitle={`${item.datetime} • Status: ${item.status}`}
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
        <Pressable onPress={() => setSelectedSubMenu(null)} style={styles.breadcrumb}>
          <Text style={styles.back}>Voltar</Text>
          <Text style={styles.crumbTitle}>CRM de Leads</Text>
        </Pressable>
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

  // 3. SUBMENU: CONFIGURAÇÕES (APARÊNCIA DO TECLADO)
  return (
    <View style={styles.flex}>
      <Pressable onPress={() => setSelectedSubMenu(null)} style={styles.breadcrumb}>
        <Text style={styles.back}>Voltar</Text>
        <Text style={styles.crumbTitle}>Aparência do Teclado</Text>
      </Pressable>

      <View style={styles.themeOptionsContainer}>
        <Text style={styles.themeSectionTitle}>Tema da Interface</Text>

        {(
          [
            { key: 'light', label: 'Modo Claro' },
            { key: 'dark', label: 'Modo Escuro' },
            { key: 'system', label: 'Padrão do Sistema' },
          ] as const
        ).map(opt => {
          const isSelected = currentTheme === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[styles.themeOptionRow, isSelected && styles.themeOptionRowActive]}
              onPress={() => handleSelectTheme(opt.key)}>
              <Text style={[styles.themeOptionText, isSelected && styles.themeOptionTextActive]}>
                {opt.label}
              </Text>
              {isSelected && <Text style={styles.themeCheckmark}>✓</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.sm },
  menuContainer: {
    padding: spacing.sm,
    gap: 8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radius.md,
  },
  menuInfo: { flex: 1 },
  menuTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  menuSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  menuMeta: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
  },
  back: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  crumbTitle: { color: colors.text, fontWeight: '600', fontSize: 13, flex: 1 },
  themeOptionsContainer: {
    padding: spacing.md,
    gap: 10,
  },
  themeSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  themeOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.md,
  },
  themeOptionRowActive: {
    backgroundColor: colors.surfaceAlt,
  },
  themeOptionText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  themeOptionTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  themeCheckmark: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
  },
});
