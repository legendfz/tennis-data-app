import { useState } from 'react';
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
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import type { Player, MatchWithPlayers } from '../../../shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MATCH_AVATAR_SIZE = 44;

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

// Round order for bracket display
const ROUND_ORDER = [
  'Final',
  'Semi-Final',
  'Quarter-Final',
  'Round of 16',
  'Round of 32',
  'Round of 64',
  'Round Robin',
];

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
        style={styles.slotAvatar}
      />
      <View style={styles.slotInfo}>
        <Text style={[styles.slotName, isWinner && styles.winnerName]} numberOfLines={1}>
          {player.name} {player.countryFlag}
        </Text>
        {seed ? <Text style={styles.slotSeed}>[{seed}]</Text> : null}
      </View>
    </View>
  );
}

function BracketMatch({ match }: { match: DrawMatch }) {
  return (
    <View style={styles.bracketMatch}>
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
  );
}

// ─── Results match card ──────────────────────────────────────────────
function ResultMatch({ match }: { match: MatchWithPlayers }) {
  return (
    <View style={styles.resultMatch}>
      <View style={styles.resultPlayers}>
        <View style={styles.resultPlayerRow}>
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
              match.winnerId === match.player1Id && styles.winnerName,
            ]}
            numberOfLines={1}
          >
            {match.player1?.name || 'TBD'} {match.player1?.countryFlag || ''}
          </Text>
        </View>
        <Text style={styles.resultScore}>{match.score}</Text>
        <View style={styles.resultPlayerRow}>
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
              match.winnerId === match.player2Id && styles.winnerName,
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

  // Fetch tournament info (includes matches for results tab)
  const { data: tournament } = useQuery<TournamentDetail>({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const res = await api.get(`/api/tournaments/${id}`);
      return res.data;
    },
  });

  // Fetch draw data
  const {
    data: draw,
    isLoading,
    error,
  } = useQuery<DrawData>({
    queryKey: ['tournament-draw', id],
    queryFn: async () => {
      const res = await api.get(`/api/tournaments/${id}/draw`);
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

  const tournamentName = tournament?.name || draw?.name || 'Tournament';
  const surfaceEmoji = tournament ? getSurfaceEmoji(tournament.surface) : '';

  // Sort rounds in bracket order
  const sortedRounds = draw?.rounds
    ? [...draw.rounds].sort(
        (a, b) => ROUND_ORDER.indexOf(a.round) - ROUND_ORDER.indexOf(b.round)
      )
    : [];

  // Group matches by round for results tab
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
      <ScrollView style={styles.container}>
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
          {draw && (
            <View style={styles.yearBadge}>
              <Text style={styles.yearText}>{draw.year}</Text>
            </View>
          )}
        </View>

        {/* Tabs: Bracket | Results */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bracket' && styles.activeTab]}
            onPress={() => setActiveTab('bracket')}
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
              <View style={styles.noDraw}>
                <Text style={styles.noDrawText}>
                  No bracket data available for this tournament
                </Text>
              </View>
            ) : (
              sortedRounds.map((round) => (
                <View key={round.round} style={styles.roundSection}>
                  <View style={styles.roundHeader}>
                    <Text style={styles.roundTitle}>{round.round}</Text>
                    <Text style={styles.roundAbbrev}>
                      {getRoundAbbrev(round.round)}
                    </Text>
                  </View>
                  {round.matches.map((match, idx) => (
                    <BracketMatch key={idx} match={match} />
                  ))}
                </View>
              ))
            )}
          </>
        ) : (
          /* Results Tab */
          <>
            {matchesByRound.length === 0 ? (
              <View style={styles.noDraw}>
                <Text style={styles.noDrawText}>No match results available</Text>
              </View>
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
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  tournamentTitle: {
    fontSize: 24,
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
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  surfaceBadge: {
    backgroundColor: '#2a2a4e',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  surfaceBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  tournamentLocation: {
    fontSize: 14,
    color: '#a0a0b0',
    marginBottom: 4,
  },
  tournamentDates: {
    fontSize: 13,
    color: '#a0a0b0',
    marginBottom: 8,
  },
  yearBadge: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  yearText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
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
  noDraw: {
    padding: 40,
    alignItems: 'center',
  },
  noDrawText: {
    color: '#a0a0b0',
    fontSize: 14,
  },
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  roundAbbrev: {
    fontSize: 12,
    color: '#a0a0b0',
    backgroundColor: '#2a2a4e',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  matchCount: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 'auto',
  },
  bracketMatch: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  playerSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  winnerSlot: {
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
  },
  slotAvatar: {
    width: MATCH_AVATAR_SIZE,
    height: MATCH_AVATAR_SIZE,
    borderRadius: MATCH_AVATAR_SIZE / 2,
    borderWidth: 2,
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
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
    flexShrink: 1,
  },
  slotNameEmpty: {
    fontSize: 14,
    color: '#6b7280',
  },
  winnerName: {
    color: '#16a34a',
    fontWeight: 'bold',
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

  // ── Results styles ──
  resultMatch: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
  },
  resultPlayers: {
    gap: 8,
  },
  resultPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#16a34a',
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
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'center',
  },
  resultDate: {
    textAlign: 'right',
    color: '#6b7280',
    fontSize: 11,
    marginTop: 6,
  },
});
