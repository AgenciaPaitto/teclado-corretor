import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { AuthError, signIn, signUp } from '../../services/auth';
import type { SegmentId } from '../../types';
import { SegmentPicker } from '../components/SegmentPicker';
import { KeyconLogo } from '../../keyboard/components/KeyconLogo';
import { brand, coralGlass, glassBorder, makeStyles, onCoralText, radius, spacing, touchTarget, typography, useColors } from '../../keyboard/theme';
import { CoralSheen } from '../components/ui';

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
  const [business, setBusiness] = useState('');
  const [phone, setPhone] = useState('');
  const [segment, setSegment] = useState<SegmentId | null>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha.');
      return;
    }

    if (isRegister && !name.trim()) {
      Alert.alert('Atenção', 'Preencha seu nome.');
      return;
    }

    if (isRegister && !segment) {
      Alert.alert('Atenção', 'Escolha o ramo do seu negócio. Se não encontrar o seu, escolha "Outro".');
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
        business: business.trim(),
        phone: phone.trim(),
        segment: segment ?? 'general',
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
      {/* Abertura: grafite com brilho coral e o logotipo (manual de marca) */}
      <View style={styles.hero}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <RadialGradient id="authGlow" cx="88%" cy="0%" r="85%" fx="88%" fy="0%">
              <Stop offset="0" stopColor={brand.coral} stopOpacity={0.6} />
              <Stop offset="0.45" stopColor={brand.coral} stopOpacity={0.18} />
              <Stop offset="1" stopColor={brand.coral} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#authGlow)" />
        </Svg>
        {/* Logotipo oficial com slogan (texto claro: o fundo aqui é sempre grafite) */}
        <KeyconLogo size={64} slogan textTone="light" />
      </View>

      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isRegister ? 'Crie sua conta' : 'Entre na sua conta'}
          </Text>
          <Text style={styles.subtitle}>
            Seus produtos, fotos e atalhos ficam sincronizados com o teclado.
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
              Criar conta
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
            placeholder="seu@email.com.br"
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
              <Text style={styles.label}>Nome do negócio (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Bella Store"
                placeholderTextColor={colors.textMuted}
                value={business}
                onChangeText={setBusiness}
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

              <Text style={styles.label}>Qual é o seu ramo?</Text>
              <Text style={styles.hint}>
                O app se adapta ao seu negócio: nomes, campos dos produtos, funil de clientes e a IA.
                Dá para trocar depois na tela Conta.
              </Text>
              <SegmentPicker value={segment} onChange={setSegment} />
            </>
          )}

          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed, loading && styles.submitBtnDisabled]}
            disabled={loading}
            onPress={handleSubmit}>
            <CoralSheen />
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.submitBtnText}>
                {isRegister ? 'Criar conta e entrar' : 'Entrar'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles(colors => ({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: spacing.xxl },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: brand.graphite,
    borderBottomLeftRadius: radius.xl + 4,
    borderBottomRightRadius: radius.xl + 4,
    overflow: 'hidden',
  },
  body: { padding: spacing.lg },
  header: { marginBottom: spacing.lg, marginTop: spacing.sm },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  tabToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    ...glassBorder(colors),
    borderRadius: radius.md,
  },
  toggleBtn: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: colors.primarySoft,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.primaryText,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: colors.surface,
    ...glassBorder(colors),
    padding: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: touchTarget + 4,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    minHeight: touchTarget + 4,
    justifyContent: 'center',
    // Liquid Glass: botão principal em pílula
    borderRadius: colors.glass ? radius.pill : radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...coralGlass(colors),
  },
  submitBtnPressed: {
    backgroundColor: colors.primaryStrong,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    ...onCoralText,
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
}));
