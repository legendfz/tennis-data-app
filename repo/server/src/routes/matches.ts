import { Router, Request, Response } from 'express';
import { mockMatches, mockPlayers, mockTournaments } from '../mock-data';
import { calculateWinProbability, ScoreState } from '../lib/win-probability';
import probabilitySnapshots from '../data/probability-snapshots.json';

const router = Router();

// GET /api/matches — Match list with tournament filter
router.get('/', (req: Request, res: Response) => {
  let matches = [...mockMatches];

  // Filter by tournament
  const tournamentId = req.query.tournamentId as string | undefined;
  if (tournamentId) {
    matches = matches.filter((m) => m.tournamentId === parseInt(tournamentId));
  }

  // Filter by round
  const round = req.query.round as string | undefined;
  if (round) {
    matches = matches.filter((m) => m.round.toLowerCase() === round.toLowerCase());
  }

  // Filter by player
  const playerId = req.query.playerId as string | undefined;
  if (playerId) {
    const pid = parseInt(playerId);
    matches = matches.filter((m) => m.player1Id === pid || m.player2Id === pid);
  }

  // Sort by date descending (most recent first)
  matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Pagination
  const limit = parseInt(String(req.query.limit)) || 20;
  const offset = parseInt(String(req.query.offset)) || 0;
  const total = matches.length;
  matches = matches.slice(offset, offset + limit);

  // Enrich with player and tournament data
  const enriched = matches.map((m) => {
    const player1 = mockPlayers.find((p) => p.id === m.player1Id);
    const player2 = mockPlayers.find((p) => p.id === m.player2Id);
    const winner = mockPlayers.find((p) => p.id === m.winnerId);
    const tournament = mockTournaments.find((t) => t.id === m.tournamentId);
    return { ...m, player1, player2, winner, tournament };
  });

  res.json({
    data: enriched,
    total,
    limit,
    offset,
  });
});

// GET /api/matches/:id — Match detail
router.get('/:id', (req: Request, res: Response) => {
  const match = mockMatches.find((m) => m.id === parseInt(String(req.params.id)));
  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  const player1 = mockPlayers.find((p) => p.id === match.player1Id);
  const player2 = mockPlayers.find((p) => p.id === match.player2Id);
  const winner = mockPlayers.find((p) => p.id === match.winnerId);
  const tournament = mockTournaments.find((t) => t.id === match.tournamentId);

  res.json({ ...match, player1, player2, winner, tournament });
});

// GET /api/matches/:id/probability-history — Get probability snapshots for historical match
router.get('/:id/probability-history', (req: Request, res: Response) => {
  const matchId = String(req.params.id);
  const snapshots = (probabilitySnapshots as Record<string, any[]>)[matchId];
  if (!snapshots) {
    res.json({ snapshots: [] });
    return;
  }
  res.json({ snapshots });
});

// POST /api/matches/:id/probability
router.post('/:id/probability', (req: Request, res: Response) => {
  const match = mockMatches.find((m) => m.id === parseInt(String(req.params.id)));
  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }

  const state: ScoreState = {
    sets: req.body.sets || [0, 0],
    games: req.body.games || [0, 0],
    points: req.body.points || ['0', '0'],
    serving: req.body.serving || 1,
    bestOf: req.body.bestOf || 3,
    p1ServeWinProb: req.body.p1ServeWinProb || 0.64,
    p2ServeWinProb: req.body.p2ServeWinProb || 0.64,
    isTiebreak: req.body.isTiebreak || false,
  };

  const result = calculateWinProbability(state);

  const player1 = mockPlayers.find((p) => p.id === match.player1Id);
  const player2 = mockPlayers.find((p) => p.id === match.player2Id);

  res.json({
    matchId: match.id,
    player1: { id: match.player1Id, name: player1?.name, winProb: result.player1WinProb },
    player2: { id: match.player2Id, name: player2?.name, winProb: result.player2WinProb },
    state,
  });
});

export default router;
