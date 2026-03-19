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
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import api from '../../lib/api';
import { getPlayerAvatarUrl } from '../../lib/avatars';
import { PlayerAvatar } from '../../lib/player-avatar';
import { Flag } from '../../lib/flags';
import { useLanguage } from '../../lib/i18n';
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
import { theme } from '../../lib/theme';
import type { PlayerDetail, MatchWithPlayers, SetStats, TitleEntry, GrandSlamEntry, SeasonMatchEntry, DecidingSetMatchEntry, WinRateByYear } from '../../../shared/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const AVATAR_SIZE = 100;
const CHART_HEIGHT = 180;
const PX_PER_POINT = 4;
const MIN_CHART_WIDTH = SCREEN_WIDTH - 64;

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
      {careerHigh != null && (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8, marginBottom: 4, paddingHorizontal: 4, gap: 6 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Career High:</Text>
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
  if (!data || data.length === 0) return <Text style={styles.detailEmpty}>No grand slam data</Text>;
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
  if (!data || data.length === 0) return <Text style={styles.detailEmpty}>No titles data</Text>;
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
  if (!data || data.length === 0) return <Text style={styles.detailEmpty}>No win rate data</Text>;
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
  if (!data || data.length === 0) return <Text style={styles.detailEmpty}>No season data</Text>;
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
        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600' }}>Career Total</Text>
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

// ─── Overview Tab ────────────────────────────────────────────────────
function OverviewTab({ player, router }: { player: PlayerDetail; router: any }) {
  const [expandedStat, setExpandedStat] = useState<StatKey | null>(null);
  const record = player.record;
  const seasonWL = record ? `${record.season.wins}-${record.season.losses}` : '--';
  const careerWins = record ? record.career.wins : 0;
  const careerTotal = record ? record.career.wins + record.career.losses : 1;
  const winRate = record ? `${((careerWins / careerTotal) * 100).toFixed(0)}%` : '--';
  const playerPrizeMoney = (player as any).prizeMoney as string | undefined;

  const toggleStat = (key: StatKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedStat(expandedStat === key ? null : key);
  };

  const statCards: { key: StatKey; value: string; label: string; color?: string }[] = [
    { key: 'ranking', value: `#${player.ranking}`, label: 'Ranking' },
    { key: 'grandSlams', value: `${player.grandSlams}`, label: 'Grand Slams', color: theme.gold },
    { key: 'titles', value: `${player.titles}`, label: 'Titles' },
    { key: 'winRate', value: winRate, label: 'Win Rate' },
    { key: 'seasonWL', value: seasonWL, label: 'Season W-L' },
    { key: 'prizeMoney', value: playerPrizeMoney || '--', label: 'Prize Money', color: theme.gold },
  ];

  const renderExpandedContent = () => {
    if (!expandedStat) return null;
    switch (expandedStat) {
      case 'ranking':
        return player.rankingHistory && player.rankingHistory.length > 0 ? (
          <RankingChart history={player.rankingHistory} careerHigh={(player as any).careerHigh} careerHighDate={(player as any).careerHighDate} />
        ) : null;
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
      {/* 6-cell Stats Grid */}
      <View style={styles.statsGrid}>
        {statCards.map((card) => (
          <TouchableOpacity
            key={card.key}
            style={[
              styles.statCell,
              expandedStat === card.key && styles.statCellActive,
            ]}
            onPress={() => toggleStat(card.key)}
            activeOpacity={0.7}
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
        <Text style={styles.cardTitle}>Info</Text>
        <InfoRow label="Nationality" value={`${player.country}`} />
        <InfoRow label="Height" value={`${player.height} cm`} />
        <InfoRow label="Weight" value={`${player.weight} kg`} />
        <InfoRow label="Plays" value={player.plays} />
        <InfoRow label="Backhand" value={player.backhand} />
        {player.birthplace && <InfoRow label="Birthplace" value={player.birthplace} />}
        {player.coach && <InfoRow label="Coach" value={player.coach} />}
      </View>
    </>
  );
}

// ─── Stats Tab ───────────────────────────────────────────────────────
function StatsTab({ player }: { player: PlayerDetail }) {
  const record = player.record;
  const setStats = (player as any).setStats as SetStats | undefined;

  return (
    <>
      {/* Surface Win Rate */}
      {record && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Surface Win Rate</Text>
          {[
            { label: 'Hard', data: record.bySurface.hard, color: theme.blue },
            { label: 'Clay', data: record.bySurface.clay, color: '#c17b3a' },
            { label: 'Grass', data: record.bySurface.grass, color: '#4caf50' },
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
  const equipment = (player as any).equipment;
  if (!equipment) return <EmptyState message="No equipment data" />;

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
              <Text style={styles.equipYears}>{item.from} — {item.to || 'Present'}</Text>
            </TouchableOpacity>
            {!item.to && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentText}>Current</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Equipment & Sponsors</Text>
      {renderTimeline(equipment.apparel, 'Apparel', '')}
      {renderTimeline(equipment.shoes, 'Shoes', '')}
      {equipment.racket && (
        <View style={styles.equipSection}>
          <Text style={styles.equipLabel}>Racket</Text>
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
          <Text style={styles.equipLabel}>Watch</Text>
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
          <Text style={styles.equipLabel}>Other Sponsors</Text>
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
      Alert.alert('Cooldown', 'You can vote again in 24 hours');
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
      Alert.alert('Cooldown', 'You can vote again in 24 hours');
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
        <Text style={styles.cardTitle}>Quick Vote</Text>
        {!votable && <Text style={styles.cooldownText}>You voted recently. Try again in 24h.</Text>}
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
        <Text style={styles.cardTitle}>Custom Tag</Text>
        <View style={styles.customInputRow}>
          <TextInput
            style={styles.customInput}
            placeholder="Add your tag..."
            placeholderTextColor="#666"
            value={customInput}
            onChangeText={setCustomInput}
            maxLength={30}
          />
          <TouchableOpacity style={styles.customSubmitBtn} onPress={handleCustomTag} activeOpacity={0.7}>
            <Text style={styles.customSubmitText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rankings */}
      {sortedTags.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Popular Tags</Text>
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
  const { getPlayerName, resolvedLanguage } = useLanguage();
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
        <EmptyState message="Failed to load player" />
      </View>
    );
  }

  const avatarUrl = getPlayerAvatarUrl(player.name, player.photoUrl, AVATAR_SIZE * 2);
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'stats', label: 'Stats' },
    { key: 'matches', label: 'Matches' },
    { key: 'gear', label: 'Gear' },
    { key: 'comments', label: 'Comments' },
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
            <TouchableOpacity onPress={handleToggleFavorite} activeOpacity={theme.activeOpacity} style={{ padding: 8, marginRight: 4, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, color: isFav ? '#ef4444' : theme.textSecondary }}>{isFav ? '\u2665' : '\u2661'}</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          {/* Decorative tennis ball */}
          <View style={styles.headerDecor}>
            <TennisBallIcon size={60} opacity={0.03} />
          </View>
          <View style={styles.bigAvatar}>
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
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

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.card,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  headerDecor: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
  },
  bigAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: theme.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatarImage: {
    width: AVATAR_SIZE - 6,
    height: AVATAR_SIZE - 6,
    borderRadius: (AVATAR_SIZE - 6) / 2,
  },
  playerName: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  playerNameEn: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  hotTagBadge: {
    backgroundColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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

  // Stats Grid (6-cell, 3 columns)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.border,
    borderRadius: 10,
    overflow: 'hidden',
    gap: 1,
    marginBottom: 16,
  },
  statCell: {
    backgroundColor: theme.card,
    width: (SCREEN_WIDTH - 34) / 3,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    position: 'relative' as const,
  },
  statCellActive: {
    backgroundColor: theme.border,
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
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
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

  // Card
  card: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
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

  // Match items
  matchItem: { backgroundColor: theme.card, borderRadius: 10, padding: 12, marginBottom: 8 },
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
});
