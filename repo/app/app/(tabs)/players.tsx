import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import type { Player } from '../../../shared/types';

export default function PlayersScreen() {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery<{ data: Player[] }>({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await api.get('/api/players');
      return res.data;
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const players = data?.data ?? (Array.isArray(data) ? data : []);

  const filtered = search.trim()
    ? players.filter((p: Player) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : players;

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
        <Text style={styles.errorText}>Failed to load players</Text>
        <Text style={styles.errorDetail}>{(error as Error).message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search players..."
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            style={styles.clearButton}
          >
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
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
            style={styles.playerCard}
            onPress={() => router.push(`/player/${item.id}`)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: item.photoUrl || getAvatarUrl(item.name, 100) }}
              style={styles.playerAvatar}
            />
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>
                {item.name} {item.countryFlag}
              </Text>
              <Text style={styles.playerDetails}>
                #{item.ranking} · {item.country} · {item.plays}
              </Text>
            </View>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{item.ranking}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No players found</Text>
          </View>
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
  center: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  clearButton: {
    position: 'absolute',
    right: 28,
    top: 24,
  },
  clearText: {
    color: '#a0a0b0',
    fontSize: 16,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  playerCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  playerDetails: {
    color: '#a0a0b0',
    fontSize: 13,
  },
  rankBadge: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetail: {
    color: '#a0a0b0',
    fontSize: 12,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: '#a0a0b0',
    fontSize: 16,
  },
});
