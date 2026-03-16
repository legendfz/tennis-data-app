/**
 * Events service — live matches, scheduled events, match details, H2H, point-by-point.
 * Calls the primary provider and wraps results in a cache layer.
 */

import { globalCache, TTL } from '../cache.js';
import type { BaseProvider } from '../providers/base.js';
import type {
  TennisEvent,
  MatchStatistics,
  HeadToHead,
  PointByPoint,
  EventsByDateParams,
} from '../types/events.js';

export class EventsService {
  constructor(private readonly provider: BaseProvider) {}

  async getLiveMatches(): Promise<TennisEvent[]> {
    const key = 'events:live';
    const cached = globalCache.get<TennisEvent[]>(key);
    if (cached) return cached;

    const data = await this.provider.getLiveMatches();
    globalCache.set(key, data, TTL.LIVE);
    return data;
  }

  async getEventsByDate(params: EventsByDateParams): Promise<TennisEvent[]> {
    const { day, month, year } = params;
    const key = `events:date:${year}-${month}-${day}`;
    const cached = globalCache.get<TennisEvent[]>(key);
    if (cached) return cached;

    const data = await this.provider.getEventsByDate(params);
    globalCache.set(key, data, TTL.SHORT);
    return data;
  }

  async getMatchDetails(eventId: number): Promise<TennisEvent> {
    const key = `event:${eventId}`;
    const cached = globalCache.get<TennisEvent>(key);
    if (cached) return cached;

    const data = await this.provider.getMatchDetails(eventId);
    // Shorter TTL for live/in-progress matches
    const isLive = data.status?.type === 'inprogress';
    globalCache.set(key, data, isLive ? TTL.LIVE : TTL.MEDIUM);
    return data;
  }

  async getMatchStatistics(eventId: number): Promise<MatchStatistics> {
    const key = `event:${eventId}:stats`;
    const cached = globalCache.get<MatchStatistics>(key);
    if (cached) return cached;

    const data = await this.provider.getMatchStatistics(eventId);
    globalCache.set(key, data, TTL.SHORT);
    return data;
  }

  async getHeadToHead(customId: string): Promise<HeadToHead> {
    const key = `event:${customId}:h2h`;
    const cached = globalCache.get<HeadToHead>(key);
    if (cached) return cached;

    const data = await this.provider.getHeadToHead(customId);
    globalCache.set(key, data, TTL.MEDIUM);
    return data;
  }

  async getPointByPoint(eventId: number): Promise<PointByPoint> {
    const key = `event:${eventId}:pbp`;
    const cached = globalCache.get<PointByPoint>(key);
    if (cached) return cached;

    const data = await this.provider.getPointByPoint(eventId);
    globalCache.set(key, data, TTL.LIVE);
    return data;
  }
}
