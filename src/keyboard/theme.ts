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
  // ── Liquid Glass (guia "KEYCON Liquid Glass") ──
  /** true = paleta de vidro do app (superfícies translúcidas sobre a aurora). */
  glass: boolean;
  /** Fundo opaco por trás da aurora. */
  canvas: string;
  auroraCoral: string;
  auroraPeach: string;
  auroraDusk: string;
  auroraMist: string;
  /** Contorno de 1px do vidro. */
  glassStroke: string;
  /** Brilho da borda de cima (luz vindo de cima). */
  glassEdge: string;
  /** Vidro leve (dock). */
  glassFillThin: string;
  /** Vidro de leitura (listas, formulários). */
  glassFillStrong: string;
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
  // Branco sobre coral, com a sombra onCoralText para destacar
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
  glass: false,
  canvas: '#14161D',
  auroraCoral: '#F17860',
  auroraPeach: '#B9573F',
  auroraDusk: '#3B4A6B',
  auroraMist: '#2A3040',
  glassStroke: 'rgba(255, 255, 255, 0.10)',
  glassEdge: 'rgba(255, 255, 255, 0.22)',
  glassFillThin: 'rgba(36, 40, 51, 0.42)',
  glassFillStrong: 'rgba(36, 40, 51, 0.72)',
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
  // Branco sobre coral, com a sombra onCoralText para destacar
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
  glass: false,
  canvas: '#EEF0F4',
  auroraCoral: '#F59A84',
  auroraPeach: '#FAD0BD',
  auroraDusk: '#AFBDDB',
  auroraMist: '#E3E8F1',
  glassStroke: 'rgba(36, 40, 51, 0.10)',
  glassEdge: 'rgba(255, 255, 255, 0.95)',
  glassFillThin: 'rgba(255, 255, 255, 0.42)',
  glassFillStrong: 'rgba(255, 255, 255, 0.78)',
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

/**
 * Paletas de vidro do app: as mesmas chaves, com as superfícies translúcidas
 * sobre a aurora (ver Aurora.tsx). Telas que usam `surface`/`surfaceAlt`
 * viram vidro sem mudar nada nelas. O teclado continua com as paletas sólidas.
 */
export const darkGlassColors: Palette = {
  ...darkColors,
  glass: true,
  bg: 'transparent',
  // 66%: ink-muted ainda passa 4,5:1 mesmo com a mancha coral atrás
  surface: 'rgba(36, 40, 51, 0.66)',
  surfaceAlt: 'rgba(255, 255, 255, 0.07)',
  surfaceActive: 'rgba(255, 255, 255, 0.12)',
  divider: 'rgba(255, 255, 255, 0.10)',
  text: '#F5F6F8',
  textSecondary: '#D5D9E2',
  textMuted: '#B9BFCC',
  primaryText: '#FFB4A3',
  primarySoft: 'rgba(241, 120, 96, 0.22)',
  tile: 'rgba(255, 255, 255, 0.08)',
};

export const lightGlassColors: Palette = {
  ...lightColors,
  glass: true,
  bg: 'transparent',
  surface: 'rgba(255, 255, 255, 0.55)',
  surfaceAlt: 'rgba(36, 40, 51, 0.06)',
  surfaceActive: 'rgba(36, 40, 51, 0.10)',
  divider: 'rgba(36, 40, 51, 0.10)',
  text: '#1B1E26',
  textSecondary: '#3E4452',
  textMuted: '#4A5160',
  primaryText: '#9C3B29',
  primarySoft: 'rgba(241, 120, 96, 0.16)',
  tile: 'rgba(255, 255, 255, 0.6)',
};

/**
 * Sombra leve do texto branco sobre coral (botões, tecla Enter, item
 * escolhido). O branco sozinho tem só 2,8:1 sobre o coral; a sombra grafite
 * dá o contorno que destaca as letras.
 */
export const onCoralText = {
  textShadowColor: 'rgba(36, 40, 51, 0.45)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
} as const;

/** Borda do vidro: contorno fino com a luz no lado de cima. Vazio fora do vidro. */
export function glassBorder(colors: Palette) {
  if (!colors.glass) return {};
  return { borderWidth: 1, borderColor: colors.glassStroke, borderTopColor: colors.glassEdge };
}

/**
 * Botão coral de vidro (CTA): pílula, aro claro uniforme e brilho coral por
 * baixo. O reflexo em degradê vem do CoralSheen (app). Sem `overflow: hidden`,
 * que cortaria a sombra no iOS. Vazio fora do vidro.
 */
export function coralGlass(colors: Palette, { pill = true }: { pill?: boolean } = {}) {
  if (!colors.glass) return {};
  return {
    // No teclado o botão mantém o próprio raio (cantos discretos)
    ...(pill ? { borderRadius: radius.pill } : {}),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: brand.coral,
    shadowOpacity: colors.scheme === 'dark' ? 0.45 : 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  };
}

const ThemeContext = createContext<Palette>(darkColors);

/** Resolve a preferência salva ('system' segue o modo claro/escuro do aparelho). */
export function resolvePalette(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
  glass = false,
): Palette {
  const mode = preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference;
  if (glass) return mode === 'light' ? lightGlassColors : darkGlassColors;
  return mode === 'light' ? lightColors : darkColors;
}

export function ThemeProvider({
  preference,
  glass = false,
  children,
}: {
  preference: ThemePreference;
  /** Paleta de vidro (Liquid Glass): só no app. */
  glass?: boolean;
  children: React.ReactNode;
}) {
  const systemScheme = useColorScheme();
  const palette = resolvePalette(preference, systemScheme, glass);
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
