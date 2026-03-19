import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../../lib/theme';
import { PlayerAvatar } from '../../../lib/player-avatar';
import api from '../../../lib/api';
import { savePrediction, loadPrediction, BracketPrediction } from '../../../lib/predictions';

interface BracketPlayer {
  id: number;
  name: string;
  ranking: number;
  country: string;
  seed: number;
}

interface BracketData {
  tournamentId: number;
  tournamentName: string;
  players: BracketPlayer[];
  matchups: { top: number; bottom: number }[]; // QF matchups by player id
}

export default function PredictBracketScreen() {
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const router = useRouter();
  const tid = parseInt(tournamentId || '1', 10);

  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);

  // Prediction state
  const [qfWinners, setQfWinners] = useState<(number | null)[]>([null, null, null, null]);
  const [sfWinners, setSfWinners] = useState<(number | null)[]>([null, null]);
  const [finalist, setFinalist] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    loadBracket();
  }, [tid]);

  const loadBracket = async () => {
    try {
      const res = await api.get(`/api/fantasy/predictions/${tid}/bracket`);
      setBracket(res.data.data);

      // Load existing prediction
      const existing = await loadPrediction(tid);
      if (existing) {
        setQfWinners(existing.qf.map((id) => id));
        setSfWinners(existing.sf.map((id) => id));
        setFinalist(existing.champion);
        setLocked(existing.locked);
      }
    } catch {
      console.error('Failed to load bracket');
    } finally {
      setLoading(false);
    }
  };

  const getPlayer = (id: number): BracketPlayer | undefined =>
    bracket?.players.find((p) => p.id === id);

  const selectQfWinner = (matchIndex: number, playerId: number) => {
    if (locked) return;
    const newQf = [...qfWinners];
    const oldWinner = newQf[matchIndex];
    newQf[matchIndex] = playerId;
    setQfWinners(newQf);

    // Clear downstream if changed
    if (oldWinner !== playerId) {
      const sfIndex = Math.floor(matchIndex / 2);
      const newSf = [...sfWinners];
      if (newSf[sfIndex] === oldWinner) {
        newSf[sfIndex] = null;
        setSfWinners(newSf);
        if (finalist === oldWinner) setFinalist(null);
      }
    }
  };

  const selectSfWinner = (matchIndex: number, playerId: number) => {
    if (locked) return;
    // Verify player is a QF winner in this half
    const qfIdx1 = matchIndex * 2;
    const qfIdx2 = matchIndex * 2 + 1;
    if (playerId !== qfWinners[qfIdx1] && playerId !== qfWinners[qfIdx2]) return;

    const newSf = [...sfWinners];
    const oldWinner = newSf[matchIndex];
    newSf[matchIndex] = playerId;
    setSfWinners(newSf);

    if (oldWinner !== playerId && finalist === oldWinner) {
      setFinalist(null);
    }
  };

  const selectFinalist = (playerId: number) => {
    if (locked) return;
    if (playerId !== sfWinners[0] && playerId !== sfWinners[1]) return;
    setFinalist(playerId);
  };

  const isComplete = qfWinners.every((w) => w !== null) && sfWinners.every((w) => w !== null) && finalist !== null;

  const handleSubmit = async () => {
    if (!isComplete || !bracket) return;

    const prediction: BracketPrediction = {
      tournamentId: tid,
      qf: qfWinners as number[],
      sf: sfWinners as number[],
      final: [finalist!],
      champion: finalist!,
      locked: true,
      totalPoints: 0,
    };

    await savePrediction(tid, prediction);
    setLocked(true);
    Alert.alert('Prediction Locked!', 'Your bracket prediction has been saved. Good luck! 🎾', [
      { text: 'OK' },
    ]);
  };

  const handleReset = async () => {
    if (locked) {
      Alert.alert('Reset Prediction?', 'This will unlock and clear your prediction.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setQfWinners([null, null, null, null]);
            setSfWinners([null, null]);
            setFinalist(null);
            setLocked(false);
          },
        },
      ]);
    }
  };

  if (loading || !bracket) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const renderPlayerSlot = (
    playerId: number | null,
    onPress: () => void,
    isSelected: boolean,
    isWinner: boolean = false
  ) => {
    const player = playerId ? getPlayer(playerId) : null;
    return (
      <TouchableOpacity
        style={[
          styles.playerSlot,
          isSelected && styles.playerSlotSelected,
          isWinner && styles.playerSlotWinner,
          !playerId && styles.playerSlotEmpty,
        ]}
        activeOpacity={locked ? 1 : theme.activeOpacity}
        onPress={onPress}
        disabled={locked || !playerId}
      >
        {player ? (
          <View style={styles.playerRow}>
            <PlayerAvatar name={player.name} size={28} />
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, isSelected && styles.playerNameSelected]} numberOfLines={1}>
                [{player.seed}] {player.name}
              </Text>
              <Text style={styles.playerRank}>#{player.ranking} {player.country}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>—</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{bracket.tournamentName}</Text>
        <Text style={styles.subtitle}>
          {locked ? '🔒 Prediction locked' : 'Tap a player to advance them to the next round'}
        </Text>

        {/* BRACKET LAYOUT */}
        <View style={styles.bracketContainer}>
          {/* QF Column */}
          <View style={styles.column}>
            <Text style={styles.roundLabel}>QF</Text>
            {bracket.matchups.map((matchup, i) => (
              <View key={`qf-${i}`} style={styles.matchup}>
                {renderPlayerSlot(
                  matchup.top,
                  () => selectQfWinner(i, matchup.top),
                  qfWinners[i] === matchup.top,
                  false
                )}
                <Text style={styles.vs}>vs</Text>
                {renderPlayerSlot(
                  matchup.bottom,
                  () => selectQfWinner(i, matchup.bottom),
                  qfWinners[i] === matchup.bottom,
                  false
                )}
              </View>
            ))}
          </View>

          {/* SF Column */}
          <View style={styles.column}>
            <Text style={styles.roundLabel}>SF</Text>
            {[0, 1].map((sfIdx) => {
              const topQfWinner = qfWinners[sfIdx * 2];
              const bottomQfWinner = qfWinners[sfIdx * 2 + 1];
              return (
                <View key={`sf-${sfIdx}`} style={[styles.matchup, styles.matchupSF]}>
                  {renderPlayerSlot(
                    topQfWinner,
                    () => topQfWinner && selectSfWinner(sfIdx, topQfWinner),
                    sfWinners[sfIdx] === topQfWinner && topQfWinner !== null,
                    false
                  )}
                  <Text style={styles.vs}>vs</Text>
                  {renderPlayerSlot(
                    bottomQfWinner,
                    () => bottomQfWinner && selectSfWinner(sfIdx, bottomQfWinner),
                    sfWinners[sfIdx] === bottomQfWinner && bottomQfWinner !== null,
                    false
                  )}
                </View>
              );
            })}
          </View>

          {/* Final Column */}
          <View style={styles.column}>
            <Text style={styles.roundLabel}>Final</Text>
            <View style={[styles.matchup, styles.matchupFinal]}>
              {renderPlayerSlot(
                sfWinners[0],
                () => sfWinners[0] && selectFinalist(sfWinners[0]),
                finalist === sfWinners[0] && sfWinners[0] !== null,
                false
              )}
              <Text style={styles.vs}>vs</Text>
              {renderPlayerSlot(
                sfWinners[1],
                () => sfWinners[1] && selectFinalist(sfWinners[1]),
                finalist === sfWinners[1] && sfWinners[1] !== null,
                false
              )}
            </View>
          </View>

          {/* Champion */}
          <View style={styles.column}>
            <Text style={styles.roundLabel}>🏆 Champion</Text>
            <View style={styles.championBox}>
              {finalist ? (
                <View style={styles.championContent}>
                  <PlayerAvatar name={getPlayer(finalist)?.name || ''} size={48} />
                  <Text style={styles.championName}>{getPlayer(finalist)?.name}</Text>
                  <Text style={styles.championCountry}>{getPlayer(finalist)?.country}</Text>
                </View>
              ) : (
                <Text style={styles.emptyChampion}>Pick your champion</Text>
              )}
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {!locked ? (
            <TouchableOpacity
              style={[styles.submitBtn, !isComplete && styles.submitBtnDisabled]}
              activeOpacity={theme.activeOpacity}
              onPress={handleSubmit}
              disabled={!isComplete}
            >
              <Text style={styles.submitBtnText}>
                {isComplete ? '🔒 Lock Prediction' : 'Complete all picks to submit'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.lockedActions}>
              <TouchableOpacity
                style={styles.viewResultsBtn}
                activeOpacity={theme.activeOpacity}
                onPress={() => router.push(`/fantasy/predict-result/${tid}` as any)}
              >
                <Text style={styles.viewResultsBtnText}>View Results →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resetBtn}
                activeOpacity={theme.activeOpacity}
                onPress={handleReset}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}
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
  bracketContainer: {
    gap: 20,
  },
  column: {
    marginBottom: 8,
  },
  roundLabel: {
    fontSize: 13,
    fontWeight: theme.fontWeight.semibold,
    color: theme.accent,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  matchup: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  matchupSF: {
    borderColor: theme.accent + '30',
  },
  matchupFinal: {
    borderColor: theme.gold + '40',
  },
  vs: {
    fontSize: 10,
    color: theme.textSecondary,
    textAlign: 'center',
    marginVertical: 2,
  },
  playerSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.bg,
    minHeight: 44,
  },
  playerSlotSelected: {
    backgroundColor: theme.accent + '25',
    borderWidth: 1,
    borderColor: theme.accent,
  },
  playerSlotWinner: {
    backgroundColor: theme.accent + '15',
  },
  playerSlotEmpty: {
    opacity: 0.4,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerInfo: {
    marginLeft: 8,
    flex: 1,
  },
  playerName: {
    fontSize: 13,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
  },
  playerNameSelected: {
    color: theme.accent,
  },
  playerRank: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  emptyText: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    width: '100%',
  },
  championBox: {
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
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.gold,
    marginTop: 8,
  },
  championCountry: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  emptyChampion: {
    fontSize: 14,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    marginTop: 24,
  },
  submitBtn: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: theme.fontWeight.semibold,
    color: '#fff',
  },
  lockedActions: {
    gap: 10,
  },
  viewResultsBtn: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  viewResultsBtnText: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: '#fff',
  },
  resetBtn: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.red + '40',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.red,
  },
});
