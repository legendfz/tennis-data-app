import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, getTournamentImageUrl } from '../../src/api/client';
import { Avatar } from '../../src/components/Avatar';
import { ErrorState } from '../../src/components/ErrorState';
import { MatchCard } from '../../src/components/MatchCard';
import { SkeletonBox } from '../../src/components/SkeletonLoader';
import { SurfaceBadge } from '../../src/components/SurfaceBadge';
import { Colors } from '../../src/theme/colors';

type Tab = 'draw' | 'schedule' | 'results';

function formatDateRange(start?: number, end?: number): string {
  if (!start && !end) return '';
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const s = start ? new Date(start * 1000).toLocaleDateString(undefined, opts) : '';
  const e = end ? new Date(end * 1000).toLocaleDateString(undefined, opts) : '';
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

function BracketPlayer({
  player,
  score,
  isWinner,
  onPress,
}: {
  player?: { id: number; name: string };
  score?: string;
  isWinner?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.bracketPlayer} onPress={onPress} disabled={!onPress}>
      <Avatar playerId={player?.id} name={player?.name} size={40} />
      <Text
        style={[styles.bracketPlayerName, !isWinner && styles.bracketPlayerLoser]}
        numberOfLines={1}
      >
        {player?.name ?? 'TBD'}
      </Text>
      {score !== undefined && (
        <Text style={[styles.bracketScore, !isWinner && styles.bracketScoreLoser]}>
          {score}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function DrawTab({ tournamentId, seasonId }: { tournamentId: string; seasonId?: string }) {
  const router = useRouter();
  const drawQuery = useQuery({
    queryKey: ['tournament', tournamentId, 'draw', seasonId],
    queryFn: () => api.getTournamentDraw(tournamentId, seasonId ?? 'current'),
    enabled: !!seasonId,
  });

  if (!seasonId) {
    return (
      <View style={styles.emptyTab}>
        <Text style={styles.emptyTabText}>Draw not yet available</Text>
      </View>
    );
  }

  if (drawQuery.isLoading) {
    return (
      <View style={styles.emptyTab}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} height={80} style={{ margin: 8 }} />
        ))}
      </View>
    );
  }

  if (drawQuery.isError) {
    return (
      <ErrorState
        message="Draw not available"
        onRetry={() => drawQuery.refetch()}
      />
    );
  }

  const cups: any[] = drawQuery.data?.cups ?? drawQuery.data?.rounds ?? [];

  if (cups.length === 0) {
    return (
      <View style={styles.emptyTab}>
        <Text style={styles.emptyTabText}>Draw not yet available</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      <ScrollView>
        <View style={styles.bracketContainer}>
          {cups.map((round: any, roundIdx: number) => (
            <View key={roundIdx} style={styles.bracketRound}>
              <Text style={styles.bracketRoundTitle}>
                {round.description ?? round.name ?? `Round ${roundIdx + 1}`}
              </Text>

              {(round.blocks ?? round.matches ?? []).map((block: any, blockIdx: number) => {
                const match = block.events?.[0] ?? block.match ?? block;
                const home = match?.homeTeam ?? block.homeTeam;
                const away = match?.awayTeam ?? block.awayTeam;
                const homeScore = getDisplayScore(match?.homeScore);
                const awayScore = getDisplayScore(match?.awayScore);

                const isFinished = match?.status?.type === 'finished';
                const homeWins =
                  isFinished &&
                  (match?.homeScore?.period1 ?? 0) > (match?.awayScore?.period1 ?? 0);

                return (
                  <TouchableOpacity
                    key={blockIdx}
                    style={styles.bracketMatch}
                    onPress={() => match?.id && router.push(`/match/${match.id}`)}
                    disabled={!match?.id}
                  >
                    <BracketPlayer
                      player={home}
                      score={homeScore}
                      isWinner={homeWins}
                      onPress={() => home?.id && router.push(`/player/${home.id}`)}
                    />
                    <View style={styles.bracketDivider} />
                    <BracketPlayer
                      player={away}
                      score={awayScore}
                      isWinner={isFinished && !homeWins}
                      onPress={() => away?.id && router.push(`/player/${away.id}`)}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

function getDisplayScore(score?: any): string | undefined {
  if (!score) return undefined;
  const sets = [1, 2, 3, 4, 5]
    .filter((n) => score[`period${n}`] !== undefined)
    .map((n) => score[`period${n}`]);
  return sets.join('-') || undefined;
}

function ScheduleTab({ matches }: { matches: any[] }) {
  const router = useRouter();

  if (matches.length === 0) {
    return (
      <View style={styles.emptyTab}>
        <Text style={styles.emptyTabText}>No scheduled matches</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      {matches.map((m: any) => (
        <TouchableOpacity
          key={m.id}
          style={styles.scheduleItem}
          onPress={() => router.push(`/match/${m.id}`)}
        >
          <View style={styles.scheduleItemAvatars}>
            <Avatar playerId={m.homeTeam?.id} name={m.homeTeam?.name} size={40} />
            <Text style={styles.scheduleVs}>vs</Text>
            <Avatar playerId={m.awayTeam?.id} name={m.awayTeam?.name} size={40} />
          </View>
          <View style={styles.scheduleItemInfo}>
            <Text style={styles.scheduleItemPlayers} numberOfLines={1}>
              {m.homeTeam?.name} vs {m.awayTeam?.name}
            </Text>
            <Text style={styles.scheduleItemMeta}>
              {m.roundInfo?.name ?? ''}
              {m.startTimestamp
                ? ` · ${new Date(m.startTimestamp * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : ''}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export default function TournamentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<Tab>('draw');
  const [refreshing, setRefreshing] = useState(false);

  const tournamentQuery = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => api.getTournament(id!),
  });

  const tournament = tournamentQuery.data?.tournament ?? tournamentQuery.data;
  const season = tournamentQuery.data?.seasons?.[0] ?? tournamentQuery.data?.season;
  const seasonId = season?.id;

  // Extract upcoming and completed matches from the tournament data
  const allMatches: any[] = tournamentQuery.data?.events ?? [];
  const scheduleMatches = allMatches.filter(
    (m: any) => m.status?.type === 'notstarted'
  );
  const resultsMatches = allMatches.filter(
    (m: any) => m.status?.type === 'finished'
  );

  useEffect(() => {
    if (tournament?.name) {
      navigation.setOptions({ title: tournament.name });
    }
  }, [tournament, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await tournamentQuery.refetch();
    setRefreshing(false);
  };

  if (tournamentQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <SkeletonBox height={120} style={{ margin: 16 }} />
        <SkeletonBox height={44} />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBox key={i} height={80} style={{ margin: 8 }} />
        ))}
      </SafeAreaView>
    );
  }

  if (tournamentQuery.isError || !tournament) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ErrorState
          message="Couldn't load tournament"
          onRetry={() => tournamentQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'draw', label: 'Draw' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'results', label: 'Results' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accentBlue} />
        }
        stickyHeaderIndices={[1]}
      >
        {/* Tournament header */}
        <View style={styles.tournamentHeader}>
          <View style={styles.tournamentLogoRow}>
            <View style={styles.tournamentLogoContainer}>
              <Image
                source={{ uri: getTournamentImageUrl(id!) }}
                style={styles.tournamentLogo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.tournamentInfo}>
              <Text style={styles.tournamentName}>{tournament.name}</Text>
              <View style={styles.tournamentBadgeRow}>
                <SurfaceBadge surface={tournament.groundType} />
                {season && (
                  <Text style={styles.tournamentDates}>
                    {formatDateRange(season.startDateTimestamp ?? season.start, season.endDateTimestamp ?? season.end)}
                  </Text>
                )}
              </View>
              {tournament.category?.name && (
                <Text style={styles.tournamentCategory}>{tournament.category.name}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Tab bar (sticky) */}
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 'draw' && (
          <DrawTab tournamentId={id!} seasonId={String(seasonId ?? '')} />
        )}

        {activeTab === 'schedule' && <ScheduleTab matches={scheduleMatches} />}

        {activeTab === 'results' && (
          <View>
            {resultsMatches.length === 0 ? (
              <View style={styles.emptyTab}>
                <Text style={styles.emptyTabText}>No results yet</Text>
              </View>
            ) : (
              resultsMatches.map((m: any) => <MatchCard key={m.id} match={m} />)
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  tournamentHeader: {
    backgroundColor: Colors.bgSecondary,
    padding: 16,
  },
  tournamentLogoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tournamentLogoContainer: {
    width: 64,
    height: 64,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tournamentLogo: {
    width: 56,
    height: 56,
  },
  tournamentInfo: {
    flex: 1,
    gap: 6,
  },
  tournamentName: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  tournamentBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tournamentDates: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  tournamentCategory: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
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
    fontSize: 15,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: Colors.textPrimary,
  },

  // Bracket
  bracketContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  bracketRound: {
    width: 200,
    gap: 8,
  },
  bracketRoundTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginBottom: 4,
  },
  bracketMatch: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceCardBorder,
    overflow: 'hidden',
    marginBottom: 12,
  },
  bracketPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
  },
  bracketPlayerName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  bracketPlayerLoser: {
    color: Colors.textSecondary,
    opacity: 0.5,
  },
  bracketScore: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  bracketScoreLoser: {
    color: Colors.textSecondary,
    opacity: 0.5,
  },
  bracketDivider: {
    height: 1,
    backgroundColor: Colors.divider,
  },

  // Schedule
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  scheduleItemAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleVs: {
    color: Colors.textTertiary,
    fontSize: 11,
  },
  scheduleItemInfo: {
    flex: 1,
  },
  scheduleItemPlayers: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  scheduleItemMeta: {
    color: Colors.textSecondary,
    fontSize: 12,
  },

  emptyTab: {
    padding: 48,
    alignItems: 'center',
  },
  emptyTabText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
