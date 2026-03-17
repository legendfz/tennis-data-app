import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/colors';

interface LiveDotProps {
  showLabel?: boolean;
}

export const LiveDot: React.FC<LiveDotProps> = ({ showLabel = true }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: 750, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scale]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { transform: [{ scale }] }]} />
      {showLabel && <Text style={styles.label}>LIVE</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentGreen,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentGreen,
    letterSpacing: 0.5,
  },
});
