export interface TitleEntry {
  year: number;
  tournament: string;
  surface: string;
  final_opponent: string;
  score: string;
  round?: string;
  tournamentId?: number;
}

export interface GrandSlamEntry {
  year: number;
  tournament: string;
  opponent: string;
  score: string;
  round?: string;
  tournamentId?: number;
}

export interface SeasonMatchEntry {
  date: string;
  tournament: string;
  opponent: string;
  result: 'W' | 'L';
  score: string;
  round?: string;
  matchId?: number;
  tournamentId?: number;
}

export interface DecidingSetMatchEntry {
  date: string;
  tournament: string;
  opponent: string;
  result: 'W' | 'L';
  score: string;
  decidingSetScore: string;
  round?: string;
  matchId?: number;
  tournamentId?: number;
}

export interface WinRateByYear {
  year: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface SetStatEntry {
  wins: number;
  total: number;
  winRate: number;
}

export interface SetStats {
  straightSets: SetStatEntry;
  threeSets: SetStatEntry;
  fourSets: SetStatEntry;
  fiveSets: SetStatEntry;
  decidingSet: SetStatEntry;
}

export interface Player {
  id: number;
  name: string;
  nameLocalized?: Record<string, string>;
  country: string;
  countryFlag: string;
  photoUrl: string | null;
  ranking: number;
  birthdate: string;
  height: number;
  weight: number;
  plays: string;
  backhand: string;
  turnedPro: number;
  titles: number;
  grandSlams: number;
  careerHigh: number;
  prizeMoney: string;
  birthplace?: string;
  coach?: string;
  recentForm?: string;
  rankingHistory?: { month: string; ranking: number }[];
  record?: {
    career: { wins: number; losses: number };
    season: { wins: number; losses: number };
    bySurface: {
      hard: { wins: number; losses: number };
      clay: { wins: number; losses: number };
      grass: { wins: number; losses: number };
    };
  };
  surfaceRecord?: {
    hard?: { winRate: number; matches: number };
    clay?: { winRate: number; matches: number };
    grass?: { winRate: number; matches: number };
    indoor?: { winRate: number; matches: number };
  };
  setStats?: SetStats;
  recentFormRecord?: {
    last5: ('W' | 'L')[];
    wins: number;
  };
  titlesList?: TitleEntry[];
  grandSlamsList?: GrandSlamEntry[];
  seasonMatches?: SeasonMatchEntry[];
  decidingSetMatches?: DecidingSetMatchEntry[];
  winRateByYear?: WinRateByYear[];
  tags?: string[];
  equipment?: {
    apparel?: { brand: string; from: number; to: number | null }[];
    shoes?: { brand: string; from: number; to: number | null }[];
    racket?: { brand: string; model: string };
    watch?: string | null;
    otherSponsors?: string[];
  };
}

export interface Tournament {
  id: number;
  name: string;
  surface: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  year: number;
  drawSize: number;
  logoUrl?: string | null;
  abbreviation?: string;
  color?: string;
  textColor?: string;
  points?: number;
}

export interface Match {
  id: number;
  tournamentId: number;
  player1Id: number;
  player2Id: number;
  score: string;
  winnerId: number;
  round: string;
  date: string;
  court?: string;
  statsJson?: Record<string, any> | null;
}

export interface MatchWithPlayers extends Match {
  player1: Player;
  player2: Player;
  winner: Player;
  tournament: Tournament;
}

export interface DrawRoundMatch {
  player1Id: number;
  player2Id: number;
  winnerId: number;
  score: string;
  seed1: number | null;
  seed2: number | null;
}

export interface DrawRound {
  round: string;
  matches: DrawRoundMatch[];
}

export interface TournamentDraw {
  tournamentId: number;
  year: number;
  name: string;
  rounds: DrawRound[];
}

export interface WinLossBySurface {
  surface: string;
  wins: number;
  losses: number;
}

export interface H2HPlayerComparison {
  id: number;
  name: string;
  nameLocalized?: Record<string, string>;
  country: string;
  countryFlag: string;
  photoUrl: string | null;
  ranking: number;
  age: number;
  height: number;
  grandSlams: number;
  seasonWinRate: string;
}

export interface H2HMatchRecord {
  date: string;
  tournament: string;
  tournamentId: number;
  surface: string;
  round: string;
  score: string;
  winnerId: number;
  matchId: number | null;
}

export interface H2HSurfaceRecord {
  p1Wins: number;
  p2Wins: number;
}

export interface H2HData {
  summary: {
    player1Wins: number;
    player2Wins: number;
    totalMatches: number;
  };
  bySurface: Record<string, H2HSurfaceRecord>;
  matchHistory: H2HMatchRecord[];
  playerComparison: {
    player1: H2HPlayerComparison;
    player2: H2HPlayerComparison;
  };
}

export interface ProbabilitySnapshot {
  label: string;
  score: string;
  p1: number;
  p2: number;
}

export interface PlayerDetail extends Player {
  recentMatches: MatchWithPlayers[];
  stats: {
    winLoss: string;
    titlesThisYear: number;
    bestResult: string;
    seasonWinLoss: string;
    winLossBySurface: WinLossBySurface[];
  };
}
