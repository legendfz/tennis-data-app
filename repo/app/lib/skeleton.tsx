import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface SkeletonBlockProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonBlock({
  width,
  height,
  borderRadius = 10,
  style,
}: SkeletonBlockProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: '#1e1e1e', opacity }, style]}
    />
  );
}

export function SkeletonCard({ height = 100 }: { height?: number }) {
  return (
    <View style={skeletonStyles.card}>
      <SkeletonBlock width="100%" height={height} />
    </View>
  );
}

export function SkeletonList({ count = 5, cardHeight = 80 }: { count?: number; cardHeight?: number }) {
  return (
    <View style={skeletonStyles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={cardHeight} />
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    marginBottom: 8,
    marginHorizontal: 16,
  },
  list: {
    paddingTop: 16,
  },
});
