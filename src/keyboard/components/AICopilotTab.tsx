import { t } from '../../i18n';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { AIServiceError, analyzeClipboardMessage } from '../../services/aiService';
import type { AISuggestion, SuggestionTone } from '../../types';
import { coralGlass, glassBorder, makeStyles, onCoralText, radius, spacing, touchTarget, useColors } from '../theme';
import { CoralSheen } from './Glass';
import { Icon } from './Icon';

interface Props {
  onInsert: (text: string) => void;
}

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; clientMessage: string; suggestions: AISuggestion[] };

const TONE_LABEL: Record<SuggestionTone, string> = {
  cordial: 'Cordial',
  objetiva: 'Objetiva',
  persuasiva: 'Persuasiva',
};

/**
 * IA do teclado: analisa a mensagem que o usuário copiou (o teclado não lê a
 * conversa sozinho) e sugere respostas para revisar e inserir.
 */
export function AICopilotTab({ onInsert }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const [state, setState] = useState<State>({ status: 'idle' });

  const analyze = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const result = await analyzeClipboardMessage();
      setState({ status: 'success', ...result });
    } catch (e) {
      const message = e instanceof AIServiceError ? e.message : 'Erro ao processar mensagem.';
      setState({ status: 'error', message });
    }
  }, []);

  return (
    <View style={styles.container}>
      <Pressable
        testID="ai-analyze-button"
        disabled={state.status === 'loading'}
        onPress={analyze}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
        <CoralSheen radius={radius.md} />
        {state.status === 'loading' ? (
          <ActivityIndicator color={colors.onPrimary} size="small" />
        ) : (
          <>
            <Icon name="ia" size={18} color={colors.onPrimary} />
            <Text style={styles.ctaText}>{t('Analisar mensagem copiada')}</Text>
          </>
        )}
      </Pressable>

      {state.status === 'idle' && (
        <Text style={styles.hint}>
          {t('Copie a mensagem do cliente e toque no botão acima para sugestões automáticas.')}</Text>
      )}

      {state.status === 'error' && <Text style={styles.error}>{state.message}</Text>}

      {state.status === 'success' && (
        <ScrollView contentContainerStyle={styles.results} keyboardShouldPersistTaps="always">
          <Text style={styles.quote} numberOfLines={2}>“{state.clientMessage}”</Text>
          {state.suggestions.map(s => (
            <Pressable
              key={s.id}
              testID={`ai-suggestion-${s.tone}`}
              onPress={() => onInsert(s.text)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
              <Text style={styles.tone}>{TONE_LABEL[s.tone]}</Text>
              <Text style={styles.cardText}>{s.text}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles(colors => ({
  container: {
    flex: 1,
    padding: spacing.sm,
  },
  cta: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    ...coralGlass(colors, { pill: false }),
  },
  ctaPressed: {
    backgroundColor: colors.primaryStrong,
  },
  ctaText: {
    ...onCoralText,
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 19,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  results: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  quote: {
    color: colors.textMuted,
    fontStyle: 'italic',
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    ...glassBorder(colors),
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  tone: {
    color: colors.violet,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
}));
