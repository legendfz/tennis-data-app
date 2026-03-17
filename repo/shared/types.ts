export interface Player {
  id: number;
  name: string;
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

export interface PlayerDetail extends Player {
  recentMatches: MatchWithPlayers[];
  stats: {
    winLoss: string;
    titlesThisYear: number;
    bestResult: string;
  };
}
