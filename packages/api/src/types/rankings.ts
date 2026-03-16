/**
 * Rankings types — mirrors TennisApi1 response shapes
 */

import type { TennisPlayer } from './players.js';

export type RankingType = 'atp' | 'wta';

export interface RankingEntry {
  ranking: number;
  points: number;
  team: TennisPlayer;
  rowName?: string;
  previousRanking?: number;
  rankingPoints?: number;
  tournamentsBestOf?: number;
}

export interface RankingsPage {
  rankings: RankingEntry[];
  type?: RankingType;
}
