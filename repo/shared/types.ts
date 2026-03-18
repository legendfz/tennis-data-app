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
  recentFormRecord?: {
    last5: ('W' | 'L')[];
    wins: number;
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
  surface: string;
  round: string;
  score: string;
  winnerId: number;
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
