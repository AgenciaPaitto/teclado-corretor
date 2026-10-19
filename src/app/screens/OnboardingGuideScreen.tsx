import React, { useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../../keyboard/theme';

export function OnboardingGuideScreen() {
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios'>(
    Platform.OS === 'ios' ? 'ios' : 'android',
  );
  const [testText, setTestText] = useState('');

  const openSettings = () => {
    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.INPUT_METHOD_SETTINGS').catch(() =>
        Linking.openSettings(),
      );
    } else {
      Linking.openSettings();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Banner Introdutório */}
      <View style={styles.heroCard}>
        <Text style={styles.heroBadge}>Instalação & Ativação</Text>
        <Text style={styles.heroTitle}>Teclado do Corretor</Text>
        <Text style={styles.heroDesc}>
          Ative o teclado nas configurações do seu celular para enviar fichas de imóveis,
          fotos em alta resolução, atalhos de áudio e respostas com IA diretamente de dentro do WhatsApp.
        </Text>
      </View>

      {/* Seletor de Sistema: Android vs iOS */}
      <View style={styles.platformSelector}>
        <Pressable
          style={[styles.platBtn, activePlatform === 'android' && styles.platBtnActive]}
          onPress={() => setActivePlatform('android')}>
          <Text style={[styles.platText, activePlatform === 'android' && styles.platTextActive]}>
            Android
          </Text>
        </Pressable>
        <Pressable
          style={[styles.platBtn, activePlatform === 'ios' && styles.platBtnActive]}
          onPress={() => setActivePlatform('ios')}>
          <Text style={[styles.platText, activePlatform === 'ios' && styles.platTextActive]}>
            iPhone (iOS)
          </Text>
        </Pressable>
      </View>

      {/* Passo a Passo Android */}
      {activePlatform === 'android' ? (
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Passo a Passo para Android:</Text>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <View style={styles.stepBody}>
              <Text style={styles.stepHeading}>Habilite o Teclado</Text>
              <Text style={styles.stepDesc}>
                Vá em <Text style={styles.bold}>Configurações &gt; Sistema &gt; Idiomas e Entrada &gt; Teclados na tela &gt; Gerenciar teclados</Text>.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <View style={styles.stepBody}>
              <Text style={styles.stepHeading}>Ative o 'Teclado do Corretor'</Text>
              <Text style={styles.stepDesc}>
                Ligue a chave ao lado de <Text style={styles.bold}>Teclado do Corretor</Text> e confirme a ativação.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <View style={styles.stepBody}>
              <Text style={styles.stepHeading}>Selecione ao Digitar</Text>
              <Text style={styles.stepDesc}>
                Abra o WhatsApp, toque no campo de mensagem e use o ícone de teclado na barra inferior para selecionar o Teclado do Corretor.
              </Text>
            </View>
          </View>

          <Pressable style={styles.actionBtn} onPress={openSettings}>
            <Text style={styles.actionBtnText}>Abrir Ajustes de Teclado no Android</Text>
          </Pressable>
        </View>
      ) : (
        /* Passo a Passo iOS */
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Passo a Passo para iPhone (iOS):</Text>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <View style={styles.stepBody}>
              <Text style={styles.stepHeading}>Adicionar Teclado</Text>
              <Text style={styles.stepDesc}>
                Acesse <Text style={styles.bold}>Ajustes &gt; Geral &gt; Teclado &gt; Teclados &gt; Adicionar Novo Teclado...</Text>
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <View style={styles.stepBody}>
              <Text style={styles.stepHeading}>Selecione 'Teclado do Corretor'</Text>
              <Text style={styles.stepDesc}>
                Na seção de teclados de terceiros, selecione <Text style={styles.bold}>Teclado do Corretor</Text>.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <View style={styles.stepBody}>
              <Text style={styles.stepHeading}>ATIVAR 'Permitir Acesso Total'</Text>
              <Text style={styles.stepDesc}>
                Toque em <Text style={styles.bold}>Teclado do Corretor</Text> na lista e ligue <Text style={styles.bold}>Permitir Acesso Total</Text>. Esse passo é fundamental para o Copilot de IA e fotos na nuvem.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>4</Text></View>
            <View style={styles.stepBody}>
              <Text style={styles.stepHeading}>Alternar no WhatsApp</Text>
              <Text style={styles.stepDesc}>
                No WhatsApp, toque e segure no ícone do Globo (🌐) na parte inferior esquerda e escolha o Teclado do Corretor.
              </Text>
            </View>
          </View>

          <Pressable style={styles.actionBtn} onPress={openSettings}>
            <Text style={styles.actionBtnText}>Abrir Ajustes do iPhone</Text>
          </Pressable>
        </View>
      )}

      {/* Área de Teste Rápido */}
      <View style={styles.testCard}>
        <Text style={styles.testTitle}>Teste seu Teclado Agora</Text>
        <Text style={styles.testDesc}>
          Toque no campo abaixo para abrir o teclado e testar se ele já está ativado:
        </Text>
        <TextInput
          style={styles.testInput}
          placeholder="Toque aqui para testar o teclado..."
          placeholderTextColor={colors.textMuted}
          value={testText}
          onChangeText={setTestText}
          multiline
        />
        {testText ? (
          <Pressable style={styles.clearBtn} onPress={() => setTestText('')}>
            <Text style={styles.clearBtnText}>Limpar texto</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  heroCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  heroBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  platformSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  platBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  platBtnActive: {
    backgroundColor: colors.surfaceAlt,
  },
  platText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  platTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  stepsCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    gap: 12,
  },
  stepsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  stepBody: { flex: 1 },
  stepHeading: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  bold: {
    color: colors.text,
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 6,
  },
  actionBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  testCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: 8,
  },
  testTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  testDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  testInput: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  clearBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearBtnText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
