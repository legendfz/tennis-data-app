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
import { PlayerAvatar } from '../../lib/player-avatar';
import { Flag } from '../../lib/flags';
import { getPlayerAvatarUrl } from '../../lib/avatars';
import { useLanguage } from '../../lib/i18n';
import { theme } from '../../lib/theme';
import type { Player } from '../../../shared/types';

const AVATAR_SIZE = 48;

function PlayerSelector({
  label,
  selectedPlayer,
  onSelect,
  excludeId,
  localizedName,
  t,
}: {
  label: string;
  selectedPlayer: Player | null;
  onSelect: (player: Player) => void;
  excludeId?: number;
  localizedName: (player: any) => string;
  t: (key: string) => string;
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
          activeOpacity={theme.activeOpacity}
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
          <Text style={styles.changeBtn}>{'\u00D7'}</Text>
        </TouchableOpacity>
      ) : (
        <View>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlayer')}
            placeholderTextColor={theme.textSecondary}
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
                    activeOpacity={theme.activeOpacity}
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

export default function H2HTabScreen() {
  const router = useRouter();
  const { getPlayerName, t } = useLanguage();
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const canCompare = player1 && player2;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>{t('headToHead')}</Text>
      <Text style={styles.subtitle}>{t('compareTwoPlayers')}</Text>

      <View style={styles.selectorsRow}>
        <View style={{ flex: 1 }}>
          <PlayerSelector label={t('player1')} selectedPlayer={player1} onSelect={setPlayer1} excludeId={player2?.id} localizedName={getPlayerName} t={t} />
        </View>
        <View style={styles.vsMiddle}>
          <Text style={styles.vsText}>{t('vs')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <PlayerSelector label={t('player2')} selectedPlayer={player2} onSelect={setPlayer2} excludeId={player1?.id} localizedName={getPlayerName} t={t} />
        </View>
      </View>

      {canCompare && (
        <TouchableOpacity
          style={styles.compareBtn}
          onPress={() => router.push(`/h2h/${player1!.id}-vs-${player2!.id}` as any)}
          activeOpacity={theme.activeOpacity}
        >
          <Text style={styles.compareBtnText}>{t('compare')}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.popularSection}>
        <Text style={styles.popularTitle}>{t('popularMatchups')}</Text>
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
            activeOpacity={theme.activeOpacity}
          >
            <Text style={styles.popularLabel}>{matchup.label}</Text>
            <Text style={styles.popularArrow}>{'\u2192'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { paddingBottom: 40, paddingTop: 50 },
  pageTitle: { fontSize: theme.fontSize.pageTitle, fontWeight: theme.fontWeight.semibold, color: theme.text, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginBottom: theme.spacing.padding },
  selectorsRow: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 8, zIndex: 10 },
  vsMiddle: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, paddingTop: 28 },
  vsText: { fontSize: 14, fontWeight: theme.fontWeight.bold, color: theme.textSecondary },
  selectorContainer: { marginBottom: theme.spacing.padding },
  selectorLabel: { fontSize: 11, fontWeight: theme.fontWeight.semibold, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  searchInput: {
    backgroundColor: theme.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.text,
    fontSize: theme.fontSize.body,
    minHeight: 44,
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
    minHeight: 44,
  },
  dropdownAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 10 },
  dropdownName: { fontSize: 13, color: theme.text, fontWeight: theme.fontWeight.medium },
  dropdownRank: { fontSize: 11, color: theme.textSecondary },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.accent,
    minHeight: 44,
  },
  selectedAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 13, color: theme.text, fontWeight: theme.fontWeight.medium },
  selectedRank: { fontSize: 11, color: theme.textSecondary },
  changeBtn: { fontSize: 18, color: theme.textSecondary, paddingHorizontal: 8, minWidth: 44, minHeight: 44, textAlign: 'center', lineHeight: 44 },
  compareBtn: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    marginHorizontal: theme.spacing.padding,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  compareBtnText: { fontSize: theme.fontSize.sectionTitle, fontWeight: theme.fontWeight.semibold, color: theme.text },
  popularSection: {
    marginTop: 28,
    marginHorizontal: theme.spacing.padding,
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: theme.spacing.padding,
  },
  popularTitle: { fontSize: theme.fontSize.sectionTitle, fontWeight: theme.fontWeight.semibold, color: theme.text, marginBottom: 12 },
  popularItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    minHeight: 44,
  },
  popularLabel: { fontSize: theme.fontSize.body, color: theme.text },
  popularArrow: { fontSize: theme.fontSize.body, color: theme.textSecondary, fontWeight: theme.fontWeight.semibold },
});
