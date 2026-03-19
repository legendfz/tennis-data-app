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

// Grand Slam tournaments
const PREDICTION_TOURNAMENTS = [
  {
    id: 101,
    name: 'Australian Open 2025',
    status: 'completed' as const,
    surface: 'Hard',
    emoji: '🇦🇺',
    startDate: '2025-01-13',
    endDate: '2025-01-26',
    drawSize: 128,
  },
  {
    id: 102,
    name: 'Roland Garros 2025',
    status: 'in_progress' as const,
    surface: 'Clay',
    emoji: '🇫🇷',
    startDate: '2025-05-25',
    endDate: '2025-06-08',
    drawSize: 128,
  },
  {
    id: 103,
    name: 'Wimbledon 2025',
    status: 'open' as const,
    surface: 'Grass',
    emoji: '🇬🇧',
    startDate: '2025-06-30',
    endDate: '2025-07-13',
    drawSize: 128,
  },
  {
    id: 104,
    name: 'US Open 2025',
    status: 'open' as const,
    surface: 'Hard',
    emoji: '🇺🇸',
    startDate: '2025-08-25',
    endDate: '2025-09-07',
    drawSize: 128,
  },
];

// =============================================
// Helper: Generate 128-player draw from ATP players
// =============================================

// ATP players sorted by ranking (IDs 1-100)
const atpPlayers = mockPlayers
  .filter((p) => p.id <= 100)
  .sort((a, b) => a.ranking - b.ranking);

interface DrawEntry {
  position: number;
  playerId: number;
  seed: number | null;
  name: string;
  ranking: number;
  country: string;
}

/**
 * Standard 128-draw seeding positions (where seeds are placed).
 * Seed 1 at position 1, Seed 2 at position 128, etc.
 * This follows the standard Grand Slam draw placement.
 */
const SEED_POSITIONS: Record<number, number> = {
  1: 1, 2: 128, 3: 33, 4: 96,
  5: 64, 6: 65, 7: 32, 8: 97,
  9: 16, 10: 17, 11: 48, 12: 49,
  13: 80, 14: 81, 15: 112, 16: 113,
  17: 8, 18: 9, 19: 24, 20: 25,
  21: 40, 22: 41, 23: 56, 24: 57,
  25: 72, 26: 73, 27: 88, 28: 89,
  29: 104, 30: 105, 31: 120, 32: 121,
};

function generateDraw128(tournamentId: number, _shuffleSeed: number): DrawEntry[] {
  const draw: DrawEntry[] = [];
  const usedPositions = new Set<number>();
  const usedPlayerIds = new Set<number>();

  // Place 32 seeds
  for (let seed = 1; seed <= 32; seed++) {
    const player = atpPlayers[seed - 1]; // ranking = seed
    const position = SEED_POSITIONS[seed];
    draw.push({
      position,
      playerId: player.id,
      seed,
      name: player.name,
      ranking: player.ranking,
      country: player.country,
    });
    usedPositions.add(position);
    usedPlayerIds.add(player.id);
  }

  // Fill remaining 96 positions with remaining ATP players (33-100) + some recycled
  const remainingPlayers = atpPlayers.filter((p) => !usedPlayerIds.has(p.id));
  // We need 96 more but only have 68 remaining ATP. We'll cycle through
  let playerIdx = 0;
  
  // Deterministic shuffle based on tournamentId
  const shuffled = [...remainingPlayers];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = ((tournamentId * 7 + i * 13) % (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  for (let pos = 1; pos <= 128; pos++) {
    if (usedPositions.has(pos)) continue;
    const player = shuffled[playerIdx % shuffled.length];
    playerIdx++;
    draw.push({
      position: pos,
      playerId: player.id,
      seed: null,
      name: player.name,
      ranking: player.ranking,
      country: player.country,
    });
  }

  return draw.sort((a, b) => a.position - b.position);
}

// Pre-generate draws for each tournament
const DRAWS_128: Record<number, DrawEntry[]> = {
  101: generateDraw128(101, 1),
  102: generateDraw128(102, 2),
  103: generateDraw128(103, 3),
  104: generateDraw128(104, 4),
};

// =============================================
// Simulate realistic 128-draw results
// =============================================

function simulateResults(draw: DrawEntry[], tournamentId: number): Record<string, number[]> {
  const rounds = ['R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'Final'];
  const results: Record<string, number[]> = {};
  
  // Start with all 128 players in position order
  let currentPlayers = draw.map((d) => ({
    playerId: d.playerId,
    seed: d.seed,
    ranking: d.ranking,
  }));

  for (const round of rounds) {
    const winners: typeof currentPlayers = [];
    const winnerIds: number[] = [];
    
    for (let i = 0; i < currentPlayers.length; i += 2) {
      const p1 = currentPlayers[i];
      const p2 = currentPlayers[i + 1];
      
      // Higher seed / lower ranking wins more often
      // Add some deterministic "randomness" based on tournament + match index
      const matchHash = (tournamentId * 31 + i * 17 + (p1.playerId * 7)) % 100;
      
      let winner: typeof p1;
      if (p1.seed && p2.seed) {
        // Both seeded: lower seed number wins ~70%
        winner = p1.seed < p2.seed ? (matchHash < 70 ? p1 : p2) : (matchHash < 70 ? p2 : p1);
      } else if (p1.seed && !p2.seed) {
        // Seeded vs unseeded: seed wins ~80%
        winner = matchHash < 80 ? p1 : p2;
      } else if (!p1.seed && p2.seed) {
        winner = matchHash < 80 ? p2 : p1;
      } else {
        // Both unseeded: lower ranking wins ~60%
        winner = p1.ranking < p2.ranking ? (matchHash < 60 ? p1 : p2) : (matchHash < 60 ? p2 : p1);
      }
      
      winners.push(winner);
      winnerIds.push(winner.playerId);
    }
    
    results[round] = winnerIds;
    currentPlayers = winners;
  }

  return results;
}

const RESULTS_128: Record<number, Record<string, number[]>> = {
  101: simulateResults(DRAWS_128[101], 101),
  102: simulateResults(DRAWS_128[102], 102),
  103: simulateResults(DRAWS_128[103], 103),
  104: simulateResults(DRAWS_128[104], 104),
};

// =============================================
// Legacy QF brackets (kept for backward compat)
// =============================================

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
      { top: 1, bottom: 9 },
      { top: 2, bottom: 3 },
      { top: 4, bottom: 13 },
      { top: 14, bottom: 5 },
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
      { top: 1, bottom: 11 },
      { top: 3, bottom: 8 },
      { top: 4, bottom: 6 },
      { top: 2, bottom: 5 },
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

const RESULTS: Record<number, {
  qf: number[];
  sf: number[];
  final: number[];
  champion: number;
}> = {
  101: { qf: [1, 2, 4, 14], sf: [1, 4], final: [1], champion: 1 },
  102: { qf: [1, 3, 4, 2], sf: [3, 4], final: [3], champion: 3 },
  103: { qf: [1, 3, 2, 4], sf: [3, 2], final: [3], champion: 3 },
  104: { qf: [1, 3, 4, 2], sf: [1, 2], final: [1], champion: 1 },
};

// =============================================
// API Routes
// =============================================

// GET /api/fantasy/predictions/tournaments
router.get('/predictions/tournaments', (_req: Request, res: Response) => {
  res.json({ data: PREDICTION_TOURNAMENTS });
});

// GET /api/fantasy/predictions/:tournamentId/bracket (legacy QF)
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

// GET /api/fantasy/predictions/:tournamentId/bracket128
router.get('/predictions/:tournamentId/bracket128', (req: Request, res: Response) => {
  const tid = parseInt(req.params.tournamentId, 10);
  const draw = DRAWS_128[tid];
  const tournament = PREDICTION_TOURNAMENTS.find((t) => t.id === tid);

  if (!draw || !tournament) {
    return res.status(404).json({ error: 'Tournament not found' });
  }

  res.json({
    data: {
      tournamentId: tid,
      tournamentName: tournament.name,
      drawSize: 128,
      seeds: draw,
      rounds: ['R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'Final'],
    },
  });
});

// GET /api/fantasy/predictions/:tournamentId/results (legacy QF)
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

// GET /api/fantasy/predictions/:tournamentId/results128
router.get('/predictions/:tournamentId/results128', (req: Request, res: Response) => {
  const tid = parseInt(req.params.tournamentId, 10);
  const results = RESULTS_128[tid];
  const draw = DRAWS_128[tid];
  const tournament = PREDICTION_TOURNAMENTS.find((t) => t.id === tid);

  if (!results || !draw || !tournament) {
    return res.status(404).json({ error: 'Results not found' });
  }

  // Champion is the last remaining winner
  const champion = results['Final'][0];

  res.json({
    data: {
      tournamentId: tid,
      tournamentName: tournament.name,
      drawSize: 128,
      draw,
      results,
      champion,
    },
  });
});

export default router;
