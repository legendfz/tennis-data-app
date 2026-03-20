import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { getDiceBearUrl } from './avatars';
import { avatarRadius, theme } from './theme';

interface PlayerAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
  /** Optional ranking for accessibility label */
  ranking?: number | null;
}

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function PlayerAvatar({ name, photoUrl, size = 40, ranking }: PlayerAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [dicebearError, setDicebearError] = useState(false);

  const dicebearUrl = getDiceBearUrl(name, size * 2);
  const radius = avatarRadius(size);

  const a11yLabel = ranking
    ? `${name}, Rank ${ranking}`
    : name;

  if (photoUrl && !imageError) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: radius },
        ]}
        onError={() => setImageError(true)}
        accessibilityLabel={a11yLabel}
        accessibilityRole="image"
      />
    );
  }

  if (!dicebearError) {
    return (
      <Image
        source={{ uri: dicebearUrl }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: radius },
        ]}
        onError={() => setDicebearError(true)}
        accessibilityLabel={a11yLabel}
        accessibilityRole="image"
      />
    );
  }

  // Final fallback: text initials
  return (
    <View
      style={[
        styles.initialsContainer,
        { width: size, height: size, borderRadius: radius },
      ]}
      accessibilityLabel={a11yLabel}
      accessibilityRole="image"
    >
      <Text style={[styles.initialsText, { fontSize: size * 0.38 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 1,
    borderColor: theme.glassBorder,
  },
  initialsContainer: {
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.glassBorder,
  },
  initialsText: {
    color: theme.text,
    fontWeight: theme.fontWeight.bold,
  },
});
