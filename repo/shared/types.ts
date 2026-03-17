export interface Player {
  id: number;
  name: string;
  country: string;
  photoUrl: string | null;
  ranking: number;
  birthdate: string;
  height: number;
  weight: number;
  plays: string;
  backhand: string;
  turnedPro: number;
}

export interface Tournament {
  id: number;
  name: string;
  surface: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
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
  statsJson: Record<string, any> | null;
}

export interface TournamentDraw {
  id: number;
  tournamentId: number;
  year: number;
  round: string;
  position: number;
  playerId: number;
  seed: number | null;
}
