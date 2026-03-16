/**
 * Ultimate Tennis provider stub — ultimate-tennis1.p.rapidapi.com
 * Not yet implemented; placeholder for future multi-provider support.
 */

import { BaseProvider } from './base.js';
import type { SearchResults } from './base.js';
import type { TennisEvent, MatchStatistics, HeadToHead, PointByPoint, EventsByDateParams } from '../types/events.js';
import type { TennisPlayer, PlayerMatchesPage } from '../types/players.js';
import type { TournamentInfo, TournamentDraw } from '../types/tournaments.js';
import type { RankingsPage } from '../types/rankings.js';

export class UltimateTennisProvider extends BaseProvider {
  readonly name = 'UltimateTennis';

  private notImplemented(): never {
    throw new Error(`${this.name} provider is not yet implemented`);
  }

  getLiveMatches(): Promise<TennisEvent[]> { return this.notImplemented(); }
  getEventsByDate(_p: EventsByDateParams): Promise<TennisEvent[]> { return this.notImplemented(); }
  getMatchDetails(_id: number): Promise<TennisEvent> { return this.notImplemented(); }
  getMatchStatistics(_id: number): Promise<MatchStatistics> { return this.notImplemented(); }
  getHeadToHead(_customId: string): Promise<HeadToHead> { return this.notImplemented(); }
  getPointByPoint(_id: number): Promise<PointByPoint> { return this.notImplemented(); }
  getPlayerDetails(_id: number): Promise<TennisPlayer> { return this.notImplemented(); }
  getPlayerMatches(_id: number, _page?: number): Promise<PlayerMatchesPage> { return this.notImplemented(); }
  getAtpRankings(): Promise<RankingsPage> { return this.notImplemented(); }
  getWtaRankings(): Promise<RankingsPage> { return this.notImplemented(); }
  getTournamentDetails(_id: number): Promise<TournamentInfo> { return this.notImplemented(); }
  getTournamentDraw(_id: number, _seasonId: number): Promise<TournamentDraw> { return this.notImplemented(); }
  searchPlayersAndTournaments(_term: string): Promise<SearchResults> { return this.notImplemented(); }
}
