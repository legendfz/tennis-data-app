import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { getAvatarUrl } from '../../lib/avatars';
import type { PlayerDetail, MatchWithPlayers } from '../../../shared/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const AVATAR_SIZE = Math.round(SCREEN_WIDTH * 0.4);

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: player, isLoading, error } = useQuery<PlayerDetail>({
    queryKey: ['player', id],
    queryFn: async () => {
      const res = await api.get(`/api/players/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (error || !player) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load player</Text>
      </View>
    );
  }

  const avatarUrl = player.photoUrl || getAvatarUrl(player.name, AVATAR_SIZE * 2);

  return (
    <>
      <Stack.Screen options={{ title: player.name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
          />
          <Text style={styles.playerName}>
            {player.name} {player.countryFlag}
          </Text>
          <Text style={styles.rankingBig}>#{player.ranking}</Text>
        </View>

        {/* Career Highlights */}
        <View style={styles.highlightsRow}>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightNumber}>{player.grandSlams}</Text>
            <Text style={styles.highlightLabel}>Grand Slams</Text>
          </View>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightNumber}>{player.titles}</Text>
            <Text style={styles.highlightLabel}>Titles</Text>
          </View>
          <View style={styles.highlightBox}>
            <Text style={styles.highlightNumber}>{player.prizeMoney}</Text>
            <Text style={styles.highlightLabel}>Prize Money</Text>
          </View>
        </View>

        {/* Player Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Player Info</Text>
          <InfoRow label="Nationality" value={`${player.countryFlag} ${player.country}`} />
          <InfoRow label="Height" value={`${player.height} cm`} />
          <InfoRow label="Weight" value={`${player.weight} kg`} />
          <InfoRow label="Plays" value={player.plays} />
          <InfoRow label="Backhand" value={player.backhand} />
          <InfoRow label="Turned Pro" value={String(player.turnedPro)} />
          <InfoRow label="Career High" value={`#${player.careerHigh}`} />
        </View>

        {/* Stats */}
        {player.stats && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Season Stats</Text>
            <InfoRow label="Win-Loss" value={player.stats.winLoss} />
            <InfoRow label="Titles This Year" value={String(player.stats.titlesThisYear)} />
            <InfoRow label="Best Result" value={player.stats.bestResult} />
          </View>
        )}

        {/* Recent Matches */}
        {player.recentMatches && player.recentMatches.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Recent Matches</Text>
            {player.recentMatches.map((match: MatchWithPlayers) => (
              <View key={match.id} style={styles.matchItem}>
                <View style={styles.matchHeader}>
                  <Text style={styles.matchTournament}>
                    {match.tournament?.name || 'Tournament'}
                  </Text>
                  <Text style={styles.matchRound}>{match.round}</Text>
                </View>
                <View style={styles.matchPlayers}>
                  <Text
                    style={[
                      styles.matchPlayerName,
                      match.winnerId === match.player1Id && styles.matchWinner,
                    ]}
                  >
                    {match.player1?.name || `Player ${match.player1Id}`}
                  </Text>
                  <Text style={styles.matchVs}>vs</Text>
                  <Text
                    style={[
                      styles.matchPlayerName,
                      match.winnerId === match.player2Id && styles.matchWinner,
                    ]}
                  >
                    {match.player2?.name || `Player ${match.player2Id}`}
                  </Text>
                </View>
                <Text style={styles.matchScore}>{match.score}</Text>
                <Text style={styles.matchDate}>{match.date}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  content: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: '#16a34a',
    marginBottom: 16,
  },
  playerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  rankingBig: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  highlightsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  highlightBox: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  highlightNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 4,
  },
  highlightLabel: {
    fontSize: 11,
    color: '#a0a0b0',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  infoLabel: {
    fontSize: 14,
    color: '#a0a0b0',
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  matchItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4e',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  matchTournament: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    textTransform: 'uppercase',
    flex: 1,
  },
  matchRound: {
    fontSize: 12,
    color: '#a0a0b0',
  },
  matchPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchPlayerName: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
  matchWinner: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  matchVs: {
    color: '#a0a0b0',
    fontSize: 12,
    marginHorizontal: 8,
  },
  matchScore: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  matchDate: {
    textAlign: 'center',
    color: '#a0a0b0',
    fontSize: 11,
    marginTop: 4,
  },
});
