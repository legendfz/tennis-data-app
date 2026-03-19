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
import { EmptySearchIllustration } from '../../lib/illustrations';
import { getAllHotTags, formatCount, PRESET_TAG_EMOJIS } from '../../lib/comments';
import { theme } from '../../lib/theme';
import type { Player } from '../../../shared/types';

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const TOUR_FILTERS = ['ALL', 'ATP', 'WTA'] as const;
type TourFilter = typeof TOUR_FILTERS[number];

export default function PlayersScreen() {
  const [search, setSearch] = useState('');
  const [tourFilter, setTourFilter] = useState<TourFilter>('ALL');
  const [hotTags, setHotTags] = useState<Record<number, { tag: string; emoji: string; count: number }>>({});
  const router = useRouter();
  const { getPlayerName, t } = useLanguage();

  useEffect(() => {
    getAllHotTags().then(setHotTags);
  }, []);

  const { data, isLoading, error, refetch } = useQuery<{ data: Player[] }>({
    queryKey: ['players', tourFilter],
    queryFn: async () => {
      const params = tourFilter !== 'ALL' ? `?tour=${tourFilter}` : '';
      const res = await api.get(`/api/players${params}`);
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
        message={t('failedToLoadPlayers')}
        subtitle={(error as Error).message}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>{t('rankings')}</Text>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchPlayers')}
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn} activeOpacity={theme.activeOpacity}>
            <Text style={styles.clearText}>\u00D7</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tourFilterRow}>
        {TOUR_FILTERS.map((tf) => (
          <TouchableOpacity
            key={tf}
            style={[styles.tourPill, tourFilter === tf && styles.tourPillActive]}
            onPress={() => setTourFilter(tf)}
            activeOpacity={theme.activeOpacity}
          >
            <Text style={[styles.tourPillText, tourFilter === tf && styles.tourPillTextActive]}>
              {tf}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
        renderItem={({ item, index }) => {
          const hot = hotTags[item.id];
          const rankChange = (item as any).rankChange;

          return (
            <TouchableOpacity
              style={styles.playerRow}
              onPress={() => router.push(`/player/${item.id}`)}
              activeOpacity={theme.activeOpacity}
            >
              <Text style={styles.rank}>{item.ranking}</Text>
              <PlayerAvatar name={item.name} photoUrl={item.photoUrl} size={48} />
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
          <EmptyState
            message={t('noPlayersFound')}
            subtitle={t('tryDifferentSearch')}
            illustration={<EmptySearchIllustration size={120} />}
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
    paddingBottom: 4,
  },
  tourFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.padding,
    gap: 8,
    marginBottom: 8,
  },
  tourPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.card,
    minHeight: 32,
    justifyContent: 'center',
  },
  tourPillActive: {
    backgroundColor: theme.accent,
  },
  tourPillText: {
    fontSize: 13,
    fontWeight: theme.fontWeight.medium as any,
    color: theme.textMuted,
  },
  tourPillTextActive: {
    color: theme.text,
    fontWeight: theme.fontWeight.semibold as any,
  },
  searchWrap: {
    marginHorizontal: theme.spacing.padding,
    marginVertical: theme.spacing.cardGap,
    backgroundColor: theme.card,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: theme.fontSize.body,
    color: theme.text,
  },
  clearBtn: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    color: theme.textSecondary,
    fontSize: 18,
  },
  list: {
    paddingBottom: 20,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.padding,
    paddingVertical: 14,
    gap: 12,
    minHeight: 62,
  },
  rank: {
    width: 28,
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
    textAlign: 'center',
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
    fontSize: 17,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
  },
  hotTagWrap: {
    marginTop: 3,
  },
  hotTag: {
    fontSize: theme.fontSize.small,
    color: theme.accent,
    backgroundColor: 'rgba(22,163,74,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  rankChange: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  rankUp: {
    color: theme.accent,
  },
  rankDown: {
    color: theme.red,
  },
  separator: {
    height: 0.5,
    backgroundColor: theme.cardAlt,
    marginLeft: 56,
  },
});
