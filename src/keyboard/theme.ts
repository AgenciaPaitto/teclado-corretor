/**
 * Design tokens do KEYCON (manual de marca v1.0) — usados no teclado e no app.
 *
 * Grafite é a cor estrutural; coral fica para ações, marca e estados ativos
 * (sem excesso). Duas paletas (escura e clara) com os mesmos nomes de token.
 * Os componentes leem a paleta ativa via useColors() / makeStyles(), então a
 * troca de tema vale na hora, tanto no app quanto no teclado.
 *
 * Tipografia: Inter 400/500/600/700. O makeStyles aplica a Inter sozinho em
 * todo estilo de texto, a partir do fontWeight (ver withInter).
 */
import React, { createContext, useContext } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import type { TextStyle } from 'react-native';
import type { ThemePreference } from '../types';

/** Cores oficiais da marca. */
export const brand = {
  graphite: '#242833',
  coral: '#F17860',
  cloud: '#F1F2F4',
  white: '#FFFFFF',
} as const;

export interface Palette {
  scheme: 'dark' | 'light';
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceActive: string;
  /** Linhas divisórias e contornos suaves. */
  divider: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  key: string;
  keyActive: string;
  keySpecial: string;
  toastBg: string;
  toastText: string;
  // Coral: botões principais, marca e estados ativos
  primary: string;
  primaryStrong: string;
  /** Coral para TEXTO (no modo claro é mais escuro, para passar no WCAG AA). */
  primaryText: string;
  /** Fundo de item ativo/selecionado. */
  primarySoft: string;
  onPrimary: string;
  // Cores de status
  info: string;
  success: string;
  successStrong: string;
  successBg: string;
  successText: string;
  warning: string;
  danger: string;
  dangerBg: string;
  violet: string;
  violetBg: string;
  // Ícones funcionais (ver Icon.tsx)
  iconNeutral: string;
  iconMuted: string;
  teal: string;
  blue: string;
  tile: string;
  tileAi: string;
}

export const darkColors: Palette = {
  scheme: 'dark',
  bg: '#1A1D24',
  surface: brand.graphite,
  surfaceAlt: '#2F3441',
  surfaceActive: '#3A4050',
  divider: '#2F3441',
  border: 'transparent',
  text: '#FFFFFF',
  textSecondary: '#C9CDD6',
  textMuted: '#8C93A1',
  accent: '#FFFFFF',
  key: '#363B48',
  keyActive: '#4A5061',
  keySpecial: '#2A2F3A',
  toastBg: '#3A4050',
  toastText: '#FFFFFF',
  primary: brand.coral,
  primaryStrong: '#E2654D',
  primaryText: brand.coral,
  primarySoft: 'rgba(241, 120, 96, 0.16)',
  onPrimary: '#FFFFFF',
  info: '#3B82F6',
  success: '#22C55E',
  successStrong: '#16A34A',
  successBg: 'rgba(34, 197, 94, 0.14)',
  successText: '#4ADE80',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.12)',
  violet: '#A78BFA',
  violetBg: 'rgba(138, 92, 246, 0.18)',
  iconNeutral: '#E6E8EC',
  iconMuted: '#9AA3B2',
  teal: '#13A894',
  blue: '#2876EF',
  tile: '#2F3441',
  tileAi: 'rgba(138, 92, 246, 0.18)',
};

export const lightColors: Palette = {
  scheme: 'light',
  bg: brand.cloud,
  surface: brand.white,
  surfaceAlt: '#E9EBEF',
  surfaceActive: '#DDE0E6',
  divider: '#E3E5EA',
  border: 'transparent',
  text: brand.graphite,
  textSecondary: '#3E4452',
  textMuted: '#5F6673',
  accent: brand.graphite,
  key: brand.white,
  keyActive: '#DDE0E6',
  keySpecial: '#D5D9E0',
  toastBg: brand.graphite,
  toastText: '#FFFFFF',
  primary: brand.coral,
  primaryStrong: '#E2654D',
  primaryText: '#B44A35',
  primarySoft: 'rgba(241, 120, 96, 0.12)',
  onPrimary: '#FFFFFF',
  info: '#2563EB',
  success: '#16A34A',
  successStrong: '#16A34A',
  successBg: '#DCFCE7',
  successText: '#15803D',
  warning: '#B45309',
  danger: '#DC2626',
  dangerBg: 'rgba(239, 68, 68, 0.08)',
  violet: '#7C4DEB',
  violetBg: '#F1ECFE',
  iconNeutral: brand.graphite,
  iconMuted: '#535D6B',
  teal: '#13A894',
  blue: '#2876EF',
  tile: brand.cloud,
  tileAi: '#F1ECFE',
};

/** Raios: 10–16 para botões e cards; 18–24 para painéis. Teclas ficam em 8. */
export const radius = { key: 8, sm: 10, md: 12, lg: 16, xl: 20, pill: 999 } as const;
/** Escala de espaçamento 4 / 8 / 12 / 16 / 24 / 32. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
/** Área mínima de toque (44 × 44 pt). */
export const touchTarget = 44;

/** Escala tipográfica do manual (Inter). */
export const typography = {
  h1: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '600', letterSpacing: -0.3 },
  title: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  button: { fontSize: 15, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '500' },
  caption: { fontSize: 12, fontWeight: '500' },
  overline: { fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
} as const satisfies Record<string, TextStyle>;

const INTER_BY_WEIGHT: Record<string, string> = {
  '500': 'Inter-Medium',
  '600': 'Inter-SemiBold',
  '700': 'Inter-Bold',
  '800': 'Inter-Bold',
  '900': 'Inter-Bold',
  bold: 'Inter-Bold',
};

/**
 * Coloca a Inter em todo estilo de texto (com fontSize ou fontWeight).
 * Android e iOS usam um arquivo por peso (Inter-SemiBold etc.), então o
 * fontWeight sai do estilo para o sistema não engrossar a letra por cima.
 * Na web a família "Inter" vem do Google Fonts e o fontWeight continua.
 */
function withInter<T extends Record<string, any>>(styles: T): T {
  const out: Record<string, any> = {};
  for (const [name, style] of Object.entries(styles)) {
    if (style && typeof style === 'object' && ('fontSize' in style || 'fontWeight' in style)) {
      if (Platform.OS === 'web') {
        out[name] = { fontFamily: 'Inter', ...style };
      } else {
        const { fontWeight, ...rest } = style;
        out[name] = { fontFamily: INTER_BY_WEIGHT[String(fontWeight)] ?? 'Inter-Regular', ...rest };
      }
    } else {
      out[name] = style;
    }
  }
  return out as T;
}

const ThemeContext = createContext<Palette>(darkColors);

/** Resolve a preferência salva ('system' segue o modo claro/escuro do aparelho). */
export function resolvePalette(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): Palette {
  const mode = preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;
  return mode === 'light' ? lightColors : darkColors;
}

export function ThemeProvider({
  preference,
  children,
}: {
  preference: ThemePreference;
  children: React.ReactNode;
}) {
  const systemScheme = useColorScheme();
  const palette = resolvePalette(preference, systemScheme);
  return React.createElement(ThemeContext.Provider, { value: palette }, children);
}

export function useColors(): Palette {
  return useContext(ThemeContext);
}

/**
 * Cria um hook de estilos dependente do tema. O StyleSheet de cada paleta é
 * criado uma única vez e reaproveitado em todas as renderizações.
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: Palette) => T) {
  const cache = new Map<Palette, T>();
  return function useStyles(): T {
    const colors = useColors();
    let styles = cache.get(colors);
    if (!styles) {
      styles = StyleSheet.create(withInter(factory(colors)));
      cache.set(colors, styles);
    }
    return styles;
  };
}
