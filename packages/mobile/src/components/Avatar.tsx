import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/colors';
import { getPlayerImageUrl } from '../api/client';

interface AvatarProps {
  playerId?: number | string;
  name?: string;
  size: number;
  style?: object;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({ playerId, name, size, style }) => {
  const [error, setError] = useState(false);
  const borderRadius = size / 2;
  const fontSize = size * 0.35;

  if (!playerId || error) {
    return (
      <View
        style={[
          styles.fallback,
          { width: size, height: size, borderRadius, backgroundColor: Colors.bgTertiary },
          style,
        ]}
      >
        <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: getPlayerImageUrl(playerId) }}
      style={[{ width: size, height: size, borderRadius, backgroundColor: Colors.bgTertiary }, style]}
      onError={() => setError(true)}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
