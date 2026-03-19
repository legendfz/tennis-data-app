import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { theme } from '../../../lib/theme';
import { PlayerAvatar } from '../../../lib/player-avatar';
import api from '../../../lib/api';
import {
  loadPrediction128,
  savePrediction128,
  PREDICTION_SCORING_128,
  ROUND_NAMES,
  ROUND_MATCH_COUNTS,
} from '../../../lib/predictions';

interface DrawEntry {
  position: number;
  playerId: number;
  seed: number | null;
  name: string;
  ranking: number;
  country: string;
}

interface ResultsData {
  tournamentId: number;
  tournamentName: string;
  drawSize: number;
  draw: DrawEntry[];
  results: Record<string, number[]>;
  champion: number;
}

export default function PredictResultScreen() {
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const tid = parseInt(tournamentId || '101', 10);

  const [results, setResults] = useState<ResultsData | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
  const [playerMap, setPlayerMap] = useState<Record<number, DrawEntry>>({});

  // Round-level stats
  const [roundStats, setRoundStats] = useState<
    Record<string, { correct: number; total: number; points: number }>
  >({});

  useEffect(() => {
    loadData();
  }, [tid]);

  const loadData = async () => {
    try {
      const [resResults, pred] = await Promise.all([
        api.get(`/api/fantasy/predictions/${tid}/results128`),
        loadPrediction128(tid),
      ]);

      const r: ResultsData = resResults.data.data;
      setResults(r);
      setPrediction(pred);

      // Build player map
      const map: Record<number, DrawEntry> = {};
      r.draw.forEach((d) => { map[d.playerId] = d; });
      setPlayerMap(map);

      if (pred && r) {
        let total = 0;
        const stats: Record<string, { correct: number; total: number; points: number }> = {};

        for (const round of ROUND_NAMES) {
          const predicted = pred.rounds[round] || [];
          const actual = r.results[round] || [];
          const matchCount = ROUND_MATCH_COUNTS[round];
          const ptsPerCorrect = PREDICTION_SCORING_128[round];

          let correctCount = 0;
          for (let i = 0; i < predicted.length; i++) {
            // Check if predicted winner at position i matches actual
            if (predicted[i] && actual[i] && predicted[i] === actual[i]) {
              correctCount++;
            }
          }

          const roundPts = correctCount * ptsPerCorrect;
          total += roundPts;
          stats[round] = { correct: correctCount, total: matchCount, points: roundPts };
        }

        // Champion bonus
        if (pred.champion === r.champion) {
          total += PREDICTION_SCORING_128.Champion;
        }

        setTotalPoints(total);
        setRoundStats(stats);

        // Update stored prediction with points
        if (pred.totalPoints !== total) {
          await savePrediction128(tid, { ...pred, totalPoints: total });
        }
      }
    } catch (e) {
      console.error('Failed to load results', e);
    } finally {
      setLoading(false);
    }
  };

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

  const maxPoints =
    Object.entries(ROUND_MATCH_COUNTS).reduce(
      (sum, [round, count]) => sum + count * PREDICTION_SCORING_128[round],
      0
    ) + PREDICTION_SCORING_128.Champion;

  const championCorrect = prediction.champion === results.champion;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{results.tournamentName}</Text>
        <Text style={styles.subtitle}>128-Draw Prediction Results</Text>

        {/* Total Points Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL POINTS</Text>
          <Text style={styles.totalValue}>{totalPoints}</Text>
          <Text style={styles.totalMax}>/ {maxPoints} max</Text>
        </View>

        {/* Champion Result */}
        <View style={styles.championSection}>
          <Text style={styles.sectionTitle}>
            🏆 Champion ({PREDICTION_SCORING_128.Champion} pts)
          </Text>
          <View style={[styles.championCard, championCorrect ? styles.championCorrect : styles.championWrong]}>
            <View style={styles.championContent}>
              {prediction.champion && playerMap[prediction.champion] && (
                <>
                  <PlayerAvatar name={playerMap[prediction.champion].name} size={48} />
                  <Text
                    style={[
                      styles.championName,
                      championCorrect ? styles.correctText : styles.wrongText,
                    ]}
                  >
                    {playerMap[prediction.champion].name}
                  </Text>
                </>
              )}
              <Text style={championCorrect ? styles.correctIcon : styles.wrongIcon}>
                {championCorrect ? '✓ Correct!' : '✗ Wrong'}
              </Text>
              {!championCorrect && playerMap[results.champion] && (
                <Text style={styles.actualText}>
                  Actual: {playerMap[results.champion].name}
                </Text>
              )}
              <Text style={championCorrect ? styles.correctPts : styles.zeroPts}>
                {championCorrect ? `+${PREDICTION_SCORING_128.Champion}` : '+0'}
              </Text>
            </View>
          </View>
        </View>

        {/* Round-by-Round Summary */}
        <Text style={styles.sectionTitle}>Round-by-Round Breakdown</Text>
        {ROUND_NAMES.map((round) => {
          const stat = roundStats[round] || { correct: 0, total: 0, points: 0 };
          const accuracy = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
          const isExpanded = expandedRound === round;

          return (
            <View key={round}>
              <TouchableOpacity
                style={styles.roundSummary}
                activeOpacity={theme.activeOpacity}
                onPress={() => setExpandedRound(isExpanded ? null : round)}
              >
                <View style={styles.roundHeader}>
                  <Text style={styles.roundName}>{round}</Text>
                  <Text style={styles.roundPtsLabel}>
                    {PREDICTION_SCORING_128[round]} pts each
                  </Text>
                </View>
                <View style={styles.roundStats}>
                  <Text style={styles.roundCorrect}>
                    {stat.correct}/{stat.total}
                  </Text>
                  <View style={styles.accuracyBar}>
                    <View
                      style={[styles.accuracyFill, { width: `${accuracy}%` }]}
                    />
                  </View>
                  <Text style={styles.roundPoints}>+{stat.points}</Text>
                  <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>

              {/* Expanded detail */}
              {isExpanded && (
                <View style={styles.roundDetail}>
                  {(prediction.rounds[round] || []).map((predId: number, i: number) => {
                    const actualId = (results.results[round] || [])[i];
                    const correct = predId === actualId;
                    const predPlayer = predId ? playerMap[predId] : null;
                    const actualPlayer = actualId ? playerMap[actualId] : null;
                    return (
                      <View key={i} style={styles.detailRow}>
                        <View style={styles.detailPlayer}>
                          {predPlayer && <PlayerAvatar name={predPlayer.name} size={22} />}
                          <Text
                            style={[
                              styles.detailName,
                              correct ? styles.correctText : styles.wrongText,
                            ]}
                            numberOfLines={1}
                          >
                            {predPlayer?.name || '—'}
                          </Text>
                        </View>
                        <View style={styles.detailResult}>
                          <Text style={correct ? styles.correctIcon : styles.wrongIcon}>
                            {correct ? '✓' : '✗'}
                          </Text>
                          {!correct && actualPlayer && (
                            <Text style={styles.detailActual} numberOfLines={1}>
                              → {actualPlayer.name}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Points Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Points Breakdown</Text>
          {ROUND_NAMES.map((round) => {
            const stat = roundStats[round] || { correct: 0, total: 0, points: 0 };
            return (
              <View key={round} style={styles.breakdownRow}>
                <Text style={styles.breakdownRound}>{round}</Text>
                <Text style={styles.breakdownScore}>
                  {stat.correct} × {PREDICTION_SCORING_128[round]}
                </Text>
                <Text style={styles.breakdownPts}>{stat.points}</Text>
              </View>
            );
          })}
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownRound}>Champion</Text>
            <Text style={styles.breakdownScore}>
              {championCorrect ? '1' : '0'} × {PREDICTION_SCORING_128.Champion}
            </Text>
            <Text style={styles.breakdownPts}>
              {championCorrect ? PREDICTION_SCORING_128.Champion : 0}
            </Text>
          </View>
          <View style={[styles.breakdownRow, styles.breakdownTotal]}>
            <Text style={styles.breakdownTotalLabel}>TOTAL</Text>
            <Text style={styles.breakdownTotalValue}>{totalPoints}</Text>
          </View>
        </View>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.accent,
    marginBottom: 10,
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
  },
  championCorrect: {
    borderColor: theme.accent + '60',
  },
  championWrong: {
    borderColor: theme.red + '40',
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
  correctText: { color: theme.accent },
  wrongText: { color: theme.red },
  correctIcon: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.accent,
    marginTop: 4,
  },
  wrongIcon: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.red,
    marginTop: 4,
  },
  correctPts: {
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    color: theme.accent,
    marginTop: 4,
  },
  zeroPts: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  roundSummary: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  roundName: {
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
  },
  roundPtsLabel: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  roundStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roundCorrect: {
    fontSize: 12,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
    minWidth: 36,
  },
  accuracyBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.bg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  accuracyFill: {
    height: '100%',
    backgroundColor: theme.accent,
    borderRadius: 3,
  },
  roundPoints: {
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    color: theme.accent,
    minWidth: 40,
    textAlign: 'right',
  },
  expandIcon: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  roundDetail: {
    backgroundColor: theme.card,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: -2,
    padding: 8,
    borderWidth: 1,
    borderColor: theme.border,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  detailPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailName: {
    fontSize: 11,
    fontWeight: theme.fontWeight.semibold,
    marginLeft: 6,
    flex: 1,
  },
  detailResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailActual: {
    fontSize: 10,
    color: theme.textSecondary,
    maxWidth: 100,
  },
  breakdownCard: {
    marginTop: 20,
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  breakdownRound: {
    fontSize: 12,
    color: theme.text,
    flex: 1,
  },
  breakdownScore: {
    fontSize: 11,
    color: theme.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  breakdownPts: {
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    color: theme.accent,
    minWidth: 40,
    textAlign: 'right',
  },
  breakdownTotal: {
    borderBottomWidth: 0,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: theme.accent + '40',
  },
  breakdownTotalLabel: {
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    color: theme.text,
    flex: 1,
  },
  breakdownTotalValue: {
    fontSize: 20,
    fontWeight: theme.fontWeight.bold,
    color: theme.accent,
  },
});
