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
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { PlayerAvatar } from '../../lib/player-avatar';
import { Flag } from '../../lib/flags';
import { useLanguage } from '../../lib/i18n';
import { SkeletonBlock } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import { TournamentLogo } from '../../lib/tournament-logo';
import { theme } from '../../lib/theme';
import type { MatchWithPlayers, MatchStats, ProbabilitySnapshot, SetGameByGame, GameByGameEntry } from '../../../shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AVATAR_SIZE = 68;

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
  return '#888';
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

// ─── Game-by-Game Timeline ───────────────────────────────────────────
function getGameIntensityBg(durationMin?: number): string {
  if (!durationMin) return '#1e1e1e';
  if (durationMin < 3) return '#1e1e1e';
  if (durationMin <= 6) return 'rgba(201,168,76,0.06)';
  return 'rgba(183,28,28,0.08)';
}

function formatDuration(durationMin?: number): string {
  if (!durationMin) return '';
  const mins = Math.floor(durationMin);
  const secs = Math.round((durationMin - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getPlayerAbbr(name: string): string {
  const parts = name.split(/[\s·]+/);
  const surname = parts[parts.length - 1] || name;
  return surname.slice(0, 3).toUpperCase();
}

function GameBlock({ game }: { game: GameByGameEntry }) {
  return (
    <View style={styles.gbgGameColumn}>
      <View style={[styles.gbgGameBlock, { backgroundColor: game.isBreak ? 'rgba(183,28,28,0.2)' : getGameIntensityBg(game.durationMin) }, game.isBreak && styles.gbgGameBlockBreak]}>
        {game.difficulty === 'bp_saved' && (
          <Text style={styles.gbgBpBadge}>BP</Text>
        )}
        <Text style={[styles.gbgGameScore, game.isBreak && styles.gbgGameScoreBreak]}>
          {game.score}
        </Text>
        {game.isBreak && <Text style={styles.gbgBreakStarInline}>★</Text>}
        {game.difficulty && game.difficulty !== 'easy' && game.difficulty !== 'broken' && (
          <View style={[styles.gbgDifficultyStripe, {
            backgroundColor: game.difficulty === 'love' ? '#1a7a3a' : game.difficulty === 'tough' ? '#c9a84c' : game.difficulty === 'bp_saved' ? '#b71c1c' : 'transparent'
          }]} />
        )}
      </View>
      {game.durationMin ? (
        <Text style={styles.gbgDurationLabel}>{formatDuration(game.durationMin)}</Text>
      ) : (
        <View style={{ height: 11 }} />
      )}
    </View>
  );
}

function GameByGameTimeline({ gameByGame, p1Short, p2Short }: { gameByGame: SetGameByGame[]; p1Short: string; p2Short: string }) {
  const p1Abbr = getPlayerAbbr(p1Short);
  const p2Abbr = getPlayerAbbr(p2Short);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Game-by-Game</Text>
      {/* Intensity legend */}
      <View style={styles.gbgIntensityLegend}>
        <Text style={styles.gbgIntensityLegendItem}><Text style={{ color: '#888' }}>●</Text> Normal</Text>
        <Text style={styles.gbgIntensityLegendItem}><Text style={{ color: 'rgba(201,168,76,0.6)' }}>●</Text> Contested</Text>
        <Text style={styles.gbgIntensityLegendItem}><Text style={{ color: 'rgba(183,28,28,0.6)' }}>●</Text> Battle</Text>
        <Text style={styles.gbgIntensityLegendItem}><Text style={{ color: '#e53935' }}>★</Text> Break</Text>
      </View>
      {/* Difficulty legend */}
      <View style={styles.gbgIntensityLegend}>
        <Text style={styles.gbgIntensityLegendItem}><Text style={{ color: '#1a7a3a' }}>━</Text> Love</Text>
        <Text style={styles.gbgIntensityLegendItem}><Text style={{ color: '#c9a84c' }}>━</Text> Tough</Text>
        <Text style={styles.gbgIntensityLegendItem}><Text style={{ color: '#b71c1c' }}>━</Text> BP Saved</Text>
      </View>
      {gameByGame.map((setData) => {
        const lastGame = setData.games[setData.games.length - 1];
        const setScore = setData.tiebreak ? setData.tiebreak.score : lastGame?.score || '0-0';
        const totalCols = setData.games.length + (setData.tiebreak ? 1 : 0);
        return (
          <View key={setData.set} style={styles.gbgSetContainer}>
            <Text style={styles.gbgSetTitle}>SET {setData.set}: {setScore}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gbgScroll}>
              <View>
                {/* Row 1: Player 1 serve games */}
                <View style={styles.gbgDualRow}>
                  <Text style={styles.gbgRowLabel}>{p1Abbr}</Text>
                  {setData.games.map((game, idx) => (
                    <View key={idx} style={styles.gbgCellWrapper}>
                      {game.server === 1 ? (
                        <GameBlock game={game} />
                      ) : (
                        <View style={styles.gbgEmptyCell} />
                      )}
                    </View>
                  ))}
                  {setData.tiebreak && (
                    <View style={styles.gbgCellWrapper}>
                      <View style={styles.gbgEmptyCell} />
                    </View>
                  )}
                </View>
                {/* Row 2: Player 2 serve games */}
                <View style={[styles.gbgDualRow, { marginTop: 4 }]}>
                  <Text style={styles.gbgRowLabel}>{p2Abbr}</Text>
                  {setData.games.map((game, idx) => (
                    <View key={idx} style={styles.gbgCellWrapper}>
                      {game.server === 2 ? (
                        <GameBlock game={game} />
                      ) : (
                        <View style={styles.gbgEmptyCell} />
                      )}
                    </View>
                  ))}
                  {setData.tiebreak && (
                    <View style={styles.gbgCellWrapper}>
                      <View style={styles.gbgGameColumn}>
                        <View style={[styles.gbgGameBlock, styles.gbgTiebreakBlock]}>
                          <Text style={styles.gbgTiebreakLabel}>TB</Text>
                          <Text style={styles.gbgGameScore}>{setData.tiebreak.score}</Text>
                        </View>
                        <View style={{ height: 11 }} />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
            {/* Tiebreak points detail */}
            {setData.tiebreak && (
              <Text style={styles.gbgTiebreakPoints}>{setData.tiebreak.points}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────
function OverviewTab({ match, p1Short, p2Short }: { match: MatchWithPlayers; p1Short: string; p2Short: string }) {
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
      {match.gameByGame && match.gameByGame.length > 0 && (
        <GameByGameTimeline gameByGame={match.gameByGame} p1Short={p1Short} p2Short={p2Short} />
      )}
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

// ─── Stats Section Header ────────────────────────────────────────────
function StatsSectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.statsSectionTitle}>{title}</Text>
  );
}

// ─── Stats Tab ───────────────────────────────────────────────────────
function StatsTabContent({ match }: { match: MatchWithPlayers }) {
  if (!match.statsJson) return <EmptyState message="No statistics available" />;
  const s = match.statsJson as MatchStats;

  const fmtPct = (v: number | undefined) => v !== undefined ? `${v}%` : '—';

  return (
    <>
      {/* Serve Stats */}
      <View style={styles.card}>
        <StatsSectionHeader title="Serve Stats" />
        {s.aces && <StatBarComparison label="Aces" value1={s.aces[0]} value2={s.aces[1]} />}
        {s.doubleFaults && <StatBarComparison label="Double Faults" value1={s.doubleFaults[0]} value2={s.doubleFaults[1]} />}
        {s.firstServePercent && <StatBarComparison label="1st Serve %" value1={fmtPct(s.firstServePercent[0])} value2={fmtPct(s.firstServePercent[1])} />}
        {s.firstServeWon && <StatBarComparison label="1st Serve Won" value1={fmtPct(s.firstServeWon[0])} value2={fmtPct(s.firstServeWon[1])} />}
        {s.secondServeWon && <StatBarComparison label="2nd Serve Won" value1={fmtPct(s.secondServeWon[0])} value2={fmtPct(s.secondServeWon[1])} />}
        {s.maxServiceSpeed && <StatBarComparison label="Max Serve Speed" value1={s.maxServiceSpeed[0]} value2={s.maxServiceSpeed[1]} />}
        {s.avgFirstServeSpeed && <StatBarComparison label="Avg 1st Serve" value1={s.avgFirstServeSpeed[0]} value2={s.avgFirstServeSpeed[1]} />}
        {s.avgSecondServeSpeed && <StatBarComparison label="Avg 2nd Serve" value1={s.avgSecondServeSpeed[0]} value2={s.avgSecondServeSpeed[1]} />}
      </View>

      {/* Return Stats */}
      <View style={styles.card}>
        <StatsSectionHeader title="Return Stats" />
        {s.breakPointsConverted && <StatBarComparison label="BP Converted" value1={s.breakPointsConverted[0]} value2={s.breakPointsConverted[1]} />}
        {s.breakPointsSaved && <StatBarComparison label="BP Saved" value1={s.breakPointsSaved[0]} value2={s.breakPointsSaved[1]} />}
        {s.returnGamesWon && <StatBarComparison label="Return Games" value1={s.returnGamesWon[0]} value2={s.returnGamesWon[1]} />}
      </View>

      {/* Points Stats */}
      <View style={styles.card}>
        <StatsSectionHeader title="Points Stats" />
        {s.totalPointsWon && <StatBarComparison label="Total Points" value1={s.totalPointsWon[0]} value2={s.totalPointsWon[1]} />}
        {s.winners && <StatBarComparison label="Winners" value1={s.winners[0]} value2={s.winners[1]} />}
        {s.unforcedErrors && <StatBarComparison label="Unforced Errors" value1={s.unforcedErrors[0]} value2={s.unforcedErrors[1]} />}
        {s.netPoints && <StatBarComparison label="Net Points" value1={s.netPoints[0]} value2={s.netPoints[1]} />}
      </View>

      {/* Match Stats */}
      <View style={styles.card}>
        <StatsSectionHeader title="Match Stats" />
        {s.totalGamesWon && <StatBarComparison label="Games Won" value1={s.totalGamesWon[0]} value2={s.totalGamesWon[1]} />}
        {s.serviceGamesWon && <StatBarComparison label="Service Games" value1={s.serviceGamesWon[0]} value2={s.serviceGamesWon[1]} />}
        {s.longestRally && <StatBarComparison label="Longest Rally" value1={s.longestRally[0]} value2={s.longestRally[1]} />}
        {s.distanceCovered && <StatBarComparison label="Distance" value1={s.distanceCovered[0]} value2={s.distanceCovered[1]} />}
      </View>
    </>
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
  const router = useRouter();
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
          <TouchableOpacity
            style={styles.tournamentLabelRow}
            activeOpacity={match.tournament?.id ? 0.7 : 1}
            onPress={() => match.tournament?.id && router.push(`/tournament/${match.tournament.id}`)}
          >
            {match.tournament && <TournamentLogo tournament={match.tournament} size="md" />}
            <Text style={[styles.tournamentLabel, match.tournament?.id && styles.tournamentLabelLink]}>
              {match.tournament?.name?.toUpperCase() || 'MATCH'}
              {match.round ? ` \u2022 ${match.round}` : ''}
              {match.tournament?.surface ? ` \u2022 ${match.tournament.surface}` : ''}
            </Text>
          </TouchableOpacity>

          <View style={styles.versusRow}>
            {/* Player 1 */}
            <TouchableOpacity style={styles.vsPlayer} activeOpacity={0.7} onPress={() => router.push(`/player/${match.player1Id}`)}>
              <PlayerAvatar name={match.player1?.name || 'P1'} photoUrl={match.player1?.photoUrl} size={56} />
              <Text style={[styles.vsName, p1Won && styles.vsNameWinner, !p1Won && p2Won && styles.vsNameLoser]} numberOfLines={1}>
                {p1Short}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Flag country={match.player1?.country || ''} countryFlag={match.player1?.countryFlag} size={12} />
                <Text style={styles.vsRank}>#{match.player1?.ranking || '?'}</Text>
              </View>
            </TouchableOpacity>

            {/* Score */}
            <View style={styles.scoreCenterBlock}>
              <Text style={styles.bigScore}>{match.score}</Text>
              {(p1Won || p2Won) && <Text style={styles.ftText}>FT</Text>}
            </View>

            {/* Player 2 */}
            <TouchableOpacity style={styles.vsPlayer} activeOpacity={0.7} onPress={() => router.push(`/player/${match.player2Id}`)}>
              <PlayerAvatar name={match.player2?.name || 'P2'} photoUrl={match.player2?.photoUrl} size={56} />
              <Text style={[styles.vsName, p2Won && styles.vsNameWinner, !p2Won && p1Won && styles.vsNameLoser]} numberOfLines={1}>
                {p2Short}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Flag country={match.player2?.country || ''} countryFlag={match.player2?.countryFlag} size={12} />
                <Text style={styles.vsRank}>#{match.player2?.ranking || '?'}</Text>
              </View>
            </TouchableOpacity>
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
          {activeTab === 'overview' && <OverviewTab match={match} p1Short={p1Short} p2Short={p2Short} />}
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
  container: { flex: 1, backgroundColor: theme.bg },
  content: { paddingBottom: 40 },

  // Match Header
  matchHeader: {
    backgroundColor: theme.cardAlt,
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
    color: theme.textSecondary,
    flexShrink: 1,
  },
  tournamentLabelLink: {
    color: theme.linkBlue,
    textDecorationLine: 'underline' as const,
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
    backgroundColor: theme.border,
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
    color: theme.textSecondary,
  },
  vsName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    textAlign: 'center',
  },
  vsNameWinner: {
    color: theme.text,
    fontWeight: '700',
  },
  vsNameLoser: {
    color: theme.textSecondary,
  },
  vsRank: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  scoreCenterBlock: {
    alignItems: 'center',
  },
  bigScore: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: 4,
  },
  ftText: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 4,
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
  tabActive: { borderBottomColor: '#16a34a' },
  tabText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  tabTextActive: { color: theme.accent, fontWeight: '600' },
  tabContent: { padding: 16 },

  // Card
  card: { backgroundColor: theme.card, borderRadius: 10, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 12 },
  statsSectionTitle: { fontSize: 13, fontWeight: '600', color: theme.accent, marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: 1 },

  // Score
  setsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  setBox: { backgroundColor: theme.bg, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 56 },
  setLabel: { fontSize: 10, color: theme.textSecondary, marginBottom: 3 },
  setScore: { fontSize: 18, fontWeight: '700', color: theme.text },

  // Info
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: theme.border },
  infoLabel: { fontSize: 14, color: theme.textSecondary },
  infoValue: { fontSize: 14, color: theme.text, fontWeight: '500' },

  // Compare Stats (symmetric)
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  compareVal: {
    width: 52,
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
  },
  compareValLeft: {
    textAlign: 'left',
  },
  compareValRight: {
    textAlign: 'right',
  },
  compareValWin: {
    color: theme.text,
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
    backgroundColor: theme.accent,
    borderRadius: 3,
  },
  compareBarRight: {
    height: 5,
    backgroundColor: '#333',
    borderRadius: 3,
  },
  compareLabel: {
    width: 90,
    textAlign: 'center',
    fontSize: 10,
    color: theme.textSecondary,
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
    color: theme.textSecondary,
  },
  probPctWin: {
    color: theme.text,
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
    backgroundColor: theme.accent,
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

  // Game-by-Game Timeline
  gbgLegend: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  gbgLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gbgLegendText: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  gbgIntensityLegend: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  gbgIntensityLegendItem: {
    fontSize: 9,
    color: '#888',
  },
  gbgSetContainer: {
    marginBottom: 14,
  },
  gbgSetTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  gbgScroll: {
    flexGrow: 0,
  },
  gbgScrollContent: {
    alignItems: 'center',
    paddingRight: 8,
    gap: 2,
  },
  gbgDualRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gbgRowLabel: {
    width: 30,
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
  },
  gbgCellWrapper: {
    width: 56,
    alignItems: 'center',
  },
  gbgEmptyCell: {
    width: 52,
    height: 55,
  },
  gbgBreakStarInline: {
    position: 'absolute',
    top: 1,
    left: 2,
    fontSize: 8,
    color: '#e53935',
    lineHeight: 10,
  },
  gbgGameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gbgGameColumn: {
    alignItems: 'center',
  },
  gbgDurationLabel: {
    fontSize: 9,
    color: '#888',
    marginTop: 2,
  },
  gbgServerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.accent,
    marginRight: 2,
  },
  gbgServerDotTop: {
    backgroundColor: theme.accent,
  },
  gbgServerDotBottom: {
    backgroundColor: '#888',
  },
  gbgGameBlock: {
    width: 52,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  gbgDifficultyStripe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
  },
  gbgBpBadge: {
    position: 'absolute',
    top: 1,
    right: 2,
    fontSize: 8,
    fontWeight: '700',
    color: '#b71c1c',
    lineHeight: 10,
  },
  gbgGameBlockBreak: {
    backgroundColor: 'rgba(183,28,28,0.2)',
    borderColor: '#e53935',
    borderWidth: 1.5,
  },
  gbgGameScore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  gbgGameScoreBreak: {
    color: '#e53935',
  },
  gbgBreakStar: {
    fontSize: 10,
    color: '#e53935',
    marginLeft: -2,
    marginRight: -2,
  },
  gbgArrow: {
    fontSize: 14,
    color: '#555',
    marginHorizontal: 1,
  },
  gbgTiebreakBlock: {
    width: 56,
    height: 44,
    backgroundColor: '#1a2a1a',
    borderColor: theme.accent,
  },
  gbgTiebreakLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.accent,
    marginBottom: -2,
  },
  gbgTiebreakPoints: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 4,
    fontFamily: 'monospace',
  },
});
