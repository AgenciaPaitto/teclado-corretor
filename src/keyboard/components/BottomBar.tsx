import React, { memo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardBridge } from '../../native/KeyboardBridge';
import { colors, radius } from '../theme';

/**
 * Barra inferior minimalista: sem bordas, cantos coloridos ou emojis.
 * A tecla "ABC" alterna para o teclado padrão.
 */
export const BottomBar = memo(() => {
  const repeat = useRef<ReturnType<typeof setInterval> | null>(null);

  const startDelete = () => {
    KeyboardBridge.deleteBackward();
    repeat.current = setInterval(() => KeyboardBridge.deleteBackward(), 80);
  };
  const stopDelete = () => {
    if (repeat.current) clearInterval(repeat.current);
    repeat.current = null;
  };

  return (
    <View style={styles.row}>
      <Key testID="key-globe" label="ABC" flex={1.2} isSpecial onPress={() => KeyboardBridge.switchKeyboard()} />
      <Key testID="key-space" label="espaço" flex={4} onPress={() => KeyboardBridge.insertText(' ')} />
      <Key testID="key-backspace" label="⌫" flex={1.2} isSpecial onPressIn={startDelete} onPressOut={stopDelete} />
      <Key testID="key-enter" label="↵" flex={1.2} isSpecial onPress={() => KeyboardBridge.sendEnter()} />
    </View>
  );
});

interface KeyProps {
  testID: string;
  label: string;
  flex?: number;
  isSpecial?: boolean;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

const Key = ({ testID, label, flex = 1, isSpecial, onPress, onPressIn, onPressOut }: KeyProps) => (
  <Pressable
    testID={testID}
    onPress={onPress}
    onPressIn={onPressIn}
    onPressOut={onPressOut}
    style={({ pressed }) => [
      styles.key,
      { flex },
      isSpecial && styles.special,
      pressed && styles.pressed,
    ]}>
    <Text style={[styles.label, isSpecial && styles.specialLabel]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: colors.bg,
  },
  key: {
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.key,
    alignItems: 'center',
    justifyContent: 'center',
  },
  special: {
    backgroundColor: colors.keySpecial,
  },
  pressed: {
    backgroundColor: colors.keyActive,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  specialLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
