import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import type { GestureResponderEvent, LayoutChangeEvent, NativeTouchEvent } from 'react-native';
import { KeyboardBridge } from '../../native/KeyboardBridge';
import type { InputContext } from '../../native/KeyboardBridge';
import { makeStyles, radius, useColors } from '../theme';
import { buildLexicon, suggest } from '../typing/lexicon';
import { resolveLetter } from '../typing/keyResolver';
import type { KeyRect } from '../typing/keyResolver';
import { TypingContext } from '../typing/typingContext';
import { createDeleteRepeater } from '../utils/deleteRepeater';
import type { IconName } from './Icon';
import { Icon } from './Icon';
import { SuggestionBar } from './SuggestionBar';
import type { SuggestionBarHandle, SuggestionItem } from './SuggestionBar';

/**
 * Teclado de digitação próprio (QWERTY pt-BR).
 *
 * Toques: um único "ouvinte" cobre todas as teclas e acompanha cada dedo
 * separadamente. Antes cada tecla era um botão, e o React Native só deixa um
 * botão "dono" do toque por vez: digitando rápido, a tecla seguinte era
 * apertada antes de soltar a anterior e se perdia. Agora:
 *  - um toque novo confirma na hora a tecla anterior que ainda estava presa
 *    (ordem garantida, nada se perde);
 *  - a tecla é decidida pelo ponto onde o dedo encostou, com a "tecla
 *    invisível" ajustada pela palavra (ver typing/keyResolver);
 *  - as teclas não se redesenham a cada letra (só a barra de sugestões e o
 *    destaque da tecla apertada).
 *
 * Modos: letras, números (?123) e símbolos (=\<). Shift: um toque = próxima
 * letra maiúscula; dois toques rápidos = caps lock. Maiúscula automática no
 * começo da mensagem e depois de . ! ?. Depois de um símbolo (ou do espaço)
 * o teclado volta sozinho para as letras. Dois espaços seguidos viram ". ".
 * Segurar uma vogal (ou c/n) mostra os acentos. Segurar ⌫ apaga continuamente.
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

type KeyAction =
  | { t: 'char'; v: string }
  | { t: 'shift' }
  | { t: 'delete' }
  | { t: 'mode'; to: Mode }
  | { t: 'globe' }
  | { t: 'space' }
  | { t: 'enter' };

type KeyKind = 'char' | 'func' | 'space' | 'enter';

interface KeyDef {
  id: string;
  label: string;
  icon?: IconName;
  kind: KeyKind;
  flex: number;
  action: KeyAction;
  /** Letra base (minúscula) — usada pela "tecla invisível" e pelos acentos. */
  letter?: string;
}

const ROW_GAP = 6;
const KEY_GAP = 5;
const LONG_PRESS_MS = 350;
const DOUBLE_TAP_MS = 300;
const DOUBLE_SPACE_MS = 450;
const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 60;
/** Trava de segurança: nenhuma repetição do ⌫ dura mais que isso. */
const MAX_REPEAT_MS = 30_000;
/** Pontuação que "puxa" o espaço automático da sugestão ("palavra ." → "palavra. "). */
const SNAP_PUNCTUATION = '.,!?;:';

/** Dedos que mudaram; no mouse (versão web no computador) o próprio evento. */
function pointsOf(e: GestureResponderEvent): NativeTouchEvent[] {
  const changed = e.nativeEvent.changedTouches;
  return changed && changed.length ? Array.from(changed) : [e.nativeEvent];
}

const isLetter = (c: string) => /^[a-zà-ÿç]$/i.test(c);

function buildRows(mode: Mode, shift: ShiftState): KeyDef[][] {
  const upper = mode === 'alpha' && shift !== 'off';
  const charKey = (c: string): KeyDef => {
    const v = upper ? c.toUpperCase() : c;
    return { id: `c:${c}`, label: v, kind: 'char', flex: 1, action: { t: 'char', v }, letter: isLetter(c) ? c : undefined };
  };
  const [r1, r2, r3] = ROWS[mode];
  const third: KeyDef =
    mode === 'alpha'
      ? { id: 'shift', label: '⇧', icon: shift === 'lock' ? 'capsLock' : 'shift', kind: 'func', flex: 1.5, action: { t: 'shift' } }
      : {
          id: 'mode-sym',
          label: mode === 'numeric' ? '=\\<' : '?123',
          kind: 'func',
          flex: 1.5,
          action: { t: 'mode', to: mode === 'numeric' ? 'symbols' : 'numeric' },
        };
  return [
    r1.map(charKey),
    r2.map(charKey),
    [third, ...r3.map(charKey), { id: 'delete', label: '⌫', icon: 'apagar', kind: 'func', flex: 1.5, action: { t: 'delete' } }],
    [
      {
        id: 'mode-main',
        label: mode === 'alpha' ? '?123' : 'ABC',
        kind: 'func',
        flex: 1.5,
        action: { t: 'mode', to: mode === 'alpha' ? 'numeric' : 'alpha' },
      },
      { id: 'globe', label: '🌐', icon: 'globo', kind: 'func', flex: 1, action: { t: 'globe' } },
      { id: 'comma', label: ',', kind: 'char', flex: 1, action: { t: 'char', v: ',' } },
      { id: 'space', label: 'espaço', kind: 'space', flex: 4, action: { t: 'space' } },
      { id: 'dot', label: '.', kind: 'char', flex: 1, action: { t: 'char', v: '.' } },
      { id: 'enter', label: '↵', icon: 'enter', kind: 'enter', flex: 1.5, action: { t: 'enter' } },
    ],
  ];
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ActiveTouch {
  key: KeyDef;
  /** Já agiu (shift/⌫ agem ao encostar; letras ao soltar ou no toque seguinte). */
  done: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}

/**
 * Para onde vai o que é digitado. Padrão: o campo do app em foco (WhatsApp...).
 * Os formulários do teclado (CRM, agenda) passam o próprio campo: o teclado do
 * sistema não pode usar TextInput sem roubar o foco da conversa.
 */
export interface TextSink {
  insertText(text: string): Promise<boolean>;
  /** false = não havia nada para apagar (para a repetição do ⌫). */
  deleteBackward(): Promise<boolean>;
  replaceTextBeforeCursor(count: number, text: string): Promise<boolean>;
  sendEnter(): Promise<boolean>;
  getInputContext(): Promise<InputContext>;
}

interface Props {
  /** Sem sink, digita no app em foco. */
  sink?: TextSink;
}

export function TypingKeyboard({ sink }: Props = {}) {
  const styles = useStyles();
  // Lido nos toques (fora do ciclo do React): sempre o sink atual
  const out = useRef<TextSink>(sink ?? KeyboardBridge);
  out.current = sink ?? KeyboardBridge;
  const internal = !!sink;
  const [mode, setModeState] = useState<Mode>('alpha');
  const [shift, setShiftState] = useState<ShiftState>('off');
  const [accentBase, setAccentBase] = useState<string | null>(null);

  // Os toques chegam fora do ciclo do React: o estado atual fica também em refs
  const modeRef = useRef<Mode>('alpha');
  const shiftRef = useRef<ShiftState>('off');
  const lastShiftTap = useRef(0);
  const lastSpaceAt = useRef(0);
  /** A sugestão escolhida acabou de inserir um espaço automático. */
  const autoSpace = useRef(false);

  const setMode = useCallback((m: Mode) => {
    modeRef.current = m;
    setModeState(m);
  }, []);
  const setShift = useCallback((s: ShiftState) => {
    shiftRef.current = s;
    setShiftState(s);
  }, []);

  const rows = useMemo(() => buildRows(mode, shift), [mode, shift]);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const suggestionBar = useRef<SuggestionBarHandle>(null);
  const feedback = useRef<PressFeedbackHandle>(null);

  /** Depois de cada edição: maiúscula automática + sugestões da palavra atual. */
  const refresh = useRef(() => {});
  const [context] = useState(
    () => new TypingContext(() => refresh.current(), () => out.current.getInputContext()),
  );
  refresh.current = () => {
    if (shiftRef.current !== 'lock') setShift(context.atSentenceStart() ? 'once' : 'off');
    const word = context.allowsSuggestions() ? context.currentWord() : '';
    const { unknown, words } = suggest(word);
    const items: SuggestionItem[] = words.map(text => ({ text, literal: false }));
    if (unknown) items.unshift({ text: word, literal: true });
    suggestionBar.current?.show(items.slice(0, 3));
  };

  // Dicionário montado logo depois de abrir (fora do caminho do 1º toque)
  useEffect(() => {
    const t = setTimeout(() => {
      buildLexicon();
      refresh.current();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Contexto do campo: ao abrir, ao trocar de campo e quando o cursor muda por fora
  useEffect(() => {
    context.reset();
    // Campo do próprio teclado: o texto só muda por aqui, não há o que vigiar
    if (internal) return () => context.dispose();
    const offShow = KeyboardBridge.onKeyboardShow(() => context.reset());
    const offSel = KeyboardBridge.onSelectionChange(e => context.onSelectionChange(e));
    return () => {
      offShow();
      offSel();
      context.dispose();
    };
  }, [context, internal]);

  // ── Ações ────────────────────────────────────────────────────────────

  const typeText = useCallback(
    (v: string) => {
      const lastIsAutoSpace = autoSpace.current && context.lastChar() === ' ';
      autoSpace.current = false;
      if (lastIsAutoSpace && SNAP_PUNCTUATION.includes(v)) {
        // "palavra ." → "palavra. "
        out.current.replaceTextBeforeCursor(1, `${v} `);
        context.replace(1, `${v} `);
      } else {
        out.current.insertText(v);
        context.insert(v);
      }
      if (shiftRef.current === 'once') setShift('off');
      // Depois de um símbolo, volta para as letras (números continuam)
      if (modeRef.current !== 'alpha' && !/^[0-9]$/.test(v)) setMode('alpha');
      setAccentBase(null);
      refresh.current();
    },
    [context, setMode, setShift],
  );

  const typeSpace = useCallback(() => {
    const now = Date.now();
    const before = context.lastChar();
    autoSpace.current = false;
    if (now - lastSpaceAt.current < DOUBLE_SPACE_MS && before === ' ') {
      // Dois espaços seguidos: ponto final (como no iPhone)
      out.current.replaceTextBeforeCursor(1, '. ');
      context.replace(1, '. ');
      lastSpaceAt.current = 0;
    } else {
      out.current.insertText(' ');
      context.insert(' ');
      lastSpaceAt.current = now;
    }
    if (modeRef.current !== 'alpha') setMode('alpha');
    setAccentBase(null);
    refresh.current();
  }, [context, setMode]);

  const onShift = useCallback(() => {
    const now = Date.now();
    const s = shiftRef.current;
    if (s === 'off') setShift('once');
    else if (s === 'once' && now - lastShiftTap.current < DOUBLE_TAP_MS) setShift('lock');
    else setShift('off');
    lastShiftTap.current = now;
  }, [setShift]);

  // Repetição do ⌫ (ver deleteRepeater: nunca deixa timer órfão e para sozinha
  // com o campo vazio). Antes, um timer perdido apagava o texto para sempre.
  const [deleteRepeater] = useState(() =>
    createDeleteRepeater(
      () => {
        context.deleteOne();
        autoSpace.current = false;
        refresh.current();
        return out.current.deleteBackward();
      },
      { delayMs: REPEAT_DELAY_MS, intervalMs: REPEAT_INTERVAL_MS, maxMs: MAX_REPEAT_MS },
    ),
  );
  const stopDelete = deleteRepeater.stop;

  // Para a repetição ao sair da tela de letras e quando o teclado é escondido
  // (nesse caso o "soltar o dedo" nunca chega ao ⌫).
  useEffect(() => stopDelete, [stopDelete]);
  useEffect(() => KeyboardBridge.onKeyboardHide(stopDelete), [stopDelete]);

  const run = useCallback(
    (key: KeyDef) => {
      const a = key.action;
      switch (a.t) {
        case 'char':
          typeText(a.v);
          break;
        case 'space':
          typeSpace();
          break;
        case 'enter':
          autoSpace.current = false;
          out.current.sendEnter();
          // No formulário, ↵ passa para o próximo campo (o texto não ganha quebra)
          if (!internal) context.insert('\n');
          refresh.current();
          break;
        case 'mode':
          setMode(a.to);
          setAccentBase(null);
          break;
        case 'globe':
          KeyboardBridge.switchKeyboard();
          break;
        default:
          break;
      }
    },
    [context, internal, setMode, typeSpace, typeText],
  );

  const pickSuggestion = useCallback(
    (item: SuggestionItem) => {
      const word = context.currentWord();
      if (item.literal || !word) {
        out.current.insertText(' ');
        context.insert(' ');
      } else {
        out.current.replaceTextBeforeCursor(word.length, `${item.text} `);
        context.replace(word.length, `${item.text} `);
      }
      autoSpace.current = true;
      lastSpaceAt.current = 0;
      if (shiftRef.current === 'once') setShift('off');
      refresh.current();
    },
    [context, setShift],
  );

  // ── Toques ───────────────────────────────────────────────────────────

  const areaRef = useRef<View>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const rowBoxes = useRef<Box[]>([]);
  const touches = useRef(new Map<string, ActiveTouch>());

  const measureOrigin = useCallback(() => {
    areaRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      if (typeof pageX === 'number' && typeof pageY === 'number') origin.current = { x: pageX, y: pageY };
    });
  }, []);

  /** Retângulo de cada tecla, calculado pelas linhas (as teclas dividem a linha pelo flex). */
  const keyRects = useCallback((): KeyRect<KeyDef>[] => {
    const out: KeyRect<KeyDef>[] = [];
    rowsRef.current.forEach((row, i) => {
      const box = rowBoxes.current[i];
      if (!box) return;
      const totalFlex = row.reduce((sum, k) => sum + k.flex, 0);
      const unit = (box.w - KEY_GAP * (row.length - 1)) / totalFlex;
      let x = box.x;
      for (const key of row) {
        const w = unit * key.flex;
        out.push({ x, y: box.y, w, h: box.h, key });
        x += w + KEY_GAP;
      }
    });
    return out;
  }, []);

  const pointOf = (t: NativeTouchEvent) =>
    origin.current
      ? { x: t.pageX - origin.current.x, y: t.pageY - origin.current.y }
      : { x: t.locationX, y: t.locationY };

  /** Confirma a tecla de um toque que ainda não agiu (soltou o dedo ou outro dedo encostou). */
  const finish = useCallback(
    (active: ActiveTouch) => {
      if (active.timer) clearTimeout(active.timer);
      active.timer = null;
      if (active.done) return;
      active.done = true;
      run(active.key);
    },
    [run],
  );

  const onTouchDown = useCallback(
    (t: NativeTouchEvent) => {
      // Digitação rápida: o dedo anterior ainda está na tela → confirma já
      touches.current.forEach(finish);

      const { x, y } = pointOf(t);
      const rects = keyRects();
      const prefix = modeRef.current === 'alpha' ? context.currentWord() : '';
      const hit = resolveLetter(rects, x, y, prefix, k => k.letter ?? null);
      if (!hit) return;
      const key = hit.key;
      const active: ActiveTouch = { key, done: false, timer: null };
      const id = String(t.identifier);
      touches.current.set(id, active);
      feedback.current?.press(id, hit, key);

      if (key.action.t === 'shift') {
        active.done = true;
        onShift();
      } else if (key.action.t === 'delete') {
        active.done = true;
        deleteRepeater.start();
      } else if (key.letter && ACCENTS[key.letter] && modeRef.current === 'alpha') {
        const letter = key.letter;
        active.timer = setTimeout(() => {
          active.timer = null;
          if (active.done) return;
          // Segurou: mostra os acentos em vez de digitar a letra
          active.done = true;
          feedback.current?.release(id);
          setAccentBase(letter);
        }, LONG_PRESS_MS);
      }
    },
    // pointOf só lê refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [context, deleteRepeater, finish, keyRects, onShift],
  );

  const onTouchUp = useCallback(
    (id: string) => {
      const active = touches.current.get(id);
      feedback.current?.release(id);
      if (!active) return;
      touches.current.delete(id);
      if (active.key.action.t === 'delete') stopDelete();
      finish(active);
    },
    [finish, stopDelete],
  );

  const cancelAll = useCallback(() => {
    touches.current.forEach(a => a.timer && clearTimeout(a.timer));
    touches.current.clear();
    feedback.current?.clear();
    stopDelete();
  }, [stopDelete]);

  const responder = useMemo(
    () => ({
      onStartShouldSetResponder: () => true,
      onResponderTerminationRequest: () => false,
      // Disparam para CADA dedo (o primeiro e os seguintes)
      onResponderStart: (e: GestureResponderEvent) => {
        for (const t of pointsOf(e)) onTouchDown(t);
      },
      onResponderEnd: (e: GestureResponderEvent) => {
        for (const t of pointsOf(e)) onTouchUp(String(t.identifier));
      },
      onResponderTerminate: cancelAll,
    }),
    [cancelAll, onTouchDown, onTouchUp],
  );

  const onRowLayout = (i: number) => (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    rowBoxes.current[i] = { x, y, w: width, h: height };
  };

  const display = (c: string) => (shift !== 'off' ? c.toUpperCase() : c);

  return (
    <View style={styles.container} testID="typing-keyboard">
      <SuggestionBar ref={suggestionBar} onPick={pickSuggestion} />

      <View ref={areaRef} style={styles.keysArea} onLayout={measureOrigin} {...responder}>
        {/* As teclas só desenham: quem recebe o toque é a área inteira */}
        <View style={styles.rows} pointerEvents="none">
          {rows.map((row, i) => (
            <View key={i} style={styles.row} onLayout={onRowLayout(i)}>
              {row.map(k => (
                <KeyView
                  key={k.id}
                  label={k.label}
                  icon={k.icon}
                  kind={k.kind}
                  flex={k.flex}
                  active={k.action.t === 'shift' && shift !== 'off'}
                />
              ))}
            </View>
          ))}
        </View>
        <PressFeedback ref={feedback} />
      </View>

      {accentBase && (
        <View style={styles.accentBar}>
          {ACCENTS[accentBase].map(a => (
            <AccentKey key={a} label={display(a)} onPress={() => typeText(display(a))} />
          ))}
          <AccentKey label="✕" onPress={() => setAccentBase(null)} />
        </View>
      )}
    </View>
  );
}

// ── Teclas (só desenho) ─────────────────────────────────────────────────

interface KeyViewProps {
  label: string;
  icon?: IconName;
  kind: KeyKind;
  flex: number;
  active: boolean;
}

const KeyView = memo(({ label, icon, kind, flex, active }: KeyViewProps) => {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View
      testID={`key-${label}`}
      accessibilityLabel={label}
      style={[
        styles.key,
        { flex },
        kind === 'func' && styles.keyFunc,
        kind === 'enter' && styles.keyEnter,
        active && styles.keyPressed,
      ]}>
      {icon ? (
        <Icon name={icon} size={22} color={kind === 'enter' ? colors.onPrimary : colors.text} />
      ) : (
        <Text
          style={[
            styles.label,
            kind === 'func' && styles.labelFunc,
            kind === 'space' && styles.labelSpace,
          ]}>
          {label}
        </Text>
      )}
    </View>
  );
});

/** Na web o Pressable espera 50 ms antes do toque; aqui não precisa. */
const WEB_NO_PRESS_DELAY = Platform.OS === 'web' ? ({ delayPressIn: 0 } as object) : {};

function AccentKey({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable
      {...WEB_NO_PRESS_DELAY}
      testID={`key-${label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.key, styles.accentKey, pressed && styles.keyPressed]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

// ── Destaque da tecla apertada (balão com a letra, como no celular) ─────

interface PressFeedbackHandle {
  press(id: string, box: Box, key: KeyDef): void;
  release(id: string): void;
  clear(): void;
}

interface Pressed {
  id: string;
  box: Box;
  key: KeyDef;
}

const PressFeedback = memo(
  forwardRef<PressFeedbackHandle>((_props, ref) => {
    const colors = useColors();
    const styles = useStyles();
    const [pressed, setPressed] = useState<Pressed[]>([]);

    useImperativeHandle(
      ref,
      () => ({
        press: (id, box, key) => setPressed(list => [...list.filter(p => p.id !== id), { id, box, key }]),
        release: id => setPressed(list => (list.some(p => p.id === id) ? list.filter(p => p.id !== id) : list)),
        clear: () => setPressed([]),
      }),
      [],
    );

    return (
      <View style={styles.feedbackLayer} pointerEvents="none">
        {pressed.map(({ id, box, key }) => {
          const bubble = key.kind === 'char';
          return (
            <React.Fragment key={id}>
              <View
                style={[
                  styles.key,
                  styles.feedbackKey,
                  { left: box.x, top: box.y, width: box.w, height: box.h },
                  key.kind === 'enter' ? styles.keyEnterPressed : styles.keyPressed,
                ]}>
                {key.icon ? (
                  <Icon name={key.icon} size={22} color={key.kind === 'enter' ? colors.onPrimary : colors.text} />
                ) : (
                  <Text style={[styles.label, key.kind === 'space' && styles.labelSpace]}>{key.label}</Text>
                )}
              </View>
              {bubble && (
                <View
                  style={[
                    styles.bubble,
                    { left: box.x - 6, top: box.y - box.h - 6, width: box.w + 12, height: box.h + 4 },
                  ]}>
                  <Text style={styles.bubbleLabel}>{key.label}</Text>
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  }),
);

const useStyles = makeStyles(colors => ({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  keysArea: {
    flex: 1,
  },
  rows: {
    flex: 1,
    paddingHorizontal: 3,
    paddingTop: 2,
    paddingBottom: 4,
    gap: ROW_GAP,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: KEY_GAP,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 3,
    right: 3,
    height: 44,
    flexDirection: 'row',
    gap: KEY_GAP,
    padding: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceActive,
    zIndex: 10,
  },
  accentKey: {
    flex: 1,
  },
  key: {
    borderRadius: radius.key,
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
  keyEnterPressed: {
    backgroundColor: colors.primaryStrong,
  },
  keyPressed: {
    backgroundColor: colors.keyActive,
  },
  label: {
    color: colors.text,
    fontSize: 19,
  },
  labelFunc: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  labelSpace: {
    fontSize: 13,
    color: colors.textMuted,
  },
  feedbackLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  feedbackKey: {
    position: 'absolute',
  },
  bubble: {
    position: 'absolute',
    borderRadius: radius.sm,
    backgroundColor: colors.key,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  bubbleLabel: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '500',
  },
}));
