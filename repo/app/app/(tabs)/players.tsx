import { useState, useCallback, useEffect } from 'react';
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
import { PlayerAvatar } from '../../lib/player-avatar';
import { Flag } from '../../lib/flags';
import { useLanguage } from '../../lib/i18n';
import { SkeletonList } from '../../lib/skeleton';
import { EmptyState } from '../../lib/empty-state';
import { getAllHotTags, formatCount, PRESET_TAG_EMOJIS } from '../../lib/comments';
import type { Player } from '../../../shared/types';

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['#16a34a', '#1565C0', '#c62828', '#333', '#4a148c', '#e65100', '#1b5e20', '#6a1b9a', '#00695c', '#bf360c'];

export default function PlayersScreen() {
  const [search, setSearch] = useState('');
  const [hotTags, setHotTags] = useState<Record<number, { tag: string; emoji: string; count: number }>>({});
  const router = useRouter();
  const { getPlayerName } = useLanguage();

  useEffect(() => {
    getAllHotTags().then(setHotTags);
  }, []);

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
    getAllHotTags().then(setHotTags);
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
        <View style={{ paddingTop: 50 }}>
          <SkeletonList count={10} cardHeight={52} />
        </View>
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
      <Text style={styles.pageTitle}>Rankings</Text>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>&#x1F50D;</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search players..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn} activeOpacity={0.7}>
            <Text style={styles.clearText}>x</Text>
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
        renderItem={({ item, index }) => {
          const hot = hotTags[item.id];
          const rankChange = (item as any).rankChange;
          const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

          return (
            <TouchableOpacity
              style={styles.playerRow}
              onPress={() => router.push(`/player/${item.id}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.rank}>{item.ranking}</Text>
              <PlayerAvatar name={item.name} photoUrl={item.photoUrl} size={40} />
              <View style={styles.nameWrap}>
                <View style={styles.nameRow}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {getPlayerName(item)}
                  </Text>
                  <Flag country={item.country} countryFlag={item.countryFlag} size={14} />
                </View>
                {hot && (
                  <View style={styles.hotTagWrap}>
                    <Text style={styles.hotTag}>
                      {hot.emoji} {hot.tag}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[
                styles.rankChange,
                rankChange > 0 && styles.rankUp,
                rankChange < 0 && styles.rankDown,
              ]}>
                {rankChange > 0 ? `\u25B2 ${rankChange}` : rankChange < 0 ? `\u25BC ${Math.abs(rankChange)}` : '\u2014'}
              </Text>
            </TouchableOpacity>
          );
        }}
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
    paddingTop: 50,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  searchWrap: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    color: '#666',
    fontSize: 16,
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
  rank: {
    width: 28,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  nameWrap: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },
  hotTagWrap: {
    marginTop: 3,
  },
  hotTag: {
    fontSize: 10,
    color: '#16a34a',
    backgroundColor: 'rgba(22,163,74,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  rankChange: {
    fontSize: 11,
    color: '#666',
  },
  rankUp: {
    color: '#16a34a',
  },
  rankDown: {
    color: '#e53935',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#1a1a1a',
    marginLeft: 56,
  },
});
