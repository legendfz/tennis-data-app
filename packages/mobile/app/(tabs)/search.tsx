import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, getTournamentImageUrl } from '../../src/api/client';
import { Avatar } from '../../src/components/Avatar';
import { ErrorState } from '../../src/components/ErrorState';
import { SkeletonSearchRow } from '../../src/components/SkeletonLoader';
import { SurfaceBadge } from '../../src/components/SurfaceBadge';
import { Colors } from '../../src/theme/colors';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const debouncedQuery = useDebounce(query, 300);

  const enabled = debouncedQuery.trim().length >= 2;

  const searchQuery = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => api.searchPlayers(debouncedQuery.trim()),
    enabled,
  });

  const players: any[] = searchQuery.data?.players ?? [];
  const tournaments: any[] = searchQuery.data?.tournaments ?? [];

  const renderPlayer = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.resultRow}
        onPress={() => router.push(`/player/${item.id}`)}
        activeOpacity={0.7}
      >
        <Avatar playerId={item.id} name={item.name} size={48} />
        <View style={styles.resultInfo}>
          <Text style={styles.resultName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.resultMeta}>
            {item.country?.name ?? item.country?.alpha2 ?? ''}
            {item.ranking ? ` · #${item.ranking}` : ''}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [router]
  );

  const renderTournament = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.resultRow}
        onPress={() => router.push(`/tournament/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.tournamentLogo}>
          <Image
            source={{ uri: getTournamentImageUrl(item.id) }}
            style={styles.tournamentLogoImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SurfaceBadge surface={item.groundType} />
          </View>
        </View>
      </TouchableOpacity>
    ),
    [router]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search players, tournaments…"
            placeholderTextColor={Colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {!query && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎾</Text>
          <Text style={styles.emptyTitle}>Search TennisHQ</Text>
          <Text style={styles.emptySubtitle}>Find players and tournaments</Text>
        </View>
      )}

      {query.length > 0 && query.length < 2 && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Type at least 2 characters</Text>
        </View>
      )}

      {enabled && searchQuery.isLoading && (
        <View>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonSearchRow key={i} />
          ))}
        </View>
      )}

      {enabled && searchQuery.isError && (
        <ErrorState
          message="Search failed. Try again."
          onRetry={() => searchQuery.refetch()}
        />
      )}

      {enabled && !searchQuery.isLoading && !searchQuery.isError && (
        <FlatList
          data={[]}
          ListHeaderComponent={() => (
            <>
              {players.length > 0 && (
                <>
                  <Text style={styles.sectionHeader}>Players ({players.length})</Text>
                  {players.map((item) => (
                    <React.Fragment key={item.id}>{renderPlayer({ item })}</React.Fragment>
                  ))}
                </>
              )}
              {tournaments.length > 0 && (
                <>
                  <Text style={styles.sectionHeader}>Tournaments ({tournaments.length})</Text>
                  {tournaments.map((item) => (
                    <React.Fragment key={item.id}>{renderTournament({ item })}</React.Fragment>
                  ))}
                </>
              )}
              {players.length === 0 && tournaments.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🎾</Text>
                  <Text style={styles.emptyTitle}>No results for "{debouncedQuery}"</Text>
                </View>
              )}
            </>
          )}
          renderItem={null}
          keyExtractor={() => ''}
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
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgTertiary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    color: Colors.textTertiary,
    fontSize: 16,
  },
  sectionHeader: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 64,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  resultInfo: {
    flex: 1,
    gap: 4,
  },
  resultName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  resultMeta: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  tournamentLogo: {
    width: 48,
    height: 48,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tournamentLogoImage: {
    width: 40,
    height: 40,
  },
  hintContainer: {
    padding: 24,
    alignItems: 'center',
  },
  hintText: {
    color: Colors.textTertiary,
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
