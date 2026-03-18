import { Router, Request, Response } from 'express';
import { mockPlayers, mockTournaments } from '../mock-data';
import h2hData from '../data/h2h.json';

const router = Router();

interface H2HMatch {
  date: string;
  tournamentId: number;
  round: string;
  score: string;
  winnerId: number;
}

interface H2HRecord {
  player1Id: number;
  player2Id: number;
  matches: H2HMatch[];
}

function getSurface(tournamentId: number): string {
  const t = mockTournaments.find((t) => t.id === tournamentId);
  if (!t) return 'Unknown';
  const s = t.surface.toLowerCase();
  if (s.includes('clay')) return 'clay';
  if (s.includes('grass')) return 'grass';
  return 'hard';
}

function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function getSeasonWinRate(playerId: number): string {
  // Use player record if available
  const player = mockPlayers.find((p) => p.id === playerId) as any;
  if (player?.record?.season) {
    const { wins, losses } = player.record.season;
    const total = wins + losses;
    if (total === 0) return '0%';
    return `${((wins / total) * 100).toFixed(1)}%`;
  }
  return 'N/A';
}

// GET /api/h2h/:player1Id/:player2Id
router.get('/:player1Id/:player2Id', (req: Request, res: Response) => {
  const p1Id = parseInt(req.params.player1Id);
  const p2Id = parseInt(req.params.player2Id);

  const player1 = mockPlayers.find((p) => p.id === p1Id);
  const player2 = mockPlayers.find((p) => p.id === p2Id);

  if (!player1 || !player2) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }

  // Find H2H record (check both orderings)
  const record = (h2hData as H2HRecord[]).find(
    (r) =>
      (r.player1Id === p1Id && r.player2Id === p2Id) ||
      (r.player1Id === p2Id && r.player2Id === p1Id)
  );

  const matches = record?.matches || [];

  // Calculate wins/losses from player1's perspective
  const p1Wins = matches.filter((m) => m.winnerId === p1Id).length;
  const p2Wins = matches.filter((m) => m.winnerId === p2Id).length;

  // By surface
  const bySurface: Record<string, { p1Wins: number; p2Wins: number }> = {
    hard: { p1Wins: 0, p2Wins: 0 },
    clay: { p1Wins: 0, p2Wins: 0 },
    grass: { p1Wins: 0, p2Wins: 0 },
  };

  matches.forEach((m) => {
    const surface = getSurface(m.tournamentId);
    if (!bySurface[surface]) bySurface[surface] = { p1Wins: 0, p2Wins: 0 };
    if (m.winnerId === p1Id) bySurface[surface].p1Wins++;
    else bySurface[surface].p2Wins++;
  });

  // Match history enriched with tournament info, sorted by date desc
  const matchHistory = matches
    .map((m) => {
      const tournament = mockTournaments.find((t) => t.id === m.tournamentId);
      return {
        date: m.date,
        tournament: tournament?.name || 'Unknown',
        surface: tournament?.surface || 'Unknown',
        round: m.round,
        score: m.score,
        winnerId: m.winnerId,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Player comparison stats
  const playerComparison = {
    player1: {
      id: player1.id,
      name: player1.name,
      country: player1.country,
      countryFlag: player1.countryFlag,
      photoUrl: player1.photoUrl,
      ranking: player1.ranking,
      age: calculateAge(player1.birthdate),
      height: player1.height,
      grandSlams: player1.grandSlams,
      seasonWinRate: getSeasonWinRate(player1.id),
    },
    player2: {
      id: player2.id,
      name: player2.name,
      country: player2.country,
      countryFlag: player2.countryFlag,
      photoUrl: player2.photoUrl,
      ranking: player2.ranking,
      age: calculateAge(player2.birthdate),
      height: player2.height,
      grandSlams: player2.grandSlams,
      seasonWinRate: getSeasonWinRate(player2.id),
    },
  };

  res.json({
    summary: {
      player1Wins: p1Wins,
      player2Wins: p2Wins,
      totalMatches: matches.length,
    },
    bySurface,
    matchHistory,
    playerComparison,
  });
});

export default router;
