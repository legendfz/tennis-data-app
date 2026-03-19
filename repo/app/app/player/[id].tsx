import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import { useLanguage } from '../../lib/i18n';
import { SkeletonBlock } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import { isFavorite, toggleFavorite } from '../../lib/favorites';
import type { PlayerDetail, MatchWithPlayers, SetStats } from '../../../shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AVATAR_SIZE = 100;
const CHART_HEIGHT = 180;
const PX_PER_POINT = 4;
const MIN_CHART_WIDTH = SCREEN_WIDTH - 64;

type TabKey = 'overview' | 'stats' | 'matches' | 'equipment';
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

// ─── Ranking Chart ───────────────────────────────────────────────────
function RankingChart({ history, currentRanking }: { history: { month: string; ranking: number }[]; currentRanking: number }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('All');
  const scrollRef = useRef<ScrollView>(null);
  const filtered = useMemo(() => filterByRange(history, timeRange), [history, timeRange]);

  if (!filtered || filtered.length < 2) return null;

  const paddingLeft = 44;
  const paddingRight = 24;
  const paddingTop = 28;
  const paddingBottom = 32;
  const dynamicWidth = Math.max(MIN_CHART_WIDTH, paddingLeft + paddingRight + filtered.length * PX_PER_POINT);
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
  const tickCount = Math.min(4, range + 1);
  const yTicks: number[] = [];
  for (let i = 0; i < tickCount; i++) yTicks.push(Math.round(minRank + (range * i) / (tickCount - 1)));

  const xLabels: { index: number; label: string }[] = [];
  const showMonths = filtered.length <= 36;
  const seenYears = new Set<string>();
  filtered.forEach((h, i) => {
    const year = h.month.slice(0, 4);
    const mon = parseInt(h.month.slice(5), 10);
    if (showMonths) {
      if (mon % 3 === 1) {
        const MONTH_SHORT = ['Jan','','Mar','','','Jun','','','Sep','','','Dec'];
        xLabels.push({ index: i, label: mon === 1 ? year : MONTH_SHORT[mon - 1] || '' });
      }
    } else if (mon === 1 && !seenYears.has(year)) {
      seenYears.add(year);
      const yearNum = parseInt(year, 10);
      if (filtered.length > 180) {
        if (yearNum % 2 === 0) xLabels.push({ index: i, label: year });
      } else {
        xLabels.push({ index: i, label: year });
      }
    }
  });

  const vGridIndices = xLabels.map((l) => l.index);
  const showAllDots = filtered.length <= 36;
  const ranges: TimeRange[] = ['1Y', '5Y', '10Y', 'All'];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Ranking History</Text>
      <View style={styles.pillRow}>
        {ranges.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.pill, timeRange === r && styles.pillActive]}
            onPress={() => setTimeRange(r)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, timeRange === r && styles.pillTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator contentContainerStyle={{ width: dynamicWidth }} style={{ marginTop: 8 }}>
        <Svg width={dynamicWidth} height={CHART_HEIGHT}>
          {yTicks.map((rank) => (
            <Line key={`grid-${rank}`} x1={paddingLeft} y1={getY(rank)} x2={dynamicWidth - paddingRight} y2={getY(rank)} stroke="#2a2a2a" strokeWidth={1} />
          ))}
          {vGridIndices.map((idx) => (
            <Line key={`vgrid-${idx}`} x1={getX(idx)} y1={paddingTop} x2={getX(idx)} y2={paddingTop + plotH} stroke="#2a2a2a" strokeWidth={1} />
          ))}
          {yTicks.map((rank) => (
            <SvgText key={`ylabel-${rank}`} x={paddingLeft - 6} y={getY(rank) + 4} fill="#6b7280" fontSize={10} textAnchor="end">#{rank}</SvgText>
          ))}
          {xLabels.map(({ index, label }) => (
            <SvgText key={`xlabel-${index}`} x={getX(index)} y={CHART_HEIGHT - 4} fill="#6b7280" fontSize={9} textAnchor="middle">{label}</SvgText>
          ))}
          <Polyline points={polylinePoints} fill="none" stroke="#16a34a" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {showAllDots
            ? points.map((p, i) => <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r={i === lastIdx ? 5 : 3} fill={i === lastIdx ? '#16a34a' : '#121212'} stroke="#16a34a" strokeWidth={1.5} />)
            : [0, lastIdx].map((i) => <Circle key={`dot-${i}`} cx={points[i].x} cy={points[i].y} r={i === lastIdx ? 5 : 3} fill={i === lastIdx ? '#16a34a' : '#121212'} stroke="#16a34a" strokeWidth={1.5} />)
          }
          <SvgText x={points[lastIdx].x} y={points[lastIdx].y - 10} fill="#16a34a" fontSize={11} fontWeight="bold" textAnchor="middle">#{filtered[lastIdx].ranking}</SvgText>
        </Svg>
      </ScrollView>
    </View>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────
function OverviewTab({ player }: { player: PlayerDetail }) {
  return (
    <>
      {/* Key Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard label="Ranking" value={`#${player.ranking}`} />
        <StatCard label="Grand Slams" value={String(player.grandSlams)} />
        <StatCard label="Titles" value={String(player.titles)} />
        <StatCard label="Prize Money" value={player.prizeMoney} />
        <StatCard label="Career High" value={`#${player.careerHigh}`} />
        <StatCard label="Turned Pro" value={String(player.turnedPro)} />
      </View>

      {/* Ranking Chart */}
      {player.rankingHistory && player.rankingHistory.length > 0 && (
        <RankingChart history={player.rankingHistory} currentRanking={player.ranking} />
      )}

      {/* Bio */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Info</Text>
        <InfoRow label="Nationality" value={`${player.countryFlag} ${player.country}`} />
        <InfoRow label="Height" value={`${player.height} cm`} />
        <InfoRow label="Weight" value={`${player.weight} kg`} />
        <InfoRow label="Plays" value={player.plays} />
        <InfoRow label="Backhand" value={player.backhand} />
        {player.birthplace && <InfoRow label="Birthplace" value={player.birthplace} />}
        {player.coach && <InfoRow label="Coach" value={player.coach} />}
      </View>

      {player.recentForm && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Form</Text>
          <Text style={styles.formText}>{player.recentForm}</Text>
        </View>
      )}
    </>
  );
}

// ─── Stats Tab ───────────────────────────────────────────────────────
function StatsTab({ player }: { player: PlayerDetail }) {
  const record = player.record;
  const setStats = (player as any).setStats as SetStats | undefined;

  return (
    <>
      {record && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Win / Loss</Text>
          <View style={styles.wlRow}>
            <View style={styles.wlBox}>
              <Text style={styles.wlValue}>{record.season.wins}-{record.season.losses}</Text>
              <Text style={styles.wlLabel}>Season</Text>
              <View style={styles.winBar}>
                <View style={[styles.winBarFill, { width: `${(record.season.wins / Math.max(record.season.wins + record.season.losses, 1)) * 100}%` }]} />
              </View>
            </View>
            <View style={styles.wlBox}>
              <Text style={styles.wlValue}>{record.career.wins}-{record.career.losses}</Text>
              <Text style={styles.wlLabel}>Career</Text>
              <View style={styles.winBar}>
                <View style={[styles.winBarFill, { width: `${(record.career.wins / Math.max(record.career.wins + record.career.losses, 1)) * 100}%` }]} />
              </View>
            </View>
          </View>

          <Text style={styles.subTitle}>By Surface</Text>
          {[
            { label: 'Hard', data: record.bySurface.hard, color: '#3b82f6' },
            { label: 'Clay', data: record.bySurface.clay, color: '#f97316' },
            { label: 'Grass', data: record.bySurface.grass, color: '#22c55e' },
          ].map((s) => {
            const total = s.data.wins + s.data.losses;
            const pct = total > 0 ? ((s.data.wins / total) * 100).toFixed(0) : '0';
            return (
              <View key={s.label} style={styles.surfaceRow}>
                <View style={[styles.surfaceDot, { backgroundColor: s.color }]} />
                <Text style={styles.surfaceLabel}>{s.label}</Text>
                <View style={styles.surfaceBarWrap}>
                  <View style={[styles.surfaceBarFill, { width: `${pct}%`, backgroundColor: s.color }]} />
                </View>
                <Text style={styles.surfaceWL}>{s.data.wins}-{s.data.losses}</Text>
                <Text style={styles.surfacePct}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      )}

      {setStats && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Set Statistics</Text>
          {[
            { key: 'straightSets', label: 'Straight Sets', data: setStats.straightSets },
            { key: 'threeSets', label: '3 Sets', data: setStats.threeSets },
            { key: 'fourSets', label: '4 Sets', data: setStats.fourSets },
            { key: 'fiveSets', label: '5 Sets', data: setStats.fiveSets },
            { key: 'decidingSet', label: 'Deciding Set', data: setStats.decidingSet },
          ].map((row) => {
            const losses = row.data.total - row.data.wins;
            return (
              <View key={row.key} style={styles.setRow}>
                <Text style={styles.setLabel}>{row.label}</Text>
                <View style={styles.setBarWrap}>
                  <View style={[styles.setBarFill, { width: `${row.data.winRate}%` }]} />
                </View>
                <Text style={styles.setPct}>{row.data.winRate.toFixed(1)}%</Text>
                <Text style={styles.setRecord}>({row.data.wins}-{losses})</Text>
              </View>
            );
          })}
        </View>
      )}

      {player.stats && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Season Stats</Text>
          <InfoRow label="Win-Loss" value={player.stats.winLoss} />
          <InfoRow label="Titles This Year" value={String(player.stats.titlesThisYear)} />
          <InfoRow label="Best Result" value={player.stats.bestResult} />
        </View>
      )}
    </>
  );
}

// ─── Matches Tab ─────────────────────────────────────────────────────
function MatchesTab({ player, getPlayerName, router }: { player: PlayerDetail; getPlayerName: (p: any) => string; router: any }) {
  if (!player.recentMatches || player.recentMatches.length === 0) {
    return <EmptyState message="No recent matches" />;
  }
  return (
    <>
      {player.recentMatches.map((match: MatchWithPlayers) => {
        const p1Won = match.winnerId === match.player1Id;
        const p2Won = match.winnerId === match.player2Id;
        return (
          <TouchableOpacity
            key={match.id}
            style={styles.matchItem}
            onPress={() => router.push(`/match/${match.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.matchMeta}>
              <Text style={styles.matchTournament}>{match.tournament?.name || 'Tournament'}</Text>
              <Text style={styles.matchRound}>{match.round}</Text>
            </View>
            <View style={styles.matchContent}>
              <Text style={[styles.matchName, p1Won && styles.matchWin, !p1Won && p2Won && styles.matchLose]} numberOfLines={1}>
                {match.player1 ? getPlayerName(match.player1) : `Player ${match.player1Id}`}
              </Text>
              <Text style={styles.matchVsScore}>{match.score}</Text>
              <Text style={[styles.matchName, p2Won && styles.matchWin, !p2Won && p1Won && styles.matchLose]} numberOfLines={1}>
                {match.player2 ? getPlayerName(match.player2) : `Player ${match.player2Id}`}
              </Text>
            </View>
            <Text style={styles.matchDate}>{match.date}</Text>
          </TouchableOpacity>
        );
      })}
    </>
  );
}

// ─── Equipment Tab ───────────────────────────────────────────────────
function EquipmentTab({ player }: { player: PlayerDetail }) {
  const equipment = (player as any).equipment;
  if (!equipment) return <EmptyState message="No equipment data" />;

  const renderTimeline = (items: { brand: string; from: number; to: number | null }[], label: string) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.equipSection}>
        <Text style={styles.equipLabel}>{label}</Text>
        {items.map((item, i) => (
          <View key={i} style={styles.equipItem}>
            <View style={styles.equipDot} />
            <View style={styles.equipInfo}>
              <Text style={styles.equipBrand}>{item.brand}</Text>
              <Text style={styles.equipYears}>{item.from} — {item.to || 'Present'}</Text>
            </View>
            {!item.to && <View style={styles.currentBadge}><Text style={styles.currentText}>Current</Text></View>}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Equipment & Sponsors</Text>
      {renderTimeline(equipment.apparel, 'Apparel')}
      {renderTimeline(equipment.shoes, 'Shoes')}
      {equipment.racket && (
        <View style={styles.equipSection}>
          <Text style={styles.equipLabel}>Racket</Text>
          <View style={styles.equipItem}>
            <View style={styles.equipDot} />
            <View style={styles.equipInfo}>
              <Text style={styles.equipBrand}>{equipment.racket.brand}</Text>
              <Text style={styles.equipYears}>{equipment.racket.model}</Text>
            </View>
          </View>
        </View>
      )}
      {equipment.watch && (
        <View style={styles.equipSection}>
          <Text style={styles.equipLabel}>Watch</Text>
          <View style={styles.equipItem}>
            <View style={styles.equipDot} />
            <View style={styles.equipInfo}><Text style={styles.equipBrand}>{equipment.watch}</Text></View>
          </View>
        </View>
      )}
      {equipment.otherSponsors && equipment.otherSponsors.length > 0 && (
        <View style={styles.equipSection}>
          <Text style={styles.equipLabel}>Other Sponsors</Text>
          <View style={styles.sponsorRow}>
            {equipment.otherSponsors.map((s: string, i: number) => (
              <View key={i} style={styles.sponsorPill}><Text style={styles.sponsorText}>{s}</Text></View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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

// ─── Main Screen ─────────────────────────────────────────────────────
export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getPlayerName, resolvedLanguage } = useLanguage();
  const [isFav, setIsFav] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const { data: player, isLoading, error } = useQuery<PlayerDetail>({
    queryKey: ['player', id],
    queryFn: async () => {
      const res = await api.get(`/api/players/${id}`);
      return res.data;
    },
  });

  useEffect(() => {
    if (id) isFavorite(parseInt(id)).then(setIsFav);
  }, [id]);

  const handleToggleFavorite = useCallback(async () => {
    if (!id) return;
    const result = await toggleFavorite(parseInt(id));
    setIsFav(result);
  }, [id]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={{ padding: 16, gap: 16 }}>
          <SkeletonBlock width={SCREEN_WIDTH - 32} height={200} borderRadius={10} />
          <SkeletonBlock width={SCREEN_WIDTH - 32} height={80} borderRadius={10} />
        </View>
      </View>
    );
  }

  if (error || !player) {
    return (
      <View style={styles.center}>
        <EmptyState message="Failed to load player" />
      </View>
    );
  }

  const avatarUrl = player.photoUrl || getAvatarUrl(player.name, AVATAR_SIZE * 2);
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'stats', label: 'Stats' },
    { key: 'matches', label: 'Matches' },
    { key: 'equipment', label: 'Equipment' },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: getPlayerName(player),
          headerRight: () => (
            <TouchableOpacity onPress={handleToggleFavorite} style={{ padding: 8, marginRight: 4 }}>
              <Text style={{ fontSize: 18, color: isFav ? '#ef4444' : '#6b7280' }}>{isFav ? '♥' : '♡'}</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <Text style={styles.playerName}>{getPlayerName(player)}</Text>
          {resolvedLanguage !== 'en' && getPlayerName(player) !== player.name && (
            <Text style={styles.playerNameEn}>{player.name}</Text>
          )}
          <Text style={styles.playerCountry}>{player.countryFlag} {player.country}</Text>
          <Text style={styles.rankBig}>#{player.ranking}</Text>
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
          {activeTab === 'overview' && <OverviewTab player={player} />}
          {activeTab === 'stats' && <StatsTab player={player} />}
          {activeTab === 'matches' && <MatchesTab player={player} getPlayerName={getPlayerName} router={router} />}
          {activeTab === 'equipment' && <EquipmentTab player={player} />}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a2a2a',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: 12,
  },
  playerName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  playerNameEn: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  playerCountry: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 6,
  },
  rankBig: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16a34a',
  },

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
  tabActive: {
    borderBottomColor: '#16a34a',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#16a34a',
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 14,
    width: (SCREEN_WIDTH - 48) / 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Card
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 8,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a2a2a',
  },
  infoLabel: { fontSize: 14, color: '#9ca3af' },
  infoValue: { fontSize: 14, color: '#ffffff', fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: 12 },

  // Form
  formText: { fontSize: 13, color: '#9ca3af', lineHeight: 20, fontStyle: 'italic' },

  // Chart pills
  pillRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: '#121212' },
  pillActive: { backgroundColor: '#16a34a' },
  pillText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  pillTextActive: { color: '#ffffff' },

  // Win/Loss
  wlRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  wlBox: { flex: 1, backgroundColor: '#121212', borderRadius: 10, padding: 12, alignItems: 'center' },
  wlValue: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 2 },
  wlLabel: { fontSize: 11, color: '#6b7280', marginBottom: 6 },
  winBar: { width: '100%', height: 4, backgroundColor: '#ef4444', borderRadius: 2, overflow: 'hidden' },
  winBarFill: { height: '100%', backgroundColor: '#16a34a', borderRadius: 2 },

  // Surface
  surfaceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#2a2a2a' },
  surfaceDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  surfaceLabel: { width: 50, fontSize: 13, color: '#ffffff' },
  surfaceBarWrap: { flex: 1, height: 6, backgroundColor: '#2a2a2a', borderRadius: 3, overflow: 'hidden', marginHorizontal: 8 },
  surfaceBarFill: { height: '100%', borderRadius: 3 },
  surfaceWL: { fontSize: 13, color: '#ffffff', fontWeight: '600', marginRight: 8 },
  surfacePct: { fontSize: 12, color: '#16a34a', fontWeight: '600', width: 36, textAlign: 'right' },

  // Set stats
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#2a2a2a' },
  setLabel: { width: 100, fontSize: 13, color: '#ffffff' },
  setBarWrap: { flex: 1, height: 6, backgroundColor: '#2a2a2a', borderRadius: 3, overflow: 'hidden', marginHorizontal: 8 },
  setBarFill: { height: '100%', borderRadius: 3, backgroundColor: '#16a34a' },
  setPct: { width: 44, fontSize: 13, fontWeight: '700', color: '#16a34a', textAlign: 'right' },
  setRecord: { width: 56, fontSize: 12, color: '#6b7280', textAlign: 'right' },

  // Match items
  matchItem: { backgroundColor: '#1e1e1e', borderRadius: 10, padding: 12, marginBottom: 8 },
  matchMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  matchTournament: { fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  matchRound: { fontSize: 11, color: '#6b7280' },
  matchContent: { flexDirection: 'row', alignItems: 'center' },
  matchName: { flex: 1, fontSize: 14, color: '#ffffff', textAlign: 'center' },
  matchWin: { color: '#16a34a', fontWeight: '700' },
  matchLose: { color: '#6b7280' },
  matchVsScore: { fontSize: 13, fontWeight: '700', color: '#ffffff', marginHorizontal: 8 },
  matchDate: { textAlign: 'center', color: '#6b7280', fontSize: 11, marginTop: 4 },

  // Equipment
  equipSection: { marginBottom: 14 },
  equipLabel: { fontSize: 13, fontWeight: '600', color: '#9ca3af', marginBottom: 8 },
  equipItem: { flexDirection: 'row', alignItems: 'center', paddingLeft: 4, marginBottom: 8 },
  equipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16a34a', marginRight: 12 },
  equipInfo: { flex: 1 },
  equipBrand: { fontSize: 14, fontWeight: '500', color: '#ffffff' },
  equipYears: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  currentBadge: { backgroundColor: 'rgba(22, 163, 74, 0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  currentText: { fontSize: 10, color: '#16a34a', fontWeight: '600' },
  sponsorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 4 },
  sponsorPill: { backgroundColor: '#121212', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 0.5, borderColor: '#2a2a2a' },
  sponsorText: { fontSize: 13, color: '#ffffff' },
});
