import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/api/client';
import { Avatar } from '../../src/components/Avatar';
import { ErrorState } from '../../src/components/ErrorState';
import { SkeletonRankingRow } from '../../src/components/SkeletonLoader';
import { Colors } from '../../src/theme/colors';

type Tab = 'atp' | 'wta';

interface RankingEntry {
  ranking: number;
  previousRanking?: number;
  points: number;
  team?: { id: number; name: string; country?: { alpha2: string } };
  player?: { id: number; name: string; country?: { alpha2: string } };
}

function RankChange({ current, previous }: { current: number; previous?: number }) {
  if (!previous) return <Text style={styles.rankUnchanged}>—</Text>;
  const delta = previous - current;
  if (delta > 0) return <Text style={styles.rankUp}>▲ {delta}</Text>;
  if (delta < 0) return <Text style={styles.rankDown}>▼ {Math.abs(delta)}</Text>;
  return <Text style={styles.rankUnchanged}>—</Text>;
}

function RankingRow({ item, onPress }: { item: RankingEntry; onPress: () => void }) {
  const player = item.team ?? item.player;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.rankNumber}>#{item.ranking}</Text>
      <Avatar playerId={player?.id} name={player?.name} size={48} style={{ marginHorizontal: 12 }} />
      <View style={styles.playerInfo}>
        <Text style={styles.playerName} numberOfLines={1}>
          {player?.name ?? 'Unknown'}
        </Text>
        <Text style={styles.points}>{item.points?.toLocaleString()} pts</Text>
      </View>
      <RankChange current={item.ranking} previous={item.previousRanking} />
    </TouchableOpacity>
  );
}

export default function RankingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('atp');
  const [refreshing, setRefreshing] = useState(false);

  const atpQuery = useQuery({
    queryKey: ['rankings', 'atp'],
    queryFn: () => api.getAtpRankings(),
  });

  const wtaQuery = useQuery({
    queryKey: ['rankings', 'wta'],
    queryFn: () => api.getWtaRankings(),
  });

  const activeQuery = activeTab === 'atp' ? atpQuery : wtaQuery;
  const rankings: RankingEntry[] = activeQuery.data?.rankings ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    await activeQuery.refetch();
    setRefreshing(false);
  };

  const getPlayerId = (item: RankingEntry) => (item.team ?? item.player)?.id;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['atp', 'wta'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeQuery.isLoading && (
        <View>
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonRankingRow key={i} />
          ))}
        </View>
      )}

      {activeQuery.isError && !activeQuery.isLoading && (
        <ErrorState message="Couldn't load rankings" onRetry={onRefresh} />
      )}

      {!activeQuery.isLoading && !activeQuery.isError && (
        <FlatList
          data={rankings}
          keyExtractor={(item) => String(item.ranking)}
          renderItem={({ item }) => (
            <RankingRow
              item={item}
              onPress={() => {
                const id = getPlayerId(item);
                if (id) router.push(`/player/${id}`);
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accentBlue}
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tab: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.accentBlue,
  },
  tabText: {
    color: Colors.textTertiary,
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 72,
  },
  rankNumber: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    width: 36,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  points: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  rankUp: {
    color: Colors.accentGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  rankDown: {
    color: Colors.accentRed,
    fontSize: 12,
    fontWeight: '600',
  },
  rankUnchanged: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 76,
  },
});
