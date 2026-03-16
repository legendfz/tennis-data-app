/**
 * Abstract provider interface — all data providers must implement this contract.
 */

import type { TennisEvent, MatchStatistics, HeadToHead, PointByPoint, EventsByDateParams } from '../types/events.js';
import type { TennisPlayer, PlayerMatchesPage } from '../types/players.js';
import type { TournamentInfo, TournamentDraw } from '../types/tournaments.js';
import type { RankingsPage } from '../types/rankings.js';

export interface SearchResults {
  players: TennisPlayer[];
  tournaments: TournamentInfo[];
}

export abstract class BaseProvider {
  abstract readonly name: string;

  // Events / Matches
  abstract getLiveMatches(): Promise<TennisEvent[]>;
  abstract getEventsByDate(params: EventsByDateParams): Promise<TennisEvent[]>;
  abstract getMatchDetails(eventId: number): Promise<TennisEvent>;
  abstract getMatchStatistics(eventId: number): Promise<MatchStatistics>;
  abstract getHeadToHead(customId: string): Promise<HeadToHead>;
  abstract getPointByPoint(eventId: number): Promise<PointByPoint>;

  // Players
  abstract getPlayerDetails(playerId: number): Promise<TennisPlayer>;
  abstract getPlayerMatches(playerId: number, page?: number): Promise<PlayerMatchesPage>;

  // Rankings
  abstract getAtpRankings(): Promise<RankingsPage>;
  abstract getWtaRankings(): Promise<RankingsPage>;

  // Tournaments
  abstract getTournamentDetails(tournamentId: number): Promise<TournamentInfo>;
  abstract getTournamentDraw(tournamentId: number, seasonId: number): Promise<TournamentDraw>;

  // Search
  abstract searchPlayersAndTournaments(term: string): Promise<SearchResults>;
}
