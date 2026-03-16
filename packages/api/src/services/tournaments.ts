/**
 * Tournaments service — tournament details and draw/bracket.
 */

import { globalCache, TTL } from '../cache.js';
import type { BaseProvider } from '../providers/base.js';
import type { TournamentInfo, TournamentDraw } from '../types/tournaments.js';

export class TournamentsService {
  constructor(private readonly provider: BaseProvider) {}

  async getTournamentDetails(tournamentId: number): Promise<TournamentInfo> {
    const key = `tournament:${tournamentId}`;
    const cached = globalCache.get<TournamentInfo>(key);
    if (cached) return cached;

    const data = await this.provider.getTournamentDetails(tournamentId);
    globalCache.set(key, data, TTL.LONG);
    return data;
  }

  async getTournamentDraw(tournamentId: number, seasonId: number): Promise<TournamentDraw> {
    const key = `tournament:${tournamentId}:season:${seasonId}:draw`;
    const cached = globalCache.get<TournamentDraw>(key);
    if (cached) return cached;

    const data = await this.provider.getTournamentDraw(tournamentId, seasonId);
    globalCache.set(key, data, TTL.MEDIUM);
    return data;
  }
}
