import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { theme } from '../../lib/theme';
import { PlayerAvatar } from '../../lib/player-avatar';
import { Flag } from '../../lib/flags';
import { useLanguage } from '../../lib/i18n';
import {
  BUDGET_TOTAL,
  getPlayerValue,
  formatValue,
  saveFantasyTeam,
  loadFantasyTeam,
  FantasyTeam,
} from '../../lib/fantasy';
import type { Player } from '../../../shared/types';

const MAX_PLAYERS = 5;

export default function CreateTeamScreen() {
  const router = useRouter();
  const { getPlayerName } = useLanguage();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Player[]>([]);
  const [teamName, setTeamName] = useState('My Dream Team');
  const [loading, setLoading] = useState(false);

  const { data } = useQuery<{ data: Player[] }>({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await api.get('/api/players');
      return res.data;
    },
  });

  // Load existing team on mount
  useState(() => {
    loadFantasyTeam().then((team) => {
      if (team && data) {
        const players = (data?.data ?? (Array.isArray(data) ? data : [])) as Player[];
        const existing = players.filter((p) => team.players.includes(p.id));
        if (existing.length > 0) {
          setSelected(existing);
          setTeamName(team.teamName);
        }
      }
    });
  });

  const players = useMemo(() => {
    const all = data?.data ?? (Array.isArray(data) ? data : []);
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.country?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const spent = useMemo(
    () => selected.reduce((sum, p) => sum + getPlayerValue(p.ranking), 0),
    [selected]
  );

  const remaining = BUDGET_TOTAL - spent;

  const togglePlayer = useCallback(
    (player: Player) => {
      setSelected((prev) => {
        const exists = prev.find((p) => p.id === player.id);
        if (exists) {
          return prev.filter((p) => p.id !== player.id);
        }
        if (prev.length >= MAX_PLAYERS) {
          Alert.alert('Team Full', 'You can only select 5 players. Remove one first.');
          return prev;
        }
        const cost = getPlayerValue(player.ranking);
        const newSpent = prev.reduce((s, p) => s + getPlayerValue(p.ranking), 0) + cost;
        if (newSpent > BUDGET_TOTAL) {
          Alert.alert('Over Budget', `Adding ${player.name} would exceed your $50M budget.`);
          return prev;
        }
        return [...prev, player];
      });
    },
    []
  );

  const confirmTeam = useCallback(async () => {
    if (selected.length < MAX_PLAYERS) {
      Alert.alert('Incomplete Team', `Please select ${MAX_PLAYERS} players.`);
      return;
    }
    setLoading(true);
    const team: FantasyTeam = {
      teamName,
      players: selected.map((p) => p.id),
      budget: BUDGET_TOTAL,
      spent,
      tournamentId: 1,
      totalPoints: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await saveFantasyTeam(team);
    setLoading(false);
    router.back();
  }, [selected, teamName, spent, router]);

  const isSelected = (id: number) => selected.some((p) => p.id === id);

  return (
    <View style={styles.container}>
      {/* Selected Players Summary */}
      <View style={styles.summary}>
        <TextInput
          style={styles.teamNameInput}
          value={teamName}
          onChangeText={setTeamName}
          placeholder="Team Name"
          placeholderTextColor={theme.textSecondary}
        />
        <View style={styles.budgetRow}>
          <Text style={styles.budgetLabel}>
            Budget: <Text style={styles.budgetValue}>{formatValue(remaining)}</Text> remaining
          </Text>
          <Text style={styles.playerCount}>
            {selected.length}/{MAX_PLAYERS} players
          </Text>
        </View>
        {selected.length > 0 && (
          <View style={styles.selectedRow}>
            {selected.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.selectedChip}
                activeOpacity={theme.activeOpacity}
                onPress={() => togglePlayer(p)}
              >
                <Text style={styles.chipName} numberOfLines={1}>
                  {p.name.split(' ').pop()}
                </Text>
                <Text style={styles.chipRemove}>✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search players..."
          placeholderTextColor={theme.textSecondary}
        />
      </View>

      {/* Player List */}
      <FlatList
        data={players}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const value = getPlayerValue(item.ranking);
          const sel = isSelected(item.id);
          const affordable = remaining >= value || sel;
          return (
            <TouchableOpacity
              style={[
                styles.playerRow,
                sel && styles.playerRowSelected,
                !affordable && styles.playerRowDisabled,
              ]}
              activeOpacity={theme.activeOpacity}
              onPress={() => togglePlayer(item)}
              disabled={!affordable && !sel}
            >
              <PlayerAvatar name={item.name} photoUrl={item.photoUrl} size={36} />
              <View style={styles.playerInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {getPlayerName(item)}
                  </Text>
                  <Flag country={item.country} countryFlag={item.countryFlag} size={14} />
                </View>
                <Text style={styles.rankText}>#{item.ranking}</Text>
              </View>
              <View style={styles.valueWrap}>
                <Text style={[styles.valueText, sel && { color: theme.accent }]}>
                  {formatValue(value)}
                </Text>
                {sel && <Text style={styles.checkMark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            selected.length < MAX_PLAYERS && styles.confirmDisabled,
          ]}
          activeOpacity={theme.activeOpacity}
          onPress={confirmTeam}
          disabled={loading}
        >
          <Text style={styles.confirmText}>
            {loading ? 'Saving...' : `Confirm Team (${selected.length}/${MAX_PLAYERS})`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  summary: {
    backgroundColor: theme.glass,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  teamNameInput: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    backgroundColor: theme.cardAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  budgetValue: {
    color: theme.accent,
    fontWeight: theme.fontWeight.bold,
  },
  playerCount: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: theme.fontWeight.semibold,
  },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.accent + '20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  chipName: {
    fontSize: 12,
    color: theme.accent,
    fontWeight: theme.fontWeight.semibold,
    maxWidth: 80,
  },
  chipRemove: {
    fontSize: 11,
    color: theme.accent,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: theme.glass,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  list: {
    paddingBottom: 100,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  playerRowSelected: {
    backgroundColor: theme.accent + '10',
  },
  playerRowDisabled: {
    opacity: 0.4,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: theme.fontWeight.medium,
    color: theme.text,
  },
  rankText: {
    fontSize: theme.fontSize.secondary,
    color: theme.textSecondary,
    marginTop: 1,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueText: {
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    color: theme.gold,
  },
  checkMark: {
    fontSize: 16,
    color: theme.accent,
    fontWeight: theme.fontWeight.bold,
  },
  separator: {
    height: 0.5,
    backgroundColor: theme.border,
    marginLeft: 64,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: theme.bg,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  confirmButton: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: theme.fontWeight.bold,
    color: '#ffffff',
  },
});
