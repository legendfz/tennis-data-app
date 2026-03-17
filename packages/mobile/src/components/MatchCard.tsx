import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../theme/colors';
import { Avatar } from './Avatar';
import { LiveDot } from './LiveDot';
import { SurfaceBadge } from './SurfaceBadge';

interface Match {
  id: number;
  homeTeam: { id: number; name: string; country?: { alpha2: string } };
  awayTeam: { id: number; name: string; country?: { alpha2: string } };
  homeScore?: {
    current?: number;
    period1?: number;
    period2?: number;
    period3?: number;
    period4?: number;
    period5?: number;
  };
  awayScore?: {
    current?: number;
    period1?: number;
    period2?: number;
    period3?: number;
    period4?: number;
    period5?: number;
  };
  status?: { type: string; description?: string };
  tournament?: { name: string; id: number; groundType?: string };
  roundInfo?: { name: string };
  startTimestamp?: number;
}

interface MatchCardProps {
  match: Match;
}

function getSetScores(homeScore?: MatchCardProps['match']['homeScore'], awayScore?: MatchCardProps['match']['awayScore']) {
  const periods = ['period1', 'period2', 'period3', 'period4', 'period5'] as const;
  const sets: { home: number; away: number }[] = [];
  for (const p of periods) {
    if (homeScore?.[p] !== undefined && awayScore?.[p] !== undefined) {
      sets.push({ home: homeScore[p]!, away: awayScore[p]! });
    }
  }
  return sets;
}

function formatTime(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const router = useRouter();
  const isLive = match.status?.type === 'inprogress';
  const isFinished = match.status?.type === 'finished';
  const sets = getSetScores(match.homeScore, match.awayScore);

  const homeWins = isFinished && sets.filter((s) => s.home > s.away).length > sets.filter((s) => s.away > s.home).length;
  const awayWins = isFinished && !homeWins;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/match/${match.id}`)}
      activeOpacity={0.85}
    >
      {/* Header */}
      <View style={styles.header}>
        <SurfaceBadge surface={match.tournament?.groundType} />
        <Text style={styles.tournamentText} numberOfLines={1}>
          {match.tournament?.name}
          {match.roundInfo?.name ? ` · ${match.roundInfo.name}` : ''}
        </Text>
      </View>

      {/* Players */}
      <View style={styles.playerRow}>
        <Avatar playerId={match.homeTeam.id} name={match.homeTeam.name} size={56} />
        <Text
          style={[
            styles.playerName,
            isFinished && awayWins && styles.loserName,
          ]}
          numberOfLines={1}
        >
          {match.homeTeam.name}
        </Text>
        <View style={styles.scoresContainer}>
          {sets.map((s, i) => (
            <Text
              key={i}
              style={[
                styles.setScore,
                isFinished && s.home < s.away && styles.loserScore,
              ]}
            >
              {s.home}
            </Text>
          ))}
          {isLive && match.homeScore?.current !== undefined && (
            <Text style={styles.liveScore}>{match.homeScore.current}</Text>
          )}
        </View>
      </View>

      <View style={[styles.playerRow, { marginTop: 8 }]}>
        <Avatar playerId={match.awayTeam.id} name={match.awayTeam.name} size={56} />
        <Text
          style={[
            styles.playerName,
            isFinished && homeWins && styles.loserName,
          ]}
          numberOfLines={1}
        >
          {match.awayTeam.name}
        </Text>
        <View style={styles.scoresContainer}>
          {sets.map((s, i) => (
            <Text
              key={i}
              style={[
                styles.setScore,
                isFinished && s.away < s.home && styles.loserScore,
              ]}
            >
              {s.away}
            </Text>
          ))}
          {isLive && match.awayScore?.current !== undefined && (
            <Text style={styles.liveScore}>{match.awayScore.current}</Text>
          )}
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusRow}>
        {isLive ? (
          <LiveDot showLabel={true} />
        ) : isFinished ? (
          <Text style={styles.finalText}>FINAL</Text>
        ) : (
          <Text style={styles.timeText}>{formatTime(match.startTimestamp)}</Text>
        )}
        {isLive && match.status?.description && (
          <Text style={styles.statusDescription}> · {match.status.description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceCardBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tournamentText: {
    color: Colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerName: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  loserName: {
    opacity: 0.5,
  },
  scoresContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  setScore: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  loserScore: {
    color: Colors.textSecondary,
  },
  liveScore: {
    color: Colors.scoreLive,
    fontSize: 20,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  finalText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  timeText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  statusDescription: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
