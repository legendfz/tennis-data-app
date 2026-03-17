import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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
import { LiveDot } from '../../src/components/LiveDot';
import { SkeletonBox } from '../../src/components/SkeletonLoader';
import { SurfaceBadge } from '../../src/components/SurfaceBadge';
import { Colors } from '../../src/theme/colors';

type Tab = 'score' | 'stats' | 'h2h' | 'pbp';

function SetScoreGrid({
  homeScore,
  awayScore,
  isLive,
  isFinished,
}: {
  homeScore: any;
  awayScore: any;
  isLive: boolean;
  isFinished: boolean;
}) {
  const periods = ['period1', 'period2', 'period3', 'period4', 'period5'] as const;
  const sets = periods.filter(
    (p) => homeScore?.[p] !== undefined && awayScore?.[p] !== undefined
  );

  if (sets.length === 0) {
    return (
      <View style={styles.noScoreContainer}>
        <Text style={styles.noScoreText}>
          {isLive ? 'Match in progress' : 'Score not available'}
        </Text>
      </View>
    );
  }

  const homeWins = sets.filter((p) => (homeScore[p] ?? 0) > (awayScore[p] ?? 0)).length;
  const awayWins = sets.filter((p) => (awayScore[p] ?? 0) > (homeScore[p] ?? 0)).length;

  return (
    <View style={styles.scoreGrid}>
      {/* Header */}
      <View style={styles.scoreHeaderRow}>
        {sets.map((_, i) => (
          <Text key={i} style={styles.setLabel}>
            S{i + 1}
          </Text>
        ))}
        {isLive && <Text style={styles.setLabel}>Game</Text>}
      </View>

      {/* Home row */}
      <View style={styles.scoreRow}>
        {sets.map((p, i) => (
          <Text
            key={i}
            style={[
              styles.scoreValue,
              isFinished &&
                homeScore[p] < awayScore[p] &&
                styles.scoreLoser,
            ]}
          >
            {homeScore[p]}
          </Text>
        ))}
        {isLive && (
          <Text style={[styles.scoreValue, styles.scoreLiveValue]}>
            {homeScore?.current ?? 0}
          </Text>
        )}
      </View>

      {/* Away row */}
      <View style={styles.scoreRow}>
        {sets.map((p, i) => (
          <Text
            key={i}
            style={[
              styles.scoreValue,
              isFinished &&
                awayScore[p] < homeScore[p] &&
                styles.scoreLoser,
            ]}
          >
            {awayScore[p]}
          </Text>
        ))}
        {isLive && (
          <Text style={[styles.scoreValue, styles.scoreLiveValue]}>
            {awayScore?.current ?? 0}
          </Text>
        )}
      </View>
    </View>
  );
}

function StatBar({ label, home, away }: { label: string; home: number | string; away: number | string }) {
  const h = parseFloat(String(home)) || 0;
  const a = parseFloat(String(away)) || 0;
  const total = h + a || 1;
  const homeWidth = (h / total) * 100;
  const awayWidth = (a / total) * 100;

  return (
    <View style={styles.statRow}>
      <Text style={styles.statValue}>{home}</Text>
      <View style={styles.statBarContainer}>
        <View style={[styles.statBarHome, { width: `${homeWidth}%` as any }]} />
        <Text style={styles.statLabel}>{label}</Text>
        <View style={[styles.statBarAway, { width: `${awayWidth}%` as any }]} />
      </View>
      <Text style={[styles.statValue, { textAlign: 'right' }]}>{away}</Text>
    </View>
  );
}

function StatsTab({ matchId }: { matchId: string }) {
  const query = useQuery({
    queryKey: ['match', matchId, 'stats'],
    queryFn: () => api.getMatchStatistics(matchId),
  });

  if (query.isLoading) {
    return (
      <View style={styles.tabContent}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBox key={i} height={40} style={{ margin: 8 }} />
        ))}
      </View>
    );
  }

  if (query.isError) {
    return <ErrorState message="Stats not available" onRetry={() => query.refetch()} />;
  }

  const groups: any[] = query.data ?? [];
  const allStats: any[] = groups.flatMap((g: any) => g.groups ?? g.statisticsItems ?? []);

  if (allStats.length === 0) {
    return (
      <View style={styles.emptyTab}>
        <Text style={styles.emptyTabText}>Statistics not available for this match</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent}>
      {allStats.map((stat: any, i: number) => (
        <StatBar
          key={i}
          label={stat.name ?? stat.key ?? `Stat ${i + 1}`}
          home={stat.home ?? stat.homeValue ?? 0}
          away={stat.away ?? stat.awayValue ?? 0}
        />
      ))}
    </ScrollView>
  );
}

function H2HTab({ matchId, homeId, awayId }: { matchId: string; homeId: number; awayId: number }) {
  const router = useRouter();
  const query = useQuery({
    queryKey: ['match', matchId, 'h2h'],
    queryFn: () => api.getMatchH2H(matchId),
  });

  if (query.isLoading) {
    return (
      <View style={styles.tabContent}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} height={60} style={{ margin: 8 }} />
        ))}
      </View>
    );
  }

  if (query.isError) {
    return <ErrorState message="H2H not available" onRetry={() => query.refetch()} />;
  }

  const h2h = query.data;
  const teamDuel = h2h?.teamDuel;
  const previousMatches: any[] = h2h?.previousEventIds
    ? []
    : h2h?.previousMatches ?? h2h?.events ?? [];

  return (
    <ScrollView style={styles.tabContent}>
      {teamDuel && (
        <View style={styles.h2hSummary}>
          <Text style={styles.h2hRecord}>
            {teamDuel.homeWins ?? 0} — {teamDuel.awayWins ?? 0}
          </Text>
          <Text style={styles.h2hLabel}>Head to Head</Text>
        </View>
      )}

      {previousMatches.length > 0 && (
        <>
          <Text style={styles.h2hSectionTitle}>Previous Meetings</Text>
          {previousMatches.slice(0, 10).map((m: any) => (
            <TouchableOpacity
              key={m.id}
              style={styles.h2hMatch}
              onPress={() => router.push(`/match/${m.id}`)}
            >
              <View style={styles.h2hMatchHeader}>
                <Text style={styles.h2hTournament}>{m.tournament?.name ?? ''}</Text>
                <Text style={styles.h2hDate}>
                  {m.startTimestamp
                    ? new Date(m.startTimestamp * 1000).toLocaleDateString()
                    : ''}
                </Text>
              </View>
              <Text style={styles.h2hScore}>
                {m.homeTeam?.name}: {m.homeScore?.display ?? '?'} — {m.awayTeam?.name}:{' '}
                {m.awayScore?.display ?? '?'}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {previousMatches.length === 0 && !teamDuel && (
        <View style={styles.emptyTab}>
          <Text style={styles.emptyTabText}>No H2H data available</Text>
        </View>
      )}
    </ScrollView>
  );
}

function PointByPointTab({ matchId }: { matchId: string }) {
  const [expandedSet, setExpandedSet] = useState<number | null>(null);
  const query = useQuery({
    queryKey: ['match', matchId, 'pbp'],
    queryFn: () => api.getMatchPointByPoint(matchId),
  });

  if (query.isLoading) {
    return (
      <View style={styles.tabContent}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBox key={i} height={48} style={{ margin: 8, borderRadius: 8 }} />
        ))}
      </View>
    );
  }

  if (query.isError) {
    return <ErrorState message="Point-by-point not available" onRetry={() => query.refetch()} />;
  }

  const sets: any[] = query.data?.sets ?? query.data?.pointByPoint ?? [];

  if (sets.length === 0) {
    return (
      <View style={styles.emptyTab}>
        <Text style={styles.emptyTabText}>Point-by-point not available for this match</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.tabContent}>
      {sets.map((set: any, setIdx: number) => (
        <View key={setIdx}>
          <TouchableOpacity
            style={styles.pbpSetHeader}
            onPress={() => setExpandedSet(expandedSet === setIdx ? null : setIdx)}
          >
            <Text style={styles.pbpSetTitle}>Set {setIdx + 1}</Text>
            <Text style={styles.pbpExpandIcon}>{expandedSet === setIdx ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {expandedSet === setIdx && (
            <View style={styles.pbpContent}>
              {(set.games ?? set.pointGroups ?? []).map((game: any, gameIdx: number) => (
                <View key={gameIdx} style={styles.pbpGame}>
                  <Text style={styles.pbpGameTitle}>Game {gameIdx + 1}</Text>
                  {(game.points ?? []).map((point: any, ptIdx: number) => (
                    <View key={ptIdx} style={styles.pbpPoint}>
                      <Text style={styles.pbpPointScore}>
                        {point.homeScore ?? ''} - {point.awayScore ?? ''}
                      </Text>
                      <Text style={styles.pbpPointType}>
                        {point.type ?? point.description ?? ''}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<Tab>('score');

  const matchQuery = useQuery({
    queryKey: ['match', id],
    queryFn: () => api.getMatch(id!),
    refetchInterval: (q) => {
      const isLive = q.state.data?.event?.status?.type === 'inprogress';
      return isLive ? 15_000 : false;
    },
  });

  const match = matchQuery.data?.event ?? matchQuery.data;

  useEffect(() => {
    if (match?.tournament?.name) {
      navigation.setOptions({
        title: `${match.tournament.name}${match.roundInfo?.name ? ` · ${match.roundInfo.name}` : ''}`,
      });
    }
  }, [match, navigation]);

  if (matchQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.headerSkeleton}>
          <SkeletonBox width={96} height={96} borderRadius={48} />
          <SkeletonBox width={80} height={80} borderRadius={40} />
        </View>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} height={40} style={{ margin: 8 }} />
        ))}
      </SafeAreaView>
    );
  }

  if (matchQuery.isError || !match) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ErrorState
          message="Couldn't load match"
          onRetry={() => matchQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  const isLive = match.status?.type === 'inprogress';
  const isFinished = match.status?.type === 'finished';

  const TABS: { key: Tab; label: string }[] = [
    { key: 'score', label: 'Score' },
    { key: 'stats', label: 'Stats' },
    { key: 'h2h', label: 'H2H' },
    { key: 'pbp', label: 'Point-by-Pt' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView stickyHeaderIndices={[1]}>
        {/* Match header */}
        <View style={styles.matchHeader}>
          {/* Surface + court */}
          <View style={styles.surfaceRow}>
            <SurfaceBadge surface={match.groundType ?? match.tournament?.groundType} />
            {match.venue?.city && (
              <Text style={styles.courtText}>{match.venue.city}</Text>
            )}
          </View>

          {/* Players */}
          <View style={styles.playersRow}>
            <TouchableOpacity
              style={styles.playerCol}
              onPress={() => router.push(`/player/${match.homeTeam.id}`)}
            >
              <Avatar playerId={match.homeTeam.id} name={match.homeTeam.name} size={80} />
              <Text style={styles.playerName} numberOfLines={2}>
                {match.homeTeam.name}
              </Text>
              {match.homeTeam.ranking && (
                <Text style={styles.playerRanking}>#{match.homeTeam.ranking}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.vsContainer}>
              {isLive && <LiveDot />}
              {isFinished && <Text style={styles.finalBadge}>FINAL</Text>}
              {!isLive && !isFinished && <Text style={styles.vsText}>VS</Text>}
            </View>

            <TouchableOpacity
              style={[styles.playerCol, styles.playerColRight]}
              onPress={() => router.push(`/player/${match.awayTeam.id}`)}
            >
              <Avatar playerId={match.awayTeam.id} name={match.awayTeam.name} size={80} />
              <Text style={[styles.playerName, { textAlign: 'right' }]} numberOfLines={2}>
                {match.awayTeam.name}
              </Text>
              {match.awayTeam.ranking && (
                <Text style={[styles.playerRanking, { textAlign: 'right' }]}>
                  #{match.awayTeam.ranking}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Score grid */}
          <SetScoreGrid
            homeScore={match.homeScore}
            awayScore={match.awayScore}
            isLive={isLive}
            isFinished={isFinished}
          />

          {isLive && match.status?.description && (
            <Text style={styles.statusDesc}>{match.status.description}</Text>
          )}
        </View>

        {/* Tab bar (sticky) */}
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
        {activeTab === 'score' && (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>Match Score</Text>
            <SetScoreGrid
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              isLive={isLive}
              isFinished={isFinished}
            />
            <View style={styles.scoreDetailRow}>
              <Text style={styles.scoreDetailPlayer}>{match.homeTeam.name}</Text>
              <Text style={styles.scoreDetailVs}>vs</Text>
              <Text style={styles.scoreDetailPlayer}>{match.awayTeam.name}</Text>
            </View>
          </View>
        )}

        {activeTab === 'stats' && <StatsTab matchId={id!} />}

        {activeTab === 'h2h' && (
          <H2HTab
            matchId={id!}
            homeId={match.homeTeam.id}
            awayId={match.awayTeam.id}
          />
        )}

        {activeTab === 'pbp' && <PointByPointTab matchId={id!} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 24,
  },
  matchHeader: {
    backgroundColor: Colors.bgSecondary,
    padding: 16,
    paddingBottom: 20,
  },
  surfaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  courtText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  playerCol: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 8,
  },
  playerColRight: {
    alignItems: 'flex-end',
  },
  playerName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  playerRanking: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  vsContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 28,
  },
  vsText: {
    color: Colors.textTertiary,
    fontSize: 14,
    fontWeight: '600',
  },
  finalBadge: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scoreGrid: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginBottom: 4,
  },
  setLabel: {
    color: Colors.textTertiary,
    fontSize: 12,
    width: 20,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginVertical: 4,
  },
  scoreValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  scoreLoser: {
    color: Colors.textSecondary,
    opacity: 0.6,
  },
  scoreLiveValue: {
    color: Colors.scoreLive,
  },
  noScoreContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noScoreText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  statusDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
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
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: Colors.textPrimary,
  },
  tabContent: {
    flex: 1,
    padding: 8,
  },
  tabContentTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    padding: 8,
    marginBottom: 8,
  },
  scoreDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  scoreDetailPlayer: {
    color: Colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  scoreDetailVs: {
    color: Colors.textTertiary,
    fontSize: 12,
    paddingHorizontal: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 8,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    width: 50,
  },
  statBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 6,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarHome: {
    height: '100%',
    backgroundColor: Colors.accentBlue,
    position: 'absolute',
    left: 0,
  },
  statBarAway: {
    height: '100%',
    backgroundColor: Colors.accentGreen,
    position: 'absolute',
    right: 0,
  },
  statLabel: {
    color: Colors.textTertiary,
    fontSize: 10,
    textAlign: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  h2hSummary: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.bgSecondary,
    margin: 8,
    borderRadius: 12,
  },
  h2hRecord: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  h2hLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  h2hSectionTitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  h2hMatch: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    marginHorizontal: 8,
  },
  h2hMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  h2hTournament: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  h2hDate: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  h2hScore: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  pbpSetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.bgSecondary,
    marginBottom: 1,
  },
  pbpSetTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  pbpExpandIcon: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  pbpContent: {
    backgroundColor: Colors.bgTertiary,
    marginBottom: 4,
  },
  pbpGame: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  pbpGameTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  pbpPoint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  pbpPointScore: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  pbpPointType: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  emptyTab: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTabText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
