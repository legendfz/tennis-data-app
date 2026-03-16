/**
 * TennisApi1 provider — full implementation against tennisapi1.p.rapidapi.com
 *
 * API base path: https://tennisapi1.p.rapidapi.com/api/tennis/...
 */

import { TennisHttpClient } from '../client.js';
import { BaseProvider } from './base.js';
import type { SearchResults } from './base.js';
import type {
  TennisEvent,
  MatchStatistics,
  HeadToHead,
  PointByPoint,
  EventsByDateParams,
} from '../types/events.js';
import type { TennisPlayer, PlayerMatchesPage } from '../types/players.js';
import type { TournamentInfo, TournamentDraw } from '../types/tournaments.js';
import type { RankingsPage } from '../types/rankings.js';

// Raw response wrappers from the API
interface EventsResponse { events?: TennisEvent[] }
interface EventResponse { event?: TennisEvent }
interface StatisticsResponse { statistics?: MatchStatistics['periods'] }
interface H2HResponse { teamDuel?: HeadToHead['teamDuel']; events?: TennisEvent[]; previousEvent?: TennisEvent }
interface PlayerResponse { player?: TennisPlayer }
interface RankingsResponse { rankings?: RankingsPage['rankings'] }
interface TournamentResponse { uniqueTournament?: TournamentInfo }
interface DrawResponse { cupTrees?: TournamentDraw['cupTrees'] }
interface SearchResponse {
  results?: Array<{
    type: string;
    entity: TennisPlayer & TournamentInfo;
  }>;
}
interface PbPResponse { pointByPoint?: PointByPoint['pointByPoint'] }

export class TennisApi1Provider extends BaseProvider {
  readonly name = 'TennisApi1';
  private client: TennisHttpClient;

  constructor(apiKey: string, host = 'tennisapi1.p.rapidapi.com') {
    super();
    this.client = new TennisHttpClient({ apiKey, host });
  }

  // ── Events ────────────────────────────────────────────────────────────────

  async getLiveMatches(): Promise<TennisEvent[]> {
    const data = await this.client.get<EventsResponse>('/api/tennis/events/live');
    return data.events ?? [];
  }

  async getEventsByDate({ day, month, year }: EventsByDateParams): Promise<TennisEvent[]> {
    const data = await this.client.get<EventsResponse>(
      `/api/tennis/events/${day}/${month}/${year}`,
    );
    return data.events ?? [];
  }

  async getMatchDetails(eventId: number): Promise<TennisEvent> {
    const data = await this.client.get<EventResponse>(`/api/tennis/event/${eventId}`);
    if (!data.event) throw new Error(`No event found for id ${eventId}`);
    return data.event;
  }

  async getMatchStatistics(eventId: number): Promise<MatchStatistics> {
    const data = await this.client.get<StatisticsResponse>(
      `/api/tennis/event/${eventId}/statistics`,
    );
    return { periods: data.statistics ?? [] };
  }

  async getHeadToHead(customId: string): Promise<HeadToHead> {
    const data = await this.client.get<H2HResponse>(`/api/tennis/event/${customId}/h2h`);
    return {
      teamDuel: data.teamDuel,
      events: data.events ?? [],
      previousEvent: data.previousEvent,
    };
  }

  async getPointByPoint(eventId: number): Promise<PointByPoint> {
    const data = await this.client.get<PbPResponse>(
      `/api/tennis/event/${eventId}/point-by-point`,
    );
    return { pointByPoint: data.pointByPoint };
  }

  // ── Players ───────────────────────────────────────────────────────────────

  async getPlayerDetails(playerId: number): Promise<TennisPlayer> {
    const data = await this.client.get<PlayerResponse>(`/api/tennis/player/${playerId}`);
    if (!data.player) throw new Error(`No player found for id ${playerId}`);
    return data.player;
  }

  async getPlayerMatches(playerId: number, page = 0): Promise<PlayerMatchesPage> {
    const data = await this.client.get<EventsResponse & { hasNextPage?: boolean }>(
      `/api/tennis/player/${playerId}/events/previous/${page}`,
    );
    return {
      events: data.events ?? [],
      hasNextPage: data.hasNextPage ?? false,
    };
  }

  // ── Rankings ──────────────────────────────────────────────────────────────

  async getAtpRankings(): Promise<RankingsPage> {
    const data = await this.client.get<RankingsResponse>('/api/tennis/rankings/atp');
    return { rankings: data.rankings ?? [], type: 'atp' };
  }

  async getWtaRankings(): Promise<RankingsPage> {
    const data = await this.client.get<RankingsResponse>('/api/tennis/rankings/wta');
    return { rankings: data.rankings ?? [], type: 'wta' };
  }

  // ── Tournaments ───────────────────────────────────────────────────────────

  async getTournamentDetails(tournamentId: number): Promise<TournamentInfo> {
    const data = await this.client.get<TournamentResponse>(
      `/api/tennis/tournament/${tournamentId}`,
    );
    if (!data.uniqueTournament) throw new Error(`No tournament found for id ${tournamentId}`);
    return data.uniqueTournament as TournamentInfo;
  }

  async getTournamentDraw(tournamentId: number, seasonId: number): Promise<TournamentDraw> {
    const data = await this.client.get<DrawResponse>(
      `/api/tennis/tournament/${tournamentId}/season/${seasonId}/cup-trees`,
    );
    return { cupTrees: data.cupTrees ?? [] };
  }

  // ── Search ────────────────────────────────────────────────────────────────

  async searchPlayersAndTournaments(term: string): Promise<SearchResults> {
    const encoded = encodeURIComponent(term);
    const data = await this.client.get<SearchResponse>(`/api/tennis/search/${encoded}`);
    const results = data.results ?? [];

    const players: TennisPlayer[] = [];
    const tournaments: TournamentInfo[] = [];

    for (const r of results) {
      if (r.type === 'player' || r.type === 'team') {
        players.push(r.entity as TennisPlayer);
      } else if (r.type === 'uniqueTournament' || r.type === 'tournament') {
        tournaments.push(r.entity as TournamentInfo);
      }
    }

    return { players, tournaments };
  }
}
