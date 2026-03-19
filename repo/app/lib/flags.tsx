import React, { useState } from 'react';
import { Image, Text, StyleSheet } from 'react-native';

// Map 3-letter country codes to ISO 3166-1 alpha-2 (lowercase)
const COUNTRY_CODE_MAP: Record<string, string> = {
  ITA: 'it', SRB: 'rs', ESP: 'es', GER: 'de', RUS: 'ru',
  POL: 'pl', NOR: 'no', AUS: 'au', BUL: 'bg', GRE: 'gr',
  USA: 'us', DEN: 'dk', FRA: 'fr', CHI: 'cl', CAN: 'ca',
  GBR: 'gb', CZE: 'cz', ARG: 'ar', NED: 'nl', POR: 'pt',
  KAZ: 'kz', CHN: 'cn',
};

interface FlagProps {
  country: string;       // 3-letter code like "ITA"
  countryFlag?: string;  // emoji fallback like "🇮🇹"
  size?: number;         // height in px, default 14
}

export function Flag({ country, countryFlag, size = 14 }: FlagProps) {
  const [error, setError] = useState(false);
  const code = COUNTRY_CODE_MAP[country];
  const width = Math.round(size * 1.5);
  const flagWidth = Math.round(width * 2); // for retina

  if (code && !error) {
    return (
      <Image
        source={{ uri: `https://flagcdn.com/w${flagWidth}/${code}.png` }}
        style={[styles.flag, { width, height: size }]}
        onError={() => setError(true)}
      />
    );
  }

  return <Text style={{ fontSize: size - 2 }}>{countryFlag || '🏳️'}</Text>;
}

const styles = StyleSheet.create({
  flag: {
    borderRadius: 2,
  },
});
