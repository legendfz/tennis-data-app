import AsyncStorage from '@react-native-async-storage/async-storage';

// Bracket Prediction scoring (re-exported from predictions.ts for convenience)
export { PREDICTION_SCORING } from './predictions';

export const SCORING_RULES = {
  matchWin: 10,
  straightSetsBonus: 5,
  fullSetsBonus: 3,
  ace: 1,
  breakPointWon: 3,
  breakPointLost: -2,
  grandSlamTitle: 50,
  mastersTitle: 30,
  firstRoundExit: -5,
};

export const SCORING_DESCRIPTIONS: Record<string, string> = {
  matchWin: 'Win a match',
  straightSetsBonus: 'Win in straight sets',
  fullSetsBonus: 'Win a match that goes to final set',
  ace: 'Each ace served',
  breakPointWon: 'Break point converted',
  breakPointLost: 'Break point lost on serve',
  grandSlamTitle: 'Win a Grand Slam title',
  mastersTitle: 'Win a Masters 1000 title',
  firstRoundExit: 'First round exit',
};

export const BUDGET_TOTAL = 50_000_000;

export function getPlayerValue(ranking: number): number {
  if (ranking <= 5) return 15_000_000;
  if (ranking <= 10) return 12_000_000;
  if (ranking <= 20) return 10_000_000;
  if (ranking <= 50) return 7_000_000;
  return 5_000_000;
}

export function formatValue(value: number): string {
  return '$' + (value / 1_000_000) + 'M';
}

export interface FantasyTeam {
  teamName: string;
  players: number[];
  budget: number;
  spent: number;
  tournamentId: number;
  totalPoints: number;
  createdAt: string;
}

const FANTASY_TEAM_KEY = '@tennishq_fantasy_team';

export async function saveFantasyTeam(team: FantasyTeam): Promise<void> {
  await AsyncStorage.setItem(FANTASY_TEAM_KEY, JSON.stringify(team));
}

export async function loadFantasyTeam(): Promise<FantasyTeam | null> {
  const data = await AsyncStorage.getItem(FANTASY_TEAM_KEY);
  if (!data) return null;
  return JSON.parse(data) as FantasyTeam;
}

export async function clearFantasyTeam(): Promise<void> {
  await AsyncStorage.removeItem(FANTASY_TEAM_KEY);
}
