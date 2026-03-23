import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  AccessibilityInfo,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import api from '../../lib/api';
import { getPlayerAvatarUrl } from '../../lib/avatars';
import { PlayerAvatar } from '../../lib/player-avatar';
import { Flag } from '../../lib/flags';
import { useLanguage, TranslationKey } from '../../lib/i18n';
import { SkeletonBlock } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import { isFavorite, toggleFavorite } from '../../lib/favorites';
import {
  getPlayerComments,
  voteTag,
  addCustomTag,
  canVote,
  getHotTag,
  PRESET_TAGS,
  PRESET_TAG_EMOJIS,
  formatCount,
  type PlayerComments,
} from '../../lib/comments';
import { TournamentLogo } from '../../lib/tournament-logo';
import { TennisBallIcon } from '../../lib/illustrations';
import { sharePlayer } from '../../lib/share';
import { theme, radii, breakpoints } from '../../lib/theme';
import { useReducedMotion } from '../../lib/useReducedMotion';
import type { PlayerDetail, MatchWithPlayers, SetStats, TitleEntry, GrandSlamEntry, SeasonMatchEntry, DecidingSetMatchEntry, WinRateByYear, TournamentBestResult, CareerBestWin } from '../../../shared/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const AVATAR_SIZE = 100;
const CHART_HEIGHT = 180;
const PX_PER_POINT = 4;
const MIN_CHART_WIDTH = SCREEN_WIDTH - 64;

const cursor = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};
const webBlur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any) : {};

type TabKey = 'overview' | 'stats' | 'matches' | 'gear' | 'comments';
type TimeRange = '1Y' | '5Y' | '10Y' | 'All';

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

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
function RankingChart({ history, careerHigh, careerHighDate }: { history: { month: string; ranking: number }[]; careerHigh?: number; careerHighDate?: string }) {
  const { t } = useLanguage();
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
      xLabels.push({ index: i, label: year });
    }
  });

  const vGridIndices = xLabels.map((l) => l.index);
  const showAllDots = filtered.length <= 36;
  const ranges: TimeRange[] = ['1Y', '5Y', '10Y', 'All'];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('rankingHistory')}</Text>
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
      {careerHigh != null && (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8, marginBottom: 4, paddingHorizontal: 4, gap: 6 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{t('careerHigh')}:</Text>
          <Text style={{ color: theme.gold, fontSize: 22, fontWeight: '700' }}>#{careerHigh}</Text>
          {careerHighDate && (
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
              — {(() => {
                const [y, m] = careerHighDate.split('-');
                const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                return `${months[parseInt(m, 10) - 1]} ${y}`;
              })()}
            </Text>
          )}
        </View>
      )}
      <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator contentContainerStyle={{ width: dynamicWidth }} style={{ marginTop: 8 }}>
        <Svg width={dynamicWidth} height={CHART_HEIGHT}>
          {yTicks.map((rank) => (
            <Line key={`grid-${rank}`} x1={paddingLeft} y1={getY(rank)} x2={dynamicWidth - paddingRight} y2={getY(rank)} stroke={theme.border} strokeWidth={1} />
          ))}
          {vGridIndices.map((idx) => (
            <Line key={`vgrid-${idx}`} x1={getX(idx)} y1={paddingTop} x2={getX(idx)} y2={paddingTop + plotH} stroke={theme.border} strokeWidth={1} />
          ))}
          {yTicks.map((rank) => (
            <SvgText key={`ylabel-${rank}`} x={paddingLeft - 6} y={getY(rank) + 4} fill={theme.textSecondary} fontSize={10} textAnchor="end">#{rank}</SvgText>
          ))}
          {xLabels.map(({ index, label }) => (
            <SvgText key={`xlabel-${index}`} x={getX(index)} y={CHART_HEIGHT - 4} fill={theme.textSecondary} fontSize={9} textAnchor="middle">{label}</SvgText>
          ))}
          <Polyline points={polylinePoints} fill="none" stroke={theme.accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {showAllDots
            ? points.map((p, i) => <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r={i === lastIdx ? 5 : 3} fill={i === lastIdx ? '#16a34a' : '#121212'} stroke={theme.accent} strokeWidth={1.5} />)
            : [0, lastIdx].map((i) => <Circle key={`dot-${i}`} cx={points[i].x} cy={points[i].y} r={i === lastIdx ? 5 : 3} fill={i === lastIdx ? '#16a34a' : '#121212'} stroke={theme.accent} strokeWidth={1.5} />)
          }
          <SvgText x={points[lastIdx].x} y={points[lastIdx].y - 10} fill={theme.accent} fontSize={11} fontWeight="bold" textAnchor="middle">#{filtered[lastIdx].ranking}</SvgText>
        </Svg>
      </ScrollView>
    </View>
  );
}

// ─── Stat Detail Panels ──────────────────────────────────────────────
type StatKey = 'ranking' | 'grandSlams' | 'titles' | 'winRate' | 'seasonWL' | 'prizeMoney';

function MatchRow({ result, children }: { result?: 'W' | 'L'; children: React.ReactNode }) {
  return (
    <View style={[
      styles.detailRow,
      result === 'W' && styles.detailRowWin,
      result === 'L' && styles.detailRowLoss,
    ]}>
      {children}
    </View>
  );
}

function GrandSlamsPanel({ data, router }: { data: GrandSlamEntry[]; router: any }) {
  const { t } = useLanguage();
  if (!data || data.length === 0) return <Text style={styles.detailEmpty}>{t('noGrandSlamData')}</Text>;
  return (
    <View style={styles.detailPanel}>
      {data.map((gs, i) => (
        <MatchRow key={i} result="W">
          <Text style={styles.detailYear}>{gs.year}</Text>
          <TournamentLogo tournamentName={gs.tournament} size="sm" />
          <TouchableOpacity
            style={{ marginLeft: 6, flexShrink: 1 }}
            activeOpacity={gs.tournamentId ? 0.7 : 1}
            onPress={() => gs.tournamentId && router.push(`/tournament/${gs.tournamentId}`)}
          >
            <Text style={[styles.detailTournament, gs.tournamentId && styles.detailTournamentLink]} numberOfLines={1}>
              {gs.tournament}{gs.round ? ` \u2022 ` : ''}
              {gs.round ? <Text style={styles.roundLabel}>{gs.round}</Text> : null}
            </Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.detailOpponent}>vs {gs.opponent}</Text>
            <Text style={styles.detailScore}>{gs.score}</Text>
          </View>
        </MatchRow>
      ))}
    </View>
  );
}

function TitlesPanel({ data, router }: { data: TitleEntry[]; router: any }) {
  const { t } = useLanguage();
  if (!data || data.length === 0) return <Text style={styles.detailEmpty}>{t('noTitlesData')}</Text>;
  const grouped = data.reduce((acc, t) => {
    if (!acc[t.year]) acc[t.year] = [];
    acc[t.year].push(t);
    return acc;
  }, {} as Record<number, TitleEntry[]>);
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  return (
    <View style={styles.detailPanel}>
      {years.map((year) => (
        <View key={year}>
          <Text style={styles.detailYearHeader}>{year} ({grouped[year].length})</Text>
          {grouped[year].map((t, i) => (
            <MatchRow key={i} result="W">
              <TournamentLogo tournamentName={t.tournament} size="sm" />
              <TouchableOpacity
                style={{ flex: 1, marginLeft: 6 }}
                activeOpacity={t.tournamentId ? 0.7 : 1}
                onPress={() => t.tournamentId && router.push(`/tournament/${t.tournamentId}`)}
              >
                <Text style={[styles.detailTournament, t.tournamentId && styles.detailTournamentLink]}>{t.tournament}</Text>
                <Text style={styles.detailSurface}>{t.surface}</Text>
              </TouchableOpacity>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.detailOpponent}>vs {t.final_opponent}</Text>
                <Text style={styles.detailScore}>{t.score}</Text>
              </View>
            </MatchRow>
          ))}
        </View>
      ))}
    </View>
  );
}

function WinRatePanel({ data }: { data: WinRateByYear[] }) {
  const { t } = useLanguage();
  if (!data || data.length === 0) return <Text style={styles.detailEmpty}>{t('noWinRateData')}</Text>;
  return (
    <View style={styles.detailPanel}>
      {data.map((yr, i) => (
        <View key={i} style={styles.detailRow}>
          <Text style={styles.detailYear}>{yr.year}</Text>
          <View style={[styles.barTrack, { flex: 1, marginHorizontal: 8 }]}>
            <View style={[styles.barFill, { width: `${yr.winRate}%` }]} />
          </View>
          <Text style={styles.detailWinRate}>{yr.winRate}%</Text>
          <Text style={styles.detailRecord}>{yr.wins}-{yr.losses}</Text>
        </View>
      ))}
    </View>
  );
}

function SeasonMatchesPanel({ data, router }: { data: SeasonMatchEntry[]; router: any }) {
  const { t } = useLanguage();
  if (!data || data.length === 0) return <Text style={styles.detailEmpty}>{t('noSeasonData')}</Text>;
  return (
    <View style={styles.detailPanel}>
      {data.map((m, i) => (
        <TouchableOpacity
          key={i}
          activeOpacity={m.matchId ? 0.7 : 1}
          onPress={() => m.matchId && router.push(`/match/${m.matchId}`)}
        >
          <MatchRow result={m.result}>
            <Text style={styles.detailDate}>{m.date.slice(5)}</Text>
            <TournamentLogo tournamentName={m.tournament} size="sm" />
            <TouchableOpacity
              style={{ flex: 1, marginLeft: 6 }}
              activeOpacity={m.tournamentId ? 0.7 : 1}
              onPress={(e) => { e.stopPropagation?.(); m.tournamentId && router.push(`/tournament/${m.tournamentId}`); }}
            >
              <Text style={[styles.detailTournament, m.tournamentId && styles.detailTournamentLink]} numberOfLines={1}>
                {m.tournament}{m.round ? ` \u2022 ` : ''}
                {m.round ? <Text style={styles.roundLabel}>{m.round}</Text> : null}
              </Text>
              <Text style={styles.detailOpponent}>vs {m.opponent}</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.detailResult, m.result === 'W' ? { color: theme.text } : { color: theme.red }]}>{m.result}</Text>
              <Text style={styles.detailScore}>{m.score}</Text>
            </View>
          </MatchRow>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function PrizeMoneyPanel({ prizeMoney }: { prizeMoney?: string }) {
  const { t } = useLanguage();
  // Mock seasonal prize money data
  const seasonalData = [
    { year: 2024, amount: '$12,345,678' },
    { year: 2023, amount: '$15,234,567' },
    { year: 2022, amount: '$9,876,543' },
    { year: 2021, amount: '$7,654,321' },
    { year: 2020, amount: '$3,210,987' },
  ];

  return (
    <View style={styles.detailPanel}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 8 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600' }}>{t('careerTotal')}</Text>
        <Text style={{ color: theme.gold, fontSize: 16, fontWeight: '700' }}>{prizeMoney || '--'}</Text>
      </View>
      {seasonalData.map((s) => (
        <View key={s.year} style={[styles.detailRow, { borderLeftColor: 'transparent' }]}>
          <Text style={styles.detailYear}>{s.year}</Text>
          <View style={{ flex: 1 }} />
          <Text style={{ color: theme.gold, fontSize: 13, fontWeight: '600' }}>{s.amount}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Ranking Points Panel ────────────────────────────────────────────
interface RankingPointEntry {
  tournament: string;
  tournamentId: number;
  round: string;
  points: number;
}

function RankingPointsPanel({ points, router }: { points: RankingPointEntry[]; router: any }) {
  const sorted = [...points].sort((a, b) => b.points - a.points);
  const total = sorted.reduce((sum, p) => sum + p.points, 0);

  return (
    <View style={styles.detailPanel}>
      <Text style={{ fontSize: 13, fontWeight: '600' as const, color: theme.text, marginBottom: 10 }}>
        Ranking Points Breakdown
      </Text>
      {sorted.map((p, i) => (
        <View key={i} style={styles.detailRow}>
          <TournamentLogo tournamentName={p.tournament} size="sm" />
          <TouchableOpacity
            style={{ flex: 1, marginLeft: 6 }}
            activeOpacity={p.tournamentId ? 0.7 : 1}
            onPress={() => p.tournamentId && router.push(`/tournament/${p.tournamentId}`)}
          >
            <Text style={[styles.detailTournament, p.tournamentId && styles.detailTournamentLink]} numberOfLines={1}>
              {p.tournament}
            </Text>
            <Text style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{p.round}</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 14, fontWeight: '700' as const, color: theme.gold }}>{p.points}</Text>
            <Text style={{ fontSize: 10, color: '#888' }}>pts</Text>
          </View>
        </View>
      ))}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        marginTop: 6,
        borderTopWidth: 1,
        borderTopColor: theme.border,
      }}>
        <Text style={{ fontSize: 13, fontWeight: '600' as const, color: theme.text }}>Total Points</Text>
        <Text style={{ fontSize: 16, fontWeight: '700' as const, color: theme.gold }}>{total.toLocaleString()}</Text>
      </View>
    </View>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────
function OverviewTab({ player, router }: { player: PlayerDetail; router: any }) {
  const { t } = useLanguage();
  const [expandedStat, setExpandedStat] = useState<StatKey | null>(null);
  const reduceMotion = useReducedMotion();
  const { width: screenW } = useWindowDimensions();
  const isLg = screenW >= breakpoints.lg;
  const record = player.record;
  const seasonWL = record ? `${record.season.wins}-${record.season.losses}` : '--';
  const careerWins = record ? record.career.wins : 0;
  const careerTotal = record ? record.career.wins + record.career.losses : 1;
  const winRate = record ? `${((careerWins / careerTotal) * 100).toFixed(0)}%` : '--';
  const playerPrizeMoney = (player as any).prizeMoney as string | undefined;

  const toggleStat = (key: StatKey) => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpandedStat(expandedStat === key ? null : key);
  };

  const statCards: { key: StatKey; value: string; label: string; color?: string }[] = [
    { key: 'ranking', value: `#${player.ranking}`, label: t('ranking') },
    { key: 'grandSlams', value: `${player.grandSlams}`, label: t('grandSlams'), color: theme.gold },
    { key: 'titles', value: `${player.titles}`, label: t('titles') },
    { key: 'winRate', value: winRate, label: t('winRate') },
    { key: 'seasonWL', value: seasonWL, label: t('seasonWL') },
    { key: 'prizeMoney', value: playerPrizeMoney || '--', label: t('prizeMoney'), color: theme.gold },
  ];

  const renderExpandedContent = () => {
    if (!expandedStat) return null;
    switch (expandedStat) {
      case 'ranking':
        return (
          <>
            {player.rankingHistory && player.rankingHistory.length > 0 && (
              <RankingChart history={player.rankingHistory} careerHigh={(player as any).careerHigh} careerHighDate={(player as any).careerHighDate} />
            )}
            {(player as any).rankingPoints && (player as any).rankingPoints.length > 0 && (
              <RankingPointsPanel points={(player as any).rankingPoints} router={router} />
            )}
          </>
        );
      case 'grandSlams':
        return <GrandSlamsPanel data={(player as any).grandSlamsList || []} router={router} />;
      case 'titles':
        return <TitlesPanel data={(player as any).titlesList || []} router={router} />;
      case 'winRate':
        return <WinRatePanel data={(player as any).winRateByYear || []} />;
      case 'seasonWL':
        return <SeasonMatchesPanel data={(player as any).seasonMatches || []} router={router} />;
      case 'prizeMoney':
        return <PrizeMoneyPanel prizeMoney={(player as any).prizeMoney} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* 6-cell Stats Grid — responsive: 3x2 default, 6x1 at lg+ */}
      <View style={[styles.statsGrid, isLg && styles.statsGridWide]}>
        {statCards.map((card) => (
          <TouchableOpacity
            key={card.key}
            style={[
              styles.statCell,
              isLg && styles.statCellWide,
              expandedStat === card.key && styles.statCellActive,
            ]}
            onPress={() => toggleStat(card.key)}
            activeOpacity={0.7}
            accessibilityLabel={`${card.label}: ${card.value}`}
            accessibilityRole="button"
            accessibilityHint="Tap to expand details"
          >
            <Text style={[styles.statNumber, card.color ? { color: card.color } : undefined]}>
              {card.value}
            </Text>
            <Text style={styles.statLabel}>{card.label}</Text>
            <Text style={[
              styles.statArrow,
              expandedStat === card.key && styles.statArrowActive,
            ]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Expanded Detail */}
      {renderExpandedContent()}

      {/* Bio */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('info')}</Text>
        <InfoRow label={t('nationality')} value={`${player.country}`} />
        <InfoRow label={t('height')} value={`${player.height} cm`} />
        <InfoRow label={t('weight')} value={`${player.weight} kg`} />
        <InfoRow label={t('plays')} value={player.plays} />
        <InfoRow label={t('backhand')} value={player.backhand} />
        {player.birthplace && <InfoRow label={t('birthplace')} value={player.birthplace} />}
        {player.coach && <InfoRow label={t('coach')} value={player.coach} />}
      </View>
    </>
  );
}

// ─── Round sorting helper ────────────────────────────────────────────
const ROUND_ORDER: Record<string, number> = {
  'Winner': 0, 'Final': 1, 'Semi-Final': 2, 'Quarter-Final': 3,
  'R16': 4, 'R32': 5, 'R64': 6, 'R128': 7,
};

function getRoundColor(round: string): string {
  if (round === 'Winner') return '#c9a84c';
  if (round === 'Final') return '#ffffff';
  return '#888';
}

// ─── Stats Tab ───────────────────────────────────────────────────────
function StatsTab({ player }: { player: PlayerDetail }) {
  const { t } = useLanguage();
  const router = useRouter();
  const record = player.record;
  const setStats = (player as any).setStats as SetStats | undefined;
  const tournamentResults = (player as any).tournamentBestResults as TournamentBestResult[] | undefined;
  const careerBestWins = (player as any).careerBestWins as CareerBestWin[] | undefined;

  const sortedResults = useMemo(() => {
    if (!tournamentResults) return [];
    return [...tournamentResults].sort((a, b) => {
      const orderA = ROUND_ORDER[a.bestRound] ?? 99;
      const orderB = ROUND_ORDER[b.bestRound] ?? 99;
      return orderA - orderB;
    });
  }, [tournamentResults]);

  return (
    <>
      {/* Surface Win Rate */}
      {record && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('surfaceWinRate')}</Text>
          {[
            { label: t('hard'), data: record.bySurface.hard, color: theme.blue },
            { label: t('clay'), data: record.bySurface.clay, color: '#c17b3a' },
            { label: t('grass'), data: record.bySurface.grass, color: '#4caf50' },
          ].map((s) => {
            const total = s.data.wins + s.data.losses;
            const pct = total > 0 ? Math.round((s.data.wins / total) * 100) : 0;
            return (
              <View key={s.label} style={styles.barRow}>
                <Text style={styles.barLabel}>{s.label}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: s.color }]} />
                </View>
                <Text style={styles.barValue}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Set Statistics */}
      {setStats && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('setStatistics')}</Text>
          {[
            { key: 'straightSets', label: t('straightSets'), data: setStats.straightSets },
            { key: 'threeSets', label: t('threeSets'), data: setStats.threeSets },
            { key: 'fourSets', label: t('fourSets'), data: setStats.fourSets },
            { key: 'fiveSets', label: t('fiveSets'), data: setStats.fiveSets },
            { key: 'decidingSet', label: t('decidingSet'), data: setStats.decidingSet },
          ].map((row) => {
            const losses = row.data.total - row.data.wins;
            return (
              <View key={row.key} style={styles.barRow}>
                <Text style={[styles.barLabel, { width: 100 }]}>{row.label}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${row.data.winRate}%` }]} />
                </View>
                <Text style={styles.barPct}>{row.data.winRate.toFixed(1)}%</Text>
                <Text style={styles.barRecord}>({row.data.wins}-{losses})</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Tournament Results */}
      {sortedResults.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tournament Results</Text>
          {sortedResults.map((tr, i) => (
            <View key={i} style={styles.tournamentResultRow}>
              <TournamentLogo tournamentName={tr.tournament} size="sm" />
              <TouchableOpacity
                style={{ flex: 1, marginLeft: 8 }}
                activeOpacity={tr.tournamentId ? 0.7 : 1}
                onPress={() => tr.tournamentId && router.push(`/tournament/${tr.tournamentId}`)}
              >
                <Text style={[styles.tournamentResultName, tr.tournamentId && styles.detailTournamentLink]} numberOfLines={1}>
                  {tr.tournament}
                </Text>
              </TouchableOpacity>
              <View style={[styles.roundBadge, { backgroundColor: tr.bestRound === 'Winner' ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.06)' }]}>
                <Text style={[styles.roundBadgeText, { color: getRoundColor(tr.bestRound) }]}>
                  {tr.bestRound}
                </Text>
              </View>
              <Text style={styles.tournamentResultYear}>{tr.year}</Text>
              <Text style={styles.tournamentResultCount}>{tr.count}×</Text>
            </View>
          ))}
        </View>
      )}

      {/* Career Best Wins */}
      {careerBestWins && careerBestWins.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Career Best Wins</Text>
          {careerBestWins.slice(0, 5).map((win, i) => (
            <View key={i} style={styles.careerWinCard}>
              <View style={styles.careerWinHeader}>
                <Text style={styles.careerWinTournament}>{win.tournament}</Text>
                <Text style={styles.careerWinMeta}>{win.year} · {win.round}</Text>
              </View>
              <View style={styles.careerWinBody}>
                <Text style={styles.careerWinVs}>vs </Text>
                {win.opponentId ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push(`/player/${win.opponentId}`)}
                  >
                    <Text style={[styles.careerWinOpponent, styles.detailTournamentLink]}>{win.opponent}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.careerWinOpponent}>{win.opponent}</Text>
                )}
                <View style={{ flex: 1 }} />
                <Text style={styles.careerWinScore}>{win.score}</Text>
              </View>
              <Text style={styles.careerWinSignificance}>{win.significance}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

// ─── Matches Tab ─────────────────────────────────────────────────────
function MatchesTab({ player, getPlayerName, router }: { player: PlayerDetail; getPlayerName: (p: any) => string; router: any }) {
  const { t } = useLanguage();
  if (!player.recentMatches || player.recentMatches.length === 0) {
    return <EmptyState message={t('noRecentMatches')} />;
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
              <TouchableOpacity
                activeOpacity={match.tournament?.id ? 0.7 : 1}
                onPress={(e) => { e.stopPropagation?.(); match.tournament?.id && router.push(`/tournament/${match.tournament.id}`); }}
              >
                <Text style={[styles.matchTournament, match.tournament?.id && styles.matchTournamentLink]}>{match.tournament?.name || 'Tournament'}</Text>
              </TouchableOpacity>
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

// ─── Gear Tab ────────────────────────────────────────────────────────
function GearTab({ player, router }: { player: PlayerDetail; router: any }) {
  const { t } = useLanguage();
  const equipment = (player as any).equipment;
  if (!equipment) return <EmptyState message={t('noEquipmentData')} />;

  const renderTimeline = (items: { brand: string; from: number; to: number | null }[], label: string, icon: string) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.equipSection}>
        <Text style={styles.equipLabel}>{label}</Text>
        {items.map((item, i) => (
          <View key={i} style={styles.equipItem}>
            <Text style={{ fontSize: 16 }}>{icon}</Text>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => router.push(`/brand/${encodeURIComponent(item.brand)}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.equipBrand}>{item.brand}</Text>
              <Text style={styles.equipYears}>{item.from} — {item.to || t('present')}</Text>
            </TouchableOpacity>
            {!item.to && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentText}>{t('current')}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('equipmentAndSponsors')}</Text>
      {renderTimeline(equipment.apparel, t('apparel'), '')}
      {renderTimeline(equipment.shoes, t('shoes'), '')}
      {equipment.racket && (
        <View style={styles.equipSection}>
          <Text style={styles.equipLabel}>{t('racket')}</Text>
          <View style={styles.equipItem}>
            <Text style={{ fontSize: 16 }}>{'\uD83C\uDFBE'}</Text>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => router.push(`/brand/${encodeURIComponent(equipment.racket.brand)}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.equipBrand}>{equipment.racket.brand}</Text>
              <Text style={styles.equipYears}>{equipment.racket.model}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {equipment.watch && (
        <View style={styles.equipSection}>
          <Text style={styles.equipLabel}>{t('watch')}</Text>
          <View style={styles.equipItem}>
            <Text style={{ fontSize: 16 }}>{'\u231A'}</Text>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => router.push(`/brand/${encodeURIComponent(equipment.watch)}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.equipBrand}>{equipment.watch}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {equipment.otherSponsors && equipment.otherSponsors.length > 0 && (
        <View style={styles.equipSection}>
          <Text style={styles.equipLabel}>{t('otherSponsors')}</Text>
          <View style={styles.sponsorRow}>
            {equipment.otherSponsors.map((s: string, i: number) => (
              <TouchableOpacity
                key={i}
                style={styles.sponsorPill}
                onPress={() => router.push(`/brand/${encodeURIComponent(s)}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.sponsorText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Comments Tab ────────────────────────────────────────────────────
function CommentsTab({ playerId }: { playerId: number }) {
  const { t } = useLanguage();
  const [comments, setComments] = useState<PlayerComments | null>(null);
  const [votable, setVotable] = useState(true);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    loadComments();
  }, [playerId]);

  const loadComments = async () => {
    const c = await getPlayerComments(playerId);
    setComments(c);
    const cv = await canVote(playerId);
    setVotable(cv);
  };

  const handleVote = async (tag: string) => {
    if (!votable) {
      Alert.alert(t('cooldown'), t('cooldownAlert'));
      return;
    }
    const success = await voteTag(playerId, tag);
    if (success) {
      await loadComments();
    }
  };

  const handleCustomTag = async () => {
    const tag = customInput.trim();
    if (!tag) return;
    if (!votable) {
      Alert.alert(t('cooldown'), t('cooldownAlert'));
      return;
    }
    await addCustomTag(playerId, tag);
    setCustomInput('');
    await loadComments();
  };

  const totalVotes = comments ? Object.values(comments.tags).reduce((a, b) => a + b, 0) : 0;
  const sortedTags = comments
    ? Object.entries(comments.tags).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <>
      {/* Preset Tag Buttons */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('quickVote')}</Text>
        {!votable && <Text style={styles.cooldownText}>{t('cooldownMessage')}</Text>}
        <View style={styles.tagGrid}>
          {PRESET_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagBtn, !votable && styles.tagBtnDisabled]}
              onPress={() => handleVote(tag)}
              activeOpacity={0.7}
            >
              <Text style={styles.tagBtnText}>
                {PRESET_TAG_EMOJIS[tag]} {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom Tag Input */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('customTag')}</Text>
        <View style={styles.customInputRow}>
          <TextInput
            style={styles.customInput}
            placeholder={t('addYourTag')}
            placeholderTextColor="#666"
            value={customInput}
            onChangeText={setCustomInput}
            maxLength={30}
          />
          <TouchableOpacity style={styles.customSubmitBtn} onPress={handleCustomTag} activeOpacity={0.7}>
            <Text style={styles.customSubmitText}>{t('add')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rankings */}
      {sortedTags.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('popularTags')}</Text>
          {sortedTags.map(([tag, count], idx) => {
            const pct = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : '0';
            const emoji = PRESET_TAG_EMOJIS[tag] || '';
            return (
              <View key={tag} style={styles.tagRankRow}>
                <Text style={styles.tagRankNum}>#{idx + 1}</Text>
                <Text style={styles.tagRankName}>{emoji} {tag}</Text>
                <View style={styles.tagBarWrap}>
                  <View style={[styles.tagBarFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.tagRankPct}>{pct}%</Text>
                <Text style={styles.tagRankCount}>{formatCount(count)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────
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
  const { getPlayerName, resolvedLanguage, t } = useLanguage();
  const [isFav, setIsFav] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [hotTag, setHotTag] = useState<{ tag: string; emoji: string; count: number } | null>(null);

  const { data: player, isLoading, error } = useQuery<PlayerDetail>({
    queryKey: ['player', id],
    queryFn: async () => {
      const res = await api.get(`/api/players/${id}`);
      return res.data;
    },
  });

  useEffect(() => {
    if (id) {
      isFavorite(parseInt(id)).then(setIsFav);
      getHotTag(parseInt(id)).then(setHotTag);
    }
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
        <EmptyState message={t('failedToLoadPlayer')} />
      </View>
    );
  }

  const avatarUrl = getPlayerAvatarUrl(player.name, player.photoUrl, AVATAR_SIZE * 2);
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: t('overview') },
    { key: 'stats', label: t('stats') },
    { key: 'matches', label: t('matches') },
    { key: 'gear', label: t('gear') },
    { key: 'comments', label: t('comments') },
  ];

  // Calculate age
  const birthYear = player.birthdate ? new Date(player.birthdate).getFullYear() : null;
  const age = birthYear ? new Date().getFullYear() - birthYear : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: getPlayerName(player),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => sharePlayer({
                  name: getPlayerName(player),
                  ranking: player.ranking,
                  grandSlams: player.grandSlams,
                  titles: player.titles,
                })}
                activeOpacity={theme.activeOpacity}
                style={{ padding: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}) }}
                accessibilityLabel="Share player"
                accessibilityRole="button"
              >
                <Text style={{ fontSize: 18 }}>📤</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleToggleFavorite}
                activeOpacity={theme.activeOpacity}
                style={{ padding: 8, marginRight: 4, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}) }}
                accessibilityLabel={isFav ? 'Remove from favorites' : 'Add to favorites'}
                accessibilityRole="button"
              >
                <Text style={{ fontSize: 18, color: isFav ? '#ef4444' : theme.textSecondary }}>{isFav ? '\u2665' : '\u2661'}</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header — gradient layers */}
        <View style={styles.header}>
          {/* Gradient simulation: purple -> blue -> bg */}
          <View style={styles.gradientLayer1} />
          <View style={styles.gradientLayer2} />
          <View style={styles.gradientLayer3} />
          {/* Decorative tennis ball */}
          <View style={styles.headerDecor}>
            <TennisBallIcon size={60} opacity={0.03} />
          </View>
          {/* Decorative circle */}
          <View style={styles.headerCircle} />
          <View style={styles.bigAvatar}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              accessibilityLabel={`${getPlayerName(player)} photo`}
            />
          </View>
          <Text style={styles.playerName}>{getPlayerName(player)}</Text>
          {resolvedLanguage !== 'en' && getPlayerName(player) !== player.name && (
            <Text style={styles.playerNameEn}>{player.name}</Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Flag country={player.country} countryFlag={player.countryFlag} size={16} />
            <Text style={styles.subtitle}>
            {player.country}
            {age ? ` \u2022 Age ${age}` : ''}
            {player.plays ? ` \u2022 ${player.plays}` : ''}
          </Text>
          </View>
          {hotTag && (
            <View style={styles.hotTagBadge}>
              <Text style={styles.hotTagText}>
                {hotTag.emoji} {hotTag.tag} ({formatCount(hotTag.count)})
              </Text>
            </View>
          )}
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
          {activeTab === 'overview' && <OverviewTab player={player} router={router} />}
          {activeTab === 'stats' && <StatsTab player={player} />}
          {activeTab === 'matches' && <MatchesTab player={player} getPlayerName={getPlayerName} router={router} />}
          {activeTab === 'gear' && <GearTab player={player} router={router} />}
          {activeTab === 'comments' && <CommentsTab playerId={parseInt(id)} />}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { paddingBottom: 40 },
  center: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },

  // Header — gradient background
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.bg,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  gradientLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#141020',
    opacity: 0.7,
  },
  gradientLayer2: {
    position: 'absolute' as const,
    top: '30%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0d1520',
    opacity: 0.6,
  },
  gradientLayer3: {
    position: 'absolute' as const,
    top: '60%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.bg,
  },
  headerCircle: {
    position: 'absolute' as const,
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  headerDecor: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    zIndex: 1,
  },
  bigAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.avatarLg,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginBottom: 12,
    zIndex: 1,
    // elevation shadow
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.5)' } as any : {}),
  },
  avatarImage: {
    width: AVATAR_SIZE - 6,
    height: AVATAR_SIZE - 6,
    borderRadius: radii.avatarLg - 2,
  },
  playerName: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
    zIndex: 1,
  },
  playerNameEn: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
    zIndex: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
    zIndex: 1,
  },
  hotTagBadge: {
    backgroundColor: 'rgba(201,168,76,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  hotTagText: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: '500',
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    ...cursor,
  },
  tabActive: {
    borderBottomColor: '#16a34a',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },
  tabTextActive: {
    color: theme.accent,
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },

  // Stats Grid (6-cell, 3 columns default, 6x1 at lg+)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.border,
    borderRadius: radii.card,
    overflow: 'hidden',
    gap: 1,
    marginBottom: 16,
  },
  statsGridWide: {
    flexWrap: 'nowrap',
  },
  statCell: {
    backgroundColor: theme.glass,
    width: (SCREEN_WIDTH - 34) / 3,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative' as const,
    ...cursor,
    ...webBlur,
  },
  statCellWide: {
    flex: 1,
    width: 'auto' as any,
  },
  statCellActive: {
    backgroundColor: theme.cardHover,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  statArrow: {
    position: 'absolute' as const,
    bottom: 4,
    right: 6,
    fontSize: 14,
    color: '#444',
  },
  statArrowActive: {
    color: theme.text,
    transform: [{ rotate: '90deg' }],
  },

  // Detail panels
  detailPanel: {
    backgroundColor: theme.glass,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    padding: 12,
    marginBottom: 12,
    ...webBlur,
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  detailRowWin: {
    borderLeftColor: '#16a34a',
  },
  detailRowLoss: {
    borderLeftColor: '#e53935',
  },
  detailEmpty: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  detailYear: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600' as const,
    width: 40,
  },
  detailYearHeader: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '600' as const,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  detailTournament: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  detailTournamentLink: {
    color: theme.linkBlue,
    textDecorationLine: 'underline' as const,
  },
  detailSurface: {
    color: '#888',
    fontSize: 11,
    marginTop: 1,
  },
  detailOpponent: {
    color: '#888',
    fontSize: 12,
  },
  detailScore: {
    color: '#888',
    fontSize: 11,
    marginTop: 1,
  },
  detailDate: {
    color: '#888',
    fontSize: 11,
    width: 42,
  },
  detailResult: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  detailWinRate: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '700' as const,
    width: 44,
    textAlign: 'right' as const,
  },
  detailRecord: {
    color: '#888',
    fontSize: 12,
    width: 44,
    textAlign: 'right' as const,
  },
  detailDecidingScore: {
    color: theme.gold,
    fontSize: 10,
    marginTop: 1,
  },

  // Card — glass effect
  card: {
    backgroundColor: theme.glass,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    padding: 16,
    marginBottom: 12,
    ...webBlur,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: theme.text, fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: 12 },

  // Chart pills
  pillRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: theme.bg },
  pillActive: { backgroundColor: theme.accent },
  pillText: { fontSize: 12, fontWeight: '600', color: '#888' },
  pillTextActive: { color: theme.text },

  // Progress bars
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  barLabel: { width: 60, fontSize: 12, color: '#888' },
  barTrack: { flex: 1, height: 6, backgroundColor: theme.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: theme.accent, borderRadius: 3 },
  barValue: { width: 40, fontSize: 13, fontWeight: '600', textAlign: 'right', color: theme.text },
  barPct: { width: 44, fontSize: 13, fontWeight: '700', color: theme.text, textAlign: 'right' },
  barRecord: { width: 56, fontSize: 12, color: '#888', textAlign: 'right' },

  // Match items — glass
  matchItem: { backgroundColor: theme.glass, borderRadius: radii.card, borderWidth: 1, borderColor: theme.glassBorder, padding: 12, marginBottom: 8, ...cursor },
  matchMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  matchTournament: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  matchTournamentLink: { color: theme.linkBlue, textDecorationLine: 'underline' as const },
  matchRound: { fontSize: 11, color: '#888' },
  matchContent: { flexDirection: 'row', alignItems: 'center' },
  matchName: { flex: 1, fontSize: 14, color: theme.text, textAlign: 'center' },
  matchWin: { color: theme.text, fontWeight: '700' },
  matchLose: { color: '#888' },
  matchVsScore: { fontSize: 13, fontWeight: '700', color: theme.text, marginHorizontal: 8 },
  matchDate: { textAlign: 'center', color: '#888', fontSize: 11, marginTop: 4 },

  // Equipment
  equipSection: { marginBottom: 14 },
  equipLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 8 },
  equipItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e1e1e' },
  equipBrand: { fontSize: 13, fontWeight: '500', color: theme.blue },
  equipYears: { fontSize: 12, color: '#888', marginTop: 1 },
  currentBadge: { backgroundColor: theme.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  currentText: { fontSize: 11, color: '#aaa', fontWeight: '600' },
  sponsorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sponsorPill: { backgroundColor: theme.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 0.5, borderColor: theme.border },
  sponsorText: { fontSize: 13, color: theme.blue },

  // Comments Tab
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBtn: { backgroundColor: theme.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: theme.border },
  tagBtnDisabled: { opacity: 0.5 },
  tagBtnText: { fontSize: 13, color: theme.text },
  cooldownText: { fontSize: 12, color: theme.red, marginBottom: 8 },
  customInputRow: { flexDirection: 'row', gap: 8 },
  customInput: { flex: 1, backgroundColor: theme.bg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: theme.text, fontSize: 14 },
  customSubmitBtn: { backgroundColor: theme.accent, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  customSubmitText: { color: theme.text, fontWeight: '600', fontSize: 14 },
  tagRankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: theme.border, gap: 8 },
  tagRankNum: { width: 28, fontSize: 12, color: '#888', fontWeight: '600' },
  tagRankName: { width: 110, fontSize: 13, color: theme.text },
  tagBarWrap: { flex: 1, height: 6, backgroundColor: theme.border, borderRadius: 3, overflow: 'hidden' },
  tagBarFill: { height: '100%', borderRadius: 3, backgroundColor: theme.accent },
  tagRankPct: { width: 40, fontSize: 12, fontWeight: '600', color: theme.text, textAlign: 'right' },
  tagRankCount: { width: 40, fontSize: 11, color: '#888', textAlign: 'right' },
  roundLabel: { fontSize: 11, color: '#888', fontWeight: '400' as const },

  // Tournament Results
  tournamentResultRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    gap: 6,
  },
  tournamentResultName: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: theme.text,
  },
  roundBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roundBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  tournamentResultYear: {
    fontSize: 11,
    color: '#888',
    width: 34,
    textAlign: 'right' as const,
  },
  tournamentResultCount: {
    fontSize: 11,
    color: '#888',
    width: 24,
    textAlign: 'right' as const,
  },

  // Career Best Wins
  careerWinCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: theme.border,
  },
  careerWinHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  careerWinTournament: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: theme.text,
  },
  careerWinMeta: {
    fontSize: 11,
    color: '#888',
  },
  careerWinBody: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  careerWinVs: {
    fontSize: 12,
    color: '#888',
  },
  careerWinOpponent: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: theme.text,
  },
  careerWinScore: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: theme.text,
  },
  careerWinSignificance: {
    fontSize: 11,
    fontStyle: 'italic' as const,
    color: '#666',
    marginTop: 2,
  },
});
