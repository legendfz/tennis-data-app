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
import type { Tournament } from '../../../shared/types';

const SURFACE_COLORS: Record<string, string> = {
  Hard: '#3b82f6',
  Clay: '#f97316',
  Grass: '#22c55e',
};

function getSurfaceBaseColor(surface: string): string {
  const lower = surface.toLowerCase();
  if (lower.includes('clay')) return SURFACE_COLORS.Clay;
  if (lower.includes('grass')) return SURFACE_COLORS.Grass;
  if (lower.includes('hard')) return SURFACE_COLORS.Hard;
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
        <SkeletonList count={5} cardHeight={120} />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        message="Failed to load tournaments"
        icon="😞"
        subtitle={(error as Error).message}
      />
    );
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
            style={styles.card}
            onPress={() => router.push(`/tournament/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.header}>
              <Text style={styles.name}>{item.name}</Text>
              <View
                style={[
                  styles.surfaceBadge,
                  { backgroundColor: getSurfaceBaseColor(item.surface) },
                ]}
              >
                <Text style={styles.surfaceText}>{item.surface}</Text>
              </View>
            </View>
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.location}>📍 {item.location}</Text>
            <Text style={styles.dates}>
              📅 {item.startDate} → {item.endDate}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState message="No tournaments found" icon="🏆" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  surfaceBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  surfaceText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  category: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  location: {
    color: '#a0a0b0',
    fontSize: 13,
    marginBottom: 4,
  },
  dates: {
    color: '#6b7280',
    fontSize: 11,
  },
});
