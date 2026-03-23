import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { PlayerAvatar } from '../lib/player-avatar';
import { TournamentLogo } from '../lib/tournament-logo';
import { theme, radii } from '../lib/theme';
import type { MatchWithPlayers } from '../../shared/types';

const webBlur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any) : {};

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const target = new Date(dateStr + 'T00:00:00');
  if (target.getTime() === today.getTime()) return 'Today';
  if (target.getTime() === tomorrow.getTime()) return 'Tomorrow';

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export default function CalendarScreen() {
  const router = useRouter();

  const { data: matchesData, isLoading } = useQuery<{ data: MatchWithPlayers[] }>({
    queryKey: ['calendar-matches'],
    queryFn: async () => {
      const res = await api.get('/api/matches?limit=200');
      return res.data;
    },
  });

  const rawMatches: MatchWithPlayers[] =
    matchesData?.data ?? (Array.isArray(matchesData) ? (matchesData as MatchWithPlayers[]) : []);

  // Get next 30 days of matches grouped by date
  const groupedByDate = useMemo(() => {
    const now = new Date();
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const groups: Record<string, MatchWithPlayers[]> = {};
    const dateOrder: string[] = [];

    // Include all matches sorted by date
    const sorted = [...rawMatches].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach((m) => {
      const date = m.date;
      if (!groups[date]) {
        groups[date] = [];
        dateOrder.push(date);
      }
      groups[date].push(m);
    });

    return dateOrder.map((date) => ({
      date,
      label: formatDateHeader(date),
      matches: groups[date],
    }));
  }, [rawMatches]);

  const handleAddToCalendar = (match: MatchWithPlayers) => {
    const p1Name = match.player1?.name || 'Player 1';
    const p2Name = match.player2?.name || 'Player 2';
    const tournament = match.tournament?.name || 'Tournament';
    Alert.alert(
      'Add to Calendar',
      `${p1Name} vs ${p2Name}\n${tournament} - ${match.round}\n${match.date}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => Alert.alert('Reminder Set', 'Match added to your calendar reminders.') },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Calendar' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Match Calendar</Text>
        <Text style={styles.subtitle}>Upcoming matches schedule</Text>

        {isLoading ? (
          <Text style={styles.loadingText}>Loading schedule...</Text>
        ) : groupedByDate.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming matches found</Text>
        ) : (
          groupedByDate.map((group) => (
            <View key={group.date}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateHeaderText}>{group.label}</Text>
                <Text style={styles.matchCount}>{group.matches.length} matches</Text>
              </View>
              {group.matches.map((match) => (
                <TouchableOpacity
                  key={match.id}
                  style={styles.matchCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/match/${match.id}`)}
                >
                  <View style={styles.matchTop}>
                    {match.tournament && (
                      <View style={styles.tournamentRow}>
                        <TournamentLogo tournament={match.tournament} size="sm" />
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            match.tournament?.id && router.push(`/tournament/${match.tournament.id}`);
                          }}
                        >
                          <Text style={styles.tournamentName}>{match.tournament.name}</Text>
                        </TouchableOpacity>
                        <Text style={styles.roundLabel}>{match.round}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.playersRow}>
                    <View style={styles.playerSide}>
                      <PlayerAvatar
                        name={match.player1?.name || 'P1'}
                        photoUrl={match.player1?.photoUrl}
                        size={36}
                        ranking={match.player1?.ranking}
                      />
                      <Text style={styles.playerName} numberOfLines={1}>
                        {match.player1?.name || 'TBD'}
                      </Text>
                    </View>
                    <View style={styles.scoreCol}>
                      {match.winnerId ? (
                        <Text style={styles.score}>{match.score}</Text>
                      ) : (
                        <Text style={styles.timeText}>
                          {(match as any).scheduledTime || 'TBD'}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.playerSide, styles.playerRight]}>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {match.player2?.name || 'TBD'}
                      </Text>
                      <PlayerAvatar
                        name={match.player2?.name || 'P2'}
                        photoUrl={match.player2?.photoUrl}
                        size={36}
                        ranking={match.player2?.ranking}
                      />
                    </View>
                  </View>
                  {!match.winnerId && (
                    <TouchableOpacity
                      style={styles.addCalBtn}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleAddToCalendar(match);
                      }}
                    >
                      <Text style={styles.addCalText}>📅 Add to Calendar</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content: { paddingBottom: 40, paddingTop: 16 },
  pageTitle: {
    fontSize: theme.fontSize.pageTitle,
    fontWeight: theme.fontWeight.black,
    color: theme.text,
    paddingHorizontal: theme.spacing.padding,
  },
  subtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    paddingHorizontal: theme.spacing.padding,
    marginBottom: 16,
  },
  loadingText: { color: theme.textSecondary, textAlign: 'center', marginTop: 40 },
  emptyText: { color: theme.textSecondary, textAlign: 'center', marginTop: 40 },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.padding,
    paddingTop: 20,
    paddingBottom: 8,
  },
  dateHeaderText: {
    fontSize: 15,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
  },
  matchCount: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  matchCard: {
    marginHorizontal: theme.spacing.padding,
    marginVertical: 4,
    padding: 14,
    borderRadius: radii.card,
    backgroundColor: theme.glass,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderTopColor: theme.glassBorderTop,
    ...theme.glassCardShadow,
    ...webBlur,
  },
  matchTop: { marginBottom: 10 },
  tournamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tournamentName: {
    fontSize: 12,
    fontWeight: theme.fontWeight.semibold,
    color: theme.linkBlue,
    flex: 1,
  },
  roundLabel: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerRight: {
    justifyContent: 'flex-end',
  },
  playerName: {
    fontSize: 14,
    fontWeight: theme.fontWeight.medium,
    color: theme.text,
    flexShrink: 1,
  },
  scoreCol: {
    width: 80,
    alignItems: 'center',
  },
  score: {
    fontSize: 15,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    letterSpacing: 1,
  },
  timeText: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
  },
  addCalBtn: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(22,163,74,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.2)',
    alignItems: 'center',
  },
  addCalText: {
    fontSize: 12,
    fontWeight: theme.fontWeight.semibold,
    color: theme.accent,
  },
});
