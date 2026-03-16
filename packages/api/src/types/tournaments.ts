/**
 * Tournament types — mirrors TennisApi1 response shapes
 */

export interface TournamentCategory {
  id: number;
  name: string;
  slug?: string;
  sport?: { id: number; name: string; slug: string };
  country?: { alpha2: string; name: string };
  flag?: string;
}

export interface UniqueTournament {
  id: number;
  name: string;
  slug?: string;
  category?: TournamentCategory;
  userCount?: number;
  hasStandings?: boolean;
  hasGroups?: boolean;
  hasRounds?: boolean;
  displayInverseHomeAwayTeams?: boolean;
}

export interface TournamentSeason {
  id: number;
  name: string;
  year: string;
  slug?: string;
  tournamentId?: number;
}

export interface TournamentInfo {
  id: number;
  name: string;
  slug?: string;
  category?: TournamentCategory;
  uniqueTournament?: UniqueTournament;
  surface?: string;
  groundType?: string;
  city?: string;
  country?: { alpha2: string; name: string };
  prizeMoneyDescription?: string;
  startDateTimestamp?: number;
  endDateTimestamp?: number;
}

export interface DrawEntry {
  homeTeam?: import('./players.js').TennisPlayer;
  awayTeam?: import('./players.js').TennisPlayer;
  homeScore?: import('./events.js').Score;
  awayScore?: import('./events.js').Score;
  winnerCode?: 1 | 2;
  id?: number;
  roundInfo?: { round: number; name?: string };
  status?: import('./events.js').EventStatus;
}

export interface TournamentDraw {
  cupTrees?: Array<{
    id: number;
    name: string;
    blocks: Array<{
      id: number;
      events: DrawEntry[];
    }>;
  }>;
}

export interface TournamentSearchResult {
  id: number;
  name: string;
  slug?: string;
  category?: TournamentCategory;
  type?: 'tournament' | 'uniqueTournament';
}
