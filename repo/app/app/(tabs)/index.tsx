import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import type { Player, MatchWithPlayers } from '../../../shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TOP_PLAYER_CARD_WIDTH = 120;

export default function HomeScreen() {
  const router = useRouter();

  const {
    data: playersData,
    isLoading: playersLoading,
    refetch: refetchPlayers,
  } = useQuery<{ data: Player[] }>({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await api.get('/api/players?limit=10');
      return res.data;
    },
  });

  const {
    data: matchesData,
    isLoading: matchesLoading,
    refetch: refetchMatches,
  } = useQuery<{ data: MatchWithPlayers[] }>({
    queryKey: ['matches-latest'],
    queryFn: async () => {
      const res = await api.get('/api/matches?limit=5');
      return res.data;
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchPlayers(), refetchMatches()]);
    setRefreshing(false);
  }, [refetchPlayers, refetchMatches]);

  const topPlayers: Player[] =
    playersData?.data ?? (Array.isArray(playersData) ? (playersData as Player[]).slice(0, 10) : []);
  const latestMatches: MatchWithPlayers[] =
    matchesData?.data ??
    (Array.isArray(matchesData) ? (matchesData as MatchWithPlayers[]).slice(0, 5) : []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#16a34a"
          colors={['#16a34a']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎾 TennisHQ</Text>
        <Text style={styles.subtitle}>Your Tennis Command Center</Text>
      </View>

      {/* Top Players - Horizontal Scroll */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Players</Text>
        {playersLoading ? (
          <ActivityIndicator size="small" color="#16a34a" style={{ padding: 20 }} />
        ) : (
          <FlatList
            data={topPlayers}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.topPlayersList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.topPlayerCard}
                onPress={() => router.push(`/player/${item.id}`)}
                activeOpacity={0.7}
              >
                <Image
                  source={{
                    uri: item.photoUrl || getAvatarUrl(item.name, 160),
                  }}
                  style={styles.topPlayerAvatar}
                />
                <Text style={styles.topPlayerRank}>#{item.ranking}</Text>
                <Text style={styles.topPlayerName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.topPlayerFlag}>{item.countryFlag}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* H2H Quick Access */}
      <TouchableOpacity
        style={styles.h2hBanner}
        onPress={() => router.push('/h2h' as any)}
      >
        <Text style={styles.h2hBannerText}>⚔️ Head to Head</Text>
        <Text style={styles.h2hBannerSub}>Compare any two players →</Text>
      </TouchableOpacity>

      {/* Latest Matches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Latest Matches</Text>
        {matchesLoading ? (
          <ActivityIndicator size="small" color="#16a34a" style={{ padding: 20 }} />
        ) : latestMatches.length === 0 ? (
          <Text style={styles.emptyText}>No recent matches</Text>
        ) : (
          latestMatches.map((match) => (
            <View key={match.id} style={styles.matchCard}>
              <Text style={styles.matchTournament}>
                {match.tournament?.name || 'Tournament'} · {match.round}
              </Text>
              <View style={styles.matchPlayers}>
                <View style={styles.matchPlayerSide}>
                  <Image
                    source={{
                      uri:
                        match.player1?.photoUrl ||
                        getAvatarUrl(match.player1?.name || 'P1', 80),
                    }}
                    style={styles.matchAvatar}
                  />
                  <Text
                    style={[
                      styles.matchPlayerName,
                      match.winnerId === match.player1Id && styles.matchWinner,
                    ]}
                    numberOfLines={1}
                  >
                    {match.player1?.name || `Player ${match.player1Id}`}
                  </Text>
                </View>

                <Text style={styles.matchVs}>vs</Text>

                <View style={styles.matchPlayerSide}>
                  <Image
                    source={{
                      uri:
                        match.player2?.photoUrl ||
                        getAvatarUrl(match.player2?.name || 'P2', 80),
                    }}
                    style={styles.matchAvatar}
                  />
                  <Text
                    style={[
                      styles.matchPlayerName,
                      match.winnerId === match.player2Id && styles.matchWinner,
                    ]}
                    numberOfLines={1}
                  >
                    {match.player2?.name || `Player ${match.player2Id}`}
                  </Text>
                </View>
              </View>
              <Text style={styles.matchScore}>{match.score}</Text>
              <Text style={styles.matchDate}>{match.date}</Text>
            </View>
          ))
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>50</Text>
          <Text style={styles.statLabel}>Players</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>14</Text>
          <Text style={styles.statLabel}>Tournaments</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>105</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h2hBanner: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#16a34a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  h2hBannerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  h2hBannerSub: {
    fontSize: 13,
    color: '#16a34a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a0b0',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  topPlayersList: {
    paddingHorizontal: 12,
    gap: 10,
  },
  topPlayerCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    width: TOP_PLAYER_CARD_WIDTH,
    alignItems: 'center',
  },
  topPlayerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#16a34a',
    marginBottom: 8,
  },
  topPlayerRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 2,
  },
  topPlayerName: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  topPlayerFlag: {
    fontSize: 18,
  },
  matchCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  matchTournament: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  matchPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  matchPlayerSide: {
    flex: 1,
    alignItems: 'center',
  },
  matchAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#16a34a',
    marginBottom: 4,
  },
  matchPlayerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  matchWinner: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  matchVs: {
    color: '#a0a0b0',
    fontSize: 12,
    marginHorizontal: 8,
  },
  matchScore: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  matchDate: {
    color: '#a0a0b0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  statBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  statLabel: {
    fontSize: 12,
    color: '#a0a0b0',
    marginTop: 4,
  },
  emptyText: {
    color: '#a0a0b0',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
});
