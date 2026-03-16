/**
 * Shared TypeScript types for TennisHQ API
 */

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

// Tennis domain types (stubs — expand as schema is built)
export type Surface = 'hard' | 'clay' | 'grass' | 'carpet';

export type TournamentLevel = 'grand_slam' | 'masters_1000' | 'atp_500' | 'atp_250' | 'challenger' | 'itf';

export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'cancelled' | 'postponed';

export type Hand = 'right' | 'left';
