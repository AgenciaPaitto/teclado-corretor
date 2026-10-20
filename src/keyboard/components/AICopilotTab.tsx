import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { AIServiceError, analyzeClipboardMessage } from '../../services/aiService';
import type { AISuggestion, SuggestionTone } from '../../types';
import { makeStyles, radius, spacing, useColors } from '../theme';

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
 * AI Copilot minimalista — sem emojis, bordas ou cantos coloridos.
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
        {state.status === 'loading' ? (
          <ActivityIndicator color={colors.text} size="small" />
        ) : (
          <Text style={styles.ctaText}>Analisar mensagem copiada</Text>
        )}
      </Pressable>

      {state.status === 'idle' && (
        <Text style={styles.hint}>
          Copie a mensagem do cliente e toque no botão acima para sugestões automáticas.
        </Text>
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
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: 11,
    alignItems: 'center',
  },
  ctaPressed: {
    backgroundColor: colors.surfaceActive,
  },
  ctaText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.1,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
  error: {
    color: colors.textMuted,
    fontSize: 12,
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
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  tone: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
}));
