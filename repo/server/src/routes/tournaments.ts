import { Router, Request, Response } from 'express';
import { mockTournaments, mockMatches, mockPlayers, mockDraws } from '../mock-data';

const router = Router();

// GET /api/tournaments — Tournament list
router.get('/', (req: Request, res: Response) => {
  let tournaments = [...mockTournaments];

  // Filter by category
  const category = req.query.category as string | undefined;
  if (category) {
    tournaments = tournaments.filter(
      (t) => t.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Filter by surface
  const surface = req.query.surface as string | undefined;
  if (surface) {
    tournaments = tournaments.filter(
      (t) => t.surface.toLowerCase().includes(surface.toLowerCase())
    );
  }

  // Sort by start date
  tournaments.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  res.json({
    data: tournaments,
    total: tournaments.length,
  });
});

// GET /api/tournaments/lookup?name=... — Find tournament by name
router.get('/lookup', (req: Request, res: Response) => {
  const name = (req.query.name as string || '').toLowerCase();
  if (!name) {
    res.status(400).json({ error: 'name query parameter required' });
    return;
  }
  const tournament = mockTournaments.find(
    (t) => t.name.toLowerCase() === name
  );
  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found' });
    return;
  }
  res.json(tournament);
});

// GET /api/tournaments/:id — Tournament detail
router.get('/:id', (req: Request, res: Response) => {
  const tournament = mockTournaments.find(
    (t) => t.id === parseInt(String(req.params.id))
  );
  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found' });
    return;
  }

  // Get matches for this tournament
  const matches = mockMatches
    .filter((m) => m.tournamentId === tournament.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((m) => {
      const player1 = mockPlayers.find((p) => p.id === m.player1Id);
      const player2 = mockPlayers.find((p) => p.id === m.player2Id);
      const winner = mockPlayers.find((p) => p.id === m.winnerId);
      return { ...m, player1, player2, winner };
    });

  res.json({ ...tournament, matches });
});

// GET /api/tournaments/:id/draw — Tournament draw/bracket
router.get('/:id/draw', (req: Request, res: Response) => {
  const tournamentId = parseInt(String(req.params.id));
  const draw = mockDraws.find((d) => d.tournamentId === tournamentId);

  if (!draw) {
    res.status(404).json({ error: 'Draw not found for this tournament' });
    return;
  }

  // Enrich draw with player data
  const enrichedRounds = draw.rounds.map((round) => ({
    round: round.round,
    matches: round.matches.map((m) => ({
      ...m,
      player1: mockPlayers.find((p) => p.id === m.player1Id),
      player2: mockPlayers.find((p) => p.id === m.player2Id),
      winner: mockPlayers.find((p) => p.id === m.winnerId),
    })),
  }));

  res.json({
    ...draw,
    rounds: enrichedRounds,
  });
});

export default router;
