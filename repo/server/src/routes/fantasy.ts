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

export default router;
