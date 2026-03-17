import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/api/client';
import { Avatar } from '../../src/components/Avatar';
import { ErrorState } from '../../src/components/ErrorState';
import { SkeletonBox, SkeletonPlayerHero } from '../../src/components/SkeletonLoader';
import { Colors } from '../../src/theme/colors';

type Tab = 'overview' | 'matches';

function calcAge(ts?: number): string {
  if (!ts) return '—';
  const birth = new Date(ts * 1000);
  const now = new Date();
  const age = now.getFullYear() - birth.getFullYear();
  return String(age);
}

function BioCellItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.bioCell}>
      <Text style={styles.bioCellValue}>{value}</Text>
      <Text style={styles.bioCellLabel}>{label}</Text>
    </View>
  );
}

function MatchResultRow({
  match,
  playerId,
  onPress,
}: {
  match: any;
  playerId: string;
  onPress: () => void;
}) {
  const router = useRouter();
  const isHome = String(match.homeTeam?.id) === String(playerId);
  const opponent = isHome ? match.awayTeam : match.homeTeam;
  const playerScore = isHome ? match.homeScore : match.awayScore;
  const opponentScore = isHome ? match.awayScore : match.homeScore;

  const won =
    match.status?.type === 'finished' &&
    ((isHome &&
      (match.homeScore?.period1 ?? 0) +
        (match.homeScore?.period2 ?? 0) +
        (match.homeScore?.period3 ?? 0) >
        (match.awayScore?.period1 ?? 0) +
          (match.awayScore?.period2 ?? 0) +
          (match.awayScore?.period3 ?? 0)) ||
      (!isHome &&
        (match.awayScore?.period1 ?? 0) +
          (match.awayScore?.period2 ?? 0) +
          (match.awayScore?.period3 ?? 0) >
          (match.homeScore?.period1 ?? 0) +
            (match.homeScore?.period2 ?? 0) +
            (match.homeScore?.period3 ?? 0)));

  const isUpcoming = match.status?.type === 'notstarted';

  return (
    <TouchableOpacity style={styles.matchResultRow} onPress={onPress} activeOpacity={0.7}>
      {!isUpcoming && (
        <View style={[styles.wlBadge, won ? styles.wBadge : styles.lBadge]}>
          <Text style={styles.wlText}>{won ? 'W' : 'L'}</Text>
        </View>
      )}
      {isUpcoming && (
        <View style={[styles.wlBadge, styles.upcomingBadge]}>
          <Text style={[styles.wlText, { color: Colors.textSecondary }]}>VS</Text>
        </View>
      )}
      <TouchableOpacity onPress={() => router.push(`/player/${opponent?.id}`)}>
        <Avatar playerId={opponent?.id} name={opponent?.name} size={40} />
      </TouchableOpacity>
      <View style={styles.matchResultInfo}>
        <Text style={styles.matchResultOpponent} numberOfLines={1}>
          {opponent?.name ?? 'Unknown'}
        </Text>
        <Text style={styles.matchResultTournament} numberOfLines={1}>
          {match.tournament?.name ?? ''}
          {match.roundInfo?.name ? ` · ${match.roundInfo.name}` : ''}
          {isUpcoming && match.startTimestamp
            ? ` · ${new Date(match.startTimestamp * 1000).toLocaleDateString()}`
            : ''}
        </Text>
      </View>
      {!isUpcoming && playerScore && opponentScore && (
        <Text style={styles.matchResultScore}>
          {[1, 2, 3, 4, 5]
            .filter((n) => playerScore[`period${n}`] !== undefined)
            .map((n) => `${playerScore[`period${n}`]}-${opponentScore[`period${n}`]}`)
            .join(' ')}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const playerQuery = useQuery({
    queryKey: ['player', id],
    queryFn: () => api.getPlayer(id!),
  });

  const matchesQuery = useQuery({
    queryKey: ['player', id, 'matches'],
    queryFn: () => api.getPlayerMatches(id!, 0),
  });

  const player = playerQuery.data?.player ?? playerQuery.data;
  const previousMatches: any[] = matchesQuery.data?.previousEvents ?? matchesQuery.data?.events ?? [];
  const nextMatches: any[] = matchesQuery.data?.nextEvents ?? [];

  useEffect(() => {
    if (player?.name) {
      navigation.setOptions({ title: player.name });
    }
  }, [player, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([playerQuery.refetch(), matchesQuery.refetch()]);
    setRefreshing(false);
  };

  if (playerQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView>
          <SkeletonPlayerHero />
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBox key={i} height={64} style={{ margin: 8 }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (playerQuery.isError || !player) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ErrorState message="Couldn't load player" onRetry={() => playerQuery.refetch()} />
      </SafeAreaView>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'matches', label: 'Matches' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentBlue}
          />
        }
      >
        {/* Hero section */}
        <View style={styles.heroSection}>
          <Avatar playerId={player.id} name={player.name} size={96} />
          {player.country?.alpha2 && (
            <Text style={styles.countryFlag}>
              {getFlagEmoji(player.country.alpha2)}
            </Text>
          )}
          <Text style={styles.heroName}>{player.name}</Text>
          <Text style={styles.heroMeta}>
            {player.ranking ? `#${player.ranking} · ` : ''}
            {player.country?.name ?? player.country?.alpha2 ?? ''}
          </Text>
        </View>

        {/* Bio grid */}
        <View style={styles.bioGrid}>
          <BioCellItem value={calcAge(player.dateOfBirthTimestamp)} label="Age" />
          <BioCellItem
            value={player.height ? `${player.height}cm` : '—'}
            label="Height"
          />
          <BioCellItem value={player.plays ?? '—'} label="Plays" />
          <BioCellItem value={player.backhand ?? '—'} label="Backhand" />
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text
                style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <View>
            {/* Season stats */}
            {(player.winCount !== undefined || player.lossCount !== undefined) && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Season Record</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{player.winCount ?? '—'}</Text>
                    <Text style={styles.statLabel}>Wins</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{player.lossCount ?? '—'}</Text>
                    <Text style={styles.statLabel}>Losses</Text>
                  </View>
                  {player.titlesCount !== undefined && (
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{player.titlesCount}</Text>
                      <Text style={styles.statLabel}>Titles</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Recent results */}
            {previousMatches.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Recent Results</Text>
                {previousMatches.slice(0, 5).map((m: any) => (
                  <MatchResultRow
                    key={m.id}
                    match={m}
                    playerId={id!}
                    onPress={() => router.push(`/match/${m.id}`)}
                  />
                ))}
              </View>
            )}

            {/* Upcoming */}
            {nextMatches.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Upcoming</Text>
                {nextMatches.slice(0, 3).map((m: any) => (
                  <MatchResultRow
                    key={m.id}
                    match={m}
                    playerId={id!}
                    onPress={() => router.push(`/match/${m.id}`)}
                  />
                ))}
              </View>
            )}

            {previousMatches.length === 0 && nextMatches.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No recent matches</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'matches' && (
          <View>
            {matchesQuery.isLoading && (
              <View>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonBox key={i} height={64} style={{ margin: 8 }} />
                ))}
              </View>
            )}
            {matchesQuery.isError && (
              <ErrorState
                message="Couldn't load matches"
                onRetry={() => matchesQuery.refetch()}
              />
            )}
            {!matchesQuery.isLoading &&
              !matchesQuery.isError &&
              previousMatches.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No match history</Text>
                </View>
              )}
            {previousMatches.map((m: any) => (
              <MatchResultRow
                key={m.id}
                match={m}
                playerId={id!}
                onPress={() => router.push(`/match/${m.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getFlagEmoji(alpha2: string): string {
  if (!alpha2 || alpha2.length !== 2) return '';
  const base = 0x1f1e6;
  const offset = alpha2.toUpperCase().charCodeAt(0) - 65;
  const offset2 = alpha2.toUpperCase().charCodeAt(1) - 65;
  return String.fromCodePoint(base + offset) + String.fromCodePoint(base + offset2);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: Colors.bgSecondary,
    gap: 8,
  },
  countryFlag: {
    fontSize: 24,
  },
  heroName: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroMeta: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  bioGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.bgTertiary,
    marginBottom: 8,
  },
  bioCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: Colors.divider,
  },
  bioCellValue: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  bioCellLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tabItem: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.accentBlue,
  },
  tabLabel: {
    color: Colors.textTertiary,
    fontSize: 16,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: Colors.textPrimary,
  },
  statsSection: {
    padding: 16,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    padding: 12,
    flex: 1,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  matchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  wlBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wBadge: {
    backgroundColor: Colors.accentGreen,
  },
  lBadge: {
    backgroundColor: Colors.accentRed,
  },
  upcomingBadge: {
    backgroundColor: Colors.bgTertiary,
  },
  wlText: {
    color: Colors.bgPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  matchResultInfo: {
    flex: 1,
  },
  matchResultOpponent: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
  },
  matchResultTournament: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  matchResultScore: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
