import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import { useLanguage } from '../../lib/i18n';
import type { PlayerDetail, MatchWithPlayers, SetStats } from '../../../shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AVATAR_SIZE = Math.round(SCREEN_WIDTH * 0.4);
const CHART_HEIGHT = 180;
const PX_PER_POINT = 4;
const MIN_CHART_WIDTH = SCREEN_WIDTH - 64;

// ─── Time Range Filter ───────────────────────────────────────────────
type TimeRange = '1Y' | '5Y' | '10Y' | 'All';

function filterByRange(
  history: { month: string; ranking: number }[],
  range: TimeRange,
): { month: string; ranking: number }[] {
  if (range === 'All' || history.length === 0) return history;
  const lastMonth = history[history.length - 1].month;
  const lastYear = parseInt(lastMonth.slice(0, 4), 10);
  const lastMon = parseInt(lastMonth.slice(5), 10);
  const yearsBack = range === '1Y' ? 1 : range === '5Y' ? 5 : 10;
  const cutoffYear = lastYear - yearsBack;
  const cutoff = `${cutoffYear}-${String(lastMon).padStart(2, '0')}`;
  return history.filter((h) => h.month >= cutoff);
}

// ─── Ranking History Line Chart (react-native-svg) ───────────────────

function RankingChart({ history }: { history: { month: string; ranking: number }[] }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('All');
  const scrollRef = useRef<ScrollView>(null);

  const filtered = useMemo(() => filterByRange(history, timeRange), [history, timeRange]);

  if (!filtered || filtered.length < 2) return null;

  const paddingLeft = 44;
  const paddingRight = 24;
  const paddingTop = 28;
  const paddingBottom = 32;

  // Dynamic chart width based on data points
  const dynamicWidth = Math.max(
    MIN_CHART_WIDTH,
    paddingLeft + paddingRight + filtered.length * PX_PER_POINT,
  );
  const plotW = dynamicWidth - paddingLeft - paddingRight;
  const plotH = CHART_HEIGHT - paddingTop - paddingBottom;

  const rankings = filtered.map((h) => h.ranking);
  const minRank = Math.min(...rankings);
  const maxRank = Math.max(...rankings);
  const range = Math.max(maxRank - minRank, 1);

  const getX = (i: number) => paddingLeft + (i / (filtered.length - 1)) * plotW;
  const getY = (ranking: number) => paddingTop + ((ranking - minRank) / range) * plotH;

  const points = filtered.map((h, i) => ({ x: getX(i), y: getY(h.ranking) }));
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const lastIdx = filtered.length - 1;

  // Y-axis grid: ~4 ticks
  const tickCount = Math.min(4, range + 1);
  const yTicks: number[] = [];
  for (let i = 0; i < tickCount; i++) {
    yTicks.push(Math.round(minRank + (range * i) / (tickCount - 1)));
  }

  // X-axis labels: auto density based on data count
  // For many points show only years, for fewer show months
  const xLabels: { index: number; label: string }[] = [];
  const showMonths = filtered.length <= 36;
  const seenYears = new Set<string>();

  filtered.forEach((h, i) => {
    const year = h.month.slice(0, 4);
    const mon = parseInt(h.month.slice(5), 10);

    if (showMonths) {
      // Show every 3rd month
      if (mon % 3 === 1) {
        const MONTH_SHORT = ['Jan','','Mar','','','Jun','','','Sep','','','Dec'];
        xLabels.push({ index: i, label: mon === 1 ? year : MONTH_SHORT[mon - 1] || '' });
      }
    } else {
      // Show January of each year (year labels)
      if (mon === 1 && !seenYears.has(year)) {
        seenYears.add(year);
        // For very long careers, skip every other year
        const yearNum = parseInt(year, 10);
        if (filtered.length > 180) {
          if (yearNum % 2 === 0) xLabels.push({ index: i, label: year });
        } else {
          xLabels.push({ index: i, label: year });
        }
      }
    }
  });

  // Vertical grid lines at label positions
  const vGridIndices = xLabels.map((l) => l.index);

  // Show dots only for sparse data or endpoints
  const showAllDots = filtered.length <= 36;

  const ranges: TimeRange[] = ['1Y', '5Y', '10Y', 'All'];

  return (
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Ranking History</Text>

      {/* Time range pills */}
      <View style={styles.pillRow}>
        {ranges.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.pill, timeRange === r && styles.pillActive]}
            onPress={() => setTimeRange(r)}
          >
            <Text style={[styles.pillText, timeRange === r && styles.pillTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Horizontally scrollable chart */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={{ width: dynamicWidth }}
        style={{ marginTop: 8 }}
      >
        <Svg width={dynamicWidth} height={CHART_HEIGHT}>
          {/* Horizontal grid lines */}
          {yTicks.map((rank) => (
            <Line
              key={`grid-${rank}`}
              x1={paddingLeft}
              y1={getY(rank)}
              x2={dynamicWidth - paddingRight}
              y2={getY(rank)}
              stroke="#2a2a4e"
              strokeWidth={1}
            />
          ))}
          {/* Vertical grid lines at label positions */}
          {vGridIndices.map((idx) => (
            <Line
              key={`vgrid-${idx}`}
              x1={getX(idx)}
              y1={paddingTop}
              x2={getX(idx)}
              y2={paddingTop + plotH}
              stroke="#2a2a4e"
              strokeWidth={1}
            />
          ))}
          {/* Y-axis labels */}
          {yTicks.map((rank) => (
            <SvgText
              key={`ylabel-${rank}`}
              x={paddingLeft - 6}
              y={getY(rank) + 4}
              fill="#a0a0b0"
              fontSize={10}
              textAnchor="end"
            >
              #{rank}
            </SvgText>
          ))}
          {/* X-axis labels */}
          {xLabels.map(({ index, label }) => (
            <SvgText
              key={`xlabel-${index}`}
              x={getX(index)}
              y={CHART_HEIGHT - 4}
              fill="#6b7280"
              fontSize={9}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          ))}
          {/* Line */}
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke="#16a34a"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Data points */}
          {showAllDots
            ? points.map((p, i) => {
                const isLast = i === lastIdx;
                return (
                  <Circle
                    key={`dot-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={isLast ? 5 : 3}
                    fill={isLast ? '#16a34a' : '#0f0f23'}
                    stroke="#16a34a"
                    strokeWidth={1.5}
                  />
                );
              })
            : /* For dense data, just show first & last dot */
              [0, lastIdx].map((i) => (
                <Circle
                  key={`dot-${i}`}
                  cx={points[i].x}
                  cy={points[i].y}
                  r={i === lastIdx ? 5 : 3}
                  fill={i === lastIdx ? '#16a34a' : '#0f0f23'}
                  stroke="#16a34a"
                  strokeWidth={1.5}
                />
              ))}
          {/* Current ranking label */}
          <SvgText
            x={points[lastIdx].x}
            y={points[lastIdx].y - 10}
            fill="#16a34a"
            fontSize={11}
            fontWeight="bold"
            textAnchor="middle"
          >
            #{filtered[lastIdx].ranking}
          </SvgText>
        </Svg>
      </ScrollView>
    </View>
  );
}

// ─── Record / Win-Loss Stats ─────────────────────────────────────────
function RecordSection({ player }: { player: PlayerDetail }) {
  const record = player.record;
  if (!record) return null;

  const surfaces = [
    { label: 'Hard', emoji: '🔵', data: record.bySurface.hard },
    { label: 'Clay', emoji: '🟤', data: record.bySurface.clay },
    { label: 'Grass', emoji: '🟢', data: record.bySurface.grass },
  ];

  return (
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Win / Loss Record</Text>

      {/* Season vs Career row */}
      <View style={styles.recordTopRow}>
        <View style={styles.recordBox}>
          <Text style={styles.recordWL}>
            {record.season.wins}-{record.season.losses}
          </Text>
          <Text style={styles.recordLabel}>Season</Text>
          <View style={styles.winBar}>
            <View
              style={[
                styles.winBarFill,
                {
                  width: `${(record.season.wins / (record.season.wins + record.season.losses)) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.recordBox}>
          <Text style={styles.recordWL}>
            {record.career.wins}-{record.career.losses}
          </Text>
          <Text style={styles.recordLabel}>Career</Text>
          <View style={styles.winBar}>
            <View
              style={[
                styles.winBarFill,
                {
                  width: `${(record.career.wins / (record.career.wins + record.career.losses)) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* By surface */}
      <Text style={styles.subSectionTitle}>By Surface</Text>
      {surfaces.map((s) => (
        <View key={s.label} style={styles.surfaceRow}>
          <Text style={styles.surfaceLabel}>
            {s.emoji} {s.label}
          </Text>
          <Text style={styles.surfaceWL}>
            {s.data.wins}-{s.data.losses}
          </Text>
          <Text style={styles.surfacePct}>
            {((s.data.wins / (s.data.wins + s.data.losses)) * 100).toFixed(0)}%
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Bio Section ─────────────────────────────────────────────────────
function BioSection({ player }: { player: PlayerDetail }) {
  if (!player.birthplace && !player.coach && !player.recentForm) return null;

  return (
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Bio</Text>
      {player.birthplace && <InfoRow label="Birthplace" value={player.birthplace} />}
      {player.coach && <InfoRow label="Coach" value={player.coach} />}
      {player.recentForm && (
        <View style={styles.recentFormContainer}>
          <Text style={styles.recentFormLabel}>Recent Form</Text>
          <Text style={styles.recentFormText}>{player.recentForm}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Set Statistics Section ──────────────────────────────────────────
function SetStatsSection({ player }: { player: PlayerDetail }) {
  const setStats = (player as any).setStats as SetStats | undefined;
  if (!setStats) return null;

  const rows = [
    { key: 'straightSets', label: 'Straight Sets 🔥', data: setStats.straightSets, highlight: false },
    { key: 'threeSets', label: '3 Sets', data: setStats.threeSets, highlight: false },
    { key: 'fourSets', label: '4 Sets', data: setStats.fourSets, highlight: false },
    { key: 'fiveSets', label: '5 Sets', data: setStats.fiveSets, highlight: false },
    { key: 'decidingSet', label: 'Deciding Set ⚡', data: setStats.decidingSet, highlight: true },
  ];

  return (
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Set Statistics</Text>
      {rows.map((row) => {
        const losses = row.data.total - row.data.wins;
        const barColor = row.highlight ? '#f59e0b' : '#16a34a';
        const pctColor = row.highlight ? '#f59e0b' : '#16a34a';
        return (
          <View key={row.key} style={styles.setStatRow}>
            <Text style={[styles.setStatLabel, row.highlight && styles.setStatLabelHighlight]}>
              {row.label}
            </Text>
            <View style={styles.setStatBarContainer}>
              <View style={styles.setStatBarBg}>
                <View
                  style={[
                    styles.setStatBarFill,
                    { width: `${row.data.winRate}%`, backgroundColor: barColor },
                  ]}
                />
              </View>
            </View>
            <Text style={[styles.setStatPct, { color: pctColor }]}>
              {row.data.winRate.toFixed(1)}%
            </Text>
            <Text style={styles.setStatRecord}>
              ({row.data.wins}-{losses})
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────
export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getPlayerName, resolvedLanguage } = useLanguage();

  const { data: player, isLoading, error } = useQuery<PlayerDetail>({
    queryKey: ['player', id],
    queryFn: async () => {
      const res = await api.get(`/api/players/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (error || !player) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load player</Text>
      </View>
    );
  }

  const avatarUrl = player.photoUrl || getAvatarUrl(player.name, AVATAR_SIZE * 2);

  return (
    <>
      <Stack.Screen options={{ title: getPlayerName(player) }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <Text style={styles.playerName}>
            {getPlayerName(player)} {player.countryFlag}
          </Text>
          {resolvedLanguage !== 'en' && getPlayerName(player) !== player.name && (
            <Text style={styles.playerNameEn}>{player.name}</Text>
          )}
          <Text style={styles.rankingBig}>#{player.ranking}</Text>
        </View>

        {/* Career Highlights */}
        <View style={styles.highlightsRow}>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightNumber}>{player.grandSlams}</Text>
            <Text style={styles.highlightLabel}>Grand Slams</Text>
          </View>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightNumber}>{player.titles}</Text>
            <Text style={styles.highlightLabel}>Titles</Text>
          </View>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightNumber}>{player.prizeMoney}</Text>
            <Text style={styles.highlightLabel}>Prize Money</Text>
          </View>
        </View>

        {/* Compare Button */}
        <TouchableOpacity
          style={styles.compareButton}
          onPress={() => router.push('/h2h' as any)}
        >
          <Text style={styles.compareButtonText}>⚔️ Compare with...</Text>
        </TouchableOpacity>

        {/* Bio */}
        <BioSection player={player} />

        {/* Ranking History Chart */}
        {player.rankingHistory && player.rankingHistory.length > 0 && (
          <RankingChart history={player.rankingHistory} />
        )}

        {/* Win/Loss Record */}
        <RecordSection player={player} />

        {/* Set Statistics */}
        <SetStatsSection player={player} />

        {/* Player Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Player Info</Text>
          <InfoRow label="Nationality" value={`${player.countryFlag} ${player.country}`} />
          <InfoRow label="Height" value={`${player.height} cm`} />
          <InfoRow label="Weight" value={`${player.weight} kg`} />
          <InfoRow label="Plays" value={player.plays} />
          <InfoRow label="Backhand" value={player.backhand} />
          <InfoRow label="Turned Pro" value={String(player.turnedPro)} />
          <InfoRow label="Career High" value={`#${player.careerHigh}`} />
        </View>

        {/* Stats */}
        {player.stats && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Season Stats</Text>
            <InfoRow label="Win-Loss" value={player.stats.winLoss} />
            <InfoRow label="Titles This Year" value={String(player.stats.titlesThisYear)} />
            <InfoRow label="Best Result" value={player.stats.bestResult} />
          </View>
        )}

        {/* Recent Matches */}
        {player.recentMatches && player.recentMatches.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Recent Matches</Text>
            {player.recentMatches.map((match: MatchWithPlayers) => (
              <View key={match.id} style={styles.matchItem}>
                <View style={styles.matchHeader}>
                  <Text style={styles.matchTournament}>
                    {match.tournament?.name || 'Tournament'}
                  </Text>
                  <Text style={styles.matchRound}>{match.round}</Text>
                </View>
                <View style={styles.matchPlayers}>
                  <Text
                    style={[
                      styles.matchPlayerName,
                      match.winnerId === match.player1Id && styles.matchWinner,
                    ]}
                  >
                    {match.player1 ? getPlayerName(match.player1) : `Player ${match.player1Id}`}
                  </Text>
                  <Text style={styles.matchVs}>vs</Text>
                  <Text
                    style={[
                      styles.matchPlayerName,
                      match.winnerId === match.player2Id && styles.matchWinner,
                    ]}
                  >
                    {match.player2 ? getPlayerName(match.player2) : `Player ${match.player2Id}`}
                  </Text>
                </View>
                <Text style={styles.matchScore}>{match.score}</Text>
                <Text style={styles.matchDate}>{match.date}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  content: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: '#16a34a',
    marginBottom: 16,
  },
  playerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  playerNameEn: {
    fontSize: 16,
    color: '#a0a0b0',
    marginBottom: 4,
  },
  rankingBig: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  compareButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  highlightsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  highlightBox: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  highlightNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 4,
  },
  highlightLabel: {
    fontSize: 11,
    color: '#a0a0b0',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0a0b0',
    marginTop: 12,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  infoLabel: {
    fontSize: 14,
    color: '#a0a0b0',
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },

  // ── Chart pill styles ──
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#0f0f23',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  pillActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a0a0b0',
  },
  pillTextActive: {
    color: '#ffffff',
  },

  // ── Record styles ──
  recordTopRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  recordBox: {
    flex: 1,
    backgroundColor: '#0f0f23',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  recordWL: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  recordLabel: {
    fontSize: 11,
    color: '#a0a0b0',
    marginBottom: 6,
  },
  winBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#ef4444',
    borderRadius: 3,
    overflow: 'hidden',
  },
  winBarFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 3,
  },
  surfaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  surfaceLabel: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
  },
  surfaceWL: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginRight: 12,
  },
  surfacePct: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },

  // ── Set Stats styles ──
  setStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  setStatLabel: {
    width: 110,
    fontSize: 13,
    color: '#ffffff',
  },
  setStatLabelHighlight: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  setStatBarContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  setStatBarBg: {
    height: 8,
    backgroundColor: '#2a2a4e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  setStatBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  setStatPct: {
    width: 48,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  setStatRecord: {
    width: 62,
    fontSize: 12,
    color: '#a0a0b0',
    textAlign: 'right',
  },

  // ── Bio styles ──
  recentFormContainer: {
    paddingVertical: 8,
  },
  recentFormLabel: {
    fontSize: 14,
    color: '#a0a0b0',
    marginBottom: 4,
  },
  recentFormText: {
    fontSize: 13,
    color: '#d0d0e0',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // ── Match styles ──
  matchItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  matchTournament: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    textTransform: 'uppercase',
    flex: 1,
  },
  matchRound: {
    fontSize: 12,
    color: '#a0a0b0',
  },
  matchPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchPlayerName: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
  matchWinner: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  matchVs: {
    color: '#a0a0b0',
    fontSize: 12,
    marginHorizontal: 8,
  },
  matchScore: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  matchDate: {
    textAlign: 'center',
    color: '#a0a0b0',
    fontSize: 11,
    marginTop: 4,
  },
});
