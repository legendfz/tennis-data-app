/**
 * Centralized design tokens for TennisHQ.
 * All files should reference these constants instead of hard-coding colors.
 */
export const theme = {
  // Backgrounds
  bg: '#121212',
  card: '#1e1e1e',
  cardAlt: '#1a1a1a',
  border: '#2a2a2a',
  skeleton: '#1e1e1e',

  // Text
  text: '#ffffff',
  textSecondary: '#888888',
  textTertiary: '#6b7280',
  textMuted: '#9ca3af',

  // Accent colors
  accent: '#16a34a',
  gold: '#f59e0b',
  red: '#e53935',
  blue: '#3b82f6',
  linkBlue: '#60a5fa',

  // Surface colors (tennis)
  surfaceClay: '#f97316',
  surfaceGrass: '#22c55e',
  surfaceHard: '#3b82f6',

  // Interactive
  activeOpacity: 0.7,

  // Typography sizes
  fontSize: {
    pageTitle: 24,
    sectionTitle: 16,
    body: 14,
    secondary: 12,
    small: 10,
  },

  // Font weights
  fontWeight: {
    bold: '700' as const,
    semibold: '600' as const,
    medium: '500' as const,
    regular: '400' as const,
  },

  // Spacing
  spacing: {
    sectionGap: 24,
    cardGap: 12,
    padding: 16,
  },

  // Touch targets
  minTouchTarget: 44,
};
