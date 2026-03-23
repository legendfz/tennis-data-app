/**
 * Base HTTP client for RapidAPI-hosted tennis APIs.
 * Handles authentication headers, rate-limit retries, and basic error parsing.
 */

export interface RapidApiConfig {
  apiKey: string;
  host: string;
  baseUrl?: string;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly isRateLimit: boolean = false,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Global rate limiter — max 3 API calls per hour across all providers.
 * Ensures we stay well within free tier limits long-term.
 */
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
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    return this.timestamps.length < this.maxCalls;
  }

  record(): void {
    this.timestamps.push(Date.now());
  }

  get remaining(): number {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    return Math.max(0, this.maxCalls - this.timestamps.length);
  }

  get nextAvailableIn(): number {
    if (this.canCall()) return 0;
    const oldest = this.timestamps[0];
    return oldest + this.windowMs - Date.now();
  }
}

const globalRateLimiter = new RateLimiter(3, 3_600_000); // 3 calls per hour

export { globalRateLimiter };

export class TennisHttpClient {
  private readonly apiKey: string;
  private readonly host: string;
  private readonly baseUrl: string;

  constructor(config: RapidApiConfig) {
    this.apiKey = config.apiKey;
    this.host = config.host;
    this.baseUrl = config.baseUrl ?? `https://${config.host}`;
  }

  private buildHeaders(): Record<string, string> {
    return {
      'x-rapidapi-key': this.apiKey,
      'x-rapidapi-host': this.host,
      'Content-Type': 'application/json',
    };
  }

  async get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, String(v));
      }
    }

    // Enforce global rate limit (3 calls/hour)
    if (!globalRateLimiter.canCall()) {
      const waitMs = globalRateLimiter.nextAvailableIn;
      throw new ApiError(429, `Rate limit: ${globalRateLimiter.remaining} calls remaining. Next available in ${Math.ceil(waitMs / 60000)}min`, true);
    }
    globalRateLimiter.record();

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      const isRateLimit = response.status === 429;
      let message = `HTTP ${response.status}`;
      try {
        const body = await response.json() as { message?: string };
        if (body.message) message = body.message;
      } catch {
        // ignore JSON parse error
      }
      throw new ApiError(response.status, message, isRateLimit);
    }

    return response.json() as Promise<T>;
  }
}
