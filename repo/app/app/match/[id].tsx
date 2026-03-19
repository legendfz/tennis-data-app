import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import { useLanguage } from '../../lib/i18n';
import { SkeletonBlock } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import type { MatchWithPlayers, ProbabilitySnapshot } from '../../../shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AVATAR_SIZE = 56;

type TabKey = 'overview' | 'stats' | 'probability';

function parseScore(score: string): string[] {
  return score.split(',').map((s) => s.trim());
}

function getSurfaceLabel(surface: string): string {
  const lower = surface.toLowerCase();
  if (lower.includes('clay')) return 'Clay';
  if (lower.includes('grass')) return 'Grass';
  if (lower.includes('hard') && lower.includes('indoor')) return 'Hard (Indoor)';
  if (lower.includes('hard')) return 'Hard';
  return surface;
}

function getSurfaceColor(surface: string): string {
  const lower = surface.toLowerCase();
  if (lower.includes('clay')) return '#f97316';
  if (lower.includes('grass')) return '#22c55e';
  if (lower.includes('hard')) return '#3b82f6';
  return '#6b7280';
}

// ─── Stat Bar ────────────────────────────────────────────────────────
function StatBarComparison({ label, value1, value2 }: { label: string; value1: string | number; value2: string | number }) {
  const animWidth = useRef(new Animated.Value(0)).current;
  const v1 = typeof value1 === 'string' ? parseFloat(value1) : value1;
  const v2 = typeof value2 === 'string' ? parseFloat(value2) : value2;
  const total = v1 + v2;
  const p1Pct = total > 0 ? (v1 / total) * 100 : 50;

  useEffect(() => {
    Animated.timing(animWidth, { toValue: p1Pct, duration: 800, useNativeDriver: false }).start();
  }, [p1Pct]);

  const p1Better = v1 > v2;
  const p2Better = v2 > v1;

  return (
    <View style={styles.statRow}>
      <Text style={[styles.statVal, p1Better && styles.statValWin]}>{value1}</Text>
      <View style={styles.statMiddle}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.statTrack}>
          <Animated.View
            style={[
              styles.statFill,
              {
                width: animWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                backgroundColor: p1Better ? '#16a34a' : '#3b82f6',
              },
            ]}
          />
        </View>
      </View>
      <Text style={[styles.statVal, p2Better && styles.statValWin]}>{value2}</Text>
    </View>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────
function OverviewTab({ match }: { match: MatchWithPlayers }) {
  const sets = parseScore(match.score);
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Score</Text>
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
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Details</Text>
        <InfoRow label="Date" value={match.date} />
        <InfoRow label="Round" value={match.round} />
        {match.court && <InfoRow label="Court" value={match.court} />}
        {match.tournament && (
          <>
            <InfoRow label="Surface" value={getSurfaceLabel(match.tournament.surface)} />
            <InfoRow label="Location" value={match.tournament.location || ''} />
          </>
        )}
      </View>
    </>
  );
}

// ─── Stats Tab ───────────────────────────────────────────────────────
function StatsTabContent({ match }: { match: MatchWithPlayers }) {
  if (!match.statsJson) return <EmptyState message="No statistics available" />;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Match Statistics</Text>
      {match.statsJson.player1?.aces !== undefined && (
        <StatBarComparison label="Aces" value1={match.statsJson.player1.aces} value2={match.statsJson.player2.aces} />
      )}
      {match.statsJson.player1?.doubleFaults !== undefined && (
        <StatBarComparison label="Double Faults" value1={match.statsJson.player1.doubleFaults} value2={match.statsJson.player2.doubleFaults} />
      )}
      {match.statsJson.player1?.firstServePercent !== undefined && (
        <StatBarComparison label="1st Serve %" value1={`${match.statsJson.player1.firstServePercent}%`} value2={`${match.statsJson.player2.firstServePercent}%`} />
      )}
      {match.statsJson.player1?.breakPointsConverted !== undefined && (
        <StatBarComparison label="Break Points" value1={match.statsJson.player1.breakPointsConverted} value2={match.statsJson.player2.breakPointsConverted} />
      )}
    </View>
  );
}

// ─── Probability Tab ─────────────────────────────────────────────────
interface ProbFactor {
  surface: { p1: number; p2: number };
  weather: { p1: number; p2: number };
  form: { p1: number; p2: number };
  h2h: { p1: number; p2: number };
  fatigue: { p1: number; p2: number };
}

function FactorChips({ factors, player }: { factors: ProbFactor; player: 'p1' | 'p2' }) {
  const chips: { label: string; value: number }[] = [];
  const labels: Record<string, string> = { surface: 'Surface', weather: 'Weather', form: 'Form', h2h: 'H2H', fatigue: 'Fatigue' };
  for (const [key, val] of Object.entries(factors)) {
    const v = (val as any)[player] as number;
    if (v !== 0) chips.push({ label: labels[key] || key, value: v });
  }
  if (chips.length === 0) return null;
  return (
    <View style={styles.chipRow}>
      {chips.map((c, i) => (
        <View key={i} style={[styles.chip, c.value > 0 ? styles.chipPos : styles.chipNeg]}>
          <Text style={[styles.chipText, c.value > 0 ? styles.chipTextPos : styles.chipTextNeg]}>
            {c.label} {c.value > 0 ? '+' : ''}{c.value}%
          </Text>
        </View>
      ))}
    </View>
  );
}

function AnimatedProbBar({ targetWidth, color }: { targetWidth: number; color: string }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, { toValue: targetWidth, duration: 1000, useNativeDriver: false }).start();
  }, [targetWidth]);
  return (
    <Animated.View
      style={{
        height: '100%',
        borderRadius: 4,
        backgroundColor: color,
        width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
      }}
    />
  );
}

function ProbabilityTab({ match, p1Prob, p2Prob, factors, snapshots, p1Name, p2Name }: {
  match: MatchWithPlayers;
  p1Prob: number;
  p2Prob: number;
  factors?: ProbFactor;
  snapshots?: ProbabilitySnapshot[];
  p1Name: string;
  p2Name: string;
}) {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Win Probability</Text>
        <View style={styles.probLabels}>
          <Text style={[styles.probName, p1Prob > p2Prob && styles.probNameWin]}>{p1Name}</Text>
          <Text style={[styles.probName, p2Prob > p1Prob && styles.probNameWin]}>{p2Name}</Text>
        </View>
        <View style={styles.probBar}>
          <AnimatedProbBar targetWidth={p1Prob} color={p1Prob >= p2Prob ? '#16a34a' : '#3b82f6'} />
        </View>
        <View style={styles.probLabels}>
          <Text style={[styles.probPct, p1Prob > p2Prob && styles.probPctWin]}>{p1Prob.toFixed(1)}%</Text>
          <Text style={[styles.probPct, p2Prob > p1Prob && styles.probPctWin]}>{p2Prob.toFixed(1)}%</Text>
        </View>
        {factors && (
          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <FactorChips factors={factors} player="p1" />
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <FactorChips factors={factors} player="p2" />
            </View>
          </View>
        )}
      </View>

      {snapshots && snapshots.length >= 2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Probability Curve</Text>
          <Text style={styles.curveLegend}>
            <Text style={{ color: '#16a34a' }}>■</Text> {p1Name}{'  '}
            <Text style={{ color: '#3b82f6' }}>■</Text> {p2Name}
          </Text>
          <View style={[styles.curveChart, { width: SCREEN_WIDTH - 64, height: 120 }]}>
            <View style={[styles.halfLine, { top: 60 }]} />
            {snapshots.map((snap, i) => {
              const stepWidth = (SCREEN_WIDTH - 64) / (snapshots.length - 1);
              const barHeight = (snap.p1 / 100) * 120;
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
        </View>
      )}
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Main ────────────────────────────────────────────────────────────
export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlayerName } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const { data: match, isLoading, error } = useQuery<MatchWithPlayers>({
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
        <View style={{ padding: 16, gap: 16 }}>
          <SkeletonBlock width={SCREEN_WIDTH - 32} height={160} borderRadius={10} />
          <SkeletonBlock width={SCREEN_WIDTH - 32} height={80} borderRadius={10} />
        </View>
      </View>
    );
  }

  if (error || !match) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Match' }} />
        <EmptyState message="Match not found" />
      </View>
    );
  }

  const p1Won = match.winnerId === match.player1Id;
  const p2Won = match.winnerId === match.player2Id;
  const p1Name = match.player1 ? getPlayerName(match.player1) : `Player ${match.player1Id}`;
  const p2Name = match.player2 ? getPlayerName(match.player2) : `Player ${match.player2Id}`;
  const p1Short = p1Name.split(/[\s·]+/).pop() || 'P1';
  const p2Short = p2Name.split(/[\s·]+/).pop() || 'P2';

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'stats', label: 'Stats' },
    { key: 'probability', label: 'Probability' },
  ];

  return (
    <>
      <Stack.Screen options={{ title: match.tournament?.name || 'Match' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Match Header */}
        <View style={styles.matchHeader}>
          <View style={styles.tournamentInfo}>
            {match.tournament && (
              <View style={styles.tournamentRow}>
                <View style={[styles.surfaceDot, { backgroundColor: getSurfaceColor(match.tournament.surface) }]} />
                <Text style={styles.tournamentName}>{match.tournament.name}</Text>
              </View>
            )}
            <Text style={styles.roundDate}>{match.round} · {match.date}</Text>
          </View>

          <View style={styles.h2hRow}>
            <View style={styles.playerSide}>
              <Image
                source={{ uri: match.player1?.photoUrl || getAvatarUrl(match.player1?.name || 'P1', AVATAR_SIZE * 2) }}
                style={styles.h2hAvatar}
              />
              <Text style={[styles.h2hName, p1Won && styles.winnerName]} numberOfLines={2}>{p1Name}</Text>
              <Text style={styles.h2hRank}>#{match.player1?.ranking || '?'}</Text>
            </View>

            <View style={styles.scoreCenter}>
              <Text style={styles.scoreBig}>{match.score}</Text>
              {(p1Won || p2Won) && <Text style={styles.ftLabel}>FT</Text>}
            </View>

            <View style={styles.playerSide}>
              <Image
                source={{ uri: match.player2?.photoUrl || getAvatarUrl(match.player2?.name || 'P2', AVATAR_SIZE * 2) }}
                style={styles.h2hAvatar}
              />
              <Text style={[styles.h2hName, p2Won && styles.winnerName]} numberOfLines={2}>{p2Name}</Text>
              <Text style={styles.h2hRank}>#{match.player2?.ranking || '?'}</Text>
            </View>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && <OverviewTab match={match} />}
          {activeTab === 'stats' && <StatsTabContent match={match} />}
          {activeTab === 'probability' && (
            <ProbabilityTab
              match={match}
              p1Prob={p1Won ? 100 : 0}
              p2Prob={p2Won ? 100 : 0}
              snapshots={probData?.snapshots}
              p1Name={p1Short}
              p2Name={p2Short}
            />
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { paddingBottom: 40 },

  // Match Header
  matchHeader: {
    backgroundColor: '#1e1e1e',
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a2a2a',
  },
  tournamentInfo: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
  },
  tournamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  surfaceDot: { width: 8, height: 8, borderRadius: 4 },
  tournamentName: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  roundDate: { fontSize: 12, color: '#6b7280' },

  h2hRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  playerSide: { flex: 1, alignItems: 'center' },
  h2hAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: 6,
  },
  h2hName: { fontSize: 14, fontWeight: '500', color: '#ffffff', textAlign: 'center', marginBottom: 2 },
  winnerName: { color: '#16a34a', fontWeight: '700' },
  h2hRank: { fontSize: 12, color: '#6b7280' },
  scoreCenter: { alignItems: 'center', paddingHorizontal: 12 },
  scoreBig: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  ftLabel: { fontSize: 10, color: '#6b7280', marginTop: 2 },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a2a2a',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#16a34a' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  tabTextActive: { color: '#16a34a', fontWeight: '600' },
  tabContent: { padding: 16 },

  // Card
  card: { backgroundColor: '#1e1e1e', borderRadius: 10, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 12 },

  // Score
  setsRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' },
  setBox: { backgroundColor: '#121212', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 56 },
  setLabel: { fontSize: 10, color: '#6b7280', marginBottom: 3 },
  setScore: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  fullScore: { fontSize: 12, color: '#6b7280', textAlign: 'center' },

  // Info
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#2a2a2a' },
  infoLabel: { fontSize: 14, color: '#9ca3af' },
  infoValue: { fontSize: 14, color: '#ffffff', fontWeight: '500' },

  // Stats
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  statVal: { width: 48, fontSize: 15, fontWeight: '700', color: '#ffffff', textAlign: 'center' },
  statValWin: { color: '#16a34a' },
  statMiddle: { flex: 1 },
  statLabel: { fontSize: 11, color: '#6b7280', textAlign: 'center', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  statTrack: { height: 8, backgroundColor: '#3b82f6', borderRadius: 4, overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: 4 },

  // Probability
  probLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  probName: { fontSize: 13, color: '#6b7280' },
  probNameWin: { color: '#16a34a', fontWeight: '600' },
  probBar: { height: 10, backgroundColor: '#3b82f6', borderRadius: 5, overflow: 'hidden', marginBottom: 4 },
  probPct: { fontSize: 15, fontWeight: '700', color: '#6b7280' },
  probPctWin: { color: '#16a34a' },

  // Factor Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6, justifyContent: 'center' },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  chipPos: { backgroundColor: 'rgba(22, 163, 74, 0.12)' },
  chipNeg: { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
  chipText: { fontSize: 11, fontWeight: '600' },
  chipTextPos: { color: '#16a34a' },
  chipTextNeg: { color: '#ef4444' },

  // Curve
  curveLegend: { fontSize: 11, color: '#6b7280', marginBottom: 8, textAlign: 'center' },
  curveChart: { backgroundColor: '#121212', borderRadius: 8, overflow: 'hidden' },
  halfLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#2a2a2a' },
});
