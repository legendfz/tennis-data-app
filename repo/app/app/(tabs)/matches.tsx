import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { useLanguage } from '../../lib/i18n';
import { SkeletonList } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import { theme } from '../../lib/theme';
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

export default function MatchesScreen() {
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const router = useRouter();
  const { getPlayerName, t } = useLanguage();

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
        <SkeletonList count={8} cardHeight={48} />
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
          activeOpacity={theme.activeOpacity}
        >
          <Text style={[styles.chipText, !selectedTournament && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {tournaments.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.chip, selectedTournament === t.id && styles.chipActive]}
            onPress={() => setSelectedTournament(t.id === selectedTournament ? null : t.id)}
            activeOpacity={theme.activeOpacity}
          >
            <Text
              style={[styles.chipText, selectedTournament === t.id && styles.chipTextActive]}
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
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const p1Won = item.winnerId === item.player1Id;
          const p2Won = item.winnerId === item.player2Id;
          const isFinished = item.winnerId != null;
          const p1Name = item.player1 ? getPlayerName(item.player1) : `Player ${item.player1Id}`;
          const p2Name = item.player2 ? getPlayerName(item.player2) : `Player ${item.player2Id}`;

          return (
            <TouchableOpacity
              style={styles.matchRow}
              onPress={() => router.push(`/match/${item.id}`)}
              activeOpacity={theme.activeOpacity}
            >
              <View style={styles.matchMeta}>
                <Text style={styles.matchTournament}>{item.tournament?.name || 'Tournament'}</Text>
                <Text style={styles.matchRound}>{item.round}</Text>
              </View>
              <View style={styles.matchContent}>
                <Text
                  style={[styles.matchPlayer, styles.matchPlayerLeft, p1Won && styles.bold, !p1Won && p2Won && styles.dim]}
                  numberOfLines={1}
                >
                  {p1Name}
                </Text>
                <View style={styles.matchCenter}>
                  <Text style={styles.matchScore}>{item.score || '--'}</Text>
                  {isFinished && <Text style={styles.ft}>FT</Text>}
                </View>
                <Text
                  style={[styles.matchPlayer, styles.matchPlayerRight, p2Won && styles.bold, !p2Won && p1Won && styles.dim]}
                  numberOfLines={1}
                >
                  {p2Name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message={t('noMatchesFound')} subtitle={t('tryChangingFilter')} />}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  filterRow: {
    maxHeight: 48,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  chip: {
    backgroundColor: theme.glass,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: theme.accent,
  },
  chipText: {
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: theme.fontWeight.medium,
  },
  chipTextActive: {
    color: theme.text,
    fontWeight: theme.fontWeight.semibold,
  },
  list: {
    paddingBottom: 20,
  },
  sectionHeaderWrap: {
    backgroundColor: theme.bg,
    paddingHorizontal: theme.spacing.padding,
    paddingTop: 20,
    paddingBottom: 6,
  },
  sectionHeader: {
    fontSize: theme.fontSize.secondary,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchRow: {
    backgroundColor: theme.glass,
    marginHorizontal: theme.spacing.padding,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderTopColor: theme.glassBorderTop,
    paddingHorizontal: theme.spacing.padding,
    paddingVertical: 10,
    minHeight: 56,
    ...theme.glassCardShadow,
  },
  matchMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  matchTournament: {
    fontSize: 11,
    color: '#555',
    letterSpacing: 1,
  },
  matchRound: {
    fontSize: 11,
    color: theme.textTertiary,
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchPlayer: {
    flex: 1,
    fontSize: theme.fontSize.body,
    color: theme.text,
  },
  matchPlayerLeft: {
    textAlign: 'right',
    paddingRight: 12,
  },
  matchPlayerRight: {
    textAlign: 'left',
    paddingLeft: 12,
  },
  bold: {
    fontWeight: theme.fontWeight.bold,
    color: theme.winnerText,
  },
  dim: {
    color: theme.loserText,
    fontWeight: theme.fontWeight.regular,
  },
  matchCenter: {
    alignItems: 'center',
    minWidth: 70,
  },
  matchScore: {
    fontSize: 17,
    fontWeight: theme.fontWeight.extrabold,
    color: theme.text,
  },
  ft: {
    fontSize: theme.fontSize.small,
    color: theme.textTertiary,
    fontWeight: theme.fontWeight.regular,
    opacity: 0.5,
    marginTop: 1,
  },
});
