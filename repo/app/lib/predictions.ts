import AsyncStorage from '@react-native-async-storage/async-storage';

export const PREDICTION_SCORING = {
  qf: 8,       // Correct QF winner prediction
  sf: 16,      // Correct SF winner prediction
  final: 32,   // Correct finalist prediction
  champion: 64, // Correct champion prediction
};

export interface BracketPrediction {
  tournamentId: number;
  qf: number[];       // 4 QF winner playerIds
  sf: number[];       // 2 SF winner playerIds
  final: number[];    // 1 finalist (winner side)
  champion: number;   // champion playerId
  locked: boolean;
  totalPoints: number;
}

const PREDICTIONS_KEY = '@tennishq_predictions';

async function getAllPredictions(): Promise<Record<string, BracketPrediction>> {
  const data = await AsyncStorage.getItem(PREDICTIONS_KEY);
  if (!data) return {};
  return JSON.parse(data);
}

export async function savePrediction(tournamentId: number, prediction: BracketPrediction): Promise<void> {
  const all = await getAllPredictions();
  all[String(tournamentId)] = prediction;
  await AsyncStorage.setItem(PREDICTIONS_KEY, JSON.stringify(all));
}

export async function loadPrediction(tournamentId: number): Promise<BracketPrediction | null> {
  const all = await getAllPredictions();
  return all[String(tournamentId)] || null;
}

export async function clearPrediction(tournamentId: number): Promise<void> {
  const all = await getAllPredictions();
  delete all[String(tournamentId)];
  await AsyncStorage.setItem(PREDICTIONS_KEY, JSON.stringify(all));
}
