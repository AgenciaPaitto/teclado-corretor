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
import { colors, radius, spacing } from '../../keyboard/theme';

interface Props {
  onSuccess: () => void;
}

export function AuthScreen({ onSuccess }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('Ana Souza');
  const [email, setEmail] = useState('ana.souza@primeimoveis.com.br');
  const [password, setPassword] = useState('******');
  const [creci, setCreci] = useState('123456-F');
  const [agency, setAgency] = useState('Prime Imóveis');
  const [phone, setPhone] = useState('(11) 98888-7777');

  const handleSubmit = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha.');
      return;
    }

    if (isRegister && (!name.trim() || !creci.trim())) {
      Alert.alert('Atenção', 'Preencha seu nome e número de CRECI.');
      return;
    }

    // Salva perfil do corretor e autentica
    Repo.setBroker({
      name: name.trim() || 'Corretor',
      agency: agency.trim() || 'Imobiliária Parceira',
      creci: creci.trim() || '000000-F',
      phone: phone.trim() || '(11) 99999-9999',
    });

    Repo.setAuthToken(`jwt-token-${Date.now()}`);
    onSuccess();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.badge}>Acesso do Corretor</Text>
        <Text style={styles.title}>
          {isRegister ? 'Crie sua Conta' : 'Acesse sua Conta'}
        </Text>
        <Text style={styles.subtitle}>
          Configure seu perfil profissional para sincronizar seus dados, imóveis e atalhos com o teclado.
        </Text>
      </View>

      <View style={styles.tabToggle}>
        <Pressable
          style={[styles.toggleBtn, !isRegister && styles.toggleBtnActive]}
          onPress={() => setIsRegister(false)}>
          <Text style={[styles.toggleText, !isRegister && styles.toggleTextActive]}>
            Entrar
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, isRegister && styles.toggleBtnActive]}
          onPress={() => setIsRegister(true)}>
          <Text style={[styles.toggleText, isRegister && styles.toggleTextActive]}>
            Criar Nova Conta
          </Text>
        </Pressable>
      </View>

      <View style={styles.formCard}>
        {isRegister && (
          <>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Ana Souza"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </>
        )}

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="seu.email@imobiliaria.com.br"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Sua senha de acesso"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {isRegister && (
          <>
            <Text style={styles.label}>Número do CRECI (com UF)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 123456-F/SP"
              placeholderTextColor={colors.textMuted}
              value={creci}
              onChangeText={setCreci}
            />

            <Text style={styles.label}>Nome da Imobiliária / Agência</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Prime Imóveis"
              placeholderTextColor={colors.textMuted}
              value={agency}
              onChangeText={setAgency}
            />

            <Text style={styles.label}>Telefone com WhatsApp</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: (11) 98888-7777"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </>
        )}

        <Pressable style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>
            {isRegister ? 'Concluir Cadastro & Entrar' : 'Entrar no Sistema'}
          </Text>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tabToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.surfaceAlt,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
