/**
 * Design tokens do teclado — Minimalista, monocromático e neutro.
 * Sem bordas, sem cantos coloridos e sem cores fortes.
 */
export const colors = {
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
} as const;

export const radius = { sm: 6, md: 8, lg: 10, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16 } as const;
