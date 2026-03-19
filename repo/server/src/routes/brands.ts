import { Router, Request, Response } from 'express';
import { mockPlayers, mockMatches, mockTournaments } from '../mock-data';

const router = Router();

interface BrandStats {
  brand: string;
  playerCount: number;
  avgRanking: number;
  totalTitles: number;
  totalGrandSlams: number;
  totalPoints: number;
  winRate: number;
  players: { id: number; name: string; ranking: number }[];
}

function isGrandSlam(tournamentId: number): boolean {
  const t = mockTournaments.find((t) => t.id === tournamentId);
  if (!t) return false;
  const name = t.name.toLowerCase();
  return (
    name.includes('australian open') ||
    name.includes('roland garros') ||
    name.includes('french open') ||
    name.includes('wimbledon') ||
    name.includes('us open')
  );
}

function extractBrands(player: any): string[] {
  const brands: string[] = [];
  const eq = player.equipment;
  if (!eq) return brands;
  if (eq.apparel) eq.apparel.forEach((a: any) => { if (a.brand && !brands.includes(a.brand)) brands.push(a.brand); });
  if (eq.shoes) eq.shoes.forEach((s: any) => { if (s.brand && !brands.includes(s.brand)) brands.push(s.brand); });
  if (eq.racket?.brand && !brands.includes(eq.racket.brand)) brands.push(eq.racket.brand);
  if (eq.watch && !brands.includes(eq.watch)) brands.push(eq.watch);
  if (eq.otherSponsors) eq.otherSponsors.forEach((s: string) => { if (!brands.includes(s)) brands.push(s); });
  return brands;
}

// GET /api/brands/rankings
router.get('/rankings', (_req: Request, res: Response) => {
  // Build brand -> player mapping
  const brandMap: Record<string, number[]> = {};

  mockPlayers.forEach((player) => {
    const brands = extractBrands(player);
    brands.forEach((brand) => {
      if (!brandMap[brand]) brandMap[brand] = [];
      brandMap[brand].push(player.id);
    });
  });

  // Calculate stats for each brand
  const rankings: BrandStats[] = Object.entries(brandMap).map(([brand, playerIds]) => {
    const players = playerIds.map((id) => mockPlayers.find((p) => p.id === id)!).filter(Boolean);
    const playerCount = players.length;
    const avgRanking = playerCount > 0
      ? Math.round(players.reduce((sum, p) => sum + p.ranking, 0) / playerCount)
      : 0;
    const totalTitles = players.reduce((sum, p) => sum + (p.titles || 0), 0);
    const totalGrandSlams = players.reduce((sum, p) => sum + (p.grandSlams || 0), 0);

    // Calculate points: +2 per win, +4 for grand slam wins
    let totalPoints = 0;
    let totalWins = 0;
    let totalMatches = 0;

    playerIds.forEach((playerId) => {
      const playerMatches = mockMatches.filter(
        (m) => m.player1Id === playerId || m.player2Id === playerId
      );
      totalMatches += playerMatches.length;
      playerMatches.forEach((m) => {
        if (m.winnerId === playerId) {
          totalWins++;
          if (isGrandSlam(m.tournamentId)) {
            totalPoints += 4;
          } else {
            totalPoints += 2;
          }
        }
      });
    });

    const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

    return {
      brand,
      playerCount,
      avgRanking,
      totalTitles,
      totalGrandSlams,
      totalPoints,
      winRate,
      players: players.map((p) => ({ id: p.id, name: p.name, ranking: p.ranking })),
    };
  });

  // Sort by total points descending
  rankings.sort((a, b) => b.totalPoints - a.totalPoints);

  res.json({ data: rankings });
});

export default router;
