import { Router, Request, Response } from 'express';
import { mockPlayers, mockMatches, mockTournaments } from '../mock-data';
import * as realApi from '../lib/real-api';

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

// Transform a RapidAPI ranking entry into our player shape
function transformRankingEntry(entry: any, tour: string) {
  const team = entry.team || {};
  return {
    id: team.id || 0,
    name: team.name || '',
    country: team.country?.name || '',
    countryCode: team.country?.alpha2 || '',
    ranking: entry.ranking || 0,
    tour: tour.toUpperCase(),
    points: entry.points || 0,
    rankingPoints: entry.rankingPoints || entry.points || 0,
    titles: 0,
    grandSlams: 0,
    careerHigh: entry.ranking || 0,
    birthdate: team.birthDateTimestamp
      ? new Date(team.birthDateTimestamp * 1000).toISOString().slice(0, 10)
      : '',
    height: team.height ? `${team.height} cm` : '',
    plays: team.plays || '',
    rankChange: entry.previousRanking
      ? entry.previousRanking - entry.ranking
      : 0,
    previousRanking: entry.previousRanking || null,
  };
}

// GET /api/players/rankings — real ATP/WTA rankings with mock fallback
router.get('/rankings', async (req: Request, res: Response) => {
  const tourParam = (req.query.tour as string || 'atp').toLowerCase();
  const tour = tourParam === 'wta' ? 'wta' : 'atp';

  try {
    const data = await realApi.getRankings(tour);
    if (data && Array.isArray(data.rankings) && data.rankings.length > 0) {
      const players = data.rankings.map((e: any) => transformRankingEntry(e, tour));
      const limit = parseInt(String(req.query.limit)) || 200;
      const offset = parseInt(String(req.query.offset)) || 0;
      return res.json({
        data: players.slice(offset, offset + limit),
        total: players.length,
        limit,
        offset,
        source: 'live',
      });
    }
  } catch {
    // fall through to mock
  }

  // Fallback: filter mock data by tour
  let players = [...mockPlayers].filter(
    (p) => !tour || (p as any).tour?.toLowerCase() === tour
  );
  players.sort((a, b) => a.ranking - b.ranking);
  const limit = parseInt(String(req.query.limit)) || 200;
  const offset = parseInt(String(req.query.offset)) || 0;
  res.json({
    data: players.slice(offset, offset + limit),
    total: players.length,
    limit,
    offset,
    source: 'mock',
  });
});

// GET /api/players/search/:term — search via real API, fallback to mock
router.get('/search/:term', async (req: Request, res: Response) => {
  const term = req.params.term;

  try {
    const data = await realApi.searchTerm(term);
    if (data && data.results) {
      const players = (data.results as any[])
        .filter((r) => r.type === 'player' || r.type === 'team')
        .map((r) => {
          const e = r.entity || {};
          return {
            id: e.id || 0,
            name: e.name || '',
            country: e.country?.name || '',
            countryCode: e.country?.alpha2 || '',
            ranking: e.ranking || 0,
            tour: e.gender === 'F' ? 'WTA' : 'ATP',
          };
        });
      return res.json({ data: players, total: players.length, source: 'live' });
    }
  } catch {
    // fall through
  }

  // Fallback: search mock data
  const q = term.toLowerCase();
  const players = mockPlayers.filter(
    (p) =>
      p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q)
  );
  res.json({ data: players, total: players.length, source: 'mock' });
});

// GET /api/players — Player list with search and ranking sort
router.get('/', (req: Request, res: Response) => {
  let players = [...mockPlayers];

  // Filter by tour (ATP/WTA/ALL)
  const tour = (req.query.tour as string || '').toUpperCase();
  if (tour === 'ATP' || tour === 'WTA') {
    players = players.filter((p) => (p as any).tour === tour);
  }

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
  const limit = parseInt(String(req.query.limit)) || 200;
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

// GET /api/players/:id — Player detail with recent matches (real API with mock fallback)
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));

  // Try real API first
  try {
    const data = await realApi.getPlayer(id);
    if (data && data.player) {
      const p = data.player;
      return res.json({
        id: p.id,
        name: p.name,
        country: p.country?.name || '',
        countryCode: p.country?.alpha2 || '',
        ranking: p.ranking || 0,
        rankingPoints: p.rankingPoints || 0,
        tour: p.gender === 'F' ? 'WTA' : 'ATP',
        birthdate: p.birthDateTimestamp
          ? new Date(p.birthDateTimestamp * 1000).toISOString().slice(0, 10)
          : '',
        height: p.height ? `${p.height} cm` : '',
        plays: p.plays || '',
        recentMatches: [],
        stats: {
          winLoss: '0-0',
          titlesThisYear: 0,
          bestResult: '',
          seasonWinLoss: '0-0',
          winLossBySurface: [],
        },
        source: 'live',
      });
    }
  } catch {
    // fall through to mock
  }

  // Fallback: mock data
  const player = mockPlayers.find((p) => p.id === id);
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
    rankingPoints: (player as any).rankingPoints || [],
    record: (player as any).record || null,
    birthplace: (player as any).birthplace || null,
    coach: (player as any).coach || null,
    recentForm: (player as any).recentForm || null,
  });
});

export default router;
