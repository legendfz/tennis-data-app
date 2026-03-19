import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { theme } from '../../../lib/theme';
import { PlayerAvatar } from '../../../lib/player-avatar';
import api from '../../../lib/api';
import { loadPrediction, savePrediction, PREDICTION_SCORING } from '../../../lib/predictions';

interface ResultPlayer {
  id: number;
  name: string;
  ranking: number;
  country: string;
  seed: number;
}

interface TournamentResults {
  tournamentId: number;
  tournamentName: string;
  players: ResultPlayer[];
  results: {
    qf: number[];
    sf: number[];
    final: number[];
    champion: number;
  };
}

export default function PredictResultScreen() {
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const tid = parseInt(tournamentId || '1', 10);

  const [results, setResults] = useState<TournamentResults | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    loadData();
  }, [tid]);

  const loadData = async () => {
    try {
      const [resResults, pred] = await Promise.all([
        api.get(`/api/fantasy/predictions/${tid}/results`),
        loadPrediction(tid),
      ]);
      const r = resResults.data.data;
      setResults(r);
      setPrediction(pred);

      if (pred && r) {
        let pts = 0;
        // QF points
        pred.qf.forEach((id: number) => {
          if (r.results.qf.includes(id)) pts += PREDICTION_SCORING.qf;
        });
        // SF points
        pred.sf.forEach((id: number) => {
          if (r.results.sf.includes(id)) pts += PREDICTION_SCORING.sf;
        });
        // Final points
        pred.final.forEach((id: number) => {
          if (r.results.final.includes(id)) pts += PREDICTION_SCORING.final;
        });
        // Champion points
        if (pred.champion === r.results.champion) pts += PREDICTION_SCORING.champion;
        setTotalPoints(pts);

        // Update stored prediction with points
        if (pred.totalPoints !== pts) {
          await savePrediction(tid, { ...pred, totalPoints: pts });
        }
      }
    } catch {
      console.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getPlayer = (id: number): ResultPlayer | undefined =>
    results?.players.find((p) => p.id === id);

  if (loading || !results) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!prediction) {
    return (
      <View style={styles.center}>
        <Text style={styles.noData}>No prediction found for this tournament.</Text>
        <Text style={styles.noDataSub}>Make your picks first!</Text>
      </View>
    );
  }

  const renderRoundComparison = (
    roundName: string,
    predicted: number[],
    actual: number[],
    pointsPerCorrect: number
  ) => (
    <View style={styles.roundSection}>
      <Text style={styles.roundTitle}>
        {roundName} ({pointsPerCorrect} pts each)
      </Text>
      {predicted.map((predId, i) => {
        const correct = actual.includes(predId);
        const player = getPlayer(predId);
        return (
          <View key={`${roundName}-${i}`} style={styles.predictionRow}>
            <View style={styles.predictionPlayer}>
              {player && <PlayerAvatar name={player.name} size={28} />}
              <Text style={[styles.predictionName, correct ? styles.correctText : styles.wrongText]}>
                {player?.name || `Player #${predId}`}
              </Text>
            </View>
            <View style={styles.predictionResult}>
              <Text style={correct ? styles.correctIcon : styles.wrongIcon}>
                {correct ? '✓' : '✗'}
              </Text>
              <Text style={correct ? styles.correctPts : styles.wrongPts}>
                {correct ? `+${pointsPerCorrect}` : '0'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{results.tournamentName}</Text>
        <Text style={styles.subtitle}>Your Prediction Results</Text>

        {/* Total Points Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL POINTS</Text>
          <Text style={styles.totalValue}>{totalPoints}</Text>
          <Text style={styles.totalMax}>
            / {(PREDICTION_SCORING.qf * 4 + PREDICTION_SCORING.sf * 2 + PREDICTION_SCORING.final + PREDICTION_SCORING.champion)} max
          </Text>
        </View>

        {/* Champion */}
        <View style={styles.championSection}>
          <Text style={styles.roundTitle}>🏆 Champion ({PREDICTION_SCORING.champion} pts)</Text>
          <View style={styles.championCard}>
            {(() => {
              const correct = prediction.champion === results.results.champion;
              const player = getPlayer(prediction.champion);
              return (
                <View style={styles.championContent}>
                  {player && <PlayerAvatar name={player.name} size={48} />}
                  <Text style={[styles.championName, correct ? styles.correctText : styles.wrongText]}>
                    {player?.name}
                  </Text>
                  <Text style={correct ? styles.correctIcon : styles.wrongIcon}>
                    {correct ? '✓ Correct!' : '✗ Wrong'}
                  </Text>
                  {!correct && (
                    <Text style={styles.actualText}>
                      Actual: {getPlayer(results.results.champion)?.name}
                    </Text>
                  )}
                </View>
              );
            })()}
          </View>
        </View>

        {/* Round by round */}
        {renderRoundComparison('Quarter-Finals', prediction.qf, results.results.qf, PREDICTION_SCORING.qf)}
        {renderRoundComparison('Semi-Finals', prediction.sf, results.results.sf, PREDICTION_SCORING.sf)}
        {renderRoundComparison('Final', prediction.final, results.results.final, PREDICTION_SCORING.final)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  center: {
    flex: 1,
    backgroundColor: theme.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scroll: {
    padding: theme.spacing.padding,
    paddingBottom: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.fontSize.secondary,
    color: theme.textSecondary,
    marginBottom: 20,
  },
  noData: {
    fontSize: 16,
    color: theme.text,
    fontWeight: theme.fontWeight.semibold,
  },
  noDataSub: {
    fontSize: theme.fontSize.secondary,
    color: theme.textSecondary,
    marginTop: 6,
  },
  totalCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.accent + '40',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  totalValue: {
    fontSize: 48,
    fontWeight: theme.fontWeight.bold,
    color: theme.accent,
  },
  totalMax: {
    fontSize: theme.fontSize.secondary,
    color: theme.textSecondary,
    marginTop: 4,
  },
  championSection: {
    marginBottom: 20,
  },
  championCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.gold + '40',
  },
  championContent: {
    alignItems: 'center',
  },
  championName: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    marginTop: 8,
  },
  actualText: {
    fontSize: theme.fontSize.secondary,
    color: theme.textSecondary,
    marginTop: 4,
  },
  roundSection: {
    marginBottom: 16,
  },
  roundTitle: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.accent,
    marginBottom: 8,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  predictionPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  predictionName: {
    fontSize: 13,
    fontWeight: theme.fontWeight.semibold,
    marginLeft: 8,
  },
  predictionResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  correctText: {
    color: theme.accent,
  },
  wrongText: {
    color: theme.red,
  },
  correctIcon: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.accent,
  },
  wrongIcon: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.red,
  },
  correctPts: {
    fontSize: 13,
    fontWeight: theme.fontWeight.semibold,
    color: theme.accent,
  },
  wrongPts: {
    fontSize: 13,
    color: theme.textSecondary,
  },
});
