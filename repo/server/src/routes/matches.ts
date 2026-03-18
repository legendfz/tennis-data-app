import { Router, Request, Response } from 'express';
import { mockMatches, mockPlayers, mockTournaments } from '../mock-data';
import { calculateWinProbability, ScoreState, calculateAdvancedProbability, AdvancedProbInput } from '../lib/win-probability';
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

  const player1 = mockPlayers.find((p) => p.id === match.player1Id);
  const player2 = mockPlayers.find((p) => p.id === match.player2Id);

  // Check if advanced parameters are provided
  const useAdvanced = req.body.surface || req.body.weather || req.body.p1Age || req.body.p1RecentFormWins !== undefined;

  if (useAdvanced) {
    const advInput: AdvancedProbInput = {
      ...state,
      surface: req.body.surface,
      p1SurfaceRecord: req.body.p1SurfaceRecord || (player1 as any)?.surfaceRecord,
      p2SurfaceRecord: req.body.p2SurfaceRecord || (player2 as any)?.surfaceRecord,
      weather: req.body.weather,
      p1Age: req.body.p1Age || (player1?.birthdate ? Math.floor((Date.now() - new Date(player1.birthdate).getTime()) / 31557600000) : undefined),
      p2Age: req.body.p2Age || (player2?.birthdate ? Math.floor((Date.now() - new Date(player2.birthdate).getTime()) / 31557600000) : undefined),
      p1RecentFormWins: req.body.p1RecentFormWins,
      p2RecentFormWins: req.body.p2RecentFormWins,
      h2hP1Wins: req.body.h2hP1Wins,
      h2hP2Wins: req.body.h2hP2Wins,
      currentSet: req.body.currentSet || ((state.sets[0] + state.sets[1]) + 1),
    };

    const advResult = calculateAdvancedProbability(advInput);

    res.json({
      matchId: match.id,
      player1: { id: match.player1Id, name: player1?.name, winProb: advResult.player1WinProb },
      player2: { id: match.player2Id, name: player2?.name, winProb: advResult.player2WinProb },
      factors: advResult.factors,
      adjustedServeProbs: {
        p1: advResult.adjustedP1ServeWinProb,
        p2: advResult.adjustedP2ServeWinProb,
      },
      state,
      advanced: true,
    });
    return;
  }

  const result = calculateWinProbability(state);

  res.json({
    matchId: match.id,
    player1: { id: match.player1Id, name: player1?.name, winProb: result.player1WinProb },
    player2: { id: match.player2Id, name: player2?.name, winProb: result.player2WinProb },
    state,
  });
});

export default router;
