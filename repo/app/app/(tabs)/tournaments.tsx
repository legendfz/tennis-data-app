import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { SkeletonList } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import { TournamentLogo } from '../../lib/tournament-logo';
import { theme } from '../../lib/theme';
import type { Tournament } from '../../../shared/types';

/** Returns a label like "ATP 500" / "WTA 1000", or null if points should be hidden */
function getTournamentPointsLabel(tournament: any): string | null {
  if (!tournament?.points) return null;
  const points = tournament.points;
  const category: string = tournament.category || '';
  if (points >= 1000 && !category.includes('WTA')) return null;
  return `${category} ${points}`;
}

export default function TournamentsScreen() {
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery<{ data: Tournament[] }>({
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

  const tournaments = data?.data ?? (Array.isArray(data) ? data : []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SkeletonList count={6} cardHeight={60} />
      </View>
    );
  }

  if (error) {
    return <EmptyState message="Failed to load events" subtitle={(error as Error).message} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tournaments}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/tournament/${item.id}`)}
            activeOpacity={theme.activeOpacity}
          >
            <View style={styles.rowLeft}>
              <TournamentLogo tournament={item} size="md" />
              <View style={styles.rowInfo}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.meta}>{item.location} · {item.surface}</Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.category}>{item.category}</Text>
                {(() => {
                  const label = getTournamentPointsLabel(item);
                  return label ? (
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsBadgeText}>{label}</Text>
                    </View>
                  ) : null;
                })()}
              </View>
              <Text style={styles.dates}>{item.startDate} — {item.endDate}</Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState message="No events found" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  list: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.padding,
    paddingVertical: 14,
    minHeight: 56,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  rowInfo: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
    marginBottom: 2,
  },
  meta: {
    fontSize: theme.fontSize.secondary,
    color: theme.textTertiary,
  },
  rowRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  category: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
    marginBottom: 2,
  },
  dates: {
    fontSize: 11,
    color: theme.textTertiary,
  },
  separator: {
    height: 0.5,
    backgroundColor: theme.border,
    marginLeft: 36,
  },
  pointsBadge: {
    backgroundColor: theme.accent,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pointsBadgeText: {
    color: theme.text,
    fontSize: theme.fontSize.small,
    fontWeight: theme.fontWeight.bold,
  },
});
