import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import { useLanguage } from '../../lib/i18n';
import { SkeletonList } from '../../lib/skeleton';
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

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
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
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      label = `${days[d.getDay()]} ${d.getDate()}`;
    }
    pills.push({ label, date: dateStr });
  }
  return pills;
}

export default function HomeScreen() {
  const router = useRouter();
  const { getPlayerName } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const datePills = useMemo(() => getDatePills(), []);

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
    await refetchMatches();
    setRefreshing(false);
  }, [refetchMatches]);

  const allMatches: MatchWithPlayers[] =
    matchesData?.data ??
    (Array.isArray(matchesData) ? (matchesData as MatchWithPlayers[]) : []);

  // Separate live matches
  const liveMatches = useMemo(() => allMatches.filter((m) => (m as any).isLive), [allMatches]);

  // Group non-live matches by tournament
  const matchesByTournament = useMemo(() => {
    const nonLive = allMatches.filter((m) => !(m as any).isLive);
    const groups: Record<string, { tournament: any; matches: MatchWithPlayers[] }> = {};
    const order: string[] = [];
    nonLive.forEach((m) => {
      const t = m.tournament;
      const key = t?.name || 'Other';
      if (!groups[key]) {
        groups[key] = { tournament: t, matches: [] };
        order.push(key);
      }
      groups[key].matches.push(m);
    });
    return order.map((name) => groups[name]);
  }, [allMatches]);

  const renderMatchRow = (match: MatchWithPlayers) => {
    const isLive = (match as any).isLive;
    const p1Won = match.winnerId === match.player1Id;
    const p2Won = match.winnerId === match.player2Id;
    const isFinished = match.winnerId != null;
    const isScheduled = !isFinished && !isLive;
    const p1Name = match.player1 ? getPlayerName(match.player1) : `Player ${match.player1Id}`;
    const p2Name = match.player2 ? getPlayerName(match.player2) : `Player ${match.player2Id}`;
    const p1Initials = match.player1 ? getInitials(match.player1.name) : 'P1';
    const p2Initials = match.player2 ? getInitials(match.player2.name) : 'P2';

    return (
      <TouchableOpacity
        key={match.id}
        style={[styles.matchRow, isLive && styles.matchRowLive]}
        onPress={() => router.push(`/match/${match.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.matchInner}>
          {/* Player 1 */}
          <View style={styles.matchPlayer}>
            <View style={[styles.avatar, !p1Won && p2Won && { opacity: 0.5 }]}>
              {match.player1?.photoUrl ? (
                <Image source={{ uri: match.player1.photoUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{p1Initials}</Text>
              )}
            </View>
            <Text style={styles.flag}>{match.player1?.countryFlag || ''}</Text>
            <Text
              style={[
                styles.playerName,
                p1Won && styles.playerNameWinner,
                !p1Won && p2Won && styles.playerNameLoser,
              ]}
              numberOfLines={1}
            >
              {p1Name}
            </Text>
            {p1Won && <View style={styles.winnerBadge} />}
          </View>

          {/* Score */}
          <View style={styles.matchScore}>
            {isLive ? (
              <>
                <Text style={styles.scoreLive}>{match.score || '0-0'}</Text>
                <View style={styles.liveStatus}>
                  <LiveDot />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </>
            ) : isFinished ? (
              <>
                <Text style={styles.scoreFt}>{match.score}</Text>
                <Text style={styles.statusFt}>FT</Text>
              </>
            ) : (
              <>
                <Text style={styles.scoreTime}>{(match as any).scheduledTime || '--:--'}</Text>
                <Text style={styles.statusScheduled}>Scheduled</Text>
              </>
            )}
          </View>

          {/* Player 2 */}
          <View style={[styles.matchPlayer, styles.matchPlayerRight]}>
            <Text
              style={[
                styles.playerName,
                p2Won && styles.playerNameWinner,
                !p2Won && p1Won && styles.playerNameLoser,
              ]}
              numberOfLines={1}
            >
              {p2Name}
            </Text>
            {p2Won && <View style={styles.winnerBadge} />}
            <Text style={styles.flag}>{match.player2?.countryFlag || ''}</Text>
            <View style={[styles.avatar, !p2Won && p1Won && { opacity: 0.5 }]}>
              {match.player2?.photoUrl ? (
                <Image source={{ uri: match.player2.photoUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{p2Initials}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Court info for scheduled matches */}
        {isScheduled && match.court && (
          <Text style={styles.courtInfo}>
            {match.court}
            {(match as any).matchOrder ? ` \u2022 ${(match as any).matchOrder}` : ''}
            {(match as any).afterMatch ? ` \u2022 After ${(match as any).afterMatch}` : ''}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

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
      {/* Title */}
      <Text style={styles.pageTitle}>Matches</Text>

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

      {matchesLoading ? (
        <SkeletonList count={5} cardHeight={48} />
      ) : allMatches.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No matches</Text>
        </View>
      ) : (
        <>
          {/* Live Matches */}
          {liveMatches.length > 0 && (
            <View>
              <Text style={styles.sectionHeaderLive}>LIVE</Text>
              {liveMatches.map(renderMatchRow)}
            </View>
          )}

          {/* Matches by Tournament */}
          {matchesByTournament.map((group, idx) => (
            <View key={idx}>
              <Text style={styles.sectionHeader}>
                {group.tournament?.name?.toUpperCase() || 'OTHER'}
                {group.tournament?.surface ? ` \u2022 ${group.tournament.surface}` : ''}
              </Text>
              {group.matches.map(renderMatchRow)}
            </View>
          ))}
        </>
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
    paddingTop: 50,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  // Date Pills
  datePillsRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
    flexDirection: 'row',
  },
  datePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e1e1e',
  },
  datePillActive: {
    backgroundColor: '#16a34a',
  },
  datePillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
  },
  datePillTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Section Headers
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderLive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e53935',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Match Row
  matchRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  matchRowLive: {
    backgroundColor: 'rgba(229,57,53,0.06)',
    borderLeftWidth: 3,
    borderLeftColor: '#e53935',
  },
  matchInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Player
  matchPlayer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchPlayerRight: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
  },
  flag: {
    fontSize: 14,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    flexShrink: 1,
  },
  playerNameWinner: {
    color: '#16a34a',
    fontWeight: '700',
  },
  playerNameLoser: {
    color: '#555',
    fontWeight: '400',
  },
  winnerBadge: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16a34a',
  },

  // Score
  matchScore: {
    width: 90,
    alignItems: 'center',
    flexShrink: 0,
  },
  scoreLive: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
  },
  scoreFt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 2,
  },
  scoreTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  statusFt: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  statusScheduled: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e53935',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#e53935',
  },

  // Court info
  courtInfo: {
    fontSize: 11,
    color: '#555',
    marginTop: 6,
    paddingLeft: 42,
  },

  // Empty
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
});
