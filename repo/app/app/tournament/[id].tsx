import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { getPlayerAvatarUrl } from '../../lib/avatars';
import { PlayerAvatar } from '../../lib/player-avatar';
import { Flag } from '../../lib/flags';
import { SkeletonList } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import { TournamentLogo } from '../../lib/tournament-logo';
import { theme } from '../../lib/theme';
import type { Player, MatchWithPlayers } from '../../../shared/types';

const MATCH_AVATAR_SIZE = 36;

interface DrawMatch {
  player1Id: number;
  player2Id: number;
  winnerId: number;
  score: string;
  seed1: number | null;
  seed2: number | null;
  matchId?: number | null;
  player1?: Player;
  player2?: Player;
  winner?: Player;
}

interface DrawRound {
  round: string;
  matches: DrawMatch[];
}

interface DrawData {
  tournamentId: number;
  year: number;
  name: string;
  rounds: DrawRound[];
}

interface TournamentDetail {
  id: number;
  name: string;
  surface: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  year: number;
  drawSize: number;
  matches?: MatchWithPlayers[];
}

const ROUND_ORDER = ['Final', 'Semi-Final', 'Quarter-Final', 'Round of 16', 'Round of 32', 'Round of 64', 'Round Robin'];
const AVAILABLE_YEARS = [2024, 2023, 2022, 2021, 2020, 2019];

function getSurfaceColor(surface: string): string {
  const s = surface.toLowerCase();
  if (s.includes('clay')) return '#f97316';
  if (s.includes('grass')) return '#22c55e';
  if (s.includes('hard')) return '#3b82f6';
  return '#6b7280';
}

function getRoundAbbrev(round: string): string {
  const map: Record<string, string> = {
    Final: 'F', 'Semi-Final': 'SF', 'Quarter-Final': 'QF',
    'Round of 16': 'R16', 'Round of 32': 'R32', 'Round of 64': 'R64', 'Round Robin': 'RR',
  };
  return map[round] || round;
}

function getRoundSortKey(round: string): number {
  const idx = ROUND_ORDER.indexOf(round);
  return idx >= 0 ? idx : 99;
}

// ── NCAA-style bracket constants ──
const CELL_W = 160;
const CELL_H = 65;
const CELL_GAP = 8;
const COL_GAP = 24;
const CONNECTOR_COLOR = '#2a2a2a';
const BRACKET_AVATAR = 28;

const ROUND_KEY_ORDER = ['Round of 128', 'Round of 64', 'Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'];

// ── Round rewards data (points & prize money) ──
type RoundRewardMap = Record<string, { pts: number; prize: number }>;

const GRAND_SLAM_REWARDS: RoundRewardMap = {
  'Final': { pts: 2000, prize: 4800000 },
  'Semi-Final': { pts: 1300, prize: 2400000 },
  'Quarter-Final': { pts: 800, prize: 1200000 },
  'Round of 16': { pts: 400, prize: 600000 },
  'Round of 32': { pts: 200, prize: 375000 },
  'Round of 64': { pts: 100, prize: 230000 },
  'Round of 128': { pts: 10, prize: 127000 },
};

const MASTERS_1000_REWARDS: RoundRewardMap = {
  'Final': { pts: 1000, prize: 1100000 },
  'Semi-Final': { pts: 600, prize: 550000 },
  'Quarter-Final': { pts: 360, prize: 275000 },
  'Round of 16': { pts: 190, prize: 137000 },
  'Round of 32': { pts: 100, prize: 70000 },
};

const ATP_500_REWARDS: RoundRewardMap = {
  'Final': { pts: 500, prize: 400000 },
  'Semi-Final': { pts: 300, prize: 200000 },
  'Quarter-Final': { pts: 180, prize: 100000 },
  'Round of 16': { pts: 90, prize: 50000 },
};

function getRewardsForCategory(category: string): RoundRewardMap {
  const cat = category.toLowerCase();
  if (cat.includes('grand slam')) return GRAND_SLAM_REWARDS;
  if (cat.includes('1000') || cat.includes('masters')) return MASTERS_1000_REWARDS;
  if (cat.includes('500')) return ATP_500_REWARDS;
  return {};
}

function formatPrize(amount: number): string {
  if (amount >= 1000000) {
    const m = amount / 1000000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}K`;
  }
  return `$${amount}`;
}
const ROUND_ABBREVS: Record<string, string> = {
  'Round of 128': 'R128', 'Round of 64': 'R64', 'Round of 32': 'R32', 'Round of 16': 'R16',
  'Quarter-Final': 'QF', 'Semi-Final': 'SF', Final: 'F',
};

function abbreviateName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return parts[0][0] + '. ' + parts.slice(1).join(' ');
}

// ── Bracket Cell ──
function BracketCell({
  match,
  onPlayerPress,
  onMatchPress,
}: {
  match: DrawMatch;
  onPlayerPress?: (id: number) => void;
  onMatchPress?: (matchId: number) => void;
}) {
  const p1Win = match.winnerId === match.player1Id;
  const p2Win = match.winnerId === match.player2Id;

  const renderPlayer = (player: Player | undefined, seed: number | null, isWinner: boolean, playerId: number) => (
    <TouchableOpacity
      style={bk.playerRow}
      activeOpacity={0.7}
      onPress={() => player && onPlayerPress?.(playerId)}
      disabled={!player}
    >
      {player ? (
        <PlayerAvatar name={player.name} photoUrl={player.photoUrl} size={BRACKET_AVATAR} />
      ) : (
        <View style={[bk.emptyAvatar, { width: BRACKET_AVATAR, height: BRACKET_AVATAR, borderRadius: BRACKET_AVATAR / 2 }]} />
      )}
      {seed ? <Text style={bk.seed}>[{seed}]</Text> : null}
      <Text
        style={[bk.playerName, isWinner ? bk.winnerText : bk.loserText]}
        numberOfLines={1}
      >
        {player ? abbreviateName(player.name) : 'TBD'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={bk.cell}>
      {renderPlayer(match.player1, match.seed1, p1Win, match.player1Id)}
      <TouchableOpacity
        style={bk.scoreRow}
        activeOpacity={0.7}
        onPress={() => match.matchId && onMatchPress?.(match.matchId)}
        disabled={!match.matchId}
      >
        <Text style={bk.scoreText}>{match.score}</Text>
      </TouchableOpacity>
      {renderPlayer(match.player2, match.seed2, p2Win, match.player2Id)}
    </View>
  );
}

// ── Champion Card (bracket top) ──
function BracketChampion({ match, onPlayerPress }: { match: DrawMatch; onPlayerPress?: (id: number) => void }) {
  const champion = match.winnerId === match.player1Id ? match.player1 : match.player2;
  const championId = match.winnerId === match.player1Id ? match.player1Id : match.player2Id;
  if (!champion) return null;
  return (
    <TouchableOpacity style={bk.champion} activeOpacity={0.7} onPress={() => onPlayerPress?.(championId)}>
      <Text style={bk.championLabel}>CHAMPION</Text>
      <PlayerAvatar name={champion.name} photoUrl={champion.photoUrl} size={56} />
      <Text style={bk.championName}>{champion.name}</Text>
      <Text style={bk.championScore}>{match.score}</Text>
    </TouchableOpacity>
  );
}

// ── Connector lines ──
function HorizontalLine({ x, y, width }: { x: number; y: number; width: number }) {
  return <View style={{ position: 'absolute', left: x, top: y, width, height: 1, backgroundColor: CONNECTOR_COLOR }} />;
}

function VerticalLine({ x, y, height }: { x: number; y: number; height: number }) {
  return <View style={{ position: 'absolute', left: x, top: y, width: 1, height, backgroundColor: CONNECTOR_COLOR }} />;
}

// ── Build full bracket tree ──
function NCAAbracket({ draw, onPlayerPress, onMatchPress, category }: { draw: DrawData; onPlayerPress: (id: number) => void; onMatchPress: (matchId: number) => void; category?: string }) {
  const rewards = category ? getRewardsForCategory(category) : {};
  // Build round map
  const roundMap: Record<string, DrawMatch[]> = {};
  draw.rounds.forEach(r => { roundMap[r.round] = r.matches; });

  // Determine available rounds in order
  const availableRounds = ROUND_KEY_ORDER.filter(r => roundMap[r] && roundMap[r].length > 0);
  if (availableRounds.length === 0) return <EmptyState message="No bracket data" />;

  const finalIdx = availableRounds.indexOf('Final');
  const hasFinal = finalIdx >= 0;

  // For a convergent bracket we need at least 2 rounds before Final, or just show linear
  // Split: rounds before final go left/right
  const preRounds = availableRounds.filter(r => r !== 'Final');

  // If only 1 pre-round + final (e.g. SF + F), show simple linear
  // For full bracket: left half gets top-half matches, right half gets bottom-half matches

  const finalMatch = hasFinal ? roundMap['Final'][0] : null;

  // Calculate column positions
  const leftRounds = preRounds; // These will appear on both sides
  const numLeftCols = leftRounds.length;
  const totalCols = numLeftCols * 2 + (hasFinal ? 1 : 0); // left cols + right cols (mirrored) + final

  // For each round, figure out how many matches per half
  // In a standard bracket, each round has half the matches of the previous
  // We split: first half → left, second half → right
  type HalfData = { round: string; matches: DrawMatch[] }[];

  const leftHalf: HalfData = [];
  const rightHalf: HalfData = [];

  preRounds.forEach(roundName => {
    const matches = roundMap[roundName];
    const half = Math.ceil(matches.length / 2);
    leftHalf.push({ round: roundName, matches: matches.slice(0, half) });
    rightHalf.push({ round: roundName, matches: matches.slice(half) });
  });

  // Calculate layout dimensions
  // Max matches in earliest round determines height
  const maxMatchesPerHalf = leftHalf.length > 0 ? leftHalf[0].matches.length : 1;
  const cellFullH = CELL_H + CELL_GAP;

  // For each round, the vertical spacing doubles
  // Earliest round: matches stacked tight
  // Next round: each match centered between 2 previous matches
  // etc.

  const colWidth = CELL_W + COL_GAP;
  const championHeight = 90;
  const headerHeight = 44;

  // Total height based on the earliest (most matches) round
  const baseHeight = maxMatchesPerHalf * cellFullH;
  const totalHeight = Math.max(baseHeight, 400) + championHeight + headerHeight + 40;
  const totalWidth = totalCols * colWidth + 40;

  // Helper: get Y position for a match in a given round index
  // Round 0 = earliest (most matches), each subsequent round spaces out 2x
  function getMatchY(roundIdx: number, matchIdx: number, matchesInRound: number): number {
    const spacing = cellFullH * Math.pow(2, roundIdx);
    const startOffset = (spacing - cellFullH) / 2;
    return championHeight + headerHeight + startOffset + matchIdx * spacing;
  }

  // Render left half (left to right: earliest → latest)
  const leftElements: JSX.Element[] = [];
  const leftConnectors: JSX.Element[] = [];

  leftHalf.forEach((rd, colIdx) => {
    const colX = 20 + colIdx * colWidth;

    // Round label
    const leftReward = rewards[rd.round];
    leftElements.push(
      <View key={`lh-${rd.round}`} style={{ position: 'absolute', left: colX, top: championHeight, width: CELL_W, alignItems: 'center' }}>
        <Text style={bk.roundLabel}>
          {ROUND_ABBREVS[rd.round] || rd.round}
        </Text>
        {leftReward && (
          <Text style={bk.rewardLabel}>
            {leftReward.pts} pts · {formatPrize(leftReward.prize)}
          </Text>
        )}
      </View>
    );

    rd.matches.forEach((match, mi) => {
      const y = getMatchY(colIdx, mi, rd.matches.length);
      leftElements.push(
        <View key={`l-${rd.round}-${mi}`} style={{ position: 'absolute', left: colX, top: y, width: CELL_W }}>
          <BracketCell match={match} onPlayerPress={onPlayerPress} onMatchPress={onMatchPress} />
        </View>
      );

      // Connector to next round
      if (colIdx < leftHalf.length - 1) {
        const nextColX = colX + colWidth;
        const nextMatchIdx = Math.floor(mi / 2);
        const nextY = getMatchY(colIdx + 1, nextMatchIdx, leftHalf[colIdx + 1].matches.length);
        const midY = y + CELL_H / 2;
        const nextMidY = nextY + CELL_H / 2;

        // Horizontal from cell to connector point
        leftConnectors.push(
          <HorizontalLine key={`lc-h-${rd.round}-${mi}`} x={colX + CELL_W} y={midY} width={COL_GAP / 2} />
        );
        // Vertical connecting pair
        if (mi % 2 === 0) {
          const pairY = getMatchY(colIdx, mi + 1, rd.matches.length) + CELL_H / 2;
          const connX = colX + CELL_W + COL_GAP / 2;
          leftConnectors.push(
            <VerticalLine key={`lc-v-${rd.round}-${mi}`} x={connX} y={midY} height={pairY - midY} />
          );
          // Horizontal from vertical to next cell
          leftConnectors.push(
            <HorizontalLine key={`lc-h2-${rd.round}-${mi}`} x={connX} y={nextMidY} width={COL_GAP / 2} />
          );
        }
      }
    });
  });

  // Right half (right to left: earliest → latest, but positioned from right)
  const rightElements: JSX.Element[] = [];
  const rightConnectors: JSX.Element[] = [];

  rightHalf.forEach((rd, colIdx) => {
    // Right side is mirrored: earliest round at far right
    const colX = totalWidth - 20 - CELL_W - colIdx * colWidth;

    const rightReward = rewards[rd.round];
    rightElements.push(
      <View key={`rh-${rd.round}`} style={{ position: 'absolute', left: colX, top: championHeight, width: CELL_W, alignItems: 'center' }}>
        <Text style={bk.roundLabel}>
          {ROUND_ABBREVS[rd.round] || rd.round}
        </Text>
        {rightReward && (
          <Text style={bk.rewardLabel}>
            {rightReward.pts} pts · {formatPrize(rightReward.prize)}
          </Text>
        )}
      </View>
    );

    rd.matches.forEach((match, mi) => {
      const y = getMatchY(colIdx, mi, rd.matches.length);
      rightElements.push(
        <View key={`r-${rd.round}-${mi}`} style={{ position: 'absolute', left: colX, top: y, width: CELL_W }}>
          <BracketCell match={match} onPlayerPress={onPlayerPress} onMatchPress={onMatchPress} />
        </View>
      );

      // Connector to next round (going left)
      if (colIdx < rightHalf.length - 1) {
        const nextColX = totalWidth - 20 - CELL_W - (colIdx + 1) * colWidth;
        const nextMatchIdx = Math.floor(mi / 2);
        const nextY = getMatchY(colIdx + 1, nextMatchIdx, rightHalf[colIdx + 1].matches.length);
        const midY = y + CELL_H / 2;
        const nextMidY = nextY + CELL_H / 2;

        // Horizontal from cell left edge to connector point
        rightConnectors.push(
          <HorizontalLine key={`rc-h-${rd.round}-${mi}`} x={colX - COL_GAP / 2} y={midY} width={COL_GAP / 2} />
        );
        // Vertical connecting pair
        if (mi % 2 === 0) {
          const pairY = getMatchY(colIdx, mi + 1, rd.matches.length) + CELL_H / 2;
          const connX = colX - COL_GAP / 2;
          rightConnectors.push(
            <VerticalLine key={`rc-v-${rd.round}-${mi}`} x={connX} y={midY} height={pairY - midY} />
          );
          // Horizontal from vertical to next cell
          rightConnectors.push(
            <HorizontalLine key={`rc-h2-${rd.round}-${mi}`} x={nextColX + CELL_W} y={nextMidY} width={connX - (nextColX + CELL_W)} />
          );
        }
      }
    });
  });

  // Final in center
  const finalElements: JSX.Element[] = [];
  if (finalMatch) {
    const finalColX = numLeftCols * colWidth + 20;
    const finalY = getMatchY(preRounds.length > 0 ? preRounds.length - 1 : 0, 0, 1);

    const finalReward = rewards['Final'];
    finalElements.push(
      <View key="fh" style={{ position: 'absolute', left: finalColX, top: championHeight, width: CELL_W, alignItems: 'center' }}>
        <Text style={bk.roundLabel}>FINAL</Text>
        {finalReward && (
          <Text style={bk.rewardLabel}>
            {finalReward.pts} pts · {formatPrize(finalReward.prize)}
          </Text>
        )}
      </View>
    );
    finalElements.push(
      <View key="final-match" style={{ position: 'absolute', left: finalColX, top: finalY, width: CELL_W }}>
        <BracketCell match={finalMatch} onPlayerPress={onPlayerPress} onMatchPress={onMatchPress} />
      </View>
    );

    // Connectors from last left/right rounds to final
    if (leftHalf.length > 0) {
      const lastLeftCol = leftHalf.length - 1;
      const lastLeftX = 20 + lastLeftCol * colWidth;
      const lastLeftY = getMatchY(lastLeftCol, 0, leftHalf[lastLeftCol].matches.length) + CELL_H / 2;
      const finalMidY = finalY + CELL_H / 2;

      finalElements.push(
        <HorizontalLine key="fc-l-h" x={lastLeftX + CELL_W} y={lastLeftY} width={COL_GAP / 2} />
      );
      const connX = lastLeftX + CELL_W + COL_GAP / 2;
      if (Math.abs(lastLeftY - finalMidY) > 1) {
        finalElements.push(
          <VerticalLine key="fc-l-v" x={connX} y={Math.min(lastLeftY, finalMidY)} height={Math.abs(finalMidY - lastLeftY)} />
        );
      }
      finalElements.push(
        <HorizontalLine key="fc-l-h2" x={connX} y={finalMidY} width={finalColX - connX} />
      );
    }

    if (rightHalf.length > 0) {
      const lastRightCol = rightHalf.length - 1;
      const lastRightX = totalWidth - 20 - CELL_W - lastRightCol * colWidth;
      const lastRightY = getMatchY(lastRightCol, 0, rightHalf[lastRightCol].matches.length) + CELL_H / 2;
      const finalMidY = finalY + CELL_H / 2;

      finalElements.push(
        <HorizontalLine key="fc-r-h" x={lastRightX - COL_GAP / 2} y={lastRightY} width={COL_GAP / 2} />
      );
      const connX = lastRightX - COL_GAP / 2;
      if (Math.abs(lastRightY - finalMidY) > 1) {
        finalElements.push(
          <VerticalLine key="fc-r-v" x={connX} y={Math.min(lastRightY, finalMidY)} height={Math.abs(finalMidY - lastRightY)} />
        );
      }
      finalElements.push(
        <HorizontalLine key="fc-r-h2" x={finalColX + CELL_W} y={finalMidY} width={connX - (finalColX + CELL_W)} />
      );
    }
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ minHeight: totalHeight + 40 }}>
        <View style={{ width: totalWidth, minHeight: totalHeight, position: 'relative' }}>
          {/* Champion at top center */}
          {finalMatch && (
            <View style={{ position: 'absolute', left: totalWidth / 2 - 100, top: 0, width: 200 }}>
              <BracketChampion match={finalMatch} onPlayerPress={onPlayerPress} />
            </View>
          )}

          {leftConnectors}
          {leftElements}
          {rightConnectors}
          {rightElements}
          {finalElements}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

// ── Legacy components kept for Results tab ──

function PlayerSlot({ player, seed, isWinner, onPress }: { player?: Player; seed: number | null; isWinner: boolean; onPress?: () => void }) {
  if (!player) {
    return (
      <View style={styles.playerSlot}>
        <View style={[styles.slotAvatar, styles.emptyAvatar]} />
        <Text style={styles.slotNameEmpty}>TBD</Text>
      </View>
    );
  }
  return (
    <TouchableOpacity style={[styles.playerSlot, isWinner && styles.winnerSlot]} activeOpacity={0.7} onPress={onPress}>
      <Image
        source={{ uri: getPlayerAvatarUrl(player.name, player.photoUrl, MATCH_AVATAR_SIZE * 2) }}
        style={styles.slotAvatar}
      />
      <View style={styles.slotInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[styles.slotName, isWinner && styles.winnerName]} numberOfLines={1}>
            {player.name}
          </Text>
          <Flag country={player.country} countryFlag={player.countryFlag} size={12} />
        </View>
        {seed ? <Text style={styles.slotSeed}>[{seed}]</Text> : null}
      </View>
      {isWinner && <Text style={styles.winCheck}>✓</Text>}
    </TouchableOpacity>
  );
}

function ResultMatch({ match, onPlayerPress, onMatchPress }: { match: MatchWithPlayers; onPlayerPress?: (playerId: number) => void; onMatchPress?: (matchId: number) => void }) {
  const p1Won = match.winnerId === match.player1Id;
  const p2Won = match.winnerId === match.player2Id;
  return (
    <TouchableOpacity
      style={styles.resultMatch}
      activeOpacity={0.7}
      onPress={() => onMatchPress?.(match.id)}
    >
      <TouchableOpacity style={styles.resultRow} activeOpacity={0.7} onPress={() => onPlayerPress?.(match.player1Id)}>
        <Image source={{ uri: getPlayerAvatarUrl(match.player1?.name || 'P1', match.player1?.photoUrl, 60) }} style={styles.resultAvatar} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
          <Text style={[styles.resultName, p1Won && styles.winnerName, !p1Won && styles.loserName]} numberOfLines={1}>
            {match.player1?.name || 'TBD'}
          </Text>
          {match.player1?.country && <Flag country={match.player1.country} countryFlag={match.player1.countryFlag} size={12} />}
        </View>
      </TouchableOpacity>
      <Text style={styles.resultScore}>{match.score}</Text>
      <TouchableOpacity style={styles.resultRow} activeOpacity={0.7} onPress={() => onPlayerPress?.(match.player2Id)}>
        <Image source={{ uri: getPlayerAvatarUrl(match.player2?.name || 'P2', match.player2?.photoUrl, 60) }} style={styles.resultAvatar} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
          <Text style={[styles.resultName, p2Won && styles.winnerName, !p2Won && styles.loserName]} numberOfLines={1}>
            {match.player2?.name || 'TBD'}
          </Text>
          {match.player2?.country && <Flag country={match.player2.country} countryFlag={match.player2.countryFlag} size={12} />}
        </View>
      </TouchableOpacity>
      {match.date && <Text style={styles.resultDate}>{match.date}</Text>}
    </TouchableOpacity>
  );
}

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'bracket' | 'results'>('bracket');
  const [selectedYear, setSelectedYear] = useState(2024);

  const handlePlayerPress = (playerId: number) => {
    router.push(`/player/${playerId}`);
  };

  const { data: tournament } = useQuery<TournamentDetail>({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const res = await api.get(`/api/tournaments/${id}`);
      return res.data;
    },
  });

  const { data: draw, isLoading, error, refetch } = useQuery<DrawData>({
    queryKey: ['tournament-draw', id, selectedYear],
    queryFn: async () => {
      const res = await api.get(`/api/tournaments/${id}/draw`);
      return res.data;
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SkeletonList count={5} cardHeight={80} />
      </View>
    );
  }

  const tournamentName = tournament?.name || draw?.name || 'Tournament';
  const sortedRounds = draw?.rounds ? [...draw.rounds].sort((a, b) => ROUND_ORDER.indexOf(a.round) - ROUND_ORDER.indexOf(b.round)) : [];
  const finalRound = sortedRounds.find((r) => r.round === 'Final');

  const matchesByRound: { round: string; matches: MatchWithPlayers[] }[] = [];
  if (tournament?.matches) {
    const grouped: Record<string, MatchWithPlayers[]> = {};
    tournament.matches.forEach((m: MatchWithPlayers) => {
      if (!grouped[m.round]) grouped[m.round] = [];
      grouped[m.round].push(m);
    });
    Object.entries(grouped)
      .sort(([a], [b]) => getRoundSortKey(a) - getRoundSortKey(b))
      .forEach(([round, matches]) => matchesByRound.push({ round, matches }));
  }

  return (
    <>
      <Stack.Screen options={{ title: tournamentName }} />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" colors={['#16a34a']} />}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            {tournament && <TournamentLogo tournament={tournament as any} size="lg" />}
            <Text style={[styles.tournamentTitle, { marginBottom: 0 }]}>{tournamentName}</Text>
          </View>
          {tournament && (
            <>
              <View style={styles.metaRow}>
                <View style={styles.categoryBadge}><Text style={styles.categoryText}>{tournament.category}</Text></View>
                <View style={[styles.surfaceBadge, { borderColor: getSurfaceColor(tournament.surface) }]}>
                  <View style={[styles.surfaceDotSmall, { backgroundColor: getSurfaceColor(tournament.surface) }]} />
                  <Text style={styles.surfaceBadgeText}>{tournament.surface}</Text>
                </View>
                {(tournament as any).points && (
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsBadgeText}>{(tournament as any).points} pts</Text>
                  </View>
                )}
              </View>
              <Text style={styles.locationText}>{tournament.location}</Text>
              <Text style={styles.dateText}>{tournament.startDate} — {tournament.endDate}</Text>
            </>
          )}
        </View>

        {/* Year Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearRow} style={styles.yearScroll}>
          {AVAILABLE_YEARS.map((year) => (
            <TouchableOpacity
              key={year}
              style={[styles.yearPill, selectedYear === year && styles.yearPillActive]}
              onPress={() => setSelectedYear(year)}
              activeOpacity={0.7}
            >
              <Text style={[styles.yearPillText, selectedYear === year && styles.yearPillTextActive]}>{year}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bracket' && styles.tabActive]}
            onPress={() => setActiveTab('bracket')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'bracket' && styles.tabTextActive]}>Bracket</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'results' && styles.tabActive]}
            onPress={() => setActiveTab('results')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'results' && styles.tabTextActive]}>Results</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'bracket' ? (
          <>
            {error || !draw ? (
              <EmptyState message={`No bracket data for ${selectedYear}`} />
            ) : (
              <NCAAbracket draw={draw} onPlayerPress={handlePlayerPress} onMatchPress={(matchId) => router.push(`/match/${matchId}`)} category={tournament?.category} />
            )}
          </>
        ) : (
          <>
            {matchesByRound.length === 0 ? (
              <EmptyState message="No match results available" />
            ) : (
              matchesByRound.map((group) => (
                <View key={group.round} style={styles.roundSection}>
                  <View style={styles.roundHeader}>
                    <Text style={styles.roundTitle}>{group.round}</Text>
                    <Text style={styles.roundAbbrev}>{getRoundAbbrev(group.round)}</Text>
                    <Text style={styles.matchCount}>{group.matches.length} match{group.matches.length !== 1 ? 'es' : ''}</Text>
                  </View>
                  {group.matches.map((match) => <ResultMatch key={match.id} match={match} onPlayerPress={handlePlayerPress} onMatchPress={(matchId) => router.push(`/match/${matchId}`)} />)}
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },

  // Header
  headerSection: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  tournamentTitle: { fontSize: 22, fontWeight: '600', color: theme.text, textAlign: 'center', marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  categoryBadge: { backgroundColor: theme.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { color: theme.text, fontSize: 11, fontWeight: '600' },
  surfaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  surfaceDotSmall: { width: 6, height: 6, borderRadius: 3 },
  surfaceBadgeText: { color: theme.text, fontSize: 11, fontWeight: '500' },
  locationText: { fontSize: 13, color: theme.textMuted, marginBottom: 2 },
  dateText: { fontSize: 12, color: theme.textTertiary },

  // Year
  yearScroll: { maxHeight: 48, borderBottomWidth: 0.5, borderBottomColor: theme.border },
  yearRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  yearPill: { backgroundColor: theme.card, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  yearPillActive: { backgroundColor: theme.accent },
  yearPillText: { fontSize: 13, color: theme.textTertiary, fontWeight: '500' },
  yearPillTextActive: { color: theme.text, fontWeight: '600' },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderBottomWidth: 0.5,
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
  tabText: { fontSize: 13, fontWeight: '500', color: theme.textTertiary },
  tabTextActive: { color: theme.accent, fontWeight: '600' },

  // Champion
  championCard: {
    backgroundColor: theme.card,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.gold,
  },
  championLabel: { fontSize: 13, fontWeight: '700', color: theme.gold, marginBottom: 10, letterSpacing: 2 },
  championAvatar: { width: 72, height: 72, borderRadius: 36, marginBottom: 10 },
  championName: { fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 4 },
  championScore: { fontSize: 13, color: theme.textTertiary },

  // Round
  roundSection: { marginTop: 16, paddingHorizontal: 16 },
  roundHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  roundTitle: { fontSize: 16, fontWeight: '600', color: theme.text },
  roundAbbrev: { fontSize: 11, color: theme.textTertiary, backgroundColor: theme.card, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  matchCount: { fontSize: 11, color: theme.textTertiary, marginLeft: 'auto' },

  // Bracket Match
  bracketMatch: { backgroundColor: theme.card, borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  finalMatch: { borderWidth: 1, borderColor: theme.gold },
  finalBanner: { backgroundColor: '#f59e0b', paddingVertical: 4, alignItems: 'center' },
  finalBannerText: { color: theme.text, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  playerSlot: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 8 },
  winnerSlot: { backgroundColor: 'rgba(245, 158, 11, 0.08)' },
  slotAvatar: { width: MATCH_AVATAR_SIZE, height: MATCH_AVATAR_SIZE, borderRadius: MATCH_AVATAR_SIZE / 2 },
  emptyAvatar: { backgroundColor: theme.border },
  slotInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  slotName: { fontSize: 13, color: theme.text, fontWeight: '500', flexShrink: 1 },
  slotNameEmpty: { fontSize: 13, color: theme.textTertiary },
  winnerName: { color: theme.text, fontWeight: '700' },
  loserName: { color: theme.textTertiary },
  winCheck: { color: theme.gold, fontSize: 14, fontWeight: '700', marginRight: 6 },
  slotSeed: { fontSize: 11, color: theme.textMuted, fontWeight: '600' },
  scoreDivider: { backgroundColor: theme.border, paddingVertical: 3, paddingHorizontal: 10, alignItems: 'center' },
  scoreText: { color: theme.text, fontSize: 12, fontWeight: '600' },

  // Results
  resultMatch: { backgroundColor: theme.card, borderRadius: 10, marginBottom: 8, padding: 10 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  resultAvatar: { width: 28, height: 28, borderRadius: 14 },
  resultName: { fontSize: 13, color: theme.text, flex: 1 },
  resultScore: { textAlign: 'center', color: theme.text, fontSize: 12, fontWeight: '700', backgroundColor: theme.border, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'center', marginVertical: 4 },
  resultDate: { textAlign: 'right', color: theme.textTertiary, fontSize: 11, marginTop: 4 },

  // Points badge
  pointsBadge: {
    backgroundColor: theme.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pointsBadgeText: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '700',
  },
});

// ── NCAA Bracket Styles ──
const bk = StyleSheet.create({
  cell: {
    width: CELL_W,
    backgroundColor: theme.card,
    borderRadius: 6,
    overflow: 'hidden',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
    height: 26,
  },
  emptyAvatar: {
    backgroundColor: theme.border,
  },
  seed: {
    fontSize: 9,
    color: theme.textMuted,
    fontWeight: '600',
  },
  playerName: {
    fontSize: 11,
    flex: 1,
  },
  winnerText: {
    color: theme.text,
    fontWeight: '700',
  },
  loserText: {
    color: theme.textSecondary,
    fontWeight: '400',
  },
  scoreRow: {
    backgroundColor: theme.border,
    paddingVertical: 2,
    alignItems: 'center',
  },
  scoreText: {
    color: theme.text,
    fontSize: 10,
    fontWeight: '600',
  },
  roundLabel: {
    fontSize: 11,
    color: theme.textTertiary,
    fontWeight: '600',
    textAlign: 'center',
  },
  rewardLabel: {
    fontSize: 10,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },
  champion: {
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  championLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.gold,
    letterSpacing: 2,
  },
  championName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  championScore: {
    fontSize: 11,
    color: theme.textTertiary,
  },
});
