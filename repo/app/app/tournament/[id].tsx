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
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import { SkeletonList } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import type { Player, MatchWithPlayers } from '../../../shared/types';

const MATCH_AVATAR_SIZE = 48;

interface DrawMatch {
  player1Id: number;
  player2Id: number;
  winnerId: number;
  score: string;
  seed1: number | null;
  seed2: number | null;
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

const ROUND_ORDER = [
  'Final',
  'Semi-Final',
  'Quarter-Final',
  'Round of 16',
  'Round of 32',
  'Round of 64',
  'Round Robin',
];

const AVAILABLE_YEARS = [2024, 2023, 2022, 2021, 2020, 2019];

function getSurfaceEmoji(surface: string): string {
  const s = surface.toLowerCase();
  if (s.includes('clay')) return '🟤';
  if (s.includes('grass')) return '🟢';
  if (s.includes('hard')) return '🔵';
  return '⚪';
}

function getRoundAbbrev(round: string): string {
  const map: Record<string, string> = {
    Final: 'F',
    'Semi-Final': 'SF',
    'Quarter-Final': 'QF',
    'Round of 16': 'R16',
    'Round of 32': 'R32',
    'Round of 64': 'R64',
    'Round Robin': 'RR',
  };
  return map[round] || round;
}

function getRoundSortKey(round: string): number {
  const idx = ROUND_ORDER.indexOf(round);
  return idx >= 0 ? idx : 99;
}

// ─── Player slot in bracket ──────────────────────────────────────────
function PlayerSlot({
  player,
  seed,
  isWinner,
}: {
  player?: Player;
  seed: number | null;
  isWinner: boolean;
}) {
  if (!player) {
    return (
      <View style={styles.playerSlot}>
        <View style={[styles.slotAvatar, styles.emptyAvatar]} />
        <Text style={styles.slotNameEmpty}>TBD</Text>
      </View>
    );
  }

  return (
    <View style={[styles.playerSlot, isWinner && styles.winnerSlot]}>
      <Image
        source={{ uri: player.photoUrl || getAvatarUrl(player.name, MATCH_AVATAR_SIZE * 2) }}
        style={[styles.slotAvatar, isWinner && styles.slotAvatarWinner]}
      />
      <View style={styles.slotInfo}>
        <Text style={[styles.slotName, isWinner && styles.winnerName]} numberOfLines={1}>
          {player.name} {player.countryFlag}
        </Text>
        {seed ? <Text style={styles.slotSeed}>[{seed}]</Text> : null}
      </View>
      {isWinner && <Text style={styles.winIndicator}>✓</Text>}
    </View>
  );
}

// ─── Bracket Match with connector lines ──────────────────────────────
function BracketMatch({ match, isFinal }: { match: DrawMatch; isFinal: boolean }) {
  return (
    <View style={styles.bracketMatchWrapper}>
      {/* Left connector line */}
      <View style={styles.connectorLine}>
        <View style={styles.connectorVertical} />
        <View style={styles.connectorHorizontal} />
      </View>
      <View style={[styles.bracketMatch, isFinal && styles.finalMatch]}>
        {isFinal && (
          <View style={styles.finalBanner}>
            <Text style={styles.finalBannerText}>🏆 FINAL</Text>
          </View>
        )}
        <PlayerSlot
          player={match.player1}
          seed={match.seed1}
          isWinner={match.winnerId === match.player1Id}
        />
        <View style={styles.scoreDivider}>
          <Text style={styles.scoreText}>{match.score}</Text>
        </View>
        <PlayerSlot
          player={match.player2}
          seed={match.seed2}
          isWinner={match.winnerId === match.player2Id}
        />
      </View>
    </View>
  );
}

// ─── Champion Card ───────────────────────────────────────────────────
function ChampionCard({ match }: { match: DrawMatch }) {
  const champion = match.winnerId === match.player1Id ? match.player1 : match.player2;
  if (!champion) return null;

  return (
    <View style={styles.championCard}>
      <Text style={styles.championLabel}>🏆 CHAMPION 🏆</Text>
      <Image
        source={{ uri: champion.photoUrl || getAvatarUrl(champion.name, 120) }}
        style={styles.championAvatar}
      />
      <Text style={styles.championName}>
        {champion.name} {champion.countryFlag}
      </Text>
      <Text style={styles.championScore}>{match.score}</Text>
    </View>
  );
}

// ─── Year Selector ───────────────────────────────────────────────────
function YearSelector({
  selectedYear,
  onSelectYear,
}: {
  selectedYear: number;
  onSelectYear: (year: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.yearSelectorContent}
      style={styles.yearSelector}
    >
      {AVAILABLE_YEARS.map((year) => (
        <TouchableOpacity
          key={year}
          style={[styles.yearPill, selectedYear === year && styles.yearPillActive]}
          onPress={() => onSelectYear(year)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.yearPillText, selectedYear === year && styles.yearPillTextActive]}
          >
            {year}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Results match card ──────────────────────────────────────────────
function ResultMatch({ match }: { match: MatchWithPlayers }) {
  const p1Won = match.winnerId === match.player1Id;
  const p2Won = match.winnerId === match.player2Id;

  return (
    <View style={styles.resultMatch}>
      <View style={styles.resultPlayers}>
        <View style={[styles.resultPlayerRow, p1Won && styles.resultPlayerRowWinner]}>
          <Image
            source={{
              uri:
                match.player1?.photoUrl ||
                getAvatarUrl(match.player1?.name || 'P1', 60),
            }}
            style={styles.resultAvatar}
          />
          <Text
            style={[
              styles.resultName,
              p1Won && styles.winnerName,
              !p1Won && styles.loserName,
            ]}
            numberOfLines={1}
          >
            {match.player1?.name || 'TBD'} {match.player1?.countryFlag || ''}
          </Text>
        </View>
        <Text style={styles.resultScore}>{match.score}</Text>
        <View style={[styles.resultPlayerRow, p2Won && styles.resultPlayerRowWinner]}>
          <Image
            source={{
              uri:
                match.player2?.photoUrl ||
                getAvatarUrl(match.player2?.name || 'P2', 60),
            }}
            style={styles.resultAvatar}
          />
          <Text
            style={[
              styles.resultName,
              p2Won && styles.winnerName,
              !p2Won && styles.loserName,
            ]}
            numberOfLines={1}
          >
            {match.player2?.name || 'TBD'} {match.player2?.countryFlag || ''}
          </Text>
        </View>
      </View>
      {match.date && <Text style={styles.resultDate}>{match.date}</Text>}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────
export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'bracket' | 'results'>('bracket');
  const [selectedYear, setSelectedYear] = useState(2024);

  const { data: tournament } = useQuery<TournamentDetail>({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const res = await api.get(`/api/tournaments/${id}`);
      return res.data;
    },
  });

  const {
    data: draw,
    isLoading,
    error,
    refetch,
  } = useQuery<DrawData>({
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
        <SkeletonList count={5} cardHeight={100} />
      </View>
    );
  }

  const tournamentName = tournament?.name || draw?.name || 'Tournament';
  const surfaceEmoji = tournament ? getSurfaceEmoji(tournament.surface) : '';

  const sortedRounds = draw?.rounds
    ? [...draw.rounds].sort(
        (a, b) => ROUND_ORDER.indexOf(a.round) - ROUND_ORDER.indexOf(b.round)
      )
    : [];

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
      .forEach(([round, matches]) => {
        matchesByRound.push({ round, matches });
      });
  }

  return (
    <>
      <Stack.Screen options={{ title: tournamentName }} />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#16a34a"
            colors={['#16a34a']}
          />
        }
      >
        {/* Tournament Header */}
        <View style={styles.headerSection}>
          <Text style={styles.tournamentTitle}>
            {surfaceEmoji} {tournamentName}
          </Text>
          {tournament && (
            <>
              <View style={styles.metaRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{tournament.category}</Text>
                </View>
                <View style={styles.surfaceBadge}>
                  <Text style={styles.surfaceBadgeText}>
                    {surfaceEmoji} {tournament.surface}
                  </Text>
                </View>
              </View>
              <Text style={styles.tournamentLocation}>📍 {tournament.location}</Text>
              <Text style={styles.tournamentDates}>
                📅 {tournament.startDate} → {tournament.endDate}
              </Text>
            </>
          )}
        </View>

        {/* Year Selector */}
        <YearSelector selectedYear={selectedYear} onSelectYear={setSelectedYear} />

        {/* Tabs: Bracket | Results */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bracket' && styles.activeTab]}
            onPress={() => setActiveTab('bracket')}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.tabText, activeTab === 'bracket' && styles.activeTabText]}
            >
              🏆 Bracket
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'results' && styles.activeTab]}
            onPress={() => setActiveTab('results')}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.tabText, activeTab === 'results' && styles.activeTabText]}
            >
              📊 Results
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'bracket' ? (
          <>
            {error || !draw ? (
              <EmptyState
                message={`No bracket data for ${selectedYear}`}
                icon="📋"
              />
            ) : (
              <>
                {/* Champion highlight */}
                {finalRound && finalRound.matches.length > 0 && (
                  <ChampionCard match={finalRound.matches[0]} />
                )}

                {sortedRounds.map((round) => (
                  <View key={round.round} style={styles.roundSection}>
                    <View style={styles.roundHeader}>
                      <Text style={styles.roundTitle}>{round.round}</Text>
                      <Text style={styles.roundAbbrev}>
                        {getRoundAbbrev(round.round)}
                      </Text>
                    </View>
                    {round.matches.map((match, idx) => (
                      <BracketMatch
                        key={idx}
                        match={match}
                        isFinal={round.round === 'Final'}
                      />
                    ))}
                  </View>
                ))}
              </>
            )}
          </>
        ) : (
          <>
            {matchesByRound.length === 0 ? (
              <EmptyState
                message="No match results available"
                icon="📊"
              />
            ) : (
              matchesByRound.map((group) => (
                <View key={group.round} style={styles.roundSection}>
                  <View style={styles.roundHeader}>
                    <Text style={styles.roundTitle}>{group.round}</Text>
                    <Text style={styles.roundAbbrev}>
                      {getRoundAbbrev(group.round)}
                    </Text>
                    <Text style={styles.matchCount}>
                      {group.matches.length} match{group.matches.length !== 1 ? 'es' : ''}
                    </Text>
                  </View>
                  {group.matches.map((match) => (
                    <ResultMatch key={match.id} match={match} />
                  ))}
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
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  center: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  tournamentTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  surfaceBadge: {
    backgroundColor: '#2a2a4e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  surfaceBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  tournamentLocation: {
    fontSize: 13,
    color: '#a0a0b0',
    marginBottom: 4,
  },
  tournamentDates: {
    fontSize: 11,
    color: '#6b7280',
  },

  // Year Selector
  yearSelector: {
    maxHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  yearSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  yearPill: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  yearPillActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  yearPillText: {
    fontSize: 13,
    color: '#a0a0b0',
    fontWeight: '600',
  },
  yearPillTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#16a34a',
  },
  tabText: {
    color: '#a0a0b0',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ffffff',
  },

  // Champion Card
  championCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  championLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 12,
    letterSpacing: 2,
  },
  championAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#f59e0b',
    marginBottom: 10,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  championName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  championScore: {
    fontSize: 14,
    color: '#a0a0b0',
    fontWeight: '600',
  },

  // Round
  roundSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  roundTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  roundAbbrev: {
    fontSize: 11,
    color: '#a0a0b0',
    backgroundColor: '#2a2a4e',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  matchCount: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 'auto',
  },

  // Bracket Match
  bracketMatchWrapper: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  connectorLine: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorVertical: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: '#2a2a4e',
    left: 6,
    borderRadius: 1,
  },
  connectorHorizontal: {
    position: 'absolute',
    width: 10,
    height: 2,
    backgroundColor: '#2a2a4e',
    left: 6,
    borderRadius: 1,
  },
  bracketMatch: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  finalMatch: {
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  finalBanner: {
    backgroundColor: '#f59e0b',
    paddingVertical: 5,
    alignItems: 'center',
  },
  finalBannerText: {
    color: '#0f0f23',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  playerSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  winnerSlot: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
  },
  slotAvatar: {
    width: MATCH_AVATAR_SIZE,
    height: MATCH_AVATAR_SIZE,
    borderRadius: MATCH_AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: '#2a2a4e',
  },
  slotAvatarWinner: {
    borderColor: '#16a34a',
  },
  emptyAvatar: {
    backgroundColor: '#2a2a4e',
    borderColor: '#3a3a5e',
  },
  slotInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotName: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    flexShrink: 1,
  },
  slotNameEmpty: {
    fontSize: 13,
    color: '#6b7280',
  },
  winnerName: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  loserName: {
    color: '#6b7280',
  },
  winIndicator: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  slotSeed: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  scoreDivider: {
    backgroundColor: '#2a2a4e',
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Results styles
  resultMatch: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginBottom: 12,
    padding: 14,
  },
  resultPlayers: {
    gap: 8,
  },
  resultPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    padding: 4,
  },
  resultPlayerRowWinner: {
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
  },
  resultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  resultName: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
  resultScore: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#2a2a4e',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'center',
  },
  resultDate: {
    textAlign: 'right',
    color: '#6b7280',
    fontSize: 11,
    marginTop: 6,
  },
});
