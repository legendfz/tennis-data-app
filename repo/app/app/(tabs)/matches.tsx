import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Match } from '../../../shared/types';

const PLAYER_NAMES: Record<number, string> = {
  1: 'Djokovic',
  2: 'Nadal',
  3: 'Federer',
  4: 'Alcaraz',
  5: 'Sinner',
};

const TOURNAMENT_NAMES: Record<number, string> = {
  1: 'Australian Open',
  2: 'Roland Garros',
  3: 'Wimbledon',
};

export default function MatchesScreen() {
  const { data: matches, isLoading, error } = useQuery<Match[]>({
    queryKey: ['matches'],
    queryFn: async () => {
      const res = await api.get('/api/matches');
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

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load matches</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.matchCard}>
            <Text style={styles.tournament}>
              {TOURNAMENT_NAMES[item.tournamentId] || 'Unknown'} · {item.round}
            </Text>
            <View style={styles.versus}>
              <Text
                style={[
                  styles.playerName,
                  item.winnerId === item.player1Id && styles.winner,
                ]}
              >
                {PLAYER_NAMES[item.player1Id] || `Player ${item.player1Id}`}
              </Text>
              <Text style={styles.vs}>vs</Text>
              <Text
                style={[
                  styles.playerName,
                  item.winnerId === item.player2Id && styles.winner,
                ]}
              >
                {PLAYER_NAMES[item.player2Id] || `Player ${item.player2Id}`}
              </Text>
            </View>
            <Text style={styles.score}>{item.score}</Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  center: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  matchCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tournament: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  versus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  playerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  winner: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  vs: {
    color: '#a0a0b0',
    fontSize: 12,
    marginHorizontal: 12,
  },
  score: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  date: {
    color: '#a0a0b0',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
});
