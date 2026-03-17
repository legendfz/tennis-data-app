import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/api/client';
import { Avatar } from '../../src/components/Avatar';
import { ErrorState } from '../../src/components/ErrorState';
import { LiveDot } from '../../src/components/LiveDot';
import { MatchCard } from '../../src/components/MatchCard';
import { SkeletonMatchCard } from '../../src/components/SkeletonLoader';
import { Colors } from '../../src/theme/colors';

type Category = 'All' | 'ATP' | 'WTA';

function getTodayParams() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

export default function HomeScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>('All');
  const [refreshing, setRefreshing] = useState(false);

  const { year, month, day } = getTodayParams();

  const liveQuery = useQuery({
    queryKey: ['matches', 'live'],
    queryFn: () => api.getLiveMatches(),
    refetchInterval: 30_000,
  });

  const scheduleQuery = useQuery({
    queryKey: ['matches', 'date', year, month, day],
    queryFn: () => api.getMatchesByDate(year, month, day),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([liveQuery.refetch(), scheduleQuery.refetch()]);
    setRefreshing(false);
  };

  const filterMatches = (matches: any[]) => {
    if (category === 'All') return matches;
    return matches.filter((m: any) => {
      const name = m.tournament?.name?.toLowerCase() ?? '';
      if (category === 'ATP') return name.includes('atp') || !name.includes('wta');
      if (category === 'WTA') return name.includes('wta');
      return true;
    });
  };

  const liveMatches = filterMatches(liveQuery.data ?? []);
  const scheduleMatches = filterMatches(scheduleQuery.data ?? []);

  // Group schedule by tournament
  const byTournament: Record<string, { tournament: any; matches: any[] }> = {};
  for (const m of scheduleMatches) {
    const key = m.tournament?.id ?? 'unknown';
    if (!byTournament[key]) {
      byTournament[key] = { tournament: m.tournament, matches: [] };
    }
    byTournament[key].matches.push(m);
  }

  const isLoading = liveQuery.isLoading && scheduleQuery.isLoading;
  const isError = liveQuery.isError && scheduleQuery.isError;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Category pills */}
      <View style={styles.pillsRow}>
        {(['All', 'ATP', 'WTA'] as Category[]).map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.pill, category === c && styles.pillActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.pillText, category === c && styles.pillTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && (
        <ScrollView>
          <Text style={styles.sectionHeader}>Live Now</Text>
          <SkeletonMatchCard />
          <SkeletonMatchCard />
          <Text style={styles.sectionHeader}>Today's Schedule</Text>
          <SkeletonMatchCard />
          <SkeletonMatchCard />
        </ScrollView>
      )}

      {isError && !isLoading && (
        <ErrorState
          message="Couldn't load matches"
          onRetry={onRefresh}
        />
      )}

      {!isLoading && !isError && (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accentGreen}
            />
          }
        >
          {/* Live section */}
          {liveMatches.length > 0 && (
            <>
              <View style={styles.sectionHeaderRow}>
                <LiveDot showLabel={false} />
                <Text style={styles.sectionHeader}>Live Now</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{liveMatches.length}</Text>
                </View>
              </View>
              {liveMatches.map((m: any) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </>
          )}

          {/* Today's Schedule */}
          {Object.keys(byTournament).length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Today's Schedule</Text>
              {Object.values(byTournament).map(({ tournament, matches }) => (
                <View key={tournament?.id ?? 'unknown'}>
                  {/* Tournament header */}
                  <TouchableOpacity
                    style={styles.tournamentHeader}
                    onPress={() =>
                      tournament?.id && router.push(`/tournament/${tournament.id}`)
                    }
                  >
                    <Text style={styles.tournamentName}>{tournament?.name ?? 'Unknown Tournament'}</Text>
                    <Text style={styles.tournamentArrow}>›</Text>
                  </TouchableOpacity>

                  {/* Schedule rows */}
                  {matches.map((m: any) => (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.scheduleRow}
                      onPress={() => router.push(`/match/${m.id}`)}
                    >
                      <View style={styles.scheduleAvatars}>
                        <TouchableOpacity onPress={() => router.push(`/player/${m.homeTeam.id}`)}>
                          <Avatar playerId={m.homeTeam.id} name={m.homeTeam.name} size={40} />
                        </TouchableOpacity>
                        <Text style={styles.vsText}>vs</Text>
                        <TouchableOpacity onPress={() => router.push(`/player/${m.awayTeam.id}`)}>
                          <Avatar playerId={m.awayTeam.id} name={m.awayTeam.name} size={40} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.scheduleInfo}>
                        <Text style={styles.schedulePlayers} numberOfLines={1}>
                          {m.homeTeam.name} vs {m.awayTeam.name}
                        </Text>
                        <Text style={styles.scheduleMeta}>
                          {m.roundInfo?.name ?? ''}
                          {m.startTimestamp
                            ? ` · ${new Date(m.startTimestamp * 1000).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}`
                            : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </>
          )}

          {liveMatches.length === 0 && Object.keys(byTournament).length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎾</Text>
              <Text style={styles.emptyText}>No matches today</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  pillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.bgTertiary,
  },
  pillActive: {
    backgroundColor: Colors.accentBlue,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  pillTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  sectionHeader: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  countBadge: {
    backgroundColor: Colors.accentGreen,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    color: Colors.bgPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.bgSecondary,
    marginBottom: 1,
  },
  tournamentName: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  tournamentArrow: {
    color: Colors.textTertiary,
    fontSize: 18,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  scheduleAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vsText: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  schedulePlayers: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  scheduleMeta: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
