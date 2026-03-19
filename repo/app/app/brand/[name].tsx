import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { PlayerAvatar } from '../../lib/player-avatar';
import { Flag } from '../../lib/flags';
import { useLanguage } from '../../lib/i18n';
import { SkeletonList } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import type { Player } from '../../../shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function BrandDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const brandName = decodeURIComponent(name || '');
  const router = useRouter();
  const { getPlayerName } = useLanguage();

  const { data, isLoading } = useQuery<{ data: Player[] }>({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await api.get('/api/players');
      return res.data;
    },
  });

  const players = data?.data ?? (Array.isArray(data) ? data : []);

  // Filter players that use this brand
  const brandPlayers = useMemo(() => {
    return players.filter((p) => {
      const eq = (p as any).equipment;
      if (!eq) return false;
      const check = (items: any[]) => items?.some((i: any) => i.brand === brandName || i === brandName);
      if (check(eq.apparel || [])) return true;
      if (check(eq.shoes || [])) return true;
      if (eq.racket?.brand === brandName) return true;
      if (eq.watch === brandName) return true;
      if (eq.otherSponsors?.includes(brandName)) return true;
      return false;
    });
  }, [players, brandName]);

  // Stats
  const totalPlayers = brandPlayers.length;
  const avgRanking = totalPlayers > 0
    ? Math.round(brandPlayers.reduce((sum, p) => sum + p.ranking, 0) / totalPlayers)
    : 0;
  const totalTitles = brandPlayers.reduce((sum, p) => sum + (p.titles || 0), 0);
  const totalGrandSlams = brandPlayers.reduce((sum, p) => sum + (p.grandSlams || 0), 0);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: brandName }} />
        <SkeletonList count={5} cardHeight={52} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: brandName }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>{brandName.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.brandTitle}>{brandName}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalPlayers}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>#{avgRanking || '--'}</Text>
            <Text style={styles.statLabel}>Avg Ranking</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalTitles}</Text>
            <Text style={styles.statLabel}>Total Titles</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#f59e0b' }]}>{totalGrandSlams}</Text>
            <Text style={styles.statLabel}>Grand Slams</Text>
          </View>
        </View>

        {/* Player List */}
        <Text style={styles.sectionTitle}>Players ({totalPlayers})</Text>
        {brandPlayers.length === 0 ? (
          <EmptyState message="No players found for this brand" />
        ) : (
          brandPlayers.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={styles.playerRow}
              onPress={() => router.push(`/player/${player.id}`)}
              activeOpacity={0.7}
            >
              <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size={40} />
              <View style={styles.nameWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.playerName}>{getPlayerName(player)}</Text>
                  <Flag country={player.country} countryFlag={player.countryFlag} size={14} />
                </View>
                <Text style={styles.playerRank}>#{player.ranking}</Text>
              </View>
              <View style={styles.titlesWrap}>
                <Text style={styles.titlesNum}>{player.titles}</Text>
                <Text style={styles.titlesLabel}>titles</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { paddingBottom: 40 },

  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#888',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },

  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    paddingHorizontal: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e1e1e',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  nameWrap: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  playerRank: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  titlesWrap: {
    alignItems: 'center',
  },
  titlesNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  titlesLabel: {
    fontSize: 10,
    color: '#666',
  },
});
