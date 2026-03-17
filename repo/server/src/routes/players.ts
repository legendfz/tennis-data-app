import { Router, Request, Response } from 'express';
import { mockPlayers, mockMatches, mockTournaments } from '../mock-data';

const router = Router();

// Surface classification helper
function getSurface(tournamentId: number): string {
  const t = mockTournaments.find((t) => t.id === tournamentId);
  if (!t) return 'Unknown';
  const s = t.surface.toLowerCase();
  if (s.includes('clay')) return 'Clay';
  if (s.includes('grass')) return 'Grass';
  if (s.includes('hard')) return 'Hard';
  return t.surface;
}

// GET /api/players — Player list with search and ranking sort
router.get('/', (req: Request, res: Response) => {
  let players = [...mockPlayers];

  // Search by name or country
  const search = req.query.search as string | undefined;
  if (search) {
    const q = search.toLowerCase();
    players = players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q)
    );
  }

  // Sort by ranking (default), or by name
  const sortBy = req.query.sort as string | undefined;
  if (sortBy === 'name') {
    players.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    players.sort((a, b) => a.ranking - b.ranking);
  }

  // Pagination
  const limit = parseInt(String(req.query.limit)) || 50;
  const offset = parseInt(String(req.query.offset)) || 0;
  const total = players.length;
  players = players.slice(offset, offset + limit);

  res.json({
    data: players,
    total,
    limit,
    offset,
  });
});

// GET /api/players/:id — Player detail with recent matches
router.get('/:id', (req: Request, res: Response) => {
  const player = mockPlayers.find((p) => p.id === parseInt(String(req.params.id)));
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }

  // Get recent matches for this player
  const playerMatches = mockMatches
    .filter((m) => m.player1Id === player.id || m.player2Id === player.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
    .map((m) => {
      const player1 = mockPlayers.find((p) => p.id === m.player1Id)!;
      const player2 = mockPlayers.find((p) => p.id === m.player2Id)!;
      const winner = mockPlayers.find((p) => p.id === m.winnerId)!;
      const tournament = mockTournaments.find((t) => t.id === m.tournamentId)!;
      return { ...m, player1, player2, winner, tournament };
    });

  // Calculate stats
  const allPlayerMatches = mockMatches.filter(
    (m) => m.player1Id === player.id || m.player2Id === player.id
  );
  const wins = allPlayerMatches.filter((m) => m.winnerId === player.id).length;
  const losses = allPlayerMatches.length - wins;

  // Win/loss by surface
  const surfaceStats: Record<string, { wins: number; losses: number }> = {};
  allPlayerMatches.forEach((m) => {
    const surface = getSurface(m.tournamentId);
    if (!surfaceStats[surface]) surfaceStats[surface] = { wins: 0, losses: 0 };
    if (m.winnerId === player.id) {
      surfaceStats[surface].wins++;
    } else {
      surfaceStats[surface].losses++;
    }
  });

  const winLossBySurface = Object.entries(surfaceStats).map(([surface, stats]) => ({
    surface,
    wins: stats.wins,
    losses: stats.losses,
  }));

  // Season win/loss (2024 matches)
  const seasonMatches = allPlayerMatches.filter((m) => m.date.startsWith('2024'));
  const seasonWins = seasonMatches.filter((m) => m.winnerId === player.id).length;
  const seasonLosses = seasonMatches.length - seasonWins;

  res.json({
    ...player,
    recentMatches: playerMatches,
    stats: {
      winLoss: `${wins}-${losses}`,
      titlesThisYear: player.titles,
      bestResult: player.grandSlams > 0 ? `${player.grandSlams} Grand Slam titles` : `Career high #${player.careerHigh}`,
      seasonWinLoss: `${seasonWins}-${seasonLosses}`,
      winLossBySurface,
    },
    // Pass through extended fields
    rankingHistory: (player as any).rankingHistory || [],
    record: (player as any).record || null,
    birthplace: (player as any).birthplace || null,
    coach: (player as any).coach || null,
    recentForm: (player as any).recentForm || null,
  });
});

export default router;
