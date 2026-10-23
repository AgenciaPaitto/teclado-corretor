import React, { forwardRef, memo, useImperativeHandle, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { makeStyles, useColors } from '../theme';

/**
 * Barra de sugestões acima das teclas (como no iPhone e no Gboard):
 * a palavra digitada "entre aspas" quando ela não existe no dicionário,
 * a melhor sugestão em destaque e mais uma ou duas opções.
 *
 * O estado mora aqui dentro: a cada letra só esta barra se redesenha,
 * não o teclado inteiro.
 */

export interface SuggestionItem {
  text: string;
  /** true = manter o que foi digitado (só adiciona o espaço). */
  literal: boolean;
}

export interface SuggestionBarHandle {
  show(items: SuggestionItem[]): void;
}

interface Props {
  onPick: (item: SuggestionItem) => void;
}

/** Na web o Pressable espera 50 ms antes do toque; aqui não precisa. */
const WEB_NO_PRESS_DELAY = Platform.OS === 'web' ? ({ delayPressIn: 0 } as object) : {};

export const SuggestionBar = memo(
  forwardRef<SuggestionBarHandle, Props>(({ onPick }, ref) => {
    const colors = useColors();
    const styles = useStyles();
    const [items, setItems] = useState<SuggestionItem[]>([]);

    useImperativeHandle(ref, () => ({ show: setItems }), []);

    // A primeira sugestão de verdade (não a palavra literal) fica em destaque
    const highlighted = items.findIndex(i => !i.literal);

    return (
      <View style={styles.bar} testID="suggestion-bar">
        {items.map((item, i) => (
          <React.Fragment key={`${i}-${item.text}`}>
            {i > 0 && <View style={styles.divider} />}
            <Pressable
              {...WEB_NO_PRESS_DELAY}
              testID={`suggestion-${i}`}
              accessibilityRole="button"
              onPress={() => onPick(item)}
              android_ripple={{ color: colors.surfaceActive }}
              style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}>
              <Text
                numberOfLines={1}
                style={[styles.text, i === highlighted && styles.textBest, item.literal && styles.textLiteral]}>
                {item.literal ? `“${item.text}”` : item.text}
              </Text>
            </Pressable>
          </React.Fragment>
        ))}
      </View>
    );
  }),
);

const useStyles = makeStyles(colors => ({
  bar: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    backgroundColor: colors.bg,
  },
  cell: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cellPressed: {
    backgroundColor: colors.surfaceActive,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: colors.divider,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '400',
  },
  textBest: {
    color: colors.text,
    fontWeight: '600',
  },
  textLiteral: {
    color: colors.textMuted,
  },
}));
