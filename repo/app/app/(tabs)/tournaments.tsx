import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Tournament } from '../../../shared/types';

const SURFACE_COLORS: Record<string, string> = {
  Hard: '#3b82f6',
  Clay: '#f97316',
  Grass: '#22c55e',
};

export default function TournamentsScreen() {
  const { data: tournaments, isLoading, error } = useQuery<Tournament[]>({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const res = await api.get('/api/tournaments');
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

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load tournaments</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tournaments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.name}>{item.name}</Text>
              <View
                style={[
                  styles.surfaceBadge,
                  { backgroundColor: SURFACE_COLORS[item.surface] || '#6b7280' },
                ]}
              >
                <Text style={styles.surfaceText}>{item.surface}</Text>
              </View>
            </View>
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.location}>📍 {item.location}</Text>
            <Text style={styles.dates}>
              {item.startDate} → {item.endDate}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
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
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    color: '#a0a0b0',
    fontSize: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
});
