/**
 * Markov chain-based tennis win probability calculator.
 *
 * Models the probability of winning from any score state by recursively
 * computing point → game → set → match probabilities.
 */

export interface ScoreState {
  /** Sets won by each player [p1, p2] */
  sets: [number, number];
  /** Games won in current set [p1, p2] */
  games: [number, number];
  /** Points in current game: "0","15","30","40","AD" for each [p1, p2] */
  points: [string, string];
  /** Who is serving: 1 or 2 */
  serving: 1 | 2;
  /** Best of 3 or 5 */
  bestOf: 3 | 5;
  /** Serve win probability for player 1 (0-1) */
  p1ServeWinProb: number;
  /** Serve win probability for player 2 (0-1) */
  p2ServeWinProb: number;
  /** Whether current game is a tiebreak */
  isTiebreak?: boolean;
}

export interface WinProbResult {
  player1WinProb: number; // 0-100
  player2WinProb: number; // 0-100
}

// Memoization cache
const cache = new Map<string, number>();

function cacheKey(
  s1: number, s2: number,
  g1: number, g2: number,
  p1: number, p2: number,
  serving: number,
  bestOf: number,
  spw1: number, spw2: number,
  isTB: boolean
): string {
  return `${s1},${s2},${g1},${g2},${p1},${p2},${serving},${bestOf},${(spw1*1000)|0},${(spw2*1000)|0},${isTB?1:0}`;
}

const POINT_MAP: Record<string, number> = { '0': 0, '15': 1, '30': 2, '40': 3, 'AD': 4 };
const POINT_NAMES = ['0', '15', '30', '40', 'AD'];

/**
 * Calculate probability player 1 wins the match from current state.
 */
export function calculateWinProbability(state: ScoreState): WinProbResult {
  cache.clear();

  const p1Idx = POINT_MAP[state.points[0]] ?? 0;
  const p2Idx = POINT_MAP[state.points[1]] ?? 0;
  const isTB = state.isTiebreak ?? (state.games[0] === 6 && state.games[1] === 6);

  const prob = matchProb(
    state.sets[0], state.sets[1],
    state.games[0], state.games[1],
    p1Idx, p2Idx,
    state.serving,
    state.bestOf,
    state.p1ServeWinProb,
    state.p2ServeWinProb,
    isTB
  );

  return {
    player1WinProb: Math.round(prob * 10000) / 100,
    player2WinProb: Math.round((1 - prob) * 10000) / 100,
  };
}

/**
 * Probability p1 wins match from state (s1,s2) sets, (g1,g2) games, (p1,p2) points
 */
function matchProb(
  s1: number, s2: number,
  g1: number, g2: number,
  p1: number, p2: number,
  serving: number,
  bestOf: number,
  spw1: number, spw2: number,
  isTB: boolean
): number {
  const setsToWin = bestOf === 5 ? 3 : 2;

  // Terminal
  if (s1 >= setsToWin) return 1;
  if (s2 >= setsToWin) return 0;

  const key = cacheKey(s1, s2, g1, g2, p1, p2, serving, bestOf, spw1, spw2, isTB);
  if (cache.has(key)) return cache.get(key)!;

  // Point win prob for server
  const pServe = serving === 1 ? spw1 : spw2;
  // From p1 perspective: if p1 serves, winning point = pServe; if p2 serves, winning point = 1-spw2
  const pPointWin = serving === 1 ? pServe : (1 - spw2);

  let result: number;

  if (isTB) {
    result = tiebreakPointProb(s1, s2, g1, g2, p1, p2, serving, bestOf, spw1, spw2);
  } else {
    result = gamePointProb(s1, s2, g1, g2, p1, p2, serving, bestOf, spw1, spw2, pPointWin);
  }

  cache.set(key, result);
  return result;
}

/**
 * Regular game point progression
 */
function gamePointProb(
  s1: number, s2: number,
  g1: number, g2: number,
  p1: number, p2: number,
  serving: number,
  bestOf: number,
  spw1: number, spw2: number,
  pPointWin: number
): number {
  // Check if this point wins the game
  // p1 wins point
  const afterP1Win = advancePoint(p1, p2, true);
  // p2 wins point
  const afterP2Win = advancePoint(p1, p2, false);

  let probIfP1WinsPoint: number;
  let probIfP2WinsPoint: number;

  if (afterP1Win.gameWon === 1) {
    // p1 won this game
    probIfP1WinsPoint = afterGameWon(s1, s2, g1 + 1, g2, serving, bestOf, spw1, spw2);
  } else {
    probIfP1WinsPoint = matchProb(s1, s2, g1, g2, afterP1Win.p1, afterP1Win.p2, serving, bestOf, spw1, spw2, false);
  }

  if (afterP2Win.gameWon === 2) {
    // p2 won this game
    probIfP2WinsPoint = afterGameWon(s1, s2, g1, g2 + 1, serving, bestOf, spw1, spw2);
  } else {
    probIfP2WinsPoint = matchProb(s1, s2, g1, g2, afterP2Win.p1, afterP2Win.p2, serving, bestOf, spw1, spw2, false);
  }

  return pPointWin * probIfP1WinsPoint + (1 - pPointWin) * probIfP2WinsPoint;
}

/**
 * After a game is won, determine new set/match state
 */
function afterGameWon(
  s1: number, s2: number,
  g1: number, g2: number,
  serving: number,
  bestOf: number,
  spw1: number, spw2: number
): number {
  const setsToWin = bestOf === 5 ? 3 : 2;
  const newServing = serving === 1 ? 2 : 1;

  // Check if set is won
  if ((g1 >= 6 && g1 - g2 >= 2) || (g2 >= 6 && g2 - g1 >= 2)) {
    // Set won
    const newS1 = g1 > g2 ? s1 + 1 : s1;
    const newS2 = g2 > g1 ? s2 + 1 : s2;
    if (newS1 >= setsToWin) return 1;
    if (newS2 >= setsToWin) return 0;
    // New set starts 0-0
    return matchProb(newS1, newS2, 0, 0, 0, 0, newServing, bestOf, spw1, spw2, false);
  }

  // Check for tiebreak (6-6)
  if (g1 === 6 && g2 === 6) {
    // Tiebreak starts at 0-0 points
    return matchProb(s1, s2, 6, 6, 0, 0, newServing, bestOf, spw1, spw2, true);
  }

  // Normal next game
  return matchProb(s1, s2, g1, g2, 0, 0, newServing, bestOf, spw1, spw2, false);
}

/**
 * Advance point in a regular game
 */
function advancePoint(
  p1: number, p2: number, p1WinsPoint: boolean
): { p1: number; p2: number; gameWon: 0 | 1 | 2 } {
  if (p1WinsPoint) {
    if (p1 === 3 && p2 <= 2) return { p1: 0, p2: 0, gameWon: 1 }; // 40-0/15/30 → game
    if (p1 === 3 && p2 === 3) return { p1: 4, p2: 3, gameWon: 0 }; // Deuce → AD-40
    if (p1 === 4) return { p1: 0, p2: 0, gameWon: 1 }; // AD → game
    if (p1 === 3 && p2 === 4) return { p1: 3, p2: 3, gameWon: 0 }; // 40-AD → Deuce
    return { p1: p1 + 1, p2, gameWon: 0 };
  } else {
    if (p2 === 3 && p1 <= 2) return { p1: 0, p2: 0, gameWon: 2 };
    if (p2 === 3 && p1 === 3) return { p1: 3, p2: 4, gameWon: 0 };
    if (p2 === 4) return { p1: 0, p2: 0, gameWon: 2 };
    if (p2 === 3 && p1 === 4) return { p1: 3, p2: 3, gameWon: 0 };
    return { p1, p2: p2 + 1, gameWon: 0 };
  }
}

/**
 * Tiebreak point progression (first to 7, win by 2, alternating serve every 2 points after first)
 */
function tiebreakPointProb(
  s1: number, s2: number,
  g1: number, g2: number,
  p1: number, p2: number,
  serving: number,
  bestOf: number,
  spw1: number, spw2: number
): number {
  const setsToWin = bestOf === 5 ? 3 : 2;

  // Check tiebreak won
  if (p1 >= 7 && p1 - p2 >= 2) {
    const newS1 = s1 + 1;
    if (newS1 >= setsToWin) return 1;
    const newServing = serving === 1 ? 2 : 1;
    return matchProb(newS1, s2, 0, 0, 0, 0, newServing, bestOf, spw1, spw2, false);
  }
  if (p2 >= 7 && p2 - p1 >= 2) {
    const newS2 = s2 + 1;
    if (newS2 >= setsToWin) return 0;
    const newServing = serving === 1 ? 2 : 1;
    return matchProb(s1, newS2, 0, 0, 0, 0, newServing, bestOf, spw1, spw2, false);
  }

  // Determine who is serving in tiebreak
  // First point: initial server. Then alternates every 2 points.
  const totalPoints = p1 + p2;
  let tbServing: number;
  if (totalPoints === 0) {
    tbServing = serving as number;
  } else {
    // After first point, switch every 2 points
    const switches = Math.floor((totalPoints + 1) / 2);
    tbServing = switches % 2 === 0 ? (serving as number) : (serving === 1 ? 2 : 1);
  }

  const pPointWin = tbServing === 1 ? spw1 : (1 - spw2);

  // p1 wins point
  const probWinPoint = pPointWin * tiebreakAfterPoint(s1, s2, g1, g2, p1 + 1, p2, serving, bestOf, spw1, spw2);
  // p2 wins point
  const probLosePoint = (1 - pPointWin) * tiebreakAfterPoint(s1, s2, g1, g2, p1, p2 + 1, serving, bestOf, spw1, spw2);

  return probWinPoint + probLosePoint;
}

function tiebreakAfterPoint(
  s1: number, s2: number,
  g1: number, g2: number,
  p1: number, p2: number,
  serving: number,
  bestOf: number,
  spw1: number, spw2: number
): number {
  return matchProb(s1, s2, g1, g2, p1, p2, serving, bestOf, spw1, spw2, true);
}

// ─── Advanced Win Probability Model ────────────────────────────────────────

export type Surface = 'hard' | 'clay' | 'grass' | 'indoor';

export interface SurfaceRecord {
  hard?: { wins: number; losses: number };
  clay?: { wins: number; losses: number };
  grass?: { wins: number; losses: number };
  indoor?: { wins: number; losses: number };
}

export interface WeatherConditions {
  temperatureC?: number; // celsius
  windSpeedKmh?: number; // km/h
}

export interface AdvancedProbInput extends ScoreState {
  /** Court surface */
  surface?: Surface;
  /** Player surface win records */
  p1SurfaceRecord?: SurfaceRecord;
  p2SurfaceRecord?: SurfaceRecord;
  /** Weather */
  weather?: WeatherConditions;
  /** Player ages (years) */
  p1Age?: number;
  p2Age?: number;
  /** Recent form: wins in last 5 matches (0-5) */
  p1RecentFormWins?: number;
  p2RecentFormWins?: number;
  /** Head-to-head record */
  h2hP1Wins?: number;
  h2hP2Wins?: number;
  /** Current set number (1-indexed) for fatigue calc */
  currentSet?: number;
}

export interface AdvancedWinProbResult extends WinProbResult {
  factors: {
    surface: { p1: number; p2: number };
    weather: { p1: number; p2: number };
    form: { p1: number; p2: number };
    h2h: { p1: number; p2: number };
    fatigue: { p1: number; p2: number };
  };
  adjustedP1ServeWinProb: number;
  adjustedP2ServeWinProb: number;
}

/**
 * Surface factor: adjust serve win prob based on surface-specific win rate
 * vs overall win rate. Capped at ±3%.
 */
function computeSurfaceFactor(
  surface: Surface | undefined,
  surfaceRecord: SurfaceRecord | undefined
): number {
  if (!surface || !surfaceRecord) return 0;
  const rec = surfaceRecord[surface];
  if (!rec || (rec.wins + rec.losses) < 3) return 0;

  // Overall win rate across all surfaces
  let totalW = 0, totalL = 0;
  for (const s of Object.values(surfaceRecord)) {
    if (s) { totalW += s.wins; totalL += s.losses; }
  }
  if (totalW + totalL === 0) return 0;

  const overallRate = totalW / (totalW + totalL);
  const surfaceRate = rec.wins / (rec.wins + rec.losses);
  const diff = surfaceRate - overallRate;

  // Clamp to ±0.03
  return Math.max(-0.03, Math.min(0.03, diff));
}

/**
 * Weather factor:
 * - High temp (>30°C): penalize older player (age>30) by -1% to -2%
 * - Wind (>20 km/h): reduce serve win prob by -1% to -2%
 */
function computeWeatherFactor(
  weather: WeatherConditions | undefined,
  age: number | undefined
): number {
  if (!weather) return 0;
  let adj = 0;

  // Heat penalty for older players
  if (weather.temperatureC && weather.temperatureC > 30 && age && age > 30) {
    const heatExcess = Math.min(weather.temperatureC - 30, 10); // 0-10
    const agePenalty = Math.min((age - 30) / 10, 1); // 0-1
    adj -= (heatExcess / 10) * 0.02 * agePenalty; // up to -2%
  }

  // Wind reduces serve effectiveness
  if (weather.windSpeedKmh && weather.windSpeedKmh > 20) {
    const windExcess = Math.min(weather.windSpeedKmh - 20, 30); // 0-30
    adj -= (windExcess / 30) * 0.02; // up to -2%
  }

  return adj;
}

/**
 * Form factor: recent 5-match win rate adjusts by ±5% max.
 * Baseline: 3/5 = 60% (neutral). Above/below shifts probability.
 */
function computeFormFactor(recentWins: number | undefined): number {
  if (recentWins === undefined) return 0;
  const wins = Math.max(0, Math.min(5, recentWins));
  // 3 wins = neutral, 5 wins = +0.05, 0 wins = -0.05
  return ((wins - 2.5) / 2.5) * 0.05;
}

/**
 * H2H factor: if total meetings > 5, weight by 5% toward the dominant player.
 */
function computeH2hFactor(
  myWins: number | undefined,
  oppWins: number | undefined
): number {
  if (myWins === undefined || oppWins === undefined) return 0;
  const total = myWins + oppWins;
  if (total <= 5) return 0;
  const myRate = myWins / total;
  // 0.5 = neutral → 0 adjustment, 1.0 = +0.05, 0.0 = -0.05
  return (myRate - 0.5) * 0.10; // ±5% max when fully dominant
}

/**
 * Fatigue factor: from set 4 onwards, older players (>30) lose serve efficiency.
 * -1% per set beyond 3 for older player, capped at -3%.
 */
function computeFatigueFactor(
  currentSet: number | undefined,
  age: number | undefined
): number {
  if (!currentSet || currentSet <= 3) return 0;
  if (!age || age <= 30) return 0;
  const setsOver3 = currentSet - 3; // 1-2 typically
  const agePenalty = Math.min((age - 30) / 8, 1); // 0-1
  return -Math.min(setsOver3 * 0.01 * agePenalty, 0.03);
}

/**
 * Calculate advanced win probability with environmental and contextual factors.
 * Original Markov chain model is untouched; this adjusts serve win probabilities
 * before feeding them into the base model.
 */
export function calculateAdvancedProbability(
  input: AdvancedProbInput
): AdvancedWinProbResult {
  // Compute individual factors for P1
  const surfP1 = computeSurfaceFactor(input.surface, input.p1SurfaceRecord);
  const surfP2 = computeSurfaceFactor(input.surface, input.p2SurfaceRecord);
  const weatherP1 = computeWeatherFactor(input.weather, input.p1Age);
  const weatherP2 = computeWeatherFactor(input.weather, input.p2Age);
  const formP1 = computeFormFactor(input.p1RecentFormWins);
  const formP2 = computeFormFactor(input.p2RecentFormWins);
  const h2hP1 = computeH2hFactor(input.h2hP1Wins, input.h2hP2Wins);
  const h2hP2 = computeH2hFactor(input.h2hP2Wins, input.h2hP1Wins);
  const fatigueP1 = computeFatigueFactor(input.currentSet, input.p1Age);
  const fatigueP2 = computeFatigueFactor(input.currentSet, input.p2Age);

  // Adjust serve win probs
  const totalAdjP1 = surfP1 + weatherP1 + formP1 + h2hP1 + fatigueP1;
  const totalAdjP2 = surfP2 + weatherP2 + formP2 + h2hP2 + fatigueP2;

  const adjustedP1 = Math.max(0.30, Math.min(0.85, input.p1ServeWinProb + totalAdjP1));
  const adjustedP2 = Math.max(0.30, Math.min(0.85, input.p2ServeWinProb + totalAdjP2));

  // Run base Markov model with adjusted probs
  const baseResult = calculateWinProbability({
    ...input,
    p1ServeWinProb: adjustedP1,
    p2ServeWinProb: adjustedP2,
  });

  // Format factors as percentages (rounded to 1 decimal)
  const pct = (v: number) => Math.round(v * 1000) / 10;

  return {
    ...baseResult,
    factors: {
      surface: { p1: pct(surfP1), p2: pct(surfP2) },
      weather: { p1: pct(weatherP1), p2: pct(weatherP2) },
      form: { p1: pct(formP1), p2: pct(formP2) },
      h2h: { p1: pct(h2hP1), p2: pct(h2hP2) },
      fatigue: { p1: pct(fatigueP1), p2: pct(fatigueP2) },
    },
    adjustedP1ServeWinProb: adjustedP1,
    adjustedP2ServeWinProb: adjustedP2,
  };
}
