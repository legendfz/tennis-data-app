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
import { EmptyFavoritesIllustration } from '../../lib/illustrations';
import { getFavorites } from '../../lib/favorites';
import { theme } from '../../lib/theme';
import type { Player } from '../../../shared/types';

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
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.playerRow}
            onPress={() => router.push(`/player/${item.id}`)}
            activeOpacity={theme.activeOpacity}
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
            illustration={<EmptyFavoritesIllustration size={120} />}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingTop: 50,
  },
  pageTitle: {
    fontSize: theme.fontSize.pageTitle,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    paddingHorizontal: theme.spacing.padding,
    paddingBottom: 12,
  },
  list: {
    paddingBottom: 20,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.padding,
    paddingVertical: 12,
    gap: 12,
    minHeight: 56,
  },
  nameWrap: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: theme.fontWeight.medium,
    color: theme.text,
  },
  rankText: {
    fontSize: theme.fontSize.secondary,
    color: theme.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 0.5,
    backgroundColor: theme.border,
    marginLeft: 72,
  },
});
