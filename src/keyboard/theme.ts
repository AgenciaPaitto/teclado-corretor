/**
 * Design tokens do teclado e do app — Minimalista, monocromático e neutro.
 * Sem bordas, sem cantos coloridos e sem cores fortes.
 *
 * Duas paletas (escura e clara) com os mesmos nomes de token. Os componentes
 * leem a paleta ativa via useColors() / makeStyles(), então a troca de tema
 * vale na hora, tanto no app quanto no teclado.
 */
import React, { createContext, useContext } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import type { ThemePreference } from '../types';

export interface Palette {
  scheme: 'dark' | 'light';
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceActive: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  key: string;
  keyActive: string;
  keySpecial: string;
  toastBg: string;
  // Cores de destaque (botões principais, selos e status)
  primary: string;
  primaryStrong: string;
  onPrimary: string;
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
}

export const darkColors: Palette = {
  scheme: 'dark',
  bg: '#101216',
  surface: '#171920',
  surfaceAlt: '#20242e',
  surfaceActive: '#292e3c',
  border: 'transparent',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#717a8c',
  accent: '#e2e8f0',
  key: '#1d212b',
  keyActive: '#292f3d',
  keySpecial: '#161922',
  toastBg: '#1c202a',
  primary: '#3b82f6',
  primaryStrong: '#2563eb',
  onPrimary: '#ffffff',
  info: '#38bdf8',
  success: '#10b981',
  successStrong: '#059669',
  successBg: '#064e3b',
  successText: '#34d399',
  warning: '#f59e0b',
  danger: '#ef4444',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  violet: '#818cf8',
  violetBg: 'rgba(99,102,241,0.15)',
};

export const lightColors: Palette = {
  scheme: 'light',
  bg: '#f3f4f7',
  surface: '#ffffff',
  surfaceAlt: '#e7eaf0',
  surfaceActive: '#d9dee7',
  border: 'transparent',
  text: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  accent: '#1e293b',
  key: '#ffffff',
  keyActive: '#e2e8f0',
  keySpecial: '#e7eaf0',
  toastBg: '#e2e6ed',
  primary: '#2563eb',
  primaryStrong: '#1d4ed8',
  onPrimary: '#ffffff',
  info: '#0369a1',
  success: '#047857',
  successStrong: '#059669',
  successBg: '#d1fae5',
  successText: '#047857',
  warning: '#b45309',
  danger: '#dc2626',
  dangerBg: 'rgba(220, 38, 38, 0.08)',
  violet: '#4f46e5',
  violetBg: 'rgba(79,70,229,0.1)',
};

export const radius = { sm: 6, md: 8, lg: 10, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16 } as const;

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
      styles = StyleSheet.create(factory(colors));
      cache.set(colors, styles);
    }
    return styles;
  };
}
