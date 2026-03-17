import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getSurfaceColor, getSurfaceLabel, getSurfaceTextColor } from '../theme/colors';

interface SurfaceBadgeProps {
  surface?: string;
}

export const SurfaceBadge: React.FC<SurfaceBadgeProps> = ({ surface }) => {
  const bg = getSurfaceColor(surface);
  const textColor = getSurfaceTextColor(surface);
  const label = getSurfaceLabel(surface);

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
