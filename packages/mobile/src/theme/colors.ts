export const Colors = {
  bgPrimary: '#0D0F14',
  bgSecondary: '#161A23',
  bgTertiary: '#1E2330',
  bgHover: '#252B3A',

  textPrimary: '#FFFFFF',
  textSecondary: '#A0A8BE',
  textTertiary: '#5C6478',

  accentGreen: '#00E676',
  accentRed: '#FF5252',
  accentYellow: '#FFD740',
  accentBlue: '#448AFF',
  accentGrass: '#69F0AE',
  accentOrange: '#FF9100',
  accentIndoor: '#B388FF',

  surfaceCard: '#161A23',
  surfaceCardBorder: '#1E2330',
  divider: '#1E2330',

  tabActive: '#FFFFFF',
  tabInactive: '#5C6478',

  scoreLive: '#00E676',
  scoreFinal: '#FFFFFF',
} as const;

export const getSurfaceColor = (surface?: string): string => {
  const s = surface?.toLowerCase() ?? '';
  if (s.includes('clay')) return Colors.accentOrange;
  if (s.includes('grass')) return Colors.accentGrass;
  if (s.includes('indoor') || s.includes('carpet')) return Colors.accentIndoor;
  return Colors.accentBlue; // hard (default)
};

export const getSurfaceTextColor = (surface?: string): string => {
  const s = surface?.toLowerCase() ?? '';
  if (s.includes('grass') || s.includes('indoor') || s.includes('carpet')) return Colors.bgPrimary;
  return Colors.textPrimary;
};

export const getSurfaceLabel = (surface?: string): string => {
  const s = surface?.toLowerCase() ?? '';
  if (s.includes('clay')) return 'CLAY';
  if (s.includes('grass')) return 'GRASS';
  if (s.includes('indoor')) return 'INDOOR';
  if (s.includes('carpet')) return 'CARPET';
  return 'HARD';
};
