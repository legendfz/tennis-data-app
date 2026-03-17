import { Player, Tournament, Match, TournamentDraw } from '../../shared/types';
import playersData from './data/players.json';
import tournamentsData from './data/tournaments.json';
import matchesData from './data/matches.json';
import drawsData from './data/draws.json';

export const mockPlayers: Player[] = playersData as Player[];
export const mockTournaments: Tournament[] = tournamentsData as Tournament[];
export const mockMatches: Match[] = matchesData as Match[];
export const mockDraws: TournamentDraw[] = drawsData as TournamentDraw[];
