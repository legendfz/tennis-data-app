import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import { useLanguage } from '../../lib/i18n';
import type { Player } from '../../../shared/types';

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
  localizedName: (player: any) => string;
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
            source={{ uri: selectedPlayer.photoUrl || getAvatarUrl(selectedPlayer.name, AVATAR_SIZE * 2) }}
            style={styles.selectedAvatar}
          />
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName}>{selectedPlayer.countryFlag} {localizedName(selectedPlayer)}</Text>
            <Text style={styles.selectedRank}>#{selectedPlayer.ranking}</Text>
          </View>
          <Text style={styles.changeBtn}>x</Text>
        </TouchableOpacity>
      ) : (
        <View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search player..."
            placeholderTextColor="#666"
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
                    <Image source={{ uri: p.photoUrl || getAvatarUrl(p.name, 48) }} style={styles.dropdownAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dropdownName}>{p.countryFlag} {localizedName(p)}</Text>
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

export default function H2HTabScreen() {
  const router = useRouter();
  const { getPlayerName } = useLanguage();
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const canCompare = player1 && player2;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Head to Head</Text>
      <Text style={styles.subtitle}>Compare two players</Text>

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
            <Text style={styles.popularArrow}>-&gt;</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { paddingBottom: 40, paddingTop: 50 },
  pageTitle: { fontSize: 22, fontWeight: '600', color: '#ffffff', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 16 },
  selectorsRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 8, zIndex: 10 },
  vsMiddle: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, paddingTop: 28 },
  vsText: { fontSize: 14, fontWeight: '700', color: '#666' },
  selectorContainer: { marginBottom: 16 },
  selectorLabel: { fontSize: 11, fontWeight: '600', color: '#666', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  searchInput: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
  },
  dropdown: {
    backgroundColor: '#1e1e1e',
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
    borderBottomColor: '#2a2a2a',
  },
  dropdownAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 10 },
  dropdownName: { fontSize: 13, color: '#ffffff', fontWeight: '500' },
  dropdownRank: { fontSize: 11, color: '#666' },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  selectedAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 13, color: '#ffffff', fontWeight: '500' },
  selectedRank: { fontSize: 11, color: '#888' },
  changeBtn: { fontSize: 18, color: '#666', paddingHorizontal: 8 },
  compareBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    marginHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  compareBtnText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  popularSection: {
    marginTop: 28,
    marginHorizontal: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 16,
  },
  popularTitle: { fontSize: 16, fontWeight: '600', color: '#ffffff', marginBottom: 12 },
  popularItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a2a2a',
  },
  popularLabel: { fontSize: 14, color: '#ffffff' },
  popularArrow: { fontSize: 14, color: '#666', fontWeight: '600' },
});
