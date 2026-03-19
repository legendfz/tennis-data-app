import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { Tournament } from '../../shared/types';

// Fallback color map by tournament name for cases where tournament object lacks color fields
const TOURNAMENT_COLORS: Record<string, { abbreviation: string; color: string; textColor: string }> = {
  'Australian Open': { abbreviation: 'AO', color: '#0091D2', textColor: '#fff' },
  'Roland Garros': { abbreviation: 'RG', color: '#D2691E', textColor: '#fff' },
  'Wimbledon': { abbreviation: 'W', color: '#006633', textColor: '#fff' },
  'US Open': { abbreviation: 'USO', color: '#003DA5', textColor: '#fff' },
  'ATP Finals': { abbreviation: 'FIN', color: '#FF6600', textColor: '#fff' },
  'Indian Wells Masters': { abbreviation: 'IW', color: '#E91E63', textColor: '#fff' },
  'Miami Open': { abbreviation: 'MIA', color: '#FF9800', textColor: '#fff' },
  'Monte-Carlo Masters': { abbreviation: 'MC', color: '#C62828', textColor: '#fff' },
  'Madrid Open': { abbreviation: 'MAD', color: '#FF5722', textColor: '#fff' },
  'Italian Open': { abbreviation: 'ROM', color: '#4CAF50', textColor: '#fff' },
  'Canadian Open': { abbreviation: 'CAN', color: '#D32F2F', textColor: '#fff' },
  'Cincinnati Masters': { abbreviation: 'CIN', color: '#1565C0', textColor: '#fff' },
  'Shanghai Masters': { abbreviation: 'SH', color: '#E53935', textColor: '#fff' },
  'Paris Masters': { abbreviation: 'PAR', color: '#9C27B0', textColor: '#fff' },
};

type LogoSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<LogoSize, number> = {
  sm: 20,
  md: 28,
  lg: 36,
};

const FONT_SIZE_MAP: Record<LogoSize, number> = {
  sm: 8,
  md: 10,
  lg: 13,
};

interface TournamentLogoProps {
  tournament?: Partial<Tournament> & { name?: string };
  /** Tournament name fallback if no tournament object */
  tournamentName?: string;
  size?: LogoSize;
}

export function TournamentLogo({ tournament, tournamentName, size = 'md' }: TournamentLogoProps) {
  const name = tournament?.name || tournamentName || '';
  const fallback = TOURNAMENT_COLORS[name];

  const logoUrl = tournament?.logoUrl;
  const abbreviation = tournament?.abbreviation || fallback?.abbreviation || getAbbreviation(name);
  const color = tournament?.color || fallback?.color || '#444';
  const textColor = tournament?.textColor || fallback?.textColor || '#fff';

  const dim = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];

  if (logoUrl) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={[styles.logo, { width: dim, height: dim, borderRadius: 6 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.logo,
        {
          width: dim,
          height: dim,
          borderRadius: 6,
          backgroundColor: color,
        },
      ]}
    >
      <Text
        style={[
          styles.abbreviation,
          {
            fontSize,
            color: textColor,
          },
        ]}
        numberOfLines={1}
      >
        {abbreviation}
      </Text>
    </View>
  );
}

/** Generate abbreviation from tournament name */
function getAbbreviation(name: string): string {
  if (!name) return '?';
  const words = name.split(/[\s-]+/).filter((w) => !['open', 'masters', 'the'].includes(w.toLowerCase()));
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  abbreviation: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
