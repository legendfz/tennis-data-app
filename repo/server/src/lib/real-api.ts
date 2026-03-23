/**
 * Thin client for TennisApi1 via RapidAPI.
 * - Global rate limiter: max 3 calls/hour
 * - In-memory cache with configurable TTLs
 * - All public methods return null on any error → caller falls back to mock
 */

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'tennisapi1.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

// ── Rate limiter ────────────────────────────────────────────────────────────

class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxCalls: number;
  private readonly windowMs: number;

  constructor(maxCalls = 3, windowMs = 3_600_000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  canCall(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    return this.timestamps.length < this.maxCalls;
  }

  record(): void {
    this.timestamps.push(Date.now());
  }

  get remaining(): number {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    return Math.max(0, this.maxCalls - this.timestamps.length);
  }
}

const rateLimiter = new RateLimiter(3, 3_600_000);

// ── Cache ───────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class TtlCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }
}

const cache = new TtlCache();

const TTL = {
  live: 20 * 60 * 1000,       // 20 min  — live scores
  short: 1 * 60 * 60 * 1000,  // 1 hr    — today's schedule
  medium: 2 * 60 * 60 * 1000, // 2 hr    — player / event detail
  long: 6 * 60 * 60 * 1000,   // 6 hr    — rankings
};

// ── Core fetch helper ───────────────────────────────────────────────────────

async function apiGet<T>(path: string): Promise<T | null> {
  if (!RAPIDAPI_KEY) return null;
  if (!rateLimiter.canCall()) {
    console.warn(`[real-api] Rate limit reached (${rateLimiter.remaining} calls remaining) — falling back to mock`);
    return null;
  }

  rateLimiter.record();
  console.log(`[real-api] GET ${path} (${rateLimiter.remaining} calls remaining this hour)`);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      console.warn(`[real-api] HTTP ${response.status} for ${path} — falling back to mock`);
      return null;
    }

    return (await response.json()) as T;
  } catch (err) {
    console.warn(`[real-api] Fetch error for ${path} — falling back to mock`, err);
    return null;
  }
}

// ── Public API methods ──────────────────────────────────────────────────────

export async function getRankings(tour: 'atp' | 'wta'): Promise<any | null> {
  const key = `rankings:${tour}`;
  const hit = cache.get<any>(key);
  if (hit) return hit;

  const data = await apiGet<any>(`/api/tennis/rankings/${tour}`);
  if (data) cache.set(key, data, TTL.long);
  return data;
}

export async function getPlayer(id: number | string): Promise<any | null> {
  const key = `player:${id}`;
  const hit = cache.get<any>(key);
  if (hit) return hit;

  const data = await apiGet<any>(`/api/tennis/player/${id}`);
  if (data) cache.set(key, data, TTL.medium);
  return data;
}

export async function searchTerm(term: string): Promise<any | null> {
  const key = `search:${term.toLowerCase()}`;
  const hit = cache.get<any>(key);
  if (hit) return hit;

  const data = await apiGet<any>(`/api/tennis/search/${encodeURIComponent(term)}`);
  if (data) cache.set(key, data, TTL.short);
  return data;
}

export async function getLiveEvents(): Promise<any | null> {
  const key = 'events:live';
  const hit = cache.get<any>(key);
  if (hit) return hit;

  const data = await apiGet<any>('/api/tennis/events/live');
  if (data) cache.set(key, data, TTL.live);
  return data;
}

export async function getTodayEvents(): Promise<any | null> {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const key = `events:${year}-${month}-${day}`;
  const hit = cache.get<any>(key);
  if (hit) return hit;

  const data = await apiGet<any>(`/api/tennis/events/${day}/${month}/${year}`);
  if (data) cache.set(key, data, TTL.short);
  return data;
}

export async function getEvent(id: number | string): Promise<any | null> {
  const key = `event:${id}`;
  const hit = cache.get<any>(key);
  if (hit) return hit;

  const data = await apiGet<any>(`/api/tennis/event/${id}`);
  if (data) cache.set(key, data, TTL.short);
  return data;
}

export async function getTournament(id: number | string): Promise<any | null> {
  const key = `tournament:${id}`;
  const hit = cache.get<any>(key);
  if (hit) return hit;

  const data = await apiGet<any>(`/api/tennis/tournament/${id}`);
  if (data) cache.set(key, data, TTL.medium);
  return data;
}

export async function getTournamentDraw(tournamentId: number | string, seasonId: number | string): Promise<any | null> {
  const key = `tournament-draw:${tournamentId}:${seasonId}`;
  const hit = cache.get<any>(key);
  if (hit) return hit;

  const data = await apiGet<any>(`/api/tennis/tournament/${tournamentId}/season/${seasonId}/cup-trees`);
  if (data) cache.set(key, data, TTL.medium);
  return data;
}

/**
 * Proxy: fetch a player image binary from RapidAPI.
 * Returns Buffer + content-type, or null on failure.
 */
export async function getPlayerImageBuffer(playerId: number | string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!RAPIDAPI_KEY) return null;
  if (!rateLimiter.canCall()) return null;

  rateLimiter.record();

  try {
    const response = await fetch(`${BASE_URL}/api/tennis/player/${playerId}/image`, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } catch {
    return null;
  }
}

/**
 * Proxy: fetch a country flag image binary from RapidAPI.
 */
export async function getFlagImageBuffer(code: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!RAPIDAPI_KEY) return null;
  if (!rateLimiter.canCall()) return null;

  rateLimiter.record();

  try {
    const response = await fetch(`${BASE_URL}/api/img/flag/${encodeURIComponent(code)}`, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } catch {
    return null;
  }
}
