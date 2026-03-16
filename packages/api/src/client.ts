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
