import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { makeStyles, radius, spacing, useColors } from '../../keyboard/theme';
import { KeyboardBridge } from '../../native/KeyboardBridge';

export function OnboardingGuideScreen() {
  const colors = useColors();
  const styles = useStyles();
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios'>(
    Platform.OS === 'ios' ? 'ios' : 'android',
  );
  const [testText, setTestText] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  const checkStatus = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const enabled = await KeyboardBridge.isKeyboardEnabled();
        const selected = await KeyboardBridge.isKeyboardSelected();
        setIsEnabled(enabled);
        setIsSelected(selected);
      } catch {
        // Ignora erros de checagem
      }
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        checkStatus();
      }
    });
    return () => sub.remove();
  }, [checkStatus]);

  const openSettings = () => {
    if (Platform.OS === 'android') {
      KeyboardBridge.openKeyboardSettings().catch(() => {
        Linking.sendIntent('android.settings.INPUT_METHOD_SETTINGS').catch(() =>
          Linking.openSettings(),
        );
      });
    } else {
      Linking.openSettings();
    }
  };

  const openPicker = () => {
    KeyboardBridge.openInputMethodPicker();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Banner Introdutório */}
      <View style={styles.heroCard}>
        <Text style={styles.heroBadge}>Ativação do Teclado</Text>
        <Text style={styles.heroTitle}>Sales Copilot</Text>
        <Text style={styles.heroDesc}>
          Para usar o teclado no WhatsApp e em qualquer aplicativo, siga os dois passos
          rápidos de ativação abaixo.
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

      {/* Passo a Passo Android com Diagnóstico em Tempo Real */}
      {activePlatform === 'android' ? (
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Etapas de Ativação no Android:</Text>

          {/* Status Geral */}
          <View style={[styles.statusBox, isSelected ? styles.statusBoxReady : styles.statusBoxPending]}>
            <Text style={styles.statusBoxIcon}>{isSelected ? '✓' : 'ℹ'}</Text>
            <View style={styles.statusBoxContent}>
              <Text style={styles.statusBoxTitle}>
                {isSelected
                  ? 'Sales Copilot Ativo e Pronto!'
                  : isEnabled
                  ? 'Habilitado, aguardando seleção como teclado atual'
                  : 'Teclado ainda não habilitado no sistema'}
              </Text>
              <Text style={styles.statusBoxSubtitle}>
                {isSelected
                  ? 'Você já pode digitar ou testar no campo abaixo e usar no WhatsApp.'
                  : isEnabled
                  ? 'Toque no Passo 2 abaixo para selecionar o Sales Copilot.'
                  : 'Toque no Passo 1 abaixo para ligar a chave do teclado.'}
              </Text>
            </View>
          </View>

          {/* PASSO 1: Habilitar nas configurações */}
          <View style={styles.stepRow}>
            <View style={[styles.stepNum, isEnabled && styles.stepNumDone]}>
              <Text style={styles.stepNumText}>{isEnabled ? '✓' : '1'}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepHeading}>
                Passo 1: Habilitar em 'Gerenciar Teclados'
              </Text>
              <Text style={styles.stepDesc}>
                Ative a chave ao lado de <Text style={styles.bold}>Sales Copilot</Text> nas configurações do seu celular.
              </Text>
              <Pressable
                style={[styles.actionBtn, isEnabled && styles.actionBtnDone]}
                onPress={openSettings}>
                <Text style={styles.actionBtnText}>
                  {isEnabled ? '✓ Habilitado nas Configurações' : '1. Abrir Configurações de Teclado'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* PASSO 2: Selecionar como teclado atual */}
          <View style={styles.stepRow}>
            <View style={[styles.stepNum, isSelected && styles.stepNumDone]}>
              <Text style={styles.stepNumText}>{isSelected ? '✓' : '2'}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepHeading}>
                Passo 2: Selecionar como Teclado Ativo
              </Text>
              <Text style={styles.stepDesc}>
                O Android exige escolher qual teclado você deseja usar no momento. Toque no botão abaixo e escolha <Text style={styles.bold}>Sales Copilot</Text>.
              </Text>
              <Pressable
                style={[styles.actionBtnPrimary, isSelected && styles.actionBtnDone]}
                onPress={openPicker}>
                <Text style={[styles.actionBtnPrimaryText, isSelected && styles.actionBtnDoneText]}>
                  {isSelected ? '✓ Selecionado como Teclado Atual' : '2. Selecionar Sales Copilot Agora'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Dica para alternar no dia a dia */}
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 Como alternar no dia a dia:</Text>
            <Text style={styles.tipDesc}>
              Quando estiver no WhatsApp ou em qualquer aplicativo, use o botão de globo (🌐) ou o ícone de teclado na barra inferior de navegação do Android para alternar entre o Sales Copilot e o teclado tradicional a qualquer momento.
            </Text>
          </View>
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
              <Text style={styles.stepHeading}>Selecione 'Sales Copilot'</Text>
              <Text style={styles.stepDesc}>
                Na seção de teclados de terceiros, selecione <Text style={styles.bold}>Sales Copilot</Text>.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <View style={styles.stepBody}>
              <Text style={styles.stepHeading}>ATIVAR 'Permitir Acesso Total'</Text>
              <Text style={styles.stepDesc}>
                Toque em <Text style={styles.bold}>Sales Copilot</Text> na lista de teclados adicionados e ative <Text style={styles.bold}>Permitir Acesso Total</Text>. Esse passo é fundamental para o Copilot de IA e fotos na nuvem.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>4</Text></View>
            <View style={styles.stepBody}>
              <Text style={styles.stepHeading}>Alternar no WhatsApp</Text>
              <Text style={styles.stepDesc}>
                No WhatsApp, toque e segure no ícone do Globo (🌐) na parte inferior esquerda e escolha o Sales Copilot.
              </Text>
            </View>
          </View>

          <Pressable style={styles.actionBtnPrimary} onPress={openSettings}>
            <Text style={styles.actionBtnPrimaryText}>Abrir Ajustes do iPhone</Text>
          </Pressable>
        </View>
      )}

      {/* Área de Teste Rápido */}
      <View style={styles.testCard}>
        <Text style={styles.testTitle}>Passo 3: Teste seu Teclado Agora</Text>
        <Text style={styles.testDesc}>
          Toque no campo abaixo para abrir o teclado imediatamente e verificar se está funcionando:
        </Text>
        <TextInput
          style={styles.testInput}
          placeholder="Toque aqui para digitar e testar o teclado..."
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

const useStyles = makeStyles(colors => ({
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
    color: colors.info,
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
    gap: 16,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.md,
    gap: 10,
  },
  statusBoxReady: {
    backgroundColor: colors.successBg,
  },
  statusBoxPending: {
    backgroundColor: colors.surfaceAlt,
  },
  statusBoxIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success,
  },
  statusBoxContent: {
    flex: 1,
  },
  statusBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  statusBoxSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
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
  stepNumDone: {
    backgroundColor: colors.successStrong,
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
    marginBottom: 8,
  },
  bold: {
    color: colors.text,
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  actionBtnDone: {
    backgroundColor: colors.successBg,
  },
  actionBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtnPrimary: {
    backgroundColor: colors.primaryStrong,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnDoneText: {
    color: colors.successText,
  },
  tipBox: {
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    borderRadius: radius.md,
    marginTop: 4,
  },
  tipTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.info,
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
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
}));
