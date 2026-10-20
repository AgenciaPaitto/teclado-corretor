import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AuthError, signIn, signUp } from '../../services/auth';
import { makeStyles, radius, spacing, useColors } from '../../keyboard/theme';

interface Props {
  onSuccess: () => void;
}

export function AuthScreen({ onSuccess }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creci, setCreci] = useState('');
  const [agency, setAgency] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha.');
      return;
    }

    if (isRegister && (!name.trim() || !creci.trim())) {
      Alert.alert('Atenção', 'Preencha seu nome e número de CRECI.');
      return;
    }

    if (isRegister && password.length < 6) {
      Alert.alert('Atenção', 'A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (!isRegister) {
        await signIn(email, password);
        onSuccess();
        return;
      }

      const result = await signUp({
        email,
        password,
        name: name.trim(),
        agency: agency.trim() || 'Imobiliária Parceira',
        creci: creci.trim(),
        phone: phone.trim(),
      });
      if (result === 'signed_in') {
        onSuccess();
      } else {
        Alert.alert(
          'Confirme seu e-mail',
          `Enviamos um link de confirmação para ${email.trim()}. Abra o e-mail, toque no link e depois entre aqui com seu e-mail e senha.`,
        );
        setIsRegister(false);
        setPassword('');
      }
    } catch (e) {
      Alert.alert('Não foi possível continuar', e instanceof AuthError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
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
          placeholder={isRegister ? 'Crie uma senha (mínimo 6 caracteres)' : 'Sua senha de acesso'}
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

        <Pressable
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          disabled={loading}
          onPress={handleSubmit}>
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.submitBtnText}>
              {isRegister ? 'Concluir Cadastro & Entrar' : 'Entrar no Sistema'}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles(colors => ({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  header: { marginBottom: spacing.md },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.info,
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
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
}));
