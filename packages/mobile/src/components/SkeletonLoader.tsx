import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '../theme/colors';

interface SkeletonBoxProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height,
  borderRadius = 4,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.bgTertiary,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonMatchCard: React.FC = () => (
  <View style={styles.matchCard}>
    <SkeletonBox width={80} height={12} borderRadius={4} style={{ marginBottom: 12 }} />
    <View style={styles.playerRow}>
      <SkeletonBox width={56} height={56} borderRadius={28} />
      <View style={styles.playerInfo}>
        <SkeletonBox width={120} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonBox width={80} height={12} borderRadius={4} />
      </View>
    </View>
    <View style={[styles.playerRow, { marginTop: 8 }]}>
      <SkeletonBox width={56} height={56} borderRadius={28} />
      <View style={styles.playerInfo}>
        <SkeletonBox width={140} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonBox width={80} height={12} borderRadius={4} />
      </View>
    </View>
  </View>
);

export const SkeletonRankingRow: React.FC = () => (
  <View style={styles.rankingRow}>
    <SkeletonBox width={30} height={16} borderRadius={4} />
    <SkeletonBox width={48} height={48} borderRadius={24} style={{ marginHorizontal: 12 }} />
    <View style={{ flex: 1 }}>
      <SkeletonBox width={140} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
      <SkeletonBox width={80} height={12} borderRadius={4} />
    </View>
    <SkeletonBox width={40} height={12} borderRadius={4} />
  </View>
);

export const SkeletonSearchRow: React.FC = () => (
  <View style={styles.rankingRow}>
    <SkeletonBox width={48} height={48} borderRadius={24} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <SkeletonBox width={160} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
      <SkeletonBox width={80} height={12} borderRadius={4} />
    </View>
  </View>
);

export const SkeletonPlayerHero: React.FC = () => (
  <View style={styles.playerHero}>
    <SkeletonBox width={96} height={96} borderRadius={48} style={{ marginBottom: 12 }} />
    <SkeletonBox width={180} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
    <SkeletonBox width={120} height={14} borderRadius={4} />
  </View>
);

const styles = StyleSheet.create({
  matchCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceCardBorder,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  playerHero: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});
