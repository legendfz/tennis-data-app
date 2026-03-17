import { Router, Request, Response } from 'express';
import { mockPlayers, mockMatches, mockTournaments } from '../mock-data';

const router = Router();

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

  res.json({
    ...player,
    recentMatches: playerMatches,
    stats: {
      winLoss: `${wins}-${losses}`,
      titlesThisYear: player.titles,
      bestResult: player.grandSlams > 0 ? `${player.grandSlams} Grand Slam titles` : `Career high #${player.careerHigh}`,
    },
  });
});

export default router;
