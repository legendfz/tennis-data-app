import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../../lib/theme';
import { PlayerAvatar } from '../../../lib/player-avatar';
import api from '../../../lib/api';
import {
  ROUND_NAMES,
  ROUND_MATCH_COUNTS,
  PREDICTION_SCORING_128,
  BracketPrediction128,
  savePrediction128,
  loadPrediction128,
} from '../../../lib/predictions';

interface DrawEntry {
  position: number;
  playerId: number;
  seed: number | null;
  name: string;
  ranking: number;
  country: string;
}

interface BracketData {
  tournamentId: number;
  tournamentName: string;
  drawSize: number;
  seeds: DrawEntry[];
  rounds: string[];
}

const QUARTER_LABELS = ['Q1 (Top)', 'Q2', 'Q3', 'Q4 (Bottom)'];

export default function PredictBracketScreen() {
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const router = useRouter();
  const tid = parseInt(tournamentId || '101', 10);
  const scrollRef = useRef<ScrollView>(null);

  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundWinners, setRoundWinners] = useState<Record<string, number[]>>({});
  const [locked, setLocked] = useState(false);
  const [activeQuarter, setActiveQuarter] = useState(0);

  // Player lookup
  const [playerMap, setPlayerMap] = useState<Record<number, DrawEntry>>({});

  useEffect(() => {
    loadBracket();
  }, [tid]);

  const loadBracket = async () => {
    try {
      const res = await api.get(`/api/fantasy/predictions/${tid}/bracket128`);
      const data: BracketData = res.data.data;
      setBracket(data);

      // Build player map
      const map: Record<number, DrawEntry> = {};
      data.seeds.forEach((s) => { map[s.playerId] = s; });
      setPlayerMap(map);

      // Load existing prediction
      const existing = await loadPrediction128(tid);
      if (existing) {
        setRoundWinners(existing.rounds);
        setCurrentRound(existing.currentRound);
        setLocked(existing.locked);
      }
    } catch (e) {
      console.error('Failed to load bracket', e);
    } finally {
      setLoading(false);
    }
  };

  // Get matchups for current round
  const getMatchups = (): { player1: DrawEntry; player2: DrawEntry; matchIndex: number }[] => {
    if (!bracket) return [];
    const round = ROUND_NAMES[currentRound];
    const matchups: { player1: DrawEntry; player2: DrawEntry; matchIndex: number }[] = [];

    if (currentRound === 0) {
      // R128: pair positions 1v2, 3v4, etc.
      const seeds = bracket.seeds;
      for (let i = 0; i < seeds.length; i += 2) {
        matchups.push({
          player1: seeds[i],
          player2: seeds[i + 1],
          matchIndex: i / 2,
        });
      }
    } else {
      // Later rounds: pair from previous round winners
      const prevRound = ROUND_NAMES[currentRound - 1];
      const prevWinners = roundWinners[prevRound] || [];
      for (let i = 0; i < prevWinners.length; i += 2) {
        const p1 = playerMap[prevWinners[i]];
        const p2 = playerMap[prevWinners[i + 1]];
        if (p1 && p2) {
          matchups.push({ player1: p1, player2: p2, matchIndex: i / 2 });
        }
      }
    }
    return matchups;
  };

  const currentRoundName = ROUND_NAMES[currentRound];
  const matchups = getMatchups();
  const expectedMatches = ROUND_MATCH_COUNTS[currentRoundName] || 0;

  // Current round selections
  const currentSelections = roundWinners[currentRoundName] || [];

  // Get matchups for a specific quarter (for R128/R64 which have many matches)
  const getQuarterMatchups = () => {
    if (matchups.length <= 8) return [matchups]; // No need for quarters if few matches
    const quarterSize = Math.ceil(matchups.length / 4);
    const quarters: typeof matchups[] = [];
    for (let i = 0; i < 4; i++) {
      quarters.push(matchups.slice(i * quarterSize, (i + 1) * quarterSize));
    }
    return quarters;
  };

  const quarters = getQuarterMatchups();
  const useQuarters = matchups.length > 8;
  const displayMatchups = useQuarters ? (quarters[activeQuarter] || []) : matchups;

  const selectWinner = (matchIndex: number, playerId: number) => {
    if (locked) return;
    const round = currentRoundName;
    const newSelections = [...(roundWinners[round] || new Array(expectedMatches).fill(null))];

    // Ensure array is the right size
    while (newSelections.length < expectedMatches) newSelections.push(null);

    newSelections[matchIndex] = playerId;
    setRoundWinners({ ...roundWinners, [round]: newSelections });
  };

  const isRoundComplete = () => {
    const selections = roundWinners[currentRoundName] || [];
    return selections.length === expectedMatches && selections.every((s) => s !== null && s !== undefined);
  };

  const handleNextRound = async () => {
    if (!isRoundComplete()) return;

    if (currentRound < ROUND_NAMES.length - 1) {
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      setActiveQuarter(0);
      scrollRef.current?.scrollTo({ y: 0, animated: true });

      // Auto-save progress
      await savePrediction128(tid, {
        tournamentId: tid,
        version: 128,
        rounds: roundWinners,
        champion: null,
        locked: false,
        totalPoints: 0,
        currentRound: nextRound,
      });
    }
  };

  const handleSubmit = async () => {
    if (!isRoundComplete()) return;

    const finalWinners = roundWinners['Final'] || [];
    const champion = finalWinners[0];

    if (!champion) return;

    const prediction: BracketPrediction128 = {
      tournamentId: tid,
      version: 128,
      rounds: roundWinners,
      champion,
      locked: true,
      totalPoints: 0,
      currentRound: ROUND_NAMES.length - 1,
    };

    await savePrediction128(tid, prediction);
    setLocked(true);
    Alert.alert('Prediction Locked! 🎾', 'Your full 128-draw bracket has been saved. Good luck!', [
      { text: 'OK' },
    ]);
  };

  const handleReset = () => {
    Alert.alert('Reset Prediction?', 'This will clear all your picks across all rounds.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          setRoundWinners({});
          setCurrentRound(0);
          setLocked(false);
          setActiveQuarter(0);
          await savePrediction128(tid, {
            tournamentId: tid,
            version: 128,
            rounds: {},
            champion: null,
            locked: false,
            totalPoints: 0,
            currentRound: 0,
          });
        },
      },
    ]);
  };

  const handlePrevRound = () => {
    if (currentRound > 0 && !locked) {
      setCurrentRound(currentRound - 1);
      setActiveQuarter(0);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  if (loading || !bracket) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const selectedInMatch = (matchIndex: number): number | null => {
    const selections = roundWinners[currentRoundName] || [];
    return selections[matchIndex] ?? null;
  };

  const completedCount = (roundWinners[currentRoundName] || []).filter(
    (s) => s !== null && s !== undefined
  ).length;

  const isLastRound = currentRound === ROUND_NAMES.length - 1;

  return (
    <View style={styles.container}>
      {/* Round Progress Bar */}
      <View style={styles.progressBar}>
        {ROUND_NAMES.map((round, i) => {
          const isCompleted = roundWinners[round]?.length === ROUND_MATCH_COUNTS[round] &&
            roundWinners[round]?.every((s) => s !== null);
          const isCurrent = i === currentRound;
          return (
            <TouchableOpacity
              key={round}
              style={[
                styles.progressDot,
                isCompleted && styles.progressDotDone,
                isCurrent && styles.progressDotCurrent,
              ]}
              onPress={() => {
                if (!locked && i <= currentRound) {
                  setCurrentRound(i);
                  setActiveQuarter(0);
                }
              }}
            >
              <Text
                style={[
                  styles.progressLabel,
                  isCompleted && styles.progressLabelDone,
                  isCurrent && styles.progressLabelCurrent,
                ]}
              >
                {round}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{bracket.tournamentName}</Text>
        <Text style={styles.subtitle}>
          {locked
            ? '🔒 Prediction locked'
            : `${currentRoundName} — Pick winners (${completedCount}/${expectedMatches})`}
        </Text>

        {/* Quarter Tabs (for large rounds) */}
        {useQuarters && (
          <View style={styles.quarterTabs}>
            {quarters.map((_, qi) => {
              const qMatches = quarters[qi] || [];
              const qSelections = qMatches.filter((m) => {
                const sel = (roundWinners[currentRoundName] || [])[m.matchIndex];
                return sel !== null && sel !== undefined;
              }).length;
              const qDone = qSelections === qMatches.length;
              return (
                <TouchableOpacity
                  key={qi}
                  style={[
                    styles.quarterTab,
                    qi === activeQuarter && styles.quarterTabActive,
                    qDone && styles.quarterTabDone,
                  ]}
                  onPress={() => setActiveQuarter(qi)}
                >
                  <Text
                    style={[
                      styles.quarterTabText,
                      qi === activeQuarter && styles.quarterTabTextActive,
                    ]}
                  >
                    {QUARTER_LABELS[qi]}
                  </Text>
                  <Text style={styles.quarterTabCount}>
                    {qSelections}/{qMatches.length}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Matchup List */}
        <View style={styles.matchupList}>
          {displayMatchups.map((m) => {
            const selected = selectedInMatch(m.matchIndex);
            return (
              <View key={m.matchIndex} style={styles.matchCard}>
                <Text style={styles.matchNumber}>Match {m.matchIndex + 1}</Text>
                <View style={styles.matchRow}>
                  <TouchableOpacity
                    style={[
                      styles.playerSlot,
                      selected === m.player1.playerId && styles.playerSlotSelected,
                    ]}
                    activeOpacity={locked ? 1 : theme.activeOpacity}
                    onPress={() => selectWinner(m.matchIndex, m.player1.playerId)}
                    disabled={locked}
                  >
                    <PlayerAvatar name={m.player1.name} size={28} />
                    <View style={styles.playerInfo}>
                      <Text
                        style={[
                          styles.playerName,
                          selected === m.player1.playerId && styles.playerNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {m.player1.seed ? `[${m.player1.seed}] ` : ''}
                        {m.player1.name}
                      </Text>
                      <Text style={styles.playerRank}>
                        #{m.player1.ranking} {m.player1.country}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <Text style={styles.vs}>VS</Text>

                  <TouchableOpacity
                    style={[
                      styles.playerSlot,
                      selected === m.player2.playerId && styles.playerSlotSelected,
                    ]}
                    activeOpacity={locked ? 1 : theme.activeOpacity}
                    onPress={() => selectWinner(m.matchIndex, m.player2.playerId)}
                    disabled={locked}
                  >
                    <PlayerAvatar name={m.player2.name} size={28} />
                    <View style={styles.playerInfo}>
                      <Text
                        style={[
                          styles.playerName,
                          selected === m.player2.playerId && styles.playerNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {m.player2.seed ? `[${m.player2.seed}] ` : ''}
                        {m.player2.name}
                      </Text>
                      <Text style={styles.playerRank}>
                        #{m.player2.ranking} {m.player2.country}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Scoring Info */}
        <View style={styles.scoringCard}>
          <Text style={styles.scoringTitle}>Points per correct pick</Text>
          <Text style={styles.scoringValue}>
            {currentRoundName}: {PREDICTION_SCORING_128[currentRoundName]} pts each
          </Text>
        </View>

        {/* Champion Display (on final round) */}
        {isLastRound && isRoundComplete() && (
          <View style={styles.championBox}>
            <Text style={styles.championTitle}>🏆 Your Champion</Text>
            {(() => {
              const champId = (roundWinners['Final'] || [])[0];
              const champ = champId ? playerMap[champId] : null;
              if (!champ) return null;
              return (
                <View style={styles.championContent}>
                  <PlayerAvatar name={champ.name} size={48} />
                  <Text style={styles.championName}>{champ.name}</Text>
                  <Text style={styles.championCountry}>
                    {champ.country} · Seed {champ.seed || 'Unseeded'}
                  </Text>
                  <Text style={styles.championPts}>+{PREDICTION_SCORING_128.Champion} pts</Text>
                </View>
              );
            })()}
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.actions}>
          {!locked ? (
            <>
              <View style={styles.navRow}>
                {currentRound > 0 && (
                  <TouchableOpacity
                    style={styles.prevBtn}
                    activeOpacity={theme.activeOpacity}
                    onPress={handlePrevRound}
                  >
                    <Text style={styles.prevBtnText}>← Previous</Text>
                  </TouchableOpacity>
                )}

                {!isLastRound ? (
                  <TouchableOpacity
                    style={[
                      styles.nextBtn,
                      !isRoundComplete() && styles.nextBtnDisabled,
                    ]}
                    activeOpacity={theme.activeOpacity}
                    onPress={handleNextRound}
                    disabled={!isRoundComplete()}
                  >
                    <Text style={styles.nextBtnText}>
                      {isRoundComplete()
                        ? `Next: ${ROUND_NAMES[currentRound + 1]} →`
                        : `${completedCount}/${expectedMatches} picked`}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      !isRoundComplete() && styles.submitBtnDisabled,
                    ]}
                    activeOpacity={theme.activeOpacity}
                    onPress={handleSubmit}
                    disabled={!isRoundComplete()}
                  >
                    <Text style={styles.submitBtnText}>
                      {isRoundComplete() ? '🔒 Lock Prediction' : `${completedCount}/${expectedMatches} picked`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {Object.keys(roundWinners).length > 0 && (
                <TouchableOpacity
                  style={styles.resetBtn}
                  activeOpacity={theme.activeOpacity}
                  onPress={handleReset}
                >
                  <Text style={styles.resetBtnText}>Reset All</Text>
                </TouchableOpacity>
              )}
            </>
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
  progressBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    justifyContent: 'space-around',
  },
  progressDot: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  progressDotDone: {
    backgroundColor: theme.accent + '30',
  },
  progressDotCurrent: {
    backgroundColor: theme.accent + '50',
    borderWidth: 1,
    borderColor: theme.accent,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
  },
  progressLabelDone: {
    color: theme.accent,
  },
  progressLabelCurrent: {
    color: '#fff',
  },
  scroll: {
    padding: theme.spacing.padding,
    paddingBottom: 80,
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
    marginBottom: 16,
  },
  quarterTabs: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  quarterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  quarterTabActive: {
    borderColor: theme.accent,
    backgroundColor: theme.accent + '20',
  },
  quarterTabDone: {
    borderColor: theme.accent + '60',
  },
  quarterTabText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
  },
  quarterTabTextActive: {
    color: theme.accent,
  },
  quarterTabCount: {
    fontSize: 9,
    color: theme.textSecondary,
    marginTop: 2,
  },
  matchupList: {
    gap: 8,
  },
  matchCard: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  matchNumber: {
    fontSize: 9,
    color: theme.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerSlot: {
    flex: 1,
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
  playerInfo: {
    marginLeft: 8,
    flex: 1,
  },
  playerName: {
    fontSize: 12,
    fontWeight: theme.fontWeight.semibold,
    color: theme.text,
  },
  playerNameSelected: {
    color: theme.accent,
  },
  playerRank: {
    fontSize: 9,
    color: theme.textSecondary,
  },
  vs: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    color: theme.textSecondary,
    marginHorizontal: 6,
  },
  scoringCard: {
    marginTop: 16,
    backgroundColor: theme.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  scoringTitle: {
    fontSize: 10,
    color: theme.textSecondary,
    letterSpacing: 0.5,
  },
  scoringValue: {
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    color: theme.accent,
    marginTop: 4,
  },
  championBox: {
    marginTop: 16,
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.gold + '40',
  },
  championTitle: {
    fontSize: 16,
    fontWeight: theme.fontWeight.bold,
    color: theme.gold,
    marginBottom: 12,
  },
  championContent: {
    alignItems: 'center',
  },
  championName: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.gold,
    marginTop: 8,
  },
  championCountry: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  championPts: {
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    color: theme.accent,
    marginTop: 6,
  },
  actions: {
    marginTop: 24,
    gap: 10,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
  },
  prevBtn: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: theme.textSecondary,
  },
  nextBtn: {
    flex: 1,
    backgroundColor: theme.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: theme.fontWeight.semibold,
    color: '#fff',
  },
  submitBtn: {
    flex: 1,
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
