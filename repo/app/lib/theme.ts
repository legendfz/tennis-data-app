/**
 * Centralized design tokens for TennisHQ v2.
 * All files should reference these constants instead of hard-coding colors.
 */
export const theme = {
  // Backgrounds — elevation via brightness (closer to user = brighter)
  bg: '#121212',          // base
  card: '#1e1e1e',        // elevation 1
  cardAlt: '#1a1a1a',     // elevation 1 alt
  cardHover: '#262626',   // hover state
  cardElevated: '#242424', // elevation 2 (modals, popovers)
  border: '#2a2a2a',
  skeleton: '#1e1e1e',

  // Glass
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassBorderTop: 'rgba(255,255,255,0.08)',
  tabBarBg: 'rgba(13,13,13,0.88)',
  tabBarBorder: 'rgba(255,255,255,0.04)',

  // Text — #f0f0f0 instead of pure white to reduce eye strain
  text: '#f0f0f0',
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
    black: '900' as const,
    extrabold: '800' as const,
    bold: '700' as const,
    semibold: '600' as const,
    medium: '500' as const,
    regular: '400' as const,
  },

  // Winner/loser
  winnerText: '#f0f0f0',
  loserText: '#3a3a3a',
  winnerDot: '#1a7a3a',

  // Spacing
  spacing: {
    sectionGap: 24,
    cardGap: 12,
    padding: 16,
  },

  // Glass card shadow
  glassCardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  } as const,

  // Touch targets
  minTouchTarget: 44,
};

/** Responsive breakpoints */
export const breakpoints = {
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1440,
};

/** Border radii — v2 design system */
export const radii = {
  card: 16,
  avatar: 16,
  avatarLg: 28,
  avatarSm: 12,
  button: 24,
  pill: 20,
};

/** Motion configuration */
export const motion = {
  enabled: true,
};

/** Notification frequency / throttle config */
export const notifications = {
  /** Minimum seconds between non-critical push notifications */
  minIntervalSec: 300,
  /** Maximum notifications per hour */
  maxPerHour: 6,
  /** Quiet hours (24h format) — suppress non-urgent alerts */
  quietHoursStart: 23,
  quietHoursEnd: 8,
};

/**
 * Compute squircle avatar border-radius from size.
 * Large avatars get bigger radius; small ones stay compact.
 */
export function avatarRadius(size: number): number {
  if (size >= 80) return radii.avatarLg;   // 28
  if (size >= 48) return radii.avatar;     // 16
  return radii.avatarSm;                   // 12
}
