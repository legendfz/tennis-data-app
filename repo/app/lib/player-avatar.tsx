import React, { useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { getDiceBearUrl } from './avatars';

interface PlayerAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
}

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function PlayerAvatar({ name, photoUrl, size = 40 }: PlayerAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [dicebearError, setDicebearError] = useState(false);

  const dicebearUrl = getDiceBearUrl(name, size * 2);

  if (photoUrl && !imageError) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        onError={() => setImageError(true)}
      />
    );
  }

  if (!dicebearError) {
    return (
      <Image
        source={{ uri: dicebearUrl }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        onError={() => setDicebearError(true)}
      />
    );
  }

  // Final fallback: text initials
  return (
    <View
      style={[
        styles.initialsContainer,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
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
    borderColor: '#2a2a2a',
  },
  initialsContainer: {
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  initialsText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
