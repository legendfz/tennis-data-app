import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { theme } from '../../lib/theme';
import { PlayerAvatar } from '../../lib/player-avatar';
import { Flag } from '../../lib/flags';
import { useLanguage } from '../../lib/i18n';
import {
  loadFantasyTeam,
  FantasyTeam,
  getPlayerValue,
  formatValue,
} from '../../lib/fantasy';
import type { Player } from '../../../shared/types';

export default function TeamScreen() {
  const router = useRouter();
  const { getPlayerName } = useLanguage();
  const [team, setTeam] = useState<FantasyTeam | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data } = useQuery<{ data: Player[] }>({
    queryKey: ['players'],
    queryFn: async () => {
      const res = await api.get('/api/players');
      return res.data;
    },
  });

  const loadTeam = useCallback(async () => {
    const t = await loadFantasyTeam();
    setTeam(t);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTeam();
    }, [loadTeam])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTeam();
    setRefreshing(false);
  }, [loadTeam]);

  const players = data?.data ?? (Array.isArray(data) ? data : []);
  const teamPlayers = team
    ? players.filter((p) => team.players.includes(p.id))
    : [];

  if (!team) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyTitle}>No Team Yet</Text>
          <Text style={styles.emptySubtitle}>Create your fantasy team to get started!</Text>
          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={theme.activeOpacity}
            onPress={() => router.push('/fantasy/create')}
          >
            <Text style={styles.createButtonText}>Create Team</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={teamPlayers}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.teamName}>{team.teamName}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: theme.accent }]}>
                  {team.totalPoints}
                </Text>
                <Text style={styles.statLabel}>Total Points</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{formatValue(team.spent)}</Text>
                <Text style={styles.statLabel}>Spent</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {formatValue(team.budget - team.spent)}
                </Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const value = getPlayerValue(item.ranking);
          // Mock points per player
          const mockPoints = 0;
          return (
            <View style={styles.playerCard}>
              <View style={styles.playerIndex}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
              <PlayerAvatar name={item.name} photoUrl={item.photoUrl} size={44} />
              <View style={styles.playerInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {getPlayerName(item)}
                  </Text>
                  <Flag country={item.country} countryFlag={item.countryFlag} size={14} />
                </View>
                <Text style={styles.playerMeta}>
                  #{item.ranking} · {formatValue(value)}
                </Text>
              </View>
              <View style={styles.pointsWrap}>
                <Text style={styles.pointsValue}>{mockPoints}</Text>
                <Text style={styles.pointsLabel}>pts</Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={theme.activeOpacity}
            onPress={() => router.push('/fantasy/create')}
          >
            <Text style={styles.editButtonText}>Edit Team</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  teamName: {
    fontSize: 22,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
  },
  statLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  list: {
    paddingBottom: 40,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  playerIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    color: theme.textSecondary,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: theme.fontWeight.medium,
    color: theme.text,
  },
  playerMeta: {
    fontSize: theme.fontSize.secondary,
    color: theme.textSecondary,
    marginTop: 2,
  },
  pointsWrap: {
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.accent,
  },
  pointsLabel: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  separator: {
    height: 0.5,
    backgroundColor: theme.border,
    marginLeft: 50,
  },
  editButton: {
    margin: 16,
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.accent + '40',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.accent,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: theme.fontWeight.bold,
    color: '#ffffff',
  },
});
