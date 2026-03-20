import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../lib/theme';
import { loadFantasyTeam, FantasyTeam, formatValue } from '../../lib/fantasy';

const ACTIVE_TOURNAMENT = {
  id: 1,
  name: 'Australian Open 2025 Fantasy',
  status: 'Active',
  startDate: '2025-01-13',
  endDate: '2025-01-26',
  surface: 'Hard',
};

export default function FantasyScreen() {
  const router = useRouter();
  const [team, setTeam] = useState<FantasyTeam | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Fantasy</Text>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {/* Active Tournament */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>ACTIVE TOURNAMENT</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{ACTIVE_TOURNAMENT.status}</Text>
            </View>
          </View>
          <Text style={styles.tournamentName}>{ACTIVE_TOURNAMENT.name}</Text>
          <Text style={styles.tournamentMeta}>
            {ACTIVE_TOURNAMENT.surface} · {ACTIVE_TOURNAMENT.startDate} → {ACTIVE_TOURNAMENT.endDate}
          </Text>
        </View>

        {/* Team Summary or Create */}
        {team ? (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={theme.activeOpacity}
            onPress={() => router.push('/fantasy/team')}
          >
            <Text style={styles.cardLabel}>YOUR TEAM</Text>
            <Text style={styles.teamName}>{team.teamName}</Text>
            <View style={styles.teamStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{team.players.length}</Text>
                <Text style={styles.statLabel}>Players</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatValue(team.spent)}</Text>
                <Text style={styles.statLabel}>Spent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.accent }]}>{team.totalPoints}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
            </View>
            <Text style={styles.viewTeam}>View Team →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.card, styles.createCard]}
            activeOpacity={theme.activeOpacity}
            onPress={() => router.push('/fantasy/create')}
          >
            <Text style={styles.createIcon}>⭐</Text>
            <Text style={styles.createTitle}>Create Your Fantasy Team</Text>
            <Text style={styles.createSubtitle}>
              Pick 5 players within a $50M budget and compete with others!
            </Text>
            <View style={styles.createButton}>
              <Text style={styles.createButtonText}>Create Team</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Bracket Prediction Entry */}
        <TouchableOpacity
          style={[styles.card, styles.predictionCard]}
          activeOpacity={theme.activeOpacity}
          onPress={() => router.push('/fantasy/predictions')}
        >
          <View style={styles.predictionRow}>
            <Text style={styles.predictionIcon}>🏆</Text>
            <View style={styles.predictionInfo}>
              <Text style={styles.predictionTitle}>Bracket Prediction</Text>
              <Text style={styles.predictionSubtitle}>
                Predict QF → Champion for Grand Slams and earn points!
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Links */}
        <View style={styles.linksRow}>
          <TouchableOpacity
            style={styles.linkCard}
            activeOpacity={theme.activeOpacity}
            onPress={() => router.push('/fantasy/leaderboard')}
          >
            <Text style={styles.linkIcon}>🏆</Text>
            <Text style={styles.linkText}>Leaderboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkCard}
            activeOpacity={theme.activeOpacity}
            onPress={() => router.push('/fantasy/rules')}
          >
            <Text style={styles.linkIcon}>📋</Text>
            <Text style={styles.linkText}>Scoring Rules</Text>
          </TouchableOpacity>
        </View>

        {/* If team exists, show Edit button */}
        {team && (
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={theme.activeOpacity}
            onPress={() => router.push('/fantasy/create')}
          >
            <Text style={styles.editButtonText}>Edit Team</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    fontWeight: theme.fontWeight.black,
    color: theme.text,
    paddingHorizontal: theme.spacing.padding,
    paddingBottom: 12,
  },
  scroll: {
    paddingHorizontal: theme.spacing.padding,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: theme.glass,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderTopColor: theme.glassBorderTop,
    ...theme.glassCardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
    letterSpacing: 0.8,
  },
  badge: {
    backgroundColor: theme.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.accent,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    marginBottom: 4,
  },
  tournamentMeta: {
    fontSize: theme.fontSize.secondary,
    color: theme.textSecondary,
  },
  teamName: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    marginTop: 6,
    marginBottom: 12,
  },
  teamStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
  },
  statLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  viewTeam: {
    fontSize: theme.fontSize.secondary,
    color: theme.accent,
    fontWeight: theme.fontWeight.semibold,
  },
  createCard: {
    alignItems: 'center',
    paddingVertical: 28,
    borderColor: theme.accent + '40',
    borderStyle: 'dashed',
  },
  createIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  createTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    marginBottom: 6,
  },
  createSubtitle: {
    fontSize: theme.fontSize.secondary,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  createButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: '#ffffff',
  },
  linksRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  linkCard: {
    flex: 1,
    backgroundColor: theme.glass,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderTopColor: theme.glassBorderTop,
    ...theme.glassCardShadow,
  },
  linkIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  linkText: {
    fontSize: 13,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
  },
  editButton: {
    backgroundColor: theme.glass,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.accent + '40',
    ...theme.glassCardShadow,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.accent,
  },
  predictionCard: {
    borderColor: theme.gold + '40',
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  predictionInfo: {
    flex: 1,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    marginBottom: 3,
  },
  predictionSubtitle: {
    fontSize: theme.fontSize.secondary,
    color: theme.textSecondary,
  },
  arrow: {
    fontSize: 18,
    color: theme.textSecondary,
    marginLeft: 8,
  },
});
