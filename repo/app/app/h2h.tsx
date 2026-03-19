import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import { getPlayerAvatarUrl } from '../lib/avatars';
import { Flag } from '../lib/flags';
import { useLanguage } from '../lib/i18n';
import { theme } from '../lib/theme';
import type { Player } from '../../shared/types';

const AVATAR_SIZE = 48;

function PlayerSelector({
  label,
  selectedPlayer,
  onSelect,
  excludeId,
  localizedName,
}: {
  label: string;
  selectedPlayer: Player | null;
  onSelect: (player: Player) => void;
  excludeId?: number;
  localizedName: (player: { name: string; nameLocalized?: Record<string, string> }) => string;
}) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const { data } = useQuery<{ data: Player[] }>({
    queryKey: ['players-search', search],
    queryFn: async () => {
      const res = await api.get('/api/players', { params: { search, limit: 50 } });
      return res.data;
    },
  });

  const players = (data?.data || []).filter((p) => p.id !== excludeId);

  return (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      {selectedPlayer ? (
        <TouchableOpacity
          style={styles.selectedCard}
          onPress={() => {
            onSelect(null as any);
            setSearch('');
            setShowDropdown(false);
          }}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: getPlayerAvatarUrl(selectedPlayer.name, selectedPlayer.photoUrl, AVATAR_SIZE * 2) }}
            style={styles.selectedAvatar}
          />
          <View style={styles.selectedInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Flag country={selectedPlayer.country} countryFlag={selectedPlayer.countryFlag} size={14} />
              <Text style={styles.selectedName}>{localizedName(selectedPlayer)}</Text>
            </View>
            <Text style={styles.selectedRank}>#{selectedPlayer.ranking}</Text>
          </View>
          <Text style={styles.changeBtn}>×</Text>
        </TouchableOpacity>
      ) : (
        <View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search player..."
            placeholderTextColor={theme.textTertiary}
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && players.length > 0 && (
            <View style={styles.dropdown}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {players.slice(0, 10).map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      onSelect(p);
                      setShowDropdown(false);
                      setSearch('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: getPlayerAvatarUrl(p.name, p.photoUrl, 48) }} style={styles.dropdownAvatar} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Flag country={p.country} countryFlag={p.countryFlag} size={12} />
                        <Text style={styles.dropdownName}>{localizedName(p)}</Text>
                      </View>
                      <Text style={styles.dropdownRank}>#{p.ranking}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function H2HScreen() {
  const router = useRouter();
  const { getPlayerName } = useLanguage();
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const canCompare = player1 && player2;

  return (
    <>
      <Stack.Screen options={{ title: 'Head to Head' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Head to Head</Text>
          <Text style={styles.headerSubtitle}>Compare two players</Text>
        </View>

        <View style={styles.selectorsRow}>
          <View style={{ flex: 1 }}>
            <PlayerSelector label="Player 1" selectedPlayer={player1} onSelect={setPlayer1} excludeId={player2?.id} localizedName={getPlayerName} />
          </View>
          <View style={styles.vsMiddle}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={{ flex: 1 }}>
            <PlayerSelector label="Player 2" selectedPlayer={player2} onSelect={setPlayer2} excludeId={player1?.id} localizedName={getPlayerName} />
          </View>
        </View>

        {canCompare && (
          <TouchableOpacity
            style={styles.compareBtn}
            onPress={() => router.push(`/h2h/${player1!.id}-vs-${player2!.id}` as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.compareBtnText}>Compare</Text>
          </TouchableOpacity>
        )}

        <View style={styles.popularSection}>
          <Text style={styles.popularTitle}>Popular Matchups</Text>
          {[
            { p1: 2, p2: 3, label: 'Djokovic vs Alcaraz' },
            { p1: 1, p2: 3, label: 'Sinner vs Alcaraz' },
            { p1: 2, p2: 1, label: 'Djokovic vs Sinner' },
            { p1: 1, p2: 5, label: 'Sinner vs Medvedev' },
            { p1: 3, p2: 4, label: 'Alcaraz vs Zverev' },
          ].map((matchup) => (
            <TouchableOpacity
              key={`${matchup.p1}-${matchup.p2}`}
              style={styles.popularItem}
              onPress={() => router.push(`/h2h/${matchup.p1}-vs-${matchup.p2}` as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.popularLabel}>{matchup.label}</Text>
              <Text style={styles.popularArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 24 },
  headerTitle: { fontSize: 22, fontWeight: '600', color: theme.text, marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: theme.textTertiary },
  selectorsRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 8, zIndex: 10 },
  vsMiddle: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, paddingTop: 28 },
  vsText: { fontSize: 14, fontWeight: '700', color: theme.textTertiary },
  selectorContainer: { marginBottom: 16 },
  selectorLabel: { fontSize: 11, fontWeight: '600', color: theme.textTertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  searchInput: {
    backgroundColor: theme.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.text,
    fontSize: 14,
  },
  dropdown: {
    backgroundColor: theme.card,
    borderRadius: 10,
    marginTop: 4,
    maxHeight: 250,
    zIndex: 100,
  },
  dropdownScroll: { maxHeight: 250 },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  dropdownAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 10 },
  dropdownName: { fontSize: 13, color: theme.text, fontWeight: '500' },
  dropdownRank: { fontSize: 11, color: theme.textTertiary },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.accent,
  },
  selectedAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 13, color: theme.text, fontWeight: '500' },
  selectedRank: { fontSize: 11, color: theme.textSecondary },
  changeBtn: { fontSize: 18, color: theme.textTertiary, paddingHorizontal: 8 },
  compareBtn: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    marginHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  compareBtnText: { fontSize: 16, fontWeight: '600', color: theme.text },
  popularSection: {
    marginTop: 28,
    marginHorizontal: 16,
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 16,
  },
  popularTitle: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 12 },
  popularItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  popularLabel: { fontSize: 14, color: theme.text },
  popularArrow: { fontSize: 14, color: theme.textSecondary, fontWeight: '600' },
});
