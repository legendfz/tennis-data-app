import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import { SkeletonList } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import type { MatchWithPlayers, Tournament } from '../../../shared/types';

function getDateGroup(dateStr: string): string {
  const today = new Date();
  const date = new Date(dateStr);
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';

  const diffDays = Math.floor(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 7) return 'This Week';
  if (diffDays < 30) return 'This Month';
  if (diffDays < 90) return 'Last 3 Months';

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

export default function MatchesScreen() {
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const router = useRouter();

  const { data: matchesData, isLoading, refetch } = useQuery<{ data: MatchWithPlayers[] }>({
    queryKey: ['matches-all'],
    queryFn: async () => {
      const res = await api.get('/api/matches?limit=200');
      return res.data;
    },
  });

  const { data: tournamentsData } = useQuery<{ data: Tournament[] }>({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const res = await api.get('/api/tournaments');
      return res.data;
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const matches: MatchWithPlayers[] =
    matchesData?.data ?? (Array.isArray(matchesData) ? (matchesData as MatchWithPlayers[]) : []);
  const tournaments: Tournament[] =
    tournamentsData?.data ?? (Array.isArray(tournamentsData) ? (tournamentsData as Tournament[]) : []);

  const filteredMatches = useMemo(() => {
    if (!selectedTournament) return matches;
    return matches.filter((m) => m.tournamentId === selectedTournament);
  }, [matches, selectedTournament]);

  const sections = useMemo(() => {
    const groups: Record<string, MatchWithPlayers[]> = {};
    const groupOrder: string[] = [];

    filteredMatches.forEach((m) => {
      const group = getDateGroup(m.date);
      if (!groups[group]) {
        groups[group] = [];
        groupOrder.push(group);
      }
      groups[group].push(m);
    });

    return groupOrder.map((title) => ({
      title,
      data: groups[title],
    }));
  }, [filteredMatches]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SkeletonList count={6} cardHeight={90} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.chip, !selectedTournament && styles.chipActive]}
          onPress={() => setSelectedTournament(null)}
        >
          <Text style={[styles.chipText, !selectedTournament && styles.chipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {tournaments.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.chip, selectedTournament === t.id && styles.chipActive]}
            onPress={() => setSelectedTournament(t.id === selectedTournament ? null : t.id)}
          >
            <Text
              style={[
                styles.chipText,
                selectedTournament === t.id && styles.chipTextActive,
              ]}
              numberOfLines={1}
            >
              {t.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#16a34a"
            colors={['#16a34a']}
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.matchCard}
            onPress={() => router.push(`/match/${item.id}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.tournament}>
              {item.tournament?.name || 'Tournament'} · {item.round}
            </Text>
            <View style={styles.versus}>
              <View style={styles.playerSide}>
                <Image
                  source={{
                    uri:
                      item.player1?.photoUrl ||
                      getAvatarUrl(item.player1?.name || 'P1', 80),
                  }}
                  style={styles.matchAvatar}
                />
                <Text
                  style={[
                    styles.playerName,
                    item.winnerId === item.player1Id && styles.winner,
                  ]}
                  numberOfLines={1}
                >
                  {item.player1?.name || `Player ${item.player1Id}`}
                </Text>
              </View>

              <Text style={styles.vs}>vs</Text>

              <View style={styles.playerSide}>
                <Image
                  source={{
                    uri:
                      item.player2?.photoUrl ||
                      getAvatarUrl(item.player2?.name || 'P2', 80),
                  }}
                  style={styles.matchAvatar}
                />
                <Text
                  style={[
                    styles.playerName,
                    item.winnerId === item.player2Id && styles.winner,
                  ]}
                  numberOfLines={1}
                >
                  {item.player2?.name || `Player ${item.player2Id}`}
                </Text>
              </View>
            </View>
            <Text style={styles.score}>{item.score}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            message="No matches found"
            icon="⚔️"
            subtitle="Try changing the filter"
          />
        }
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  filterRow: {
    maxHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  chipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  chipText: {
    fontSize: 13,
    color: '#a0a0b0',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
    paddingTop: 16,
    paddingBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  matchCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  tournament: {
    color: '#a0a0b0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  versus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  playerSide: {
    flex: 1,
    alignItems: 'center',
  },
  matchAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#2a2a4e',
    marginBottom: 4,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  winner: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  vs: {
    color: '#a0a0b0',
    fontSize: 12,
    marginHorizontal: 8,
  },
  score: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
});
