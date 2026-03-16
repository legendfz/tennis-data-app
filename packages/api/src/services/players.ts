/**
 * Players service — player profiles and match history.
 */

import { globalCache, TTL } from '../cache.js';
import type { BaseProvider } from '../providers/base.js';
import type { TennisPlayer, PlayerMatchesPage } from '../types/players.js';

export class PlayersService {
  constructor(private readonly provider: BaseProvider) {}

  async getPlayerDetails(playerId: number): Promise<TennisPlayer> {
    const key = `player:${playerId}`;
    const cached = globalCache.get<TennisPlayer>(key);
    if (cached) return cached;

    const data = await this.provider.getPlayerDetails(playerId);
    globalCache.set(key, data, TTL.MEDIUM);
    return data;
  }

  async getPlayerMatches(playerId: number, page = 0): Promise<PlayerMatchesPage> {
    const key = `player:${playerId}:matches:${page}`;
    const cached = globalCache.get<PlayerMatchesPage>(key);
    if (cached) return cached;

    const data = await this.provider.getPlayerMatches(playerId, page);
    globalCache.set(key, data, TTL.SHORT);
    return data;
  }

  async searchPlayersAndTournaments(term: string) {
    const key = `search:${term.toLowerCase()}`;
    const cached = globalCache.get<Awaited<ReturnType<BaseProvider['searchPlayersAndTournaments']>>>(key);
    if (cached) return cached;

    const data = await this.provider.searchPlayersAndTournaments(term);
    globalCache.set(key, data, TTL.SHORT);
    return data;
  }
}
