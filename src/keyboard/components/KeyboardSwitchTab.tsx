import React from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { KeyboardBridge } from '../../native/KeyboardBridge';
import { makeStyles, radius, spacing } from '../theme';

interface Props {
  onInsert: (text: string) => void;
}

export function KeyboardSwitchTab({ onInsert }: Props) {
  const styles = useStyles();

  // Celular deitado: o teclado fica mais baixo, então escondemos a explicação
  const { width, height } = useWindowDimensions();
  const compact = width > height;

  const handleSwitch = () => {
    KeyboardBridge.switchKeyboard();
  };

  const handleDelete = () => {
    KeyboardBridge.deleteBackward();
  };

  const handleEnter = () => {
    KeyboardBridge.sendEnter();
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]} testID="keyboard-switch-tab">
      <View style={[styles.card, compact && styles.cardCompact]}>
        {!compact && <Text style={styles.title}>Teclado de Digitação</Text>}
        {!compact && (
          <Text style={styles.desc}>
            Toque no botão abaixo para alternar para o seu teclado padrão (Gboard, Samsung, etc.) e digitar livremente.
          </Text>
        )}
        <Pressable
          testID="switch-keyboard-btn"
          style={({ pressed }) => [styles.switchBtn, pressed && styles.pressed]}
          onPress={handleSwitch}>
          <Text style={styles.switchBtnText}>Alternar Teclado (🌐)</Text>
        </Pressable>
      </View>

      {/* Controles rápidos auxiliares */}
      <View style={styles.quickBar}>
        <Pressable
          testID="btn-comma"
          style={({ pressed }) => [styles.quickKey, pressed && styles.pressed]}
          onPress={() => onInsert(',')}>
          <Text style={styles.quickKeyText}>,</Text>
        </Pressable>

        <Pressable
          testID="btn-space"
          style={({ pressed }) => [styles.quickKey, styles.spaceKey, pressed && styles.pressed]}
          onPress={() => onInsert(' ')}>
          <Text style={styles.quickKeyText}>Espaço</Text>
        </Pressable>

        <Pressable
          testID="btn-dot"
          style={({ pressed }) => [styles.quickKey, pressed && styles.pressed]}
          onPress={() => onInsert('.')}>
          <Text style={styles.quickKeyText}>.</Text>
        </Pressable>

        <Pressable
          testID="btn-backspace"
          style={({ pressed }) => [styles.quickKey, pressed && styles.pressed]}
          onPress={handleDelete}>
          <Text style={styles.quickKeyText}>⌫</Text>
        </Pressable>

        <Pressable
          testID="btn-enter"
          style={({ pressed }) => [styles.quickKey, styles.enterKey, pressed && styles.pressed]}
          onPress={handleEnter}>
          <Text style={[styles.quickKeyText, styles.enterKeyText]}>↵</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles(colors => ({
  container: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  containerCompact: {
    padding: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  cardCompact: {
    padding: spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  desc: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  switchBtn: {
    backgroundColor: colors.surfaceActive,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceAlt,
  },
  switchBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  quickBar: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 8,
  },
  quickKey: {
    height: 42,
    minWidth: 42,
    backgroundColor: colors.key,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  spaceKey: {
    flex: 1,
  },
  enterKey: {
    backgroundColor: colors.surfaceActive,
  },
  quickKeyText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  enterKeyText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.6,
  },
}));
