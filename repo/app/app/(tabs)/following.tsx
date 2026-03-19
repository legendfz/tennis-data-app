import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../lib/api';
import { PlayerAvatar } from '../../lib/player-avatar';
import { Flag } from '../../lib/flags';
import { useLanguage } from '../../lib/i18n';
import { EmptyState } from '../../lib/empty-state';
import { getFavorites } from '../../lib/favorites';
import type { Player } from '../../../shared/types';

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function FollowingScreen() {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const router = useRouter();
  const { getPlayerName } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      getFavorites().then(setFavoriteIds);
    }, [])
  );

  const { data, refetch } = useQuery<{ data: Player[] }>({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await api.get('/api/players');
      return res.data;
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getFavorites().then(setFavoriteIds);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const players = data?.data ?? (Array.isArray(data) ? data : []);
  const favPlayers = players.filter((p) => favoriteIds.includes(p.id));

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Following</Text>
      <FlatList
        data={favPlayers}
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
            <PlayerAvatar name={item.name} photoUrl={item.photoUrl} size={40} />
            <View style={styles.nameWrap}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {getPlayerName(item)}
                </Text>
                <Flag country={item.country} countryFlag={item.countryFlag} size={14} />
              </View>
              <Text style={styles.rankText}>#{item.ranking}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            message="No followed players"
            subtitle="Follow players from their profile page"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 50,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  list: {
    paddingBottom: 20,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  nameWrap: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },
  rankText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#2a2a2a',
    marginLeft: 72,
  },
});
