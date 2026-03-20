import { Router, Request, Response } from 'express';
import { mockMatches, mockPlayers, mockTournaments, mockDraws } from '../mock-data';
import { calculateWinProbability, ScoreState, calculateAdvancedProbability, AdvancedProbInput } from '../lib/win-probability';
import probabilitySnapshots from '../data/probability-snapshots.json';
import type { NextRoundInfo } from '../../../shared/types';

const router = Router();

// Round progression order (lower index = later in tournament)
const ROUND_ORDER = ['Final', 'Semi-Final', 'Quarter-Final', 'Round of 16', 'Round of 32', 'Round of 64', 'Round Robin'];

function getNextRoundInfo(match: typeof mockMatches[0]): NextRoundInfo | null {
  // Find the draw for this tournament
  const draw = mockDraws.find((d) => d.tournamentId === match.tournamentId);
  if (!draw) return null;

  // Find which round this match is in within the draw
  const currentRoundName = match.round;
  const currentRoundIdx = ROUND_ORDER.indexOf(currentRoundName);
  if (currentRoundIdx < 0) return null; // Unknown round
  if (currentRoundIdx === 0) return null; // Already the Final, no next round

  const nextRoundName = ROUND_ORDER[currentRoundIdx - 1];
  if (!nextRoundName) return null;

  // Find the current match in the draw to identify the player's position
  const currentDrawRound = draw.rounds.find((r) => r.round === currentRoundName);
  if (!currentDrawRound) return null;

  // Find the draw match that corresponds to this match
  const drawMatch = currentDrawRound.matches.find(
    (dm) =>
      (dm.player1Id === match.player1Id && dm.player2Id === match.player2Id) ||
      (dm.player1Id === match.player2Id && dm.player2Id === match.player1Id)
  );
  if (!drawMatch) return null;

  // Get the index of this match within the round
  const matchIdx = currentDrawRound.matches.indexOf(drawMatch);

  // In a standard bracket, match 0 and 1 feed into next round match 0,
  // match 2 and 3 feed into next round match 1, etc.
  const nextMatchIdx = Math.floor(matchIdx / 2);

  const nextDrawRound = draw.rounds.find((r) => r.round === nextRoundName);
  if (!nextDrawRound) return null;

  const nextDrawMatch = nextDrawRound.matches[nextMatchIdx];
  if (!nextDrawMatch) return null;

  // Determine the winner of our current match
  const winnerId = match.winnerId;

  // The opponent in the next round comes from the sibling match
  // Sibling match is the other match that feeds into the same next-round match
  const siblingIdx = matchIdx % 2 === 0 ? matchIdx + 1 : matchIdx - 1;
  const siblingMatch = currentDrawRound.matches[siblingIdx];

  if (!siblingMatch) {
    // No sibling match means it's a bye or single entry
    return null;
  }

  // Find the actual match ID for the sibling match
  const siblingRealMatch = mockMatches.find(
    (m) =>
      m.tournamentId === match.tournamentId &&
      m.round === currentRoundName &&
      ((m.player1Id === siblingMatch.player1Id && m.player2Id === siblingMatch.player2Id) ||
       (m.player1Id === siblingMatch.player2Id && m.player2Id === siblingMatch.player1Id))
  );

  // Check if the sibling match has a winner
  if (siblingMatch.winnerId) {
    // Opponent is confirmed
    const opponent = mockPlayers.find((p) => p.id === siblingMatch.winnerId);
    if (!opponent) return null;
    return {
      round: nextRoundName,
      opponent: { id: opponent.id, name: opponent.name, ranking: opponent.ranking },
      status: 'confirmed',
    };
  } else {
    // Opponent is pending - show both potential opponents
    const potentialA = mockPlayers.find((p) => p.id === siblingMatch.player1Id);
    const potentialB = mockPlayers.find((p) => p.id === siblingMatch.player2Id);
    if (!potentialA || !potentialB) return null;
    return {
      round: nextRoundName,
      opponent: { id: potentialA.id, name: potentialA.name, ranking: potentialA.ranking },
      or: { id: potentialB.id, name: potentialB.name, ranking: potentialB.ranking },
      status: 'pending',
      matchId: siblingRealMatch?.id,
    };
  }
}

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
    const nextRound = getNextRoundInfo(m);
    return { ...m, player1, player2, winner, tournament, nextRound };
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
  const nextRound = getNextRoundInfo(match);

  res.json({ ...match, player1, player2, winner, tournament, nextRound });
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
