import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useColors } from '../../keyboard/theme';

/**
 * Fundo Liquid Glass: quatro manchas sobre o canvas (guia "KEYCON Liquid
 * Glass"). Coral no alto à esquerda, pêssego no alto à direita, azul frio
 * embaixo (atrás do menu) e névoa embaixo à esquerda. Desenhado uma vez por
 * tela, atrás de tudo; o vidro das telas fica por cima.
 *
 * `dark`: força da mancha no tema escuro. O título e o subtítulo de cada tela
 * ficam sobre a aurora; com o coral a 40%, o subtítulo cinza ainda passa
 * 4,5:1 (a 100% cairia para 3,5:1).
 */
const SPOTS = [
  { id: 'coral', key: 'auroraCoral', cx: '12%', cy: '6%', rx: '75%', ry: '42%', fade: 0.62, dark: 0.4 },
  { id: 'peach', key: 'auroraPeach', cx: '95%', cy: '20%', rx: '60%', ry: '32%', fade: 0.6, dark: 0.55 },
  { id: 'dusk', key: 'auroraDusk', cx: '75%', cy: '100%', rx: '90%', ry: '45%', fade: 0.65, dark: 0.9 },
  { id: 'mist', key: 'auroraMist', cx: '0%', cy: '85%', rx: '70%', ry: '35%', fade: 0.7, dark: 1 },
] as const;

export const Aurora = memo(() => {
  const colors = useColors();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.canvas }]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          {SPOTS.map(s => (
            <RadialGradient key={s.id} id={`aurora-${s.id}`} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fx={s.cx} fy={s.cy}>
              <Stop offset="0" stopColor={colors[s.key]} stopOpacity={colors.scheme === 'dark' ? s.dark : 1} />
              <Stop offset={String(s.fade)} stopColor={colors[s.key]} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {SPOTS.map(s => (
          <Rect key={s.id} width="100%" height="100%" fill={`url(#aurora-${s.id})`} />
        ))}
      </Svg>
    </View>
  );
});
