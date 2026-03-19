import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import { useLanguage, LANGUAGE_OPTIONS } from '../../lib/i18n';
import { SkeletonList, SkeletonBlock } from '../../lib/skeleton';
import { getFavorites } from '../../lib/favorites';
import type { Player, MatchWithPlayers } from '../../../shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TOP_PLAYER_CARD_WIDTH = 130;

// Live badge with blinking dot
function LiveBadge() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.liveBadge}>
      <Animated.View style={[styles.liveDot, { opacity }]} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function getFormattedDate(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };
  return now.toLocaleDateString('en-US', options);
}

export default function HomeScreen() {
  const router = useRouter();
  const { language, setLanguage, getPlayerName } = useLanguage();
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      getFavorites().then(setFavoriteIds);
    }, [])
  );

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
      {/* Welcome Header with Date */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()} 👋</Text>
        <Text style={styles.title}>🎾 TennisHQ</Text>
        <Text style={styles.dateText}>{getFormattedDate()}</Text>
      </View>

      {/* Language Switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.langSwitcher}
      >
        {LANGUAGE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.code}
            style={[styles.langPill, language === opt.code && styles.langPillActive]}
            onPress={() => setLanguage(opt.code)}
            activeOpacity={0.7}
          >
            <Text style={[styles.langPillText, language === opt.code && styles.langPillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* My Players - Favorites */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>❤️ My Players</Text>
        {favoriteIds.length === 0 ? (
          <View style={styles.emptyFavContainer}>
            <Text style={styles.emptyFavIcon}>🎾</Text>
            <Text style={styles.emptyFavText}>Follow your favorite players</Text>
            <Text style={styles.emptyFavSub}>Tap ❤️ on a player's profile to add them here</Text>
          </View>
        ) : (
          <FlatList
            data={topPlayers.filter((p) => favoriteIds.includes(p.id))}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => `fav-${item.id}`}
            contentContainerStyle={styles.topPlayersList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.favPlayerCard}
                onPress={() => router.push(`/player/${item.id}`)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: item.photoUrl || getAvatarUrl(item.name, 120) }}
                  style={styles.favPlayerAvatar}
                />
                <Text style={styles.favPlayerName} numberOfLines={1}>
                  {getPlayerName(item)}
                </Text>
                <Text style={styles.favPlayerRank}>#{item.ranking}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyFavContainer}>
                <Text style={styles.emptyFavSub}>Your favorited players will appear here once loaded</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Top Players - Horizontal Scroll */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 Top Players</Text>
        {playersLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}>
            {[1,2,3,4].map(i => (
              <SkeletonBlock key={i} width={TOP_PLAYER_CARD_WIDTH} height={170} borderRadius={16} />
            ))}
          </ScrollView>
        ) : (
          <FlatList
            data={topPlayers}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.topPlayersList}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.topPlayerCard}
                onPress={() => router.push(`/player/${item.id}`)}
                activeOpacity={0.7}
              >
                {/* Rank badge - large and prominent */}
                <View style={[
                  styles.rankBadge,
                  index === 0 && styles.rankBadgeGold,
                  index === 1 && styles.rankBadgeSilver,
                  index === 2 && styles.rankBadgeBronze,
                ]}>
                  <Text style={[
                    styles.rankBadgeText,
                    index < 3 && styles.rankBadgeTextTop,
                  ]}>
                    {index < 3 ? ['👑', '🥈', '🥉'][index] : `#${item.ranking}`}
                  </Text>
                </View>
                <Image
                  source={{
                    uri: item.photoUrl || getAvatarUrl(item.name, 160),
                  }}
                  style={styles.topPlayerAvatar}
                />
                <Text style={styles.topPlayerRank}>#{item.ranking}</Text>
                <Text style={styles.topPlayerName} numberOfLines={2}>
                  {getPlayerName(item)}
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
        activeOpacity={0.7}
      >
        <Text style={styles.h2hBannerText}>⚔️ Head to Head</Text>
        <Text style={styles.h2hBannerSub}>Compare any two players →</Text>
      </TouchableOpacity>

      {/* Latest Matches */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚡ Latest Matches</Text>
          <LiveBadge />
        </View>
        {matchesLoading ? (
          <SkeletonList count={3} cardHeight={110} />
        ) : latestMatches.length === 0 ? (
          <Text style={styles.emptyText}>No recent matches</Text>
        ) : (
          latestMatches.map((match) => {
            const p1IsWinner = match.winnerId === match.player1Id;
            const p2IsWinner = match.winnerId === match.player2Id;
            return (
              <TouchableOpacity
                key={match.id}
                style={styles.matchCard}
                onPress={() => router.push(`/match/${match.id}`)}
                activeOpacity={0.7}
              >
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
                      style={[styles.matchAvatar, p1IsWinner && styles.matchAvatarWinner]}
                    />
                    <Text
                      style={[
                        styles.matchPlayerName,
                        p1IsWinner && styles.matchWinner,
                        !p1IsWinner && p2IsWinner && styles.matchLoser,
                      ]}
                      numberOfLines={1}
                    >
                      {match.player1 ? getPlayerName(match.player1) : `Player ${match.player1Id}`}
                    </Text>
                    {p1IsWinner && <Text style={styles.winnerBadge}>W</Text>}
                  </View>

                  <View style={styles.vsContainer}>
                    <Text style={styles.matchVs}>VS</Text>
                  </View>

                  <View style={styles.matchPlayerSide}>
                    <Image
                      source={{
                        uri:
                          match.player2?.photoUrl ||
                          getAvatarUrl(match.player2?.name || 'P2', 80),
                      }}
                      style={[styles.matchAvatar, p2IsWinner && styles.matchAvatarWinner]}
                    />
                    <Text
                      style={[
                        styles.matchPlayerName,
                        p2IsWinner && styles.matchWinner,
                        !p2IsWinner && p1IsWinner && styles.matchLoser,
                      ]}
                      numberOfLines={1}
                    >
                      {match.player2 ? getPlayerName(match.player2) : `Player ${match.player2Id}`}
                    </Text>
                    {p2IsWinner && <Text style={styles.winnerBadge}>W</Text>}
                  </View>
                </View>
                <Text style={styles.matchScore}>{match.score}</Text>
                <Text style={styles.matchDate}>{match.date}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>🎾</Text>
          <Text style={styles.statNumber}>50</Text>
          <Text style={styles.statLabel}>Players</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>🏆</Text>
          <Text style={styles.statNumber}>14</Text>
          <Text style={styles.statLabel}>Tournaments</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statEmoji}>⚔️</Text>
          <Text style={styles.statNumber}>105</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Live badge
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ef4444',
    letterSpacing: 1,
  },

  // Language
  langSwitcher: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexDirection: 'row',
  },
  langPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  langPillActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  langPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a0a0b0',
  },
  langPillTextActive: {
    color: '#ffffff',
  },

  // H2H
  h2hBanner: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#16a34a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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

  // Container
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  content: {
    paddingBottom: 40,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#a0a0b0',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#6b7280',
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16a34a',
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  // Top Players
  topPlayersList: {
    paddingHorizontal: 12,
    gap: 10,
  },
  topPlayerCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 14,
    width: TOP_PLAYER_CARD_WIDTH,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2a2a4e',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 1,
  },
  rankBadgeGold: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  rankBadgeSilver: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderWidth: 1,
    borderColor: '#94a3b8',
  },
  rankBadgeBronze: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    borderWidth: 1,
    borderColor: '#d97706',
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#a0a0b0',
  },
  rankBadgeTextTop: {
    fontSize: 14,
  },
  topPlayerAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#16a34a',
    marginBottom: 8,
    marginTop: 4,
  },
  topPlayerRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
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
    fontSize: 20,
  },

  // Match Card
  matchCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  matchTournament: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2a2a4e',
    marginBottom: 6,
  },
  matchAvatarWinner: {
    borderColor: '#16a34a',
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
  matchLoser: {
    color: '#6b7280',
  },
  winnerBadge: {
    marginTop: 4,
    backgroundColor: '#16a34a',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  vsContainer: {
    paddingHorizontal: 8,
  },
  matchVs: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: 'bold',
  },
  matchScore: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '700',
  },
  matchDate: {
    color: '#6b7280',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  statBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  statLabel: {
    fontSize: 11,
    color: '#a0a0b0',
    marginTop: 4,
  },
  emptyText: {
    color: '#a0a0b0',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },

  // My Players (favorites)
  emptyFavContainer: {
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    borderStyle: 'dashed',
  },
  emptyFavIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyFavText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  emptyFavSub: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  favPlayerCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 12,
    width: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  favPlayerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#16a34a',
    marginBottom: 6,
  },
  favPlayerName: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  favPlayerRank: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: 'bold',
  },
});
