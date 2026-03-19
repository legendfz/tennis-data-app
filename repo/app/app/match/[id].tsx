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
import { PlayerAvatar } from '../../lib/player-avatar';
import { Flag } from '../../lib/flags';
import { useLanguage } from '../../lib/i18n';
import { SkeletonBlock } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import { TournamentLogo } from '../../lib/tournament-logo';
import type { MatchWithPlayers, ProbabilitySnapshot } from '../../../shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AVATAR_SIZE = 56;

type TabKey = 'overview' | 'stats' | 'probability';

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function parseScore(score: string): string[] {
  return score.split(',').map((s) => s.trim());
}

function getSurfaceColor(surface: string): string {
  const lower = surface.toLowerCase();
  if (lower.includes('clay')) return '#f97316';
  if (lower.includes('grass')) return '#22c55e';
  if (lower.includes('hard')) return '#3b82f6';
  return '#666';
}

// ─── Stat Bar (symmetric) ────────────────────────────────────────────
function StatBarComparison({ label, value1, value2 }: { label: string; value1: string | number; value2: string | number }) {
  const v1 = typeof value1 === 'string' ? parseFloat(value1) || 0 : value1;
  const v2 = typeof value2 === 'string' ? parseFloat(value2) || 0 : value2;
  const total = v1 + v2;
  const p1Pct = total > 0 ? (v1 / total) * 100 : 50;
  const p1Better = v1 > v2;
  const p2Better = v2 > v1;

  return (
    <View style={styles.compareRow}>
      <Text style={[styles.compareVal, styles.compareValLeft, p1Better && styles.compareValWin]}>
        {value1}
      </Text>
      <View style={styles.compareBars}>
        <View style={[styles.compareBarLeft, { flex: p1Pct }]} />
        <View style={[styles.compareBarRight, { flex: 100 - p1Pct }]} />
      </View>
      <Text style={styles.compareLabel}>{label}</Text>
      <View style={styles.compareBars}>
        <View style={[styles.compareBarRight, { flex: 100 - p1Pct }]} />
        <View style={{ flex: p1Pct }} />
      </View>
      <Text style={[styles.compareVal, styles.compareValRight, p2Better && styles.compareValWin]}>
        {value2}
      </Text>
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
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Details</Text>
        <InfoRow label="Date" value={match.date} />
        <InfoRow label="Round" value={match.round} />
        {match.court && <InfoRow label="Court" value={match.court} />}
        {match.tournament && (
          <>
            <InfoRow label="Surface" value={match.tournament.surface} />
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
      {match.statsJson.player1?.winners !== undefined && (
        <StatBarComparison label="Winners" value1={match.statsJson.player1.winners} value2={match.statsJson.player2.winners} />
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
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Win Probability</Text>
      <View style={styles.probRow}>
        <Text style={[styles.probPct, p1Prob > p2Prob && styles.probPctWin]}>{p1Prob.toFixed(0)}%</Text>
        <View style={styles.probBarOuter}>
          <View style={[styles.probBarInner, { width: `${p1Prob}%` }]} />
        </View>
        <Text style={[styles.probPct, p2Prob > p1Prob && styles.probPctWin]}>{p2Prob.toFixed(0)}%</Text>
      </View>
      {factors && (
        <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <FactorChips factors={factors} player="p1" />
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <FactorChips factors={factors} player="p2" />
          </View>
        </View>
      )}
    </View>
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
  const p1Initials = match.player1 ? getInitials(match.player1.name) : 'P1';
  const p2Initials = match.player2 ? getInitials(match.player2.name) : 'P2';

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
          <View style={styles.tournamentLabelRow}>
            {match.tournament && <TournamentLogo tournament={match.tournament} size="md" />}
            <Text style={styles.tournamentLabel}>
              {match.tournament?.name?.toUpperCase() || 'MATCH'}
              {match.round ? ` \u2022 ${match.round}` : ''}
              {match.tournament?.surface ? ` \u2022 ${match.tournament.surface}` : ''}
            </Text>
          </View>

          <View style={styles.versusRow}>
            {/* Player 1 */}
            <View style={styles.vsPlayer}>
              <PlayerAvatar name={match.player1?.name || 'P1'} photoUrl={match.player1?.photoUrl} size={56} />
              <Text style={[styles.vsName, p1Won && styles.vsNameWinner, !p1Won && p2Won && styles.vsNameLoser]} numberOfLines={1}>
                {p1Short}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Flag country={match.player1?.country || ''} countryFlag={match.player1?.countryFlag} size={12} />
                <Text style={styles.vsRank}>#{match.player1?.ranking || '?'}</Text>
              </View>
            </View>

            {/* Score */}
            <View style={styles.scoreCenterBlock}>
              <Text style={styles.bigScore}>{match.score}</Text>
              {(p1Won || p2Won) && <Text style={styles.ftText}>FT</Text>}
            </View>

            {/* Player 2 */}
            <View style={styles.vsPlayer}>
              <PlayerAvatar name={match.player2?.name || 'P2'} photoUrl={match.player2?.photoUrl} size={56} />
              <Text style={[styles.vsName, p2Won && styles.vsNameWinner, !p2Won && p1Won && styles.vsNameLoser]} numberOfLines={1}>
                {p2Short}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Flag country={match.player2?.country || ''} countryFlag={match.player2?.countryFlag} size={12} />
                <Text style={styles.vsRank}>#{match.player2?.ranking || '?'}</Text>
              </View>
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
              p1Prob={p1Won ? 73 : p2Won ? 27 : 50}
              p2Prob={p2Won ? 73 : p1Won ? 27 : 50}
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
    backgroundColor: '#1a1a1a',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tournamentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  tournamentLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
    flexShrink: 1,
  },
  versusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  vsPlayer: {
    alignItems: 'center',
    flex: 1,
  },
  vsAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  vsAvatarImg: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  vsAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
  },
  vsName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
  vsNameWinner: {
    color: '#fff',
    fontWeight: '700',
  },
  vsNameLoser: {
    color: '#666',
  },
  vsRank: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  scoreCenterBlock: {
    alignItems: 'center',
  },
  bigScore: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 4,
  },
  ftText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
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
  tabText: { fontSize: 13, fontWeight: '500', color: '#666' },
  tabTextActive: { color: '#16a34a', fontWeight: '600' },
  tabContent: { padding: 16 },

  // Card
  card: { backgroundColor: '#1e1e1e', borderRadius: 10, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#ffffff', marginBottom: 12 },

  // Score
  setsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  setBox: { backgroundColor: '#121212', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 56 },
  setLabel: { fontSize: 10, color: '#666', marginBottom: 3 },
  setScore: { fontSize: 18, fontWeight: '700', color: '#ffffff' },

  // Info
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#2a2a2a' },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: '#ffffff', fontWeight: '500' },

  // Compare Stats (symmetric)
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  compareVal: {
    width: 36,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  compareValLeft: {
    textAlign: 'left',
  },
  compareValRight: {
    textAlign: 'right',
  },
  compareValWin: {
    color: '#fff',
    fontWeight: '700',
  },
  compareBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
    height: 5,
    marginHorizontal: 8,
  },
  compareBarLeft: {
    height: 5,
    backgroundColor: '#16a34a',
    borderRadius: 3,
  },
  compareBarRight: {
    height: 5,
    backgroundColor: '#333',
    borderRadius: 3,
  },
  compareLabel: {
    width: 80,
    textAlign: 'center',
    fontSize: 11,
    color: '#888',
  },

  // Probability
  probRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  probPct: {
    fontSize: 20,
    fontWeight: '700',
    color: '#666',
  },
  probPctWin: {
    color: '#fff',
  },
  probBarOuter: {
    flex: 1,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  probBarInner: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 4,
  },

  // Factor Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6, justifyContent: 'center' },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  chipPos: { backgroundColor: 'rgba(22, 163, 74, 0.12)' },
  chipNeg: { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
  chipText: { fontSize: 11, fontWeight: '600' },
  chipTextPos: { color: '#4caf50' },
  chipTextNeg: { color: '#ef4444' },
});
