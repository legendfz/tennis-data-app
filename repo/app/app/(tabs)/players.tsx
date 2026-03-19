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
import { useFocusEffect } from '@react-navigation/native';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import { useLanguage } from '../../lib/i18n';
import { SkeletonList } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import { getFavorites } from '../../lib/favorites';
import type { Player } from '../../../shared/types';

export default function PlayersScreen() {
  const [search, setSearch] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const router = useRouter();
  const { getPlayerName } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      getFavorites().then(setFavoriteIds);
    }, [])
  );

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
        <SkeletonList count={10} cardHeight={52} />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        message="Failed to load players"
        subtitle={(error as Error).message}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search players"
          placeholderTextColor="#6b7280"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn} activeOpacity={0.7}>
            <Text style={styles.clearText}>×</Text>
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
            style={styles.playerRow}
            onPress={() => router.push(`/player/${item.id}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.rank}>#{item.ranking}</Text>
            <Image
              source={{ uri: item.photoUrl || getAvatarUrl(item.name, 72) }}
              style={styles.avatar}
            />
            <View style={styles.nameWrap}>
              <Text style={styles.playerName} numberOfLines={1}>
                {getPlayerName(item)}
              </Text>
              <Text style={styles.country}>{item.country}</Text>
            </View>
            <Text style={styles.flag}>{item.countryFlag}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState message="No players found" subtitle="Try a different search" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
  },
  clearBtn: {
    position: 'absolute',
    right: 24,
    padding: 4,
  },
  clearText: {
    color: '#6b7280',
    fontSize: 18,
  },
  list: {
    paddingBottom: 20,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rank: {
    width: 36,
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  nameWrap: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  country: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  flag: {
    fontSize: 16,
    marginLeft: 8,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#2a2a2a',
    marginLeft: 64,
  },
});
