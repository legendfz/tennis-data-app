/**
 * TennisHQ Data Abstraction Layer — public API
 *
 * Usage:
 *   import { createTennisClient } from './tennis/index.js';
 *   const tennis = createTennisClient();
 *   const live = await tennis.events.getLiveMatches();
 */

// dotenv is loaded by the application entry point; this library does not load it
import { createProviderRegistry } from '../providers/index.js';
import { EventsService } from '../services/events.js';
import { PlayersService } from '../services/players.js';
import { TournamentsService } from '../services/tournaments.js';
import { RankingsService } from '../services/rankings.js';

export { Cache, TTL, globalCache } from '../cache.js';
export { TennisHttpClient, ApiError } from '../client.js';
export type { RapidApiConfig } from '../client.js';

export { BaseProvider, TennisApi1Provider, MatchStatProvider, UltimateTennisProvider, ProviderRegistry, createProviderRegistry } from '../providers/index.js';
export type { SearchResults, ProviderName } from '../providers/index.js';

export { EventsService } from '../services/events.js';
export { PlayersService } from '../services/players.js';
export { TournamentsService } from '../services/tournaments.js';
export { RankingsService } from '../services/rankings.js';

// Domain types
export type * from '../types/events.js';
export type * from '../types/players.js';
export type * from '../types/tournaments.js';
export type * from '../types/rankings.js';

export interface TennisClient {
  events: EventsService;
  players: PlayersService;
  tournaments: TournamentsService;
  rankings: RankingsService;
}

/**
 * Factory — creates a fully-wired TennisClient from env vars.
 * Call once at application startup and reuse the instance.
 */
export function createTennisClient(): TennisClient {
  const registry = createProviderRegistry();
  const provider = registry.primary;

  return {
    events: new EventsService(provider),
    players: new PlayersService(provider),
    tournaments: new TournamentsService(provider),
    rankings: new RankingsService(provider),
  };
}
