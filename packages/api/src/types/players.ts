/**
 * Player types — mirrors TennisApi1 response shapes
 */

export interface PlayerCountry {
  alpha2: string;
  alpha3?: string;
  name: string;
}

export interface PlayerSport {
  id: number;
  name: string;
  slug: string;
}

export interface TennisPlayer {
  id: number;
  name: string;
  slug?: string;
  shortName?: string;
  country?: PlayerCountry;
  sport?: PlayerSport;
  position?: string;
  // Tennis-specific fields
  ranking?: number;
  rankingPoints?: number;
  age?: number;
  height?: number;         // cm
  weight?: number;         // kg
  turned_pro?: number;     // year
  plays?: 'Right-Handed' | 'Left-Handed' | 'Right-handed' | 'Left-handed';
  backhand?: string;
  birthDateTimestamp?: number;
  gender?: 'M' | 'F';
}

export interface PlayerRankingEntry {
  ranking: number;
  points: number;
  team: TennisPlayer;
  rowName?: string;
}

export interface PlayerMatchesPage {
  events: import('./events.js').TennisEvent[];
  hasNextPage?: boolean;
}

export interface PlayerSearchResult {
  id: number;
  name: string;
  slug?: string;
  shortName?: string;
  country?: PlayerCountry;
  sport?: PlayerSport;
  team?: TennisPlayer;
  type?: 'player' | 'team';
}
