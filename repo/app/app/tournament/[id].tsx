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
import { TournamentLogo } from '../../lib/tournament-logo';
import type { Player, MatchWithPlayers } from '../../../shared/types';

const MATCH_AVATAR_SIZE = 36;

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

function PlayerSlot({ player, seed, isWinner }: { player?: Player; seed: number | null; isWinner: boolean }) {
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
      {isWinner && <Text style={styles.winCheck}>✓</Text>}
    </View>
  );
}

function BracketMatch({ match, isFinal }: { match: DrawMatch; isFinal: boolean }) {
  return (
    <View style={[styles.bracketMatch, isFinal && styles.finalMatch]}>
      {isFinal && (
        <View style={styles.finalBanner}><Text style={styles.finalBannerText}>FINAL</Text></View>
      )}
      <PlayerSlot player={match.player1} seed={match.seed1} isWinner={match.winnerId === match.player1Id} />
      <View style={styles.scoreDivider}>
        <Text style={styles.scoreText}>{match.score}</Text>
      </View>
      <PlayerSlot player={match.player2} seed={match.seed2} isWinner={match.winnerId === match.player2Id} />
    </View>
  );
}

function ChampionCard({ match }: { match: DrawMatch }) {
  const champion = match.winnerId === match.player1Id ? match.player1 : match.player2;
  if (!champion) return null;
  return (
    <View style={styles.championCard}>
      <Text style={styles.championLabel}>CHAMPION</Text>
      <Image source={{ uri: champion.photoUrl || getAvatarUrl(champion.name, 120) }} style={styles.championAvatar} />
      <Text style={styles.championName}>{champion.name} {champion.countryFlag}</Text>
      <Text style={styles.championScore}>{match.score}</Text>
    </View>
  );
}

function ResultMatch({ match }: { match: MatchWithPlayers }) {
  const p1Won = match.winnerId === match.player1Id;
  const p2Won = match.winnerId === match.player2Id;
  return (
    <View style={styles.resultMatch}>
      <View style={styles.resultRow}>
        <Image source={{ uri: match.player1?.photoUrl || getAvatarUrl(match.player1?.name || 'P1', 60) }} style={styles.resultAvatar} />
        <Text style={[styles.resultName, p1Won && styles.winnerName, !p1Won && styles.loserName]} numberOfLines={1}>
          {match.player1?.name || 'TBD'} {match.player1?.countryFlag || ''}
        </Text>
      </View>
      <Text style={styles.resultScore}>{match.score}</Text>
      <View style={styles.resultRow}>
        <Image source={{ uri: match.player2?.photoUrl || getAvatarUrl(match.player2?.name || 'P2', 60) }} style={styles.resultAvatar} />
        <Text style={[styles.resultName, p2Won && styles.winnerName, !p2Won && styles.loserName]} numberOfLines={1}>
          {match.player2?.name || 'TBD'} {match.player2?.countryFlag || ''}
        </Text>
      </View>
      {match.date && <Text style={styles.resultDate}>{match.date}</Text>}
    </View>
  );
}

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
              <>
                {finalRound && finalRound.matches.length > 0 && <ChampionCard match={finalRound.matches[0]} />}
                {sortedRounds.map((round) => (
                  <View key={round.round} style={styles.roundSection}>
                    <View style={styles.roundHeader}>
                      <Text style={styles.roundTitle}>{round.round}</Text>
                      <Text style={styles.roundAbbrev}>{getRoundAbbrev(round.round)}</Text>
                    </View>
                    {round.matches.map((match, idx) => (
                      <BracketMatch key={idx} match={match} isFinal={round.round === 'Final'} />
                    ))}
                  </View>
                ))}
              </>
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
                  {group.matches.map((match) => <ResultMatch key={match.id} match={match} />)}
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
  container: { flex: 1, backgroundColor: '#121212' },

  // Header
  headerSection: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a2a2a',
  },
  tournamentTitle: { fontSize: 22, fontWeight: '600', color: '#ffffff', textAlign: 'center', marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  categoryBadge: { backgroundColor: '#2a2a2a', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
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
  surfaceBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '500' },
  locationText: { fontSize: 13, color: '#9ca3af', marginBottom: 2 },
  dateText: { fontSize: 12, color: '#6b7280' },

  // Year
  yearScroll: { maxHeight: 48, borderBottomWidth: 0.5, borderBottomColor: '#2a2a2a' },
  yearRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  yearPill: { backgroundColor: '#1e1e1e', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  yearPillActive: { backgroundColor: '#16a34a' },
  yearPillText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  yearPillTextActive: { color: '#ffffff', fontWeight: '600' },

  // Tabs
  tabRow: {
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
  tabActive: { borderBottomColor: '#16a34a' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  tabTextActive: { color: '#16a34a', fontWeight: '600' },

  // Champion
  championCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  championLabel: { fontSize: 13, fontWeight: '700', color: '#f59e0b', marginBottom: 10, letterSpacing: 2 },
  championAvatar: { width: 72, height: 72, borderRadius: 36, marginBottom: 10 },
  championName: { fontSize: 18, fontWeight: '600', color: '#ffffff', marginBottom: 4 },
  championScore: { fontSize: 13, color: '#6b7280' },

  // Round
  roundSection: { marginTop: 16, paddingHorizontal: 16 },
  roundHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  roundTitle: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  roundAbbrev: { fontSize: 11, color: '#6b7280', backgroundColor: '#1e1e1e', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  matchCount: { fontSize: 11, color: '#6b7280', marginLeft: 'auto' },

  // Bracket Match
  bracketMatch: { backgroundColor: '#1e1e1e', borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  finalMatch: { borderWidth: 1, borderColor: '#f59e0b' },
  finalBanner: { backgroundColor: '#f59e0b', paddingVertical: 4, alignItems: 'center' },
  finalBannerText: { color: '#ffffff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  playerSlot: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 8 },
  winnerSlot: { backgroundColor: 'rgba(245, 158, 11, 0.08)' },
  slotAvatar: { width: MATCH_AVATAR_SIZE, height: MATCH_AVATAR_SIZE, borderRadius: MATCH_AVATAR_SIZE / 2 },
  emptyAvatar: { backgroundColor: '#2a2a2a' },
  slotInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  slotName: { fontSize: 13, color: '#ffffff', fontWeight: '500', flexShrink: 1 },
  slotNameEmpty: { fontSize: 13, color: '#6b7280' },
  winnerName: { color: '#fff', fontWeight: '700' },
  loserName: { color: '#6b7280' },
  winCheck: { color: '#f59e0b', fontSize: 14, fontWeight: '700', marginRight: 6 },
  slotSeed: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  scoreDivider: { backgroundColor: '#2a2a2a', paddingVertical: 3, paddingHorizontal: 10, alignItems: 'center' },
  scoreText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },

  // Results
  resultMatch: { backgroundColor: '#1e1e1e', borderRadius: 10, marginBottom: 8, padding: 10 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  resultAvatar: { width: 28, height: 28, borderRadius: 14 },
  resultName: { fontSize: 13, color: '#ffffff', flex: 1 },
  resultScore: { textAlign: 'center', color: '#ffffff', fontSize: 12, fontWeight: '700', backgroundColor: '#2a2a2a', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'center', marginVertical: 4 },
  resultDate: { textAlign: 'right', color: '#6b7280', fontSize: 11, marginTop: 4 },
});
