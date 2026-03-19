import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import { useLanguage } from '../../lib/i18n';
import { SkeletonList } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import type { Player } from '../../../shared/types';

function RankChangeIndicator({ change }: { change?: number }) {
  if (change === undefined || change === null || change === 0) {
    return <Text style={styles.rankUnchanged}>—</Text>;
  }
  if (change > 0) {
    return (
      <Text style={styles.rankUp}>▲ {change}</Text>
    );
  }
  return (
    <Text style={styles.rankDown}>▼ {Math.abs(change)}</Text>
  );
}

export default function PlayersScreen() {
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { getPlayerName } = useLanguage();

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
    ? players.filter((p: Player) => {
        const q = search.toLowerCase();
        if (p.name.toLowerCase().includes(q)) return true;
        if (p.nameLocalized) {
          return Object.values(p.nameLocalized).some((n) => n.toLowerCase().includes(q));
        }
        return false;
      })
    : players;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SkeletonList count={8} cardHeight={72} />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        message="Failed to load players"
        icon="😞"
        subtitle={(error as Error).message}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search players..."
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
              activeOpacity={0.7}
            >
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
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
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: item.photoUrl || getAvatarUrl(item.name, 100) }}
                style={styles.playerAvatar}
              />
              <Text style={styles.flagOverlay}>{item.countryFlag}</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>
                {getPlayerName(item)}
              </Text>
              <View style={styles.playerDetailsRow}>
                <Text style={styles.playerDetails}>
                  {item.country} · {item.plays}
                </Text>
                <RankChangeIndicator change={(item as any).rankingChange} />
              </View>
            </View>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{item.ranking}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            message="No players found"
            icon="🔍"
            subtitle="Try a different search term"
          />
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
  
  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2a2a4e',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    color: '#a0a0b0',
    fontSize: 16,
  },

  // List
  list: {
    padding: 16,
    paddingTop: 8,
  },

  // Player Card
  playerCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  playerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  flagOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    fontSize: 16,
    backgroundColor: '#0f0f23',
    borderRadius: 8,
    overflow: 'hidden',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  playerDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerDetails: {
    color: '#a0a0b0',
    fontSize: 13,
  },

  // Rank Badge
  rankBadge: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  rankText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Rank Change
  rankUp: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '700',
  },
  rankDown: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  rankUnchanged: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
  },
});
