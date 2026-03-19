import AsyncStorage from '@react-native-async-storage/async-storage';

// Legacy scoring (kept for backward compat)
export const PREDICTION_SCORING = {
  qf: 8,
  sf: 16,
  final: 32,
  champion: 64,
};

// New 128-draw scoring
export const PREDICTION_SCORING_128: Record<string, number> = {
  R128: 1,
  R64: 2,
  R32: 4,
  R16: 8,
  QF: 16,
  SF: 32,
  Final: 64,
  Champion: 128,
};

export const ROUND_NAMES = ['R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'Final'];
export const ROUND_MATCH_COUNTS: Record<string, number> = {
  R128: 64,
  R64: 32,
  R32: 16,
  R16: 8,
  QF: 4,
  SF: 2,
  Final: 1,
};

// Legacy
export interface BracketPrediction {
  tournamentId: number;
  qf: number[];
  sf: number[];
  final: number[];
  champion: number;
  locked: boolean;
  totalPoints: number;
}

// New 128-draw prediction
export interface BracketPrediction128 {
  tournamentId: number;
  version: 128;
  // Winners per round keyed by round name, array of playerIds
  rounds: Record<string, number[]>;
  champion: number | null;
  locked: boolean;
  totalPoints: number;
  currentRound: number; // index into ROUND_NAMES
}

const PREDICTIONS_KEY = '@tennishq_predictions';
const PREDICTIONS_128_KEY = '@tennishq_predictions_128';

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

// 128-draw prediction storage
async function getAllPredictions128(): Promise<Record<string, BracketPrediction128>> {
  const data = await AsyncStorage.getItem(PREDICTIONS_128_KEY);
  if (!data) return {};
  return JSON.parse(data);
}

export async function savePrediction128(tournamentId: number, prediction: BracketPrediction128): Promise<void> {
  const all = await getAllPredictions128();
  all[String(tournamentId)] = prediction;
  await AsyncStorage.setItem(PREDICTIONS_128_KEY, JSON.stringify(all));
}

export async function loadPrediction128(tournamentId: number): Promise<BracketPrediction128 | null> {
  const all = await getAllPredictions128();
  return all[String(tournamentId)] || null;
}

export async function clearPrediction128(tournamentId: number): Promise<void> {
  const all = await getAllPredictions128();
  delete all[String(tournamentId)];
  await AsyncStorage.setItem(PREDICTIONS_128_KEY, JSON.stringify(all));
}
