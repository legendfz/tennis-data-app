import { Router, Request, Response } from 'express';
import { mockPlayers, mockTournaments, mockMatches } from '../mock-data';

const router = Router();

// GET /api/search?q=xxx — Unified search across players, tournaments, and matches
router.get('/', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  if (!query) {
    res.json({ players: [], tournaments: [], matches: [] });
    return;
  }

  // Search players
  const players = mockPlayers
    .filter((p) => {
      if (p.name.toLowerCase().includes(query)) return true;
      if (p.country.toLowerCase().includes(query)) return true;
      if ((p as any).nameLocalized) {
        return Object.values((p as any).nameLocalized).some(
          (n: any) => typeof n === 'string' && n.toLowerCase().includes(query)
        );
      }
      return false;
    })
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      name: p.name,
      nameLocalized: (p as any).nameLocalized,
      country: p.country,
      countryFlag: p.countryFlag,
      ranking: p.ranking,
      photoUrl: p.photoUrl,
    }));

  // Search tournaments
  const tournaments = mockTournaments
    .filter((t) =>
      t.name.toLowerCase().includes(query) ||
      t.location.toLowerCase().includes(query) ||
      t.surface.toLowerCase().includes(query)
    )
    .slice(0, 10)
    .map((t) => ({
      id: t.id,
      name: t.name,
      location: t.location,
      surface: t.surface,
      category: t.category,
      startDate: t.startDate,
      endDate: t.endDate,
    }));

  // Search matches (by player names in match)
  const matchResults = mockMatches
    .filter((m) => {
      const p1 = mockPlayers.find((p) => p.id === m.player1Id);
      const p2 = mockPlayers.find((p) => p.id === m.player2Id);
      const t = mockTournaments.find((t) => t.id === m.tournamentId);
      return (
        (p1 && p1.name.toLowerCase().includes(query)) ||
        (p2 && p2.name.toLowerCase().includes(query)) ||
        (t && t.name.toLowerCase().includes(query)) ||
        m.round.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
    .map((m) => {
      const player1 = mockPlayers.find((p) => p.id === m.player1Id);
      const player2 = mockPlayers.find((p) => p.id === m.player2Id);
      const tournament = mockTournaments.find((t) => t.id === m.tournamentId);
      return {
        id: m.id,
        player1: player1 ? { id: player1.id, name: player1.name, countryFlag: player1.countryFlag } : null,
        player2: player2 ? { id: player2.id, name: player2.name, countryFlag: player2.countryFlag } : null,
        score: m.score,
        round: m.round,
        date: m.date,
        tournament: tournament ? { id: tournament.id, name: tournament.name } : null,
        winnerId: m.winnerId,
      };
    });

  res.json({
    players,
    tournaments,
    matches: matchResults,
  });
});

export default router;
