import { Router, Request, Response } from 'express';
import { mockPlayers } from '../mock-data';

const router = Router();

// Player value tiers based on ranking
function getPlayerValue(ranking: number): number {
  if (ranking <= 5) return 15_000_000;
  if (ranking <= 10) return 12_000_000;
  if (ranking <= 20) return 10_000_000;
  if (ranking <= 50) return 7_000_000;
  return 5_000_000;
}

// GET /api/fantasy/tournaments — Active fantasy tournaments
router.get('/tournaments', (_req: Request, res: Response) => {
  res.json({
    data: [
      {
        id: 1,
        name: 'Australian Open 2025 Fantasy',
        status: 'active',
        startDate: '2025-01-13',
        endDate: '2025-01-26',
        surface: 'Hard',
        totalParticipants: 1247,
        prizeDescription: 'Bragging rights & leaderboard glory',
      },
      {
        id: 2,
        name: 'Roland Garros 2025 Fantasy',
        status: 'upcoming',
        startDate: '2025-05-25',
        endDate: '2025-06-08',
        surface: 'Clay',
        totalParticipants: 0,
        prizeDescription: 'Coming soon',
      },
    ],
  });
});

// GET /api/fantasy/leaderboard — Mock leaderboard
router.get('/leaderboard', (_req: Request, res: Response) => {
  const leaderboard = [
    { rank: 1, username: 'TennisKing', teamName: 'Grand Slam Squad', points: 342 },
    { rank: 2, username: 'AceHunter', teamName: 'Serve & Volley', points: 318 },
    { rank: 3, username: 'ClayMaster', teamName: 'Red Dirt Army', points: 295 },
    { rank: 4, username: 'NetRusher', teamName: 'Volley Kings', points: 278 },
    { rank: 5, username: 'BaselineB', teamName: 'Baseline Beasts', points: 264 },
    { rank: 6, username: 'TopSpinT', teamName: 'Spin Doctors', points: 251 },
    { rank: 7, username: 'DropShot', teamName: 'Touch Masters', points: 239 },
    { rank: 8, username: 'You', teamName: 'My Dream Team', points: 225, isCurrentUser: true },
    { rank: 9, username: 'BackhandW', teamName: 'Two-Handers', points: 212 },
    { rank: 10, username: 'ServeBot', teamName: 'Big Servers', points: 198 },
    { rank: 11, username: 'CourtKing', teamName: 'Court Conquerors', points: 185 },
    { rank: 12, username: 'RallyPro', teamName: 'Rally Masters', points: 172 },
    { rank: 13, username: 'MatchPt', teamName: 'Match Pointers', points: 158 },
    { rank: 14, username: 'GrassLover', teamName: 'Grass Gods', points: 142 },
    { rank: 15, username: 'Deuce40', teamName: 'Deuce Squad', points: 128 },
  ];

  res.json({ data: leaderboard });
});

// GET /api/fantasy/player-values — Player values based on ranking
router.get('/player-values', (_req: Request, res: Response) => {
  const playerValues = mockPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    ranking: p.ranking,
    country: p.country,
    value: getPlayerValue(p.ranking),
    valueTier:
      p.ranking <= 5
        ? 'elite'
        : p.ranking <= 10
        ? 'premium'
        : p.ranking <= 20
        ? 'high'
        : p.ranking <= 50
        ? 'mid'
        : 'value',
  }));

  res.json({
    data: playerValues,
    budget: 50_000_000,
    maxPlayers: 5,
    tiers: [
      { range: '1-5', value: 15_000_000, label: 'Elite' },
      { range: '6-10', value: 12_000_000, label: 'Premium' },
      { range: '11-20', value: 10_000_000, label: 'High' },
      { range: '21-50', value: 7_000_000, label: 'Mid' },
      { range: '51-100', value: 5_000_000, label: 'Value' },
    ],
  });
});

// =============================================
// BRACKET PREDICTION APIs
// =============================================

// Grand Slam QF brackets with real players (8 seeds each)
const PREDICTION_TOURNAMENTS = [
  {
    id: 101,
    name: 'Australian Open 2025',
    status: 'completed' as const,
    surface: 'Hard',
    emoji: '🇦🇺',
    startDate: '2025-01-13',
    endDate: '2025-01-26',
  },
  {
    id: 102,
    name: 'Roland Garros 2025',
    status: 'in_progress' as const,
    surface: 'Clay',
    emoji: '🇫🇷',
    startDate: '2025-05-25',
    endDate: '2025-06-08',
  },
  {
    id: 103,
    name: 'Wimbledon 2025',
    status: 'open' as const,
    surface: 'Grass',
    emoji: '🇬🇧',
    startDate: '2025-06-30',
    endDate: '2025-07-13',
  },
  {
    id: 104,
    name: 'US Open 2025',
    status: 'open' as const,
    surface: 'Hard',
    emoji: '🇺🇸',
    startDate: '2025-08-25',
    endDate: '2025-09-07',
  },
];

// QF Brackets: 8 players per tournament, 4 matchups
const BRACKETS: Record<number, {
  players: { id: number; name: string; ranking: number; country: string; seed: number }[];
  matchups: { top: number; bottom: number }[];
}> = {
  101: {
    players: [
      { id: 1, name: 'Jannik Sinner', ranking: 1, country: 'ITA', seed: 1 },
      { id: 9, name: 'Alex de Minaur', ranking: 9, country: 'AUS', seed: 8 },
      { id: 2, name: 'Novak Djokovic', ranking: 2, country: 'SRB', seed: 2 },
      { id: 3, name: 'Carlos Alcaraz', ranking: 3, country: 'ESP', seed: 3 },
      { id: 4, name: 'Alexander Zverev', ranking: 4, country: 'GER', seed: 4 },
      { id: 13, name: 'Tommy Paul', ranking: 13, country: 'USA', seed: 12 },
      { id: 14, name: 'Ben Shelton', ranking: 14, country: 'USA', seed: 14 },
      { id: 5, name: 'Daniil Medvedev', ranking: 5, country: 'RUS', seed: 5 },
    ],
    matchups: [
      { top: 1, bottom: 9 },   // Sinner vs de Minaur
      { top: 2, bottom: 3 },   // Djokovic vs Alcaraz
      { top: 4, bottom: 13 },  // Zverev vs Paul
      { top: 14, bottom: 5 },  // Shelton vs Medvedev
    ],
  },
  102: {
    players: [
      { id: 1, name: 'Jannik Sinner', ranking: 1, country: 'ITA', seed: 1 },
      { id: 11, name: 'Stefanos Tsitsipas', ranking: 11, country: 'GRE', seed: 9 },
      { id: 3, name: 'Carlos Alcaraz', ranking: 3, country: 'ESP', seed: 3 },
      { id: 8, name: 'Casper Ruud', ranking: 8, country: 'NOR', seed: 7 },
      { id: 4, name: 'Alexander Zverev', ranking: 4, country: 'GER', seed: 4 },
      { id: 6, name: 'Andrey Rublev', ranking: 6, country: 'RUS', seed: 6 },
      { id: 2, name: 'Novak Djokovic', ranking: 2, country: 'SRB', seed: 2 },
      { id: 5, name: 'Daniil Medvedev', ranking: 5, country: 'RUS', seed: 5 },
    ],
    matchups: [
      { top: 1, bottom: 11 },  // Sinner vs Tsitsipas
      { top: 3, bottom: 8 },   // Alcaraz vs Ruud
      { top: 4, bottom: 6 },   // Zverev vs Rublev
      { top: 2, bottom: 5 },   // Djokovic vs Medvedev
    ],
  },
  103: {
    players: [
      { id: 1, name: 'Jannik Sinner', ranking: 1, country: 'ITA', seed: 1 },
      { id: 10, name: 'Grigor Dimitrov', ranking: 10, country: 'BUL', seed: 10 },
      { id: 3, name: 'Carlos Alcaraz', ranking: 3, country: 'ESP', seed: 3 },
      { id: 5, name: 'Daniil Medvedev', ranking: 5, country: 'RUS', seed: 5 },
      { id: 2, name: 'Novak Djokovic', ranking: 2, country: 'SRB', seed: 2 },
      { id: 12, name: 'Taylor Fritz', ranking: 12, country: 'USA', seed: 12 },
      { id: 4, name: 'Alexander Zverev', ranking: 4, country: 'GER', seed: 4 },
      { id: 7, name: 'Hubert Hurkacz', ranking: 7, country: 'POL', seed: 7 },
    ],
    matchups: [
      { top: 1, bottom: 10 },
      { top: 3, bottom: 5 },
      { top: 2, bottom: 12 },
      { top: 4, bottom: 7 },
    ],
  },
  104: {
    players: [
      { id: 1, name: 'Jannik Sinner', ranking: 1, country: 'ITA', seed: 1 },
      { id: 5, name: 'Daniil Medvedev', ranking: 5, country: 'RUS', seed: 5 },
      { id: 3, name: 'Carlos Alcaraz', ranking: 3, country: 'ESP', seed: 3 },
      { id: 12, name: 'Taylor Fritz', ranking: 12, country: 'USA', seed: 12 },
      { id: 4, name: 'Alexander Zverev', ranking: 4, country: 'GER', seed: 4 },
      { id: 14, name: 'Ben Shelton', ranking: 14, country: 'USA', seed: 13 },
      { id: 2, name: 'Novak Djokovic', ranking: 2, country: 'SRB', seed: 2 },
      { id: 15, name: 'Holger Rune', ranking: 15, country: 'DEN', seed: 15 },
    ],
    matchups: [
      { top: 1, bottom: 5 },
      { top: 3, bottom: 12 },
      { top: 4, bottom: 14 },
      { top: 2, bottom: 15 },
    ],
  },
};

// "Correct answers" — actual tournament results
const RESULTS: Record<number, {
  qf: number[];     // 4 QF winners
  sf: number[];     // 2 SF winners
  final: number[];  // 1 finalist (the winner)
  champion: number;
}> = {
  101: {
    qf: [1, 2, 4, 14],       // Sinner, Djokovic, Zverev, Shelton
    sf: [1, 4],               // Sinner, Zverev
    final: [1],               // Sinner
    champion: 1,              // Sinner wins AO 2025
  },
  102: {
    qf: [1, 3, 4, 2],        // Sinner, Alcaraz, Zverev, Djokovic
    sf: [3, 4],               // Alcaraz, Zverev
    final: [3],               // Alcaraz
    champion: 3,              // Alcaraz wins RG 2025
  },
  103: {
    qf: [1, 3, 2, 4],        // Sinner, Alcaraz, Djokovic, Zverev
    sf: [3, 2],               // Alcaraz, Djokovic
    final: [3],               // Alcaraz
    champion: 3,              // Alcaraz wins Wimbledon 2025
  },
  104: {
    qf: [1, 3, 4, 2],        // Sinner, Alcaraz, Zverev, Djokovic
    sf: [1, 2],               // Sinner, Djokovic
    final: [1],               // Sinner
    champion: 1,              // Sinner wins USO 2025
  },
};

// GET /api/fantasy/predictions/tournaments
router.get('/predictions/tournaments', (_req: Request, res: Response) => {
  res.json({ data: PREDICTION_TOURNAMENTS });
});

// GET /api/fantasy/predictions/:tournamentId/bracket
router.get('/predictions/:tournamentId/bracket', (req: Request, res: Response) => {
  const tid = parseInt(req.params.tournamentId, 10);
  const bracket = BRACKETS[tid];
  const tournament = PREDICTION_TOURNAMENTS.find((t) => t.id === tid);

  if (!bracket || !tournament) {
    return res.status(404).json({ error: 'Tournament not found' });
  }

  res.json({
    data: {
      tournamentId: tid,
      tournamentName: tournament.name,
      players: bracket.players,
      matchups: bracket.matchups,
    },
  });
});

// GET /api/fantasy/predictions/:tournamentId/results
router.get('/predictions/:tournamentId/results', (req: Request, res: Response) => {
  const tid = parseInt(req.params.tournamentId, 10);
  const result = RESULTS[tid];
  const bracket = BRACKETS[tid];
  const tournament = PREDICTION_TOURNAMENTS.find((t) => t.id === tid);

  if (!result || !bracket || !tournament) {
    return res.status(404).json({ error: 'Results not found' });
  }

  res.json({
    data: {
      tournamentId: tid,
      tournamentName: tournament.name,
      players: bracket.players,
      results: result,
    },
  });
});

export default router;
