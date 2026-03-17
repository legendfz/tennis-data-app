import axios from 'axios';

const API_BASE = 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Image URLs via proxy
export const getPlayerImageUrl = (playerId: number | string) =>
  `${API_BASE}/api/images/player/${playerId}`;

export const getFlagUrl = (alpha2: string) =>
  `${API_BASE}/api/images/flag/${alpha2}`;

export const getTournamentImageUrl = (tournamentId: number | string) =>
  `${API_BASE}/api/images/tournament/${tournamentId}`;

// API calls
export const api = {
  getLiveMatches: () =>
    apiClient.get('/api/matches/live').then((r) => r.data.data),

  getMatchesByDate: (year: number, month: number, day: number) =>
    apiClient
      .get(`/api/matches/date/${year}/${month}/${day}`)
      .then((r) => r.data.data),

  getMatch: (id: string | number) =>
    apiClient.get(`/api/matches/${id}`).then((r) => r.data.data),

  getMatchStatistics: (id: string | number) =>
    apiClient.get(`/api/matches/${id}/statistics`).then((r) => r.data.data),

  getMatchH2H: (id: string | number) =>
    apiClient.get(`/api/matches/${id}/h2h`).then((r) => r.data.data),

  getMatchPointByPoint: (id: string | number) =>
    apiClient.get(`/api/matches/${id}/point-by-point`).then((r) => r.data.data),

  searchPlayers: (term: string) =>
    apiClient.get(`/api/players/search/${encodeURIComponent(term)}`).then((r) => r.data.data),

  getPlayer: (id: string | number) =>
    apiClient.get(`/api/players/${id}`).then((r) => r.data.data),

  getPlayerMatches: (id: string | number, page = 0) =>
    apiClient.get(`/api/players/${id}/matches?page=${page}`).then((r) => r.data.data),

  getAtpRankings: () =>
    apiClient.get('/api/rankings/atp').then((r) => r.data.data),

  getWtaRankings: () =>
    apiClient.get('/api/rankings/wta').then((r) => r.data.data),

  getTournament: (id: string | number) =>
    apiClient.get(`/api/tournaments/${id}`).then((r) => r.data.data),

  getTournamentDraw: (id: string | number, seasonId: string | number) =>
    apiClient
      .get(`/api/tournaments/${id}/draw/${seasonId}`)
      .then((r) => r.data.data),
};
