import React, { memo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Stop } from 'react-native-svg';
import { makeStyles } from '../theme';

/**
 * Símbolo K coral do KEYCON (duas hastes + perna, com degradê para dar volume).
 *
 * ATENÇÃO (manual, pág. 3 e 15): este vetor é uma APROXIMAÇÃO para uso dentro
 * da interface. O ícone oficial do app (App Store / launcher) é a arte
 * renderizada em PNG 1024 × 1024 — não substituir pelo K vetorial.
 */
export const KeyconMark = memo(({ size = 32 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs>
      <LinearGradient id="keyconStem" gradientUnits="userSpaceOnUse" x1="17" y1="7" x2="17" y2="43">
        <Stop offset="0" stopColor="#FF9A80" />
        <Stop offset="1" stopColor="#F17860" />
      </LinearGradient>
      <LinearGradient id="keyconLeg" gradientUnits="userSpaceOnUse" x1="24" y1="26" x2="55" y2="57">
        <Stop offset="0" stopColor="#F17860" />
        <Stop offset="1" stopColor="#E65B43" />
      </LinearGradient>
      <LinearGradient id="keyconArm" gradientUnits="userSpaceOnUse" x1="10" y1="56" x2="54" y2="10">
        <Stop offset="0" stopColor="#FFC9B8" />
        <Stop offset="1" stopColor="#F58468" />
      </LinearGradient>
    </Defs>
    <Line x1="31" y1="33" x2="48" y2="50" stroke="url(#keyconLeg)" strokeWidth="14" strokeLinecap="round" />
    <Line x1="17" y1="14" x2="17" y2="36" stroke="url(#keyconStem)" strokeWidth="14" strokeLinecap="round" />
    <Line
      x1="17"
      y1="49"
      x2="47"
      y2="17"
      stroke="url(#keyconArm)"
      strokeWidth="14"
      strokeLinecap="round"
      strokeOpacity={0.95}
    />
  </Svg>
));

interface LogoProps {
  /** Altura do símbolo; a assinatura acompanha a proporção. */
  size?: number;
  /** Cor da assinatura KEYCON (grafite no claro, branco no escuro). */
  color?: string;
  layout?: 'horizontal' | 'vertical';
}

/** Logotipo completo: símbolo K + assinatura KEYCON. */
export const KeyconLogo = memo(({ size = 28, color, layout = 'horizontal' }: LogoProps) => {
  const styles = useStyles();
  const vertical = layout === 'vertical';
  return (
    <View style={vertical ? styles.vertical : styles.horizontal} accessibilityRole="image" accessibilityLabel="KEYCON">
      <KeyconMark size={size} />
      <Text
        style={[
          styles.wordmark,
          { fontSize: Math.round(size * (vertical ? 0.42 : 0.68)) },
          color ? { color } : null,
        ]}>
        KEYCON
      </Text>
    </View>
  );
});

const useStyles = makeStyles(colors => ({
  horizontal: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vertical: { alignItems: 'center', gap: 8 },
  wordmark: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
}));
