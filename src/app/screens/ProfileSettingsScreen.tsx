import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Repo } from '../../storage/storage';
import type { BrokerProfile, ThemePreference } from '../../types';
import { colors, radius, spacing } from '../../keyboard/theme';
import { AI_CONFIG } from '../../services/aiService';

interface Props {
  onLogout: () => void;
  onThemeChange?: (theme: ThemePreference) => void;
  onProfileChange?: (broker: BrokerProfile) => void;
}

export function ProfileSettingsScreen({ onLogout, onThemeChange, onProfileChange }: Props) {
  const [broker, setBroker] = useState<BrokerProfile>(() => Repo.getBroker());
  const [theme, setTheme] = useState<ThemePreference>(() => Repo.getTheme());
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState(broker.name);
  const [agency, setAgency] = useState(broker.agency);
  const [creci, setCreci] = useState(broker.creci);
  const [phone, setPhone] = useState(broker.phone);

  const handleSaveProfile = () => {
    const updated: BrokerProfile = {
      name: name.trim() || broker.name,
      agency: agency.trim() || broker.agency,
      creci: creci.trim() || broker.creci,
      phone: phone.trim() || broker.phone,
    };

    Repo.setBroker(updated);
    setBroker(updated);
    onProfileChange?.(updated);
    setIsEditing(false);
    Alert.alert('Sucesso', 'Perfil atualizado e sincronizado com o teclado!');
  };

  const handleSelectTheme = (t: ThemePreference) => {
    setTheme(t);
    Repo.setTheme(t);
    onThemeChange?.(t);
  };

  const handleResetData = () => {
    Alert.alert(
      'Restaurar Dados',
      'Deseja restaurar as pastas de imóveis, fotos de exemplo e atalhos de demonstração?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: () => {
            Repo.resetToDefaults();
            const restored = Repo.getBroker();
            setBroker(restored);
            setName(restored.name);
            setAgency(restored.agency);
            setCreci(restored.creci);
            setPhone(restored.phone);
            setTheme(Repo.getTheme());
            onProfileChange?.(restored);
            Alert.alert('Restaurado', 'Dados de exemplo restaurados com sucesso.');
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.badge}>Configurações Gerais</Text>
        <Text style={styles.title}>Perfil & Sistema</Text>
      </View>

      {/* Cartão de Perfil */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Dados do Corretor</Text>
          <Pressable onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editBtnText}>{isEditing ? 'Cancelar' : 'Editar'}</Text>
          </Pressable>
        </View>

        {isEditing ? (
          <View style={styles.formGap}>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Imobiliária / Agência</Text>
            <TextInput
              style={styles.input}
              value={agency}
              onChangeText={setAgency}
            />

            <Text style={styles.label}>CRECI</Text>
            <TextInput
              style={styles.input}
              value={creci}
              onChangeText={setCreci}
            />

            <Text style={styles.label}>WhatsApp / Telefone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
            />

            <Pressable style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>Salvar Alterações</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.profileDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nome:</Text>
              <Text style={styles.detailValue}>{broker.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Imobiliária:</Text>
              <Text style={styles.detailValue}>{broker.agency}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>CRECI:</Text>
              <Text style={styles.detailValue}>{broker.creci}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>WhatsApp:</Text>
              <Text style={styles.detailValue}>{broker.phone}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Tema da Interface */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Aparência do Teclado e App</Text>
        <Text style={styles.sectionDesc}>Escolha como a interface deve se comportar:</Text>

        {(
          [
            { key: 'light', label: 'Modo Claro', desc: 'Fundo limpo e suave' },
            { key: 'dark', label: 'Modo Escuro', desc: 'Sóbrio e confortável para uso contínuo' },
            { key: 'system', label: 'Padrão do Sistema', desc: 'Segue a configuração do aparelho' },
          ] as const
        ).map(opt => {
          const isSelected = theme === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[styles.themeOptionRow, isSelected && styles.themeOptionRowActive]}
              onPress={() => handleSelectTheme(opt.key)}>
              <View>
                <Text style={[styles.themeLabel, isSelected && styles.themeLabelActive]}>
                  {opt.label}
                </Text>
                <Text style={styles.themeSubDesc}>{opt.desc}</Text>
              </View>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          );
        })}
      </View>

      {/* Status da Sincronização */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Status do Teclado</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusDot}>●</Text>
          <Text style={styles.statusText}>Armazenamento local compartilhado com o teclado (MMKV)</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={[styles.statusDot, styles.statusDotPending]}>●</Text>
          <Text style={styles.statusText}>Fotos e vídeos: links externos (upload em nuvem ainda não configurado)</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={[styles.statusDot, AI_CONFIG.useMock && styles.statusDotPending]}>●</Text>
          <Text style={styles.statusText}>
            {AI_CONFIG.useMock
              ? 'AI Copilot em modo demonstração (servidor não configurado)'
              : 'AI Copilot conectado ao servidor'}
          </Text>
        </View>
      </View>

      {/* Ações Avançadas */}
      <View style={styles.actionsCard}>
        <Pressable style={styles.resetBtn} onPress={handleResetData}>
          <Text style={styles.resetBtnText}>Restaurar Catálogo de Demonstração</Text>
        </Pressable>

        <Pressable style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Sair da Conta</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  header: { marginBottom: spacing.md },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  sectionDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  editBtnText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
  },
  profileDetails: { gap: 6 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  detailLabel: { fontSize: 12, color: colors.textMuted },
  detailValue: { fontSize: 12, fontWeight: '600', color: colors.text },
  formGap: { gap: 8 },
  label: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.md,
    padding: 10,
    fontSize: 12,
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  themeOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    borderRadius: radius.md,
    marginTop: 4,
  },
  themeOptionRowActive: {
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  themeLabel: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  themeLabelActive: { color: colors.text, fontWeight: '700' },
  themeSubDesc: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  checkmark: { color: '#3b82f6', fontWeight: '700', fontSize: 14 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  statusDot: { color: '#10b981', fontSize: 10 },
  statusDotPending: { color: '#f59e0b' },
  statusText: { color: colors.textSecondary, fontSize: 11, flex: 1 },
  actionsCard: { gap: 8, marginTop: 4 },
  resetBtn: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  resetBtnText: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  logoutBtnText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
});
