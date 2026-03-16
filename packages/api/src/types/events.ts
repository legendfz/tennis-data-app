/**
 * Match / Event types — mirrors TennisApi1 response shapes
 */

export interface Score {
  current?: number;
  display?: number;
  period1?: number;
  period2?: number;
  period3?: number;
  period4?: number;
  period5?: number;
  normaltime?: number;
}

export interface TeamInfo {
  id: number;
  name: string;
  slug?: string;
  shortName?: string;
  country?: {
    alpha2?: string;
    alpha3?: string;
    name?: string;
  };
  sport?: { name: string; slug: string; id: number };
  playerTeamInfo?: {
    ranking?: number;
    seed?: number;
  };
}

export interface TournamentRef {
  id: number;
  name: string;
  slug?: string;
  category?: {
    id: number;
    name: string;
    slug?: string;
    sport?: { id: number; name: string; slug: string };
  };
  uniqueTournament?: {
    id: number;
    name: string;
    slug?: string;
  };
}

export interface EventStatus {
  code: number;
  description: string;
  type: 'inprogress' | 'finished' | 'notstarted' | 'canceled' | 'postponed';
}

export type CourtSurface = 'Hard' | 'Clay' | 'Grass' | 'Carpet' | 'Indoor Hard' | 'Indoor Clay';

export interface TennisEvent {
  id: number;
  slug?: string;
  customId?: string;
  status: EventStatus;
  winnerCode?: 1 | 2;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeScore: Score;
  awayScore: Score;
  tournament: TournamentRef;
  season?: { id: number; name: string; year: string; slug?: string };
  roundInfo?: { round: number; name?: string; cupRoundType?: number };
  startTimestamp?: number;
  venue?: { id: number; city?: { name: string }; stadium?: { name: string } };
  note?: string;
  gameState?: {
    serving?: 1 | 2;
    gameScore?: { home: string; away: string };
    tieBreak?: boolean;
  };
}

export interface MatchStatistics {
  periods: {
    period: 'ALL' | string;
    groups: Array<{
      groupName: string;
      statisticsItems: Array<{
        name: string;
        home: string | number;
        away: string | number;
        homeValue?: number;
        awayValue?: number;
        compareCode?: number;
        homeTotal?: number;
        awayTotal?: number;
      }>;
    }>;
  }[];
}

export interface H2HEvent extends TennisEvent {
  // same shape as TennisEvent; bundled in h2h response
}

export interface HeadToHead {
  teamDuel?: {
    homeWins: number;
    awayWins: number;
    draws: number;
  };
  events?: H2HEvent[];
  previousEvent?: TennisEvent;
}

export interface PointByPoint {
  pointByPoint?: {
    periods: Array<{
      period: number;
      home: number;
      away: number;
      gameScores: Array<{
        home: string;
        away: string;
        point: string;
        scoring: 1 | 2;
        isSetPoint?: boolean;
        isMatchPoint?: boolean;
        isTiebreak?: boolean;
      }>;
    }>;
  };
}

export interface EventsByDateParams {
  day: number;
  month: number;
  year: number;
}
