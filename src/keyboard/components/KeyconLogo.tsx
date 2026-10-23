import React, { memo } from 'react';
import { Image } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { useColors } from '../theme';
import symbolPng from '../../assets/brand/keycon-symbol.png';
import logoLightPng from '../../assets/brand/keycon-logo-light.png';
import logoDarkPng from '../../assets/brand/keycon-logo-dark.png';
import sloganLightPng from '../../assets/brand/keycon-logo-slogan-light.png';
import sloganDarkPng from '../../assets/brand/keycon-logo-slogan-dark.png';

/**
 * Marca oficial do KEYCON (artes em assets/, versões otimizadas em
 * src/assets/brand). "light"/"dark" é a cor do TEXTO: texto claro para fundos
 * escuros e texto grafite para fundos claros.
 */

/** No Metro o import de PNG vira um id; no Vite (web) vira uma URL. */
function source(mod: unknown): ImageSourcePropType {
  return typeof mod === 'string' ? { uri: mod } : (mod as ImageSourcePropType);
}

// Proporções das artes originais (largura / altura)
const SYMBOL_RATIO = 1334 / 1244;
const LOGO_RATIO = 1569 / 335;
const SLOGAN_RATIO = 1586 / 334;

/** Símbolo K — para espaços pequenos (manual: usar o K sem o nome). */
export const KeyconMark = memo(({ size = 32 }: { size?: number }) => (
  <Image
    source={source(symbolPng)}
    style={{ width: Math.round(size * SYMBOL_RATIO), height: size }}
    resizeMode="contain"
    accessibilityLabel="KEYCON"
  />
));

interface LogoProps {
  /** Altura da imagem. */
  size?: number;
  /** Versão com o slogan embaixo do nome. */
  slogan?: boolean;
  /** Força a cor do texto; sem isso, segue o tema (claro → texto grafite). */
  textTone?: 'light' | 'dark';
}

/** Logotipo horizontal: símbolo K + KEYCON (com ou sem slogan). */
export const KeyconLogo = memo(({ size = 28, slogan = false, textTone }: LogoProps) => {
  const colors = useColors();
  const tone = textTone ?? (colors.scheme === 'dark' ? 'light' : 'dark');
  const mod = slogan
    ? tone === 'light' ? sloganLightPng : sloganDarkPng
    : tone === 'light' ? logoLightPng : logoDarkPng;
  return (
    <Image
      source={source(mod)}
      style={{ width: Math.round(size * (slogan ? SLOGAN_RATIO : LOGO_RATIO)), height: size }}
      resizeMode="contain"
      accessibilityLabel="KEYCON"
    />
  );
});
