/**
 * In-memory cache with TTL support (Map-based)
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(cleanupIntervalMs = 60_000) {
    // Periodically evict expired entries
    this.cleanupInterval = setInterval(() => {
      this.evictExpired();
    }, cleanupIntervalMs);
    // Don't block process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// TTL constants (seconds)
export const TTL = {
  LIVE: 60,           // 1 min  — live match data
  SHORT: 300,         // 5 min  — recent events / today's schedule
  MEDIUM: 1_800,      // 30 min — player details, H2H
  LONG: 3_600,        // 1 hr   — rankings, tournament info / static data
} as const;

// Singleton shared across the process
export const globalCache = new Cache();
