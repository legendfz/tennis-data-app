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
import type { Tournament } from '../../../shared/types';

function getSurfaceColor(surface: string): string {
  const lower = surface.toLowerCase();
  if (lower.includes('clay')) return '#f97316';
  if (lower.includes('grass')) return '#22c55e';
  if (lower.includes('hard')) return '#3b82f6';
  return '#6b7280';
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
            tintColor="#16a34a"
            colors={['#16a34a']}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/tournament/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <TournamentLogo tournament={item} size="md" />
              <View style={styles.rowInfo}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.meta}>{item.location} · {item.surface}</Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.category}>{item.category}</Text>
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
    backgroundColor: '#121212',
  },
  list: {
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  surfaceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  rowInfo: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
  },
  rowRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    marginBottom: 2,
  },
  dates: {
    fontSize: 11,
    color: '#6b7280',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#2a2a2a',
    marginLeft: 36,
  },
});
