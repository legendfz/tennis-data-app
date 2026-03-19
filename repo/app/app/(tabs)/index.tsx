import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Animated,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import { useLanguage } from '../../lib/i18n';
import { SkeletonList } from '../../lib/skeleton';
import { getFavorites } from '../../lib/favorites';
import type { Player, MatchWithPlayers } from '../../../shared/types';

function LiveDot() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return <Animated.View style={[styles.liveDot, { opacity }]} />;
}

function getDatePills(): { label: string; date: string }[] {
  const pills: { label: string; date: string }[] = [];
  const today = new Date();
  for (let i = -3; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    let label: string;
    if (i === -1) label = 'Yesterday';
    else if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      label = `${months[d.getMonth()]} ${d.getDate()}`;
    }
    pills.push({ label, date: dateStr });
  }
  return pills;
}

export default function HomeScreen() {
  const router = useRouter();
  const { getPlayerName } = useLanguage();
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const datePills = useMemo(() => getDatePills(), []);

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
      const res = await api.get('/api/matches?limit=50');
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
  const allMatches: MatchWithPlayers[] =
    matchesData?.data ??
    (Array.isArray(matchesData) ? (matchesData as MatchWithPlayers[]) : []);

  // Group matches by tournament
  const matchesByTournament = useMemo(() => {
    const groups: Record<string, MatchWithPlayers[]> = {};
    const order: string[] = [];
    allMatches.forEach((m) => {
      const key = m.tournament?.name || 'Other';
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(m);
    });
    return order.map((name) => ({ tournament: name, matches: groups[name] }));
  }, [allMatches]);

  const favPlayers = topPlayers.filter((p) => favoriteIds.includes(p.id));

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
      {/* Date Selector Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datePillsRow}
      >
        {datePills.map((pill) => (
          <TouchableOpacity
            key={pill.date}
            style={[styles.datePill, selectedDate === pill.date && styles.datePillActive]}
            onPress={() => setSelectedDate(pill.date)}
            activeOpacity={0.7}
          >
            <Text style={[styles.datePillText, selectedDate === pill.date && styles.datePillTextActive]}>
              {pill.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* My Players */}
      {favPlayers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Following</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favRow}>
            {favPlayers.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.favItem}
                onPress={() => router.push(`/player/${p.id}`)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: p.photoUrl || getAvatarUrl(p.name, 80) }}
                  style={styles.favAvatar}
                />
                <Text style={styles.favName} numberOfLines={1}>{getPlayerName(p).split(' ').pop()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Matches by Tournament */}
      {matchesLoading ? (
        <SkeletonList count={5} cardHeight={48} />
      ) : matchesByTournament.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No matches</Text>
        </View>
      ) : (
        matchesByTournament.map((group) => (
          <View key={group.tournament} style={styles.tournamentGroup}>
            <View style={styles.tournamentHeader}>
              <Text style={styles.tournamentName}>{group.tournament}</Text>
            </View>
            {group.matches.map((match) => {
              const p1Won = match.winnerId === match.player1Id;
              const p2Won = match.winnerId === match.player2Id;
              const isFinished = match.winnerId != null;
              const p1Name = match.player1 ? getPlayerName(match.player1) : `Player ${match.player1Id}`;
              const p2Name = match.player2 ? getPlayerName(match.player2) : `Player ${match.player2Id}`;

              return (
                <TouchableOpacity
                  key={match.id}
                  style={styles.matchRow}
                  onPress={() => router.push(`/match/${match.id}`)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.matchPlayer, styles.matchPlayerLeft, p1Won && styles.matchPlayerBold, !p1Won && p2Won && styles.matchPlayerDim]}
                    numberOfLines={1}
                  >
                    {p1Name}
                  </Text>
                  <View style={styles.matchCenter}>
                    <Text style={[styles.matchScore, !isFinished && styles.matchTime]}>
                      {match.score || '--'}
                    </Text>
                    {isFinished && <Text style={styles.matchStatus}>FT</Text>}
                  </View>
                  <Text
                    style={[styles.matchPlayer, styles.matchPlayerRight, p2Won && styles.matchPlayerBold, !p2Won && p1Won && styles.matchPlayerDim]}
                    numberOfLines={1}
                  >
                    {p2Name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    paddingBottom: 40,
  },

  // Date Pills
  datePillsRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
    flexDirection: 'row',
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e1e1e',
  },
  datePillActive: {
    backgroundColor: '#16a34a',
  },
  datePillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9ca3af',
  },
  datePillTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Section
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    paddingHorizontal: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Favorites
  favRow: {
    paddingHorizontal: 12,
    gap: 16,
    flexDirection: 'row',
    paddingBottom: 12,
  },
  favItem: {
    alignItems: 'center',
    width: 56,
  },
  favAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 4,
  },
  favName: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },

  // Tournament group
  tournamentGroup: {
    marginBottom: 4,
  },
  tournamentHeader: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tournamentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },

  // Match row
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a2a2a',
  },
  matchPlayer: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
  },
  matchPlayerLeft: {
    textAlign: 'right',
    paddingRight: 12,
  },
  matchPlayerRight: {
    textAlign: 'left',
    paddingLeft: 12,
  },
  matchPlayerBold: {
    fontWeight: '700',
  },
  matchPlayerDim: {
    color: '#6b7280',
  },
  matchCenter: {
    alignItems: 'center',
    minWidth: 70,
  },
  matchScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  matchTime: {
    color: '#9ca3af',
    fontWeight: '500',
  },
  matchStatus: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },

  // Live
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },

  // Empty
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
