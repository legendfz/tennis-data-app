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
import { useLanguage } from '../../lib/i18n';
import { SkeletonList, SkeletonBlock } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import type { H2HData } from '../../../shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AVATAR_SIZE = 96;

function SurfaceBar({
  label,
  emoji,
  p1Wins,
  p2Wins,
}: {
  label: string;
  emoji: string;
  p1Wins: number;
  p2Wins: number;
}) {
  const total = p1Wins + p2Wins;
  if (total === 0) return null;
  const p1Pct = (p1Wins / total) * 100;

  return (
    <View style={styles.surfaceRow}>
      <Text style={styles.surfaceLabel}>{emoji} {label}</Text>
      <View style={styles.surfaceBarContainer}>
        <View style={styles.surfaceBarBg}>
          <View
            style={[
              styles.surfaceBarFill,
              {
                width: `${p1Pct}%`,
                backgroundColor: p1Wins > p2Wins ? '#16a34a' : p1Wins === p2Wins ? '#a0a0b0' : '#3b82f6',
              },
            ]}
          />
        </View>
      </View>
      <Text style={styles.surfaceScore}>
        <Text style={p1Wins >= p2Wins ? styles.winNum : styles.loseNum}>{p1Wins}</Text>
        {' - '}
        <Text style={p2Wins >= p1Wins ? styles.winNum : styles.loseNum}>{p2Wins}</Text>
      </Text>
    </View>
  );
}

function ComparisonRow({
  label,
  value1,
  value2,
  higherIsBetter = true,
}: {
  label: string;
  value1: string | number;
  value2: string | number;
  higherIsBetter?: boolean;
}) {
  const v1 = typeof value1 === 'string' ? parseFloat(value1) : value1;
  const v2 = typeof value2 === 'string' ? parseFloat(value2) : value2;
  const p1Better = higherIsBetter ? v1 > v2 : v1 < v2;
  const p2Better = higherIsBetter ? v2 > v1 : v2 < v1;

  return (
    <View style={styles.compRow}>
      <Text style={[styles.compValue, p1Better && styles.compBetter]}>{value1}</Text>
      <Text style={styles.compLabel}>{label}</Text>
      <Text style={[styles.compValue, p2Better && styles.compBetter]}>{value2}</Text>
    </View>
  );
}

export default function H2HDetailScreen() {
  const { matchup } = useLocalSearchParams<{ matchup: string }>();
  const { getPlayerName } = useLanguage();

  const parts = matchup?.split('-vs-') || [];
  const p1Id = parseInt(parts[0]);
  const p2Id = parseInt(parts[1]);

  const { data, isLoading, error } = useQuery<H2HData>({
    queryKey: ['h2h', p1Id, p2Id],
    queryFn: async () => {
      const res = await api.get(`/api/h2h/${p1Id}/${p2Id}`);
      return res.data;
    },
    enabled: !isNaN(p1Id) && !isNaN(p2Id),
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'H2H' }} />
        <View style={{ padding: 16, gap: 16 }}>
          <SkeletonBlock width={SCREEN_WIDTH - 32} height={200} borderRadius={16} />
          <SkeletonBlock width={SCREEN_WIDTH - 32} height={120} borderRadius={16} />
          <SkeletonBlock width={SCREEN_WIDTH - 32} height={200} borderRadius={16} />
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'H2H' }} />
        <EmptyState message="Failed to load H2H data" icon="😞" />
      </View>
    );
  }

  const { playerComparison: pc, summary, bySurface, matchHistory } = data;
  const p1 = pc.player1;
  const p2 = pc.player2;
  const p1Leading = summary.player1Wins > summary.player2Wins;
  const p2Leading = summary.player2Wins > summary.player1Wins;

  return (
    <>
      <Stack.Screen options={{ title: `${getPlayerName(p1)} vs ${getPlayerName(p2)}` }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top: Player avatars face-to-face */}
        <View style={styles.topSection}>
          <View style={styles.playerCol}>
            <Image
              source={{ uri: p1.photoUrl || getAvatarUrl(p1.name, AVATAR_SIZE * 2) }}
              style={[styles.avatar, p1Leading && styles.avatarLeading]}
            />
            <Text style={styles.flag}>{p1.countryFlag}</Text>
            <Text style={styles.playerName} numberOfLines={2}>{getPlayerName(p1)}</Text>
            <Text style={styles.playerRank}>#{p1.ranking}</Text>
          </View>

          <View style={styles.vsCol}>
            <View style={styles.vsBubble}>
              <Text style={styles.vsLabel}>VS</Text>
            </View>
          </View>

          <View style={styles.playerCol}>
            <Image
              source={{ uri: p2.photoUrl || getAvatarUrl(p2.name, AVATAR_SIZE * 2) }}
              style={[styles.avatar, p2Leading && styles.avatarLeading]}
            />
            <Text style={styles.flag}>{p2.countryFlag}</Text>
            <Text style={styles.playerName} numberOfLines={2}>{getPlayerName(p2)}</Text>
            <Text style={styles.playerRank}>#{p2.ranking}</Text>
          </View>
        </View>

        {/* Total Record - Extra large numbers */}
        <View style={styles.recordSection}>
          <Text style={styles.sectionLabel}>HEAD TO HEAD</Text>
          <View style={styles.recordRow}>
            <Text style={[styles.recordNum, p1Leading && styles.recordGreen]}>
              {summary.player1Wins}
            </Text>
            <View style={styles.recordDivider}>
              <Text style={styles.recordDash}>—</Text>
              <Text style={styles.recordTotal}>{summary.totalMatches} matches</Text>
            </View>
            <Text style={[styles.recordNum, p2Leading && styles.recordBlue]}>
              {summary.player2Wins}
            </Text>
          </View>
          {summary.totalMatches > 0 && (
            <View style={styles.overallBar}>
              <View
                style={[
                  styles.overallBarFill,
                  {
                    width: `${(summary.player1Wins / summary.totalMatches) * 100}%`,
                    backgroundColor: p1Leading ? '#16a34a' : '#3b82f6',
                  },
                ]}
              />
            </View>
          )}
        </View>

        {/* By Surface */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>BY SURFACE</Text>
          <SurfaceBar label="Hard" emoji="🔵" p1Wins={bySurface.hard?.p1Wins || 0} p2Wins={bySurface.hard?.p2Wins || 0} />
          <SurfaceBar label="Clay" emoji="🟠" p1Wins={bySurface.clay?.p1Wins || 0} p2Wins={bySurface.clay?.p2Wins || 0} />
          <SurfaceBar label="Grass" emoji="🟢" p1Wins={bySurface.grass?.p1Wins || 0} p2Wins={bySurface.grass?.p2Wins || 0} />
        </View>

        {/* Key Stats Comparison */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>KEY STATS</Text>
          <ComparisonRow label="Ranking" value1={`#${p1.ranking}`} value2={`#${p2.ranking}`} higherIsBetter={false} />
          <ComparisonRow label="Age" value1={p1.age} value2={p2.age} higherIsBetter={false} />
          <ComparisonRow label="Height" value1={`${p1.height}cm`} value2={`${p2.height}cm`} />
          <ComparisonRow label="Grand Slams" value1={p1.grandSlams} value2={p2.grandSlams} />
          <ComparisonRow label="Season Win %" value1={p1.seasonWinRate} value2={p2.seasonWinRate} />
        </View>

        {/* Match History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>MATCH HISTORY</Text>
          {matchHistory.map((m, i) => {
            const p1Won = m.winnerId === p1.id;
            return (
              <View key={i} style={styles.matchItem}>
                <View style={styles.matchTop}>
                  <Text style={styles.matchTournament}>{m.tournament}</Text>
                  <Text style={styles.matchRound}>{m.round}</Text>
                </View>
                <View style={styles.matchMiddle}>
                  <Text style={[styles.matchPlayerLabel, p1Won && styles.matchWinner, !p1Won && styles.matchLoserText]}>
                    {p1.name.split(' ').pop()}
                  </Text>
                  <Text style={styles.matchScore}>{m.score}</Text>
                  <Text style={[styles.matchPlayerLabel, !p1Won && styles.matchWinner, p1Won && styles.matchLoserText]}>
                    {p2.name.split(' ').pop()}
                  </Text>
                </View>
                <View style={styles.matchBottom}>
                  <Text style={styles.matchDate}>{m.date}</Text>
                  <Text style={styles.matchSurface}>{m.surface}</Text>
                </View>
              </View>
            );
          })}
          {matchHistory.length === 0 && (
            <EmptyState message="No head-to-head matches found" icon="🎾" />
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  content: { paddingBottom: 40 },

  // Top section
  topSection: { flexDirection: 'row', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  playerCol: { flex: 1, alignItems: 'center' },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: '#2a2a4e',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarLeading: { borderColor: '#16a34a' },
  flag: { fontSize: 30, marginBottom: 4 },
  playerName: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 2 },
  playerRank: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  vsCol: { paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
  vsBubble: {
    backgroundColor: '#2a2a4e',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  vsLabel: { fontSize: 18, fontWeight: 'bold', color: '#f59e0b' },

  // Record section
  recordSection: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#a0a0b0', letterSpacing: 2, marginBottom: 16 },
  recordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  recordNum: { fontSize: 52, fontWeight: 'bold', color: '#ffffff' },
  recordGreen: { color: '#16a34a' },
  recordBlue: { color: '#3b82f6' },
  recordDivider: { alignItems: 'center', marginHorizontal: 20 },
  recordDash: { fontSize: 28, color: '#a0a0b0' },
  recordTotal: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  overallBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 16,
  },
  overallBarFill: { height: '100%', borderRadius: 5 },

  // Card
  card: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#a0a0b0', letterSpacing: 2, marginBottom: 16, textAlign: 'center' },

  // Surface
  surfaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  surfaceLabel: { width: 80, fontSize: 14, color: '#ffffff' },
  surfaceBarContainer: { flex: 1, marginHorizontal: 8 },
  surfaceBarBg: { height: 10, backgroundColor: '#3b82f6', borderRadius: 5, overflow: 'hidden' },
  surfaceBarFill: { height: '100%', borderRadius: 5 },
  surfaceScore: { width: 50, textAlign: 'right', fontSize: 14, color: '#ffffff' },
  winNum: { color: '#16a34a', fontWeight: 'bold' },
  loseNum: { color: '#6b7280' },

  // Comparison
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  compValue: { width: 80, fontSize: 16, fontWeight: '600', color: '#ffffff', textAlign: 'center' },
  compBetter: { color: '#16a34a' },
  compLabel: { flex: 1, fontSize: 13, color: '#a0a0b0', textAlign: 'center' },

  // Match History
  matchItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  matchTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  matchTournament: { fontSize: 11, fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', flex: 1, letterSpacing: 0.5 },
  matchRound: { fontSize: 11, color: '#a0a0b0' },
  matchMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  matchPlayerLabel: { flex: 1, fontSize: 14, color: '#a0a0b0', textAlign: 'center' },
  matchWinner: { color: '#16a34a', fontWeight: 'bold' },
  matchLoserText: { color: '#6b7280' },
  matchScore: { fontSize: 13, fontWeight: '600', color: '#ffffff', textAlign: 'center', flex: 2 },
  matchBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  matchDate: { fontSize: 11, color: '#6b7280' },
  matchSurface: { fontSize: 11, color: '#6b7280' },
});
