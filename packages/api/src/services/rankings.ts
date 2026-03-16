/**
 * Rankings service — ATP and WTA rankings with long-lived cache.
 */

import { globalCache, TTL } from '../cache.js';
import type { BaseProvider } from '../providers/base.js';
import type { RankingsPage } from '../types/rankings.js';

export class RankingsService {
  constructor(private readonly provider: BaseProvider) {}

  async getAtpRankings(): Promise<RankingsPage> {
    const key = 'rankings:atp';
    const cached = globalCache.get<RankingsPage>(key);
    if (cached) return cached;

    const data = await this.provider.getAtpRankings();
    globalCache.set(key, data, TTL.LONG);
    return data;
  }

  async getWtaRankings(): Promise<RankingsPage> {
    const key = 'rankings:wta';
    const cached = globalCache.get<RankingsPage>(key);
    if (cached) return cached;

    const data = await this.provider.getWtaRankings();
    globalCache.set(key, data, TTL.LONG);
    return data;
  }
}
