import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import { SkeletonBlock } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import type { MatchWithPlayers, ProbabilitySnapshot } from '../../../shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AVATAR_SIZE = Math.round(SCREEN_WIDTH * 0.22);

const SURFACE_ICONS: Record<string, string> = {
  Hard: '🔵',
  Clay: '🟠',
  Grass: '🟢',
  'Hard (Indoor)': '🏟️',
};

function getSurfaceIcon(surface: string): string {
  if (surface.toLowerCase().includes('clay')) return SURFACE_ICONS.Clay;
  if (surface.toLowerCase().includes('grass')) return SURFACE_ICONS.Grass;
  if (surface.toLowerCase().includes('hard') && surface.toLowerCase().includes('indoor'))
    return SURFACE_ICONS['Hard (Indoor)'];
  if (surface.toLowerCase().includes('hard')) return SURFACE_ICONS.Hard;
  return '🎾';
}

function parseScore(score: string): string[] {
  return score.split(',').map((s) => s.trim());
}

function StatBar({
  label,
  value1,
  value2,
}: {
  label: string;
  value1: string | number;
  value2: string | number;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statValue}>{value1}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value2}</Text>
    </View>
  );
}

function WinProbabilityBar({
  p1Name,
  p2Name,
  p1Prob,
  p2Prob,
}: {
  p1Name: string;
  p2Name: string;
  p1Prob: number;
  p2Prob: number;
}) {
  return (
    <View style={probStyles.barSection}>
      <View style={probStyles.barLabels}>
        <Text style={[probStyles.barLabel, p1Prob > p2Prob && probStyles.barLabelWin]}>
          {p1Name}
        </Text>
        <Text style={[probStyles.barLabel, p2Prob > p1Prob && probStyles.barLabelWin]}>
          {p2Name}
        </Text>
      </View>
      <View style={probStyles.barContainer}>
        <View
          style={[
            probStyles.barFillLeft,
            {
              width: `${p1Prob}%`,
              backgroundColor: p1Prob >= p2Prob ? '#16a34a' : '#3b82f6',
            },
          ]}
        />
      </View>
      <View style={probStyles.barLabels}>
        <Text style={[probStyles.barPct, p1Prob > p2Prob && probStyles.barPctWin]}>
          {p1Prob.toFixed(1)}%
        </Text>
        <Text style={[probStyles.barPct, p2Prob > p1Prob && probStyles.barPctWin]}>
          {p2Prob.toFixed(1)}%
        </Text>
      </View>
    </View>
  );
}

function ProbabilityCurve({ snapshots, p1Name, p2Name }: {
  snapshots: ProbabilitySnapshot[];
  p1Name: string;
  p2Name: string;
}) {
  if (!snapshots || snapshots.length < 2) return null;
  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = 120;
  const stepWidth = chartWidth / (snapshots.length - 1);

  return (
    <View style={probStyles.curveContainer}>
      <Text style={probStyles.curveLegend}>
        <Text style={{ color: '#16a34a' }}>■</Text> {p1Name}{'  '}
        <Text style={{ color: '#3b82f6' }}>■</Text> {p2Name}
      </Text>
      <View style={[probStyles.curveChart, { width: chartWidth, height: chartHeight }]}>
        {/* 50% line */}
        <View style={[probStyles.halfLine, { top: chartHeight / 2 }]} />
        {/* Bars for each snapshot */}
        {snapshots.map((snap, i) => {
          const barHeight = (snap.p1 / 100) * chartHeight;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: i * stepWidth,
                bottom: 0,
                width: Math.max(stepWidth - 2, 4),
                height: barHeight,
                backgroundColor: snap.p1 >= 50 ? '#16a34a' : '#3b82f6',
                borderRadius: 2,
                opacity: 0.7,
              }}
            />
          );
        })}
      </View>
      {/* X-axis labels */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', width: chartWidth }}>
          {snapshots.map((snap, i) => (
            <Text
              key={i}
              style={[
                probStyles.curveLabel,
                {
                  width: stepWidth,
                  textAlign: 'center',
                },
              ]}
            >
              {snap.label}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const probStyles = StyleSheet.create({
  section: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a0a0b0',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  barSection: { marginBottom: 8 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: 13, color: '#a0a0b0' },
  barLabelWin: { color: '#16a34a', fontWeight: 'bold' },
  barContainer: {
    height: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFillLeft: { height: '100%', borderRadius: 6 },
  barPct: { fontSize: 15, fontWeight: 'bold', color: '#a0a0b0' },
  barPctWin: { color: '#16a34a' },
  curveContainer: { marginTop: 16 },
  curveLegend: { fontSize: 11, color: '#a0a0b0', marginBottom: 8, textAlign: 'center' },
  curveChart: { backgroundColor: '#0f0f23', borderRadius: 8, overflow: 'hidden' },
  halfLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#2a2a4e',
  },
  curveLabel: { fontSize: 8, color: '#6b7280', marginTop: 4 },
});

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: match,
    isLoading,
    error,
  } = useQuery<MatchWithPlayers>({
    queryKey: ['match', id],
    queryFn: async () => {
      const res = await api.get(`/api/matches/${id}`);
      return res.data;
    },
  });

  const { data: probData } = useQuery<{ snapshots: ProbabilitySnapshot[] }>({
    queryKey: ['match-prob-history', id],
    queryFn: async () => {
      const res = await api.get(`/api/matches/${id}/probability-history`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Match' }} />
        <View style={styles.skeletonWrap}>
          <SkeletonBlock width={SCREEN_WIDTH - 32} height={200} />
          <SkeletonBlock width={SCREEN_WIDTH - 32} height={80} />
          <SkeletonBlock width={SCREEN_WIDTH - 32} height={160} />
        </View>
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Match' }} />
        <EmptyState message="Match not found" icon="🎾" />
      </View>
    );
  }

  const sets = parseScore(match.score);
  const p1Won = match.winnerId === match.player1Id;
  const p2Won = match.winnerId === match.player2Id;
  const surfaceIcon = match.tournament ? getSurfaceIcon(match.tournament.surface) : '🎾';

  return (
    <>
      <Stack.Screen
        options={{
          title: match.tournament?.name || 'Match',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Tournament Info Bar */}
        <View style={styles.tournamentBar}>
          <Text style={styles.tournamentName}>
            {surfaceIcon} {match.tournament?.name || 'Tournament'}
          </Text>
          <Text style={styles.roundText}>{match.round}</Text>
          <Text style={styles.dateText}>{match.date}</Text>
          {match.court && <Text style={styles.courtText}>{match.court}</Text>}
        </View>

        {/* Player Head-to-Head */}
        <View style={styles.h2hSection}>
          {/* Player 1 */}
          <View style={styles.playerSide}>
            <Image
              source={{
                uri:
                  match.player1?.photoUrl ||
                  getAvatarUrl(match.player1?.name || 'P1', AVATAR_SIZE * 2),
              }}
              style={[
                styles.h2hAvatar,
                p1Won && styles.winnerAvatar,
              ]}
            />
            <Text style={styles.playerFlag}>
              {match.player1?.countryFlag || '🏳️'}
            </Text>
            <Text
              style={[styles.h2hName, p1Won && styles.winnerText]}
              numberOfLines={2}
            >
              {match.player1?.name || `Player ${match.player1Id}`}
            </Text>
            <Text style={styles.h2hRank}>
              #{match.player1?.ranking || '?'}
            </Text>
            {p1Won && <Text style={styles.winBadge}>WINNER</Text>}
          </View>

          <View style={styles.vsContainer}>
            <Text style={styles.vsBig}>VS</Text>
          </View>

          {/* Player 2 */}
          <View style={styles.playerSide}>
            <Image
              source={{
                uri:
                  match.player2?.photoUrl ||
                  getAvatarUrl(match.player2?.name || 'P2', AVATAR_SIZE * 2),
              }}
              style={[
                styles.h2hAvatar,
                p2Won && styles.winnerAvatar,
              ]}
            />
            <Text style={styles.playerFlag}>
              {match.player2?.countryFlag || '🏳️'}
            </Text>
            <Text
              style={[styles.h2hName, p2Won && styles.winnerText]}
              numberOfLines={2}
            >
              {match.player2?.name || `Player ${match.player2Id}`}
            </Text>
            <Text style={styles.h2hRank}>
              #{match.player2?.ranking || '?'}
            </Text>
            {p2Won && <Text style={styles.winBadge}>WINNER</Text>}
          </View>
        </View>

        {/* Score Display */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreSectionTitle}>SCORE</Text>
          <View style={styles.setsRow}>
            {sets.map((set, idx) => (
              <View key={idx} style={styles.setBox}>
                <Text style={styles.setLabel}>Set {idx + 1}</Text>
                <Text style={styles.setScore}>{set}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.fullScore}>{match.score}</Text>
        </View>

        {/* Match Stats */}
        {match.statsJson && (
          <View style={styles.statsSection}>
            <Text style={styles.statsSectionTitle}>MATCH STATISTICS</Text>
            {match.statsJson.player1?.aces !== undefined && (
              <StatBar
                label="Aces"
                value1={match.statsJson.player1.aces}
                value2={match.statsJson.player2.aces}
              />
            )}
            {match.statsJson.player1?.doubleFaults !== undefined && (
              <StatBar
                label="Double Faults"
                value1={match.statsJson.player1.doubleFaults}
                value2={match.statsJson.player2.doubleFaults}
              />
            )}
            {match.statsJson.player1?.firstServePercent !== undefined && (
              <StatBar
                label="1st Serve %"
                value1={`${match.statsJson.player1.firstServePercent}%`}
                value2={`${match.statsJson.player2.firstServePercent}%`}
              />
            )}
            {match.statsJson.player1?.breakPointsConverted !== undefined && (
              <StatBar
                label="Break Points"
                value1={match.statsJson.player1.breakPointsConverted}
                value2={match.statsJson.player2.breakPointsConverted}
              />
            )}
          </View>
        )}

        {/* Win Probability Section */}
        <View style={probStyles.section}>
          <Text style={probStyles.title}>WIN PROBABILITY</Text>
          <WinProbabilityBar
            p1Name={match.player1?.name?.split(' ').pop() || 'P1'}
            p2Name={match.player2?.name?.split(' ').pop() || 'P2'}
            p1Prob={p1Won ? 100 : 0}
            p2Prob={p2Won ? 100 : 0}
          />
          {probData?.snapshots && probData.snapshots.length > 0 && (
            <ProbabilityCurve
              snapshots={probData.snapshots}
              p1Name={match.player1?.name?.split(' ').pop() || 'P1'}
              p2Name={match.player2?.name?.split(' ').pop() || 'P2'}
            />
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  content: {
    paddingBottom: 40,
  },
  skeletonWrap: {
    padding: 16,
    gap: 16,
  },
  tournamentBar: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  roundText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#a0a0b0',
  },
  courtText: {
    fontSize: 12,
    color: '#a0a0b0',
    marginTop: 2,
  },
  h2hSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  playerSide: {
    flex: 1,
    alignItems: 'center',
  },
  h2hAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: '#2a2a4e',
    marginBottom: 8,
  },
  winnerAvatar: {
    borderColor: '#16a34a',
  },
  playerFlag: {
    fontSize: 24,
    marginBottom: 4,
  },
  h2hName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 2,
  },
  winnerText: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  h2hRank: {
    fontSize: 13,
    color: '#a0a0b0',
    fontWeight: '600',
  },
  winBadge: {
    marginTop: 6,
    backgroundColor: '#16a34a',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  vsContainer: {
    paddingHorizontal: 8,
  },
  vsBig: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#a0a0b0',
  },
  scoreSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
  },
  scoreSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a0a0b0',
    letterSpacing: 1,
    marginBottom: 12,
  },
  setsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  setBox: {
    backgroundColor: '#0f0f23',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 60,
  },
  setLabel: {
    fontSize: 10,
    color: '#a0a0b0',
    marginBottom: 4,
  },
  setScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  fullScore: {
    fontSize: 14,
    color: '#a0a0b0',
  },
  statsSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  statsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a0a0b0',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  statLabel: {
    fontSize: 13,
    color: '#a0a0b0',
    textAlign: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    width: 80,
    textAlign: 'center',
  },
});
