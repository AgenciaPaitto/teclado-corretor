import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { KeyboardBridge } from '../../native/KeyboardBridge';
import { makeStyles, radius } from '../theme';

/**
 * Teclado de digitação próprio (QWERTY pt-BR), portado do simulador web.
 * Modos: letras, números (?123) e símbolos (=\<). Shift: um toque = próxima
 * letra maiúscula; dois toques rápidos = caps lock. Segurar uma vogal (ou c/n)
 * mostra os acentos. Segurar ⌫ apaga continuamente. 🌐 troca para outro teclado.
 */

type Mode = 'alpha' | 'numeric' | 'symbols';
type ShiftState = 'off' | 'once' | 'lock';

const ROWS: Record<Mode, [string[], string[], string[]]> = {
  alpha: [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ç'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ],
  numeric: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['@', '#', '$', '%', '&', '-', '+', '(', ')', '/'],
    ['*', '"', "'", ':', ';', '!', '?'],
  ],
  symbols: [
    ['~', '`', '|', '^', '_', '=', '{', '}', '[', ']'],
    ['<', '>', '€', '£', '¥', '¢', '§', '°', '«', '»'],
    ['·', '©', '®', '™', '¶', '¿', '¡'],
  ],
};

const ACCENTS: Record<string, string[]> = {
  a: ['á', 'à', 'â', 'ã', 'ä'],
  e: ['é', 'è', 'ê', 'ë'],
  i: ['í', 'ì', 'î', 'ï'],
  o: ['ó', 'ò', 'ô', 'õ', 'ö'],
  u: ['ú', 'ù', 'û', 'ü'],
  c: ['ç'],
  n: ['ñ'],
};

const DOUBLE_TAP_MS = 300;
const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 60;

export function TypingKeyboard() {
  const styles = useStyles();
  const [mode, setMode] = useState<Mode>('alpha');
  const [shift, setShift] = useState<ShiftState>('off');
  const [accentBase, setAccentBase] = useState<string | null>(null);
  const lastShiftTap = useRef(0);
  const repeatDelay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const upper = mode === 'alpha' && shift !== 'off';
  const display = (c: string) => (upper ? c.toUpperCase() : c);

  const type = useCallback(
    (text: string) => {
      KeyboardBridge.insertText(text);
      if (shift === 'once') setShift('off');
      setAccentBase(null);
    },
    [shift],
  );

  const onShift = () => {
    const now = Date.now();
    if (shift === 'off') {
      setShift('once');
    } else if (shift === 'once' && now - lastShiftTap.current < DOUBLE_TAP_MS) {
      setShift('lock');
    } else {
      setShift('off');
    }
    lastShiftTap.current = now;
  };

  const stopDelete = useCallback(() => {
    if (repeatDelay.current) clearTimeout(repeatDelay.current);
    if (repeatTimer.current) clearInterval(repeatTimer.current);
    repeatDelay.current = null;
    repeatTimer.current = null;
  }, []);

  const startDelete = () => {
    KeyboardBridge.deleteBackward();
    repeatDelay.current = setTimeout(() => {
      repeatTimer.current = setInterval(() => KeyboardBridge.deleteBackward(), REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  };

  useEffect(() => stopDelete, [stopDelete]);

  const changeMode = (m: Mode) => {
    setMode(m);
    setAccentBase(null);
  };

  const [row1, row2, row3] = ROWS[mode];

  const letterKey = (c: string) => (
    <Key
      key={c}
      label={display(c)}
      onPress={() => type(display(c))}
      onLongPress={mode === 'alpha' && ACCENTS[c] ? () => setAccentBase(c) : undefined}
    />
  );

  return (
    <View style={styles.container} testID="typing-keyboard">
      {accentBase && (
        <View style={styles.accentBar}>
          {ACCENTS[accentBase].map(a => (
            <Key key={a} label={display(a)} onPress={() => type(display(a))} />
          ))}
          <Key label="✕" kind="func" onPress={() => setAccentBase(null)} />
        </View>
      )}

      <View style={styles.row}>{row1.map(letterKey)}</View>
      <View style={styles.row}>{row2.map(letterKey)}</View>
      <View style={styles.row}>
        {mode === 'alpha' ? (
          <Key
            label={shift === 'lock' ? '⇪' : '⇧'}
            kind="func"
            flex={1.5}
            active={shift !== 'off'}
            onPress={onShift}
          />
        ) : (
          <Key
            label={mode === 'numeric' ? '=\\<' : '?123'}
            kind="func"
            flex={1.5}
            onPress={() => changeMode(mode === 'numeric' ? 'symbols' : 'numeric')}
          />
        )}
        {row3.map(letterKey)}
        <Key label="⌫" kind="func" flex={1.5} onPressIn={startDelete} onPressOut={stopDelete} />
      </View>
      <View style={styles.row}>
        <Key
          label={mode === 'alpha' ? '?123' : 'ABC'}
          kind="func"
          flex={1.5}
          onPress={() => changeMode(mode === 'alpha' ? 'numeric' : 'alpha')}
        />
        <Key label="🌐" kind="func" onPress={() => KeyboardBridge.switchKeyboard()} />
        <Key label="," onPress={() => type(',')} />
        <Key label="espaço" kind="space" flex={4} onPress={() => type(' ')} />
        <Key label="." onPress={() => type('.')} />
        <Key label="↵" kind="enter" flex={1.5} onPress={() => KeyboardBridge.sendEnter()} />
      </View>
    </View>
  );
}

interface KeyProps {
  label: string;
  kind?: 'char' | 'func' | 'space' | 'enter';
  flex?: number;
  active?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

function Key({ label, kind = 'char', flex = 1, active, onPress, onLongPress, onPressIn, onPressOut }: KeyProps) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.key,
        { flex },
        kind === 'func' && styles.keyFunc,
        kind === 'enter' && styles.keyEnter,
        (pressed || active) && styles.keyPressed,
      ]}>
      <Text
        style={[
          styles.label,
          kind === 'func' && styles.labelFunc,
          kind === 'space' && styles.labelSpace,
          kind === 'enter' && styles.labelEnter,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles(colors => ({
  container: {
    flex: 1,
    paddingHorizontal: 3,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 6,
    backgroundColor: colors.bg,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  accentBar: {
    position: 'absolute',
    top: 2,
    left: 3,
    right: 3,
    height: 44,
    flexDirection: 'row',
    gap: 5,
    padding: 4,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceActive,
    zIndex: 10,
  },
  key: {
    borderRadius: radius.sm,
    backgroundColor: colors.key,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyFunc: {
    backgroundColor: colors.keySpecial,
  },
  keyEnter: {
    backgroundColor: colors.primary,
  },
  keyPressed: {
    backgroundColor: colors.keyActive,
  },
  label: {
    color: colors.text,
    fontSize: 18,
  },
  labelFunc: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  labelSpace: {
    fontSize: 12,
    color: colors.textMuted,
  },
  labelEnter: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
}));
