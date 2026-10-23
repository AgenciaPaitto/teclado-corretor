import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { KeyboardBridge } from '../../native/KeyboardBridge';
import { acceptsMime } from '../../utils/mime';
import { glassBorder, makeStyles, onCoralText, radius, spacing, touchTarget, useColors } from '../theme';

interface Props {
  onInsert: (text: string) => void;
}

interface Snapshot {
  targetApp: string | null;
  mimeTypes: string[];
}

/** Formatos de foto que testamos no campo em foco. */
const IMAGE_CHECKS = [
  { mime: 'image/jpeg', label: 'Foto JPEG' },
  { mime: 'image/png', label: 'Foto PNG' },
  { mime: 'image/gif', label: 'GIF' },
] as const;

/**
 * Diagnóstico — mostra o que o campo de texto em foco (ex.: conversa do
 * WhatsApp) aceita receber do teclado: só texto, ou também imagens.
 */
export function DiagnosticsPanel({ onInsert }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [targetApp, mimeTypes] = await Promise.all([
        KeyboardBridge.getTargetApp(),
        KeyboardBridge.getContentMimeTypes(),
      ]);
      setSnapshot({ targetApp, mimeTypes });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }
  if (!snapshot) {
    return <ActivityIndicator style={styles.loading} color={colors.textMuted} />;
  }

  const { targetApp, mimeTypes } = snapshot;
  const checks = IMAGE_CHECKS.map(c => ({ ...c, ok: acceptsMime(mimeTypes, c.mime) }));
  const formats = mimeTypes.length > 0 ? mimeTypes.join(', ') : 'Nenhum (o campo só aceita texto)';

  const report = [
    'Diagnóstico do KEYCON',
    `App em foco: ${targetApp || 'desconhecido'}`,
    `Formatos aceitos: ${formats}`,
    ...checks.map(c => `${c.label} direto na conversa: ${c.ok ? 'sim' : 'não'}`),
  ].join('\n');

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="always">
      <Text style={styles.hint}>
        Abra o teclado no campo de mensagem do WhatsApp e entre aqui para ver o que ele aceita.
      </Text>

      <View style={styles.card}>
        <Row label="App em foco" value={targetApp || 'desconhecido'} />
        <Row label="Formatos aceitos" value={formats} />
        {checks.map(c => (
          <Row key={c.mime} label={`${c.label} direto na conversa`} value={c.ok ? 'Sim' : 'Não'} highlight={c.ok} />
        ))}
        <Row label="Áudio, vídeo e várias fotos" value="Pelo compartilhamento" />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.btn} onPress={load}>
          <Text style={styles.btnText}>Atualizar</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => onInsert(report)}>
          <Text style={[styles.btnText, styles.btnPrimaryText]}>Inserir relatório</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueOk]}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles(colors => ({
  container: { padding: spacing.sm, gap: spacing.sm },
  loading: { marginTop: spacing.lg },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginTop: spacing.lg, padding: spacing.md },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  card: {
    backgroundColor: colors.surface,
    ...glassBorder(colors),
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { gap: 2 },
  rowLabel: { color: colors.textMuted, fontSize: 12 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  rowValueOk: { color: colors.successText },
  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    minHeight: touchTarget,
    justifyContent: 'center',
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  btnPrimaryText: { color: colors.onPrimary, ...onCoralText },
}));
