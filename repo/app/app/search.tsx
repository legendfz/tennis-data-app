import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import api from '../lib/api';
import { PlayerAvatar } from '../lib/player-avatar';
import { Flag } from '../lib/flags';
import { TournamentLogo } from '../lib/tournament-logo';
import { theme, radii } from '../lib/theme';

const webBlur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any) : {};
const cursor = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};

interface SearchResult {
  players: any[];
  tournaments: any[];
  matches: any[];
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ players: [], tournaments: [], matches: [] });
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ players: [], tournaments: [], matches: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/api/search?q=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch {
      setResults({ players: [], tournaments: [], matches: [] });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const hasResults = results.players.length > 0 || results.tournaments.length > 0 || results.matches.length > 0;

  const renderPlayers = () => {
    if (results.players.length === 0) return null;
    const showAll = expandedSection === 'players';
    const items = showAll ? results.players : results.players.slice(0, 5);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PLAYERS</Text>
        {items.map((p: any) => (
          <TouchableOpacity
            key={p.id}
            style={styles.resultRow}
            activeOpacity={0.7}
            onPress={() => router.push(`/player/${p.id}`)}
          >
            <PlayerAvatar name={p.name} photoUrl={p.photoUrl} size={40} ranking={p.ranking} />
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{p.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Flag country={p.country} countryFlag={p.countryFlag} size={12} />
                <Text style={styles.resultMeta}>#{p.ranking}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {results.players.length > 5 && !showAll && (
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => setExpandedSection('players')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>See all {results.players.length} players →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderTournaments = () => {
    if (results.tournaments.length === 0) return null;
    const showAll = expandedSection === 'tournaments';
    const items = showAll ? results.tournaments : results.tournaments.slice(0, 5);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TOURNAMENTS</Text>
        {items.map((t: any) => (
          <TouchableOpacity
            key={t.id}
            style={styles.resultRow}
            activeOpacity={0.7}
            onPress={() => router.push(`/tournament/${t.id}`)}
          >
            <TournamentLogo tournamentName={t.name} size="sm" />
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{t.name}</Text>
              <Text style={styles.resultMeta}>{t.location} · {t.surface}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {results.tournaments.length > 5 && !showAll && (
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => setExpandedSection('tournaments')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>See all {results.tournaments.length} tournaments →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMatches = () => {
    if (results.matches.length === 0) return null;
    const showAll = expandedSection === 'matches';
    const items = showAll ? results.matches : results.matches.slice(0, 5);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MATCHES</Text>
        {items.map((m: any) => (
          <TouchableOpacity
            key={m.id}
            style={styles.resultRow}
            activeOpacity={0.7}
            onPress={() => router.push(`/match/${m.id}`)}
          >
            <View style={styles.matchInfo}>
              <Text style={styles.matchTournament}>
                {m.tournament?.name || 'Match'} · {m.round}
              </Text>
              <View style={styles.matchPlayers}>
                <Text style={[styles.matchPlayerName, m.winnerId === m.player1?.id && styles.matchWinner]}>
                  {m.player1?.name || 'P1'}
                </Text>
                <Text style={styles.matchScore}>{m.score}</Text>
                <Text style={[styles.matchPlayerName, m.winnerId === m.player2?.id && styles.matchWinner]}>
                  {m.player2?.name || 'P2'}
                </Text>
              </View>
              <Text style={styles.matchDate}>{m.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {results.matches.length > 5 && !showAll && (
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => setExpandedSection('matches')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>See all {results.matches.length} matches →</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Search' }} />
      <View style={styles.container}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search players, tournaments, matches..."
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setExpandedSection(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setExpandedSection(null);
              }}
              style={styles.clearBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {loading && (
            <Text style={styles.statusText}>Searching...</Text>
          )}
          {!loading && query.length > 0 && !hasResults && (
            <Text style={styles.statusText}>No results found for "{query}"</Text>
          )}
          {!loading && query.length === 0 && (
            <View style={styles.hintWrap}>
              <Text style={styles.hintIcon}>🎾</Text>
              <Text style={styles.hintText}>Search for players, tournaments, or matches</Text>
            </View>
          )}
          {renderPlayers()}
          {renderTournaments()}
          {renderMatches()}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  searchWrap: {
    marginHorizontal: theme.spacing.padding,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: theme.glass,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 48,
    ...webBlur,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: theme.fontSize.body,
    color: theme.text,
  },
  clearBtn: {
    padding: 8,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...cursor,
  },
  clearText: { color: theme.textSecondary, fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  statusText: {
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  hintWrap: {
    alignItems: 'center',
    marginTop: 80,
  },
  hintIcon: { fontSize: 40, marginBottom: 12 },
  hintText: { color: theme.textSecondary, fontSize: 14 },
  section: {
    marginTop: 16,
    paddingHorizontal: theme.spacing.padding,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
    color: theme.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    ...cursor,
  },
  resultInfo: { flex: 1 },
  resultName: {
    fontSize: 15,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  matchInfo: { flex: 1 },
  matchTournament: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  matchPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  matchPlayerName: {
    fontSize: 14,
    color: theme.text,
    flex: 1,
  },
  matchWinner: {
    fontWeight: theme.fontWeight.bold,
  },
  matchScore: {
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    marginHorizontal: 8,
  },
  matchDate: {
    fontSize: 11,
    color: theme.textTertiary,
  },
  seeAllBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    ...cursor,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: theme.fontWeight.semibold,
    color: theme.accent,
  },
});
