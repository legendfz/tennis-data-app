import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '../../../.env') });

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createTennisClient } from './tennis/index.js';

const app = Fastify({ logger: true });
const tennis = createTennisClient();

await app.register(cors, { origin: true });

// Health
app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Matches
app.get('/api/matches/live', async (_req, reply) => {
  try {
    const data = await tennis.events.getLiveMatches();
    return { data };
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
});

app.get<{ Params: { year: string; month: string; day: string } }>(
  '/api/matches/date/:year/:month/:day',
  async (req, reply) => {
    try {
      const { year, month, day } = req.params;
      const data = await tennis.events.getEventsByDate({
        year: parseInt(year), month: parseInt(month), day: parseInt(day),
      });
      return { data };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  },
);

app.get<{ Params: { id: string } }>('/api/matches/:id', async (req, reply) => {
  try {
    const data = await tennis.events.getMatchDetails(parseInt(req.params.id));
    return { data };
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
});

app.get<{ Params: { id: string } }>('/api/matches/:id/statistics', async (req, reply) => {
  try {
    const data = await tennis.events.getMatchStatistics(parseInt(req.params.id));
    return { data };
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
});

app.get<{ Params: { id: string } }>('/api/matches/:id/h2h', async (req, reply) => {
  try {
    const data = await tennis.events.getHeadToHead(req.params.id);
    return { data };
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
});

app.get<{ Params: { id: string } }>('/api/matches/:id/point-by-point', async (req, reply) => {
  try {
    const data = await tennis.events.getPointByPoint(parseInt(req.params.id));
    return { data };
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
});

// Players
app.get<{ Params: { term: string } }>('/api/players/search/:term', async (req, reply) => {
  try {
    const data = await tennis.players.searchPlayersAndTournaments(req.params.term);
    return { data };
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
});

app.get<{ Params: { id: string } }>('/api/players/:id', async (req, reply) => {
  try {
    const data = await tennis.players.getPlayerDetails(parseInt(req.params.id));
    return { data };
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
});

app.get<{ Params: { id: string }; Querystring: { page?: string } }>(
  '/api/players/:id/matches',
  async (req, reply) => {
    try {
      const page = parseInt(req.query.page ?? '0');
      const data = await tennis.players.getPlayerMatches(parseInt(req.params.id), page);
      return { data };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  },
);

// Rankings
app.get('/api/rankings/atp', async (_req, reply) => {
  try {
    const data = await tennis.rankings.getAtpRankings();
    return { data };
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
});

app.get('/api/rankings/wta', async (_req, reply) => {
  try {
    const data = await tennis.rankings.getWtaRankings();
    return { data };
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
});

// Tournaments
app.get<{ Params: { id: string } }>('/api/tournaments/:id', async (req, reply) => {
  try {
    const data = await tennis.tournaments.getTournamentDetails(parseInt(req.params.id));
    return { data };
  } catch (err: any) {
    return reply.status(500).send({ error: err.message });
  }
});

app.get<{ Params: { id: string; seasonId: string } }>(
  '/api/tournaments/:id/draw/:seasonId',
  async (req, reply) => {
    try {
      const data = await tennis.tournaments.getTournamentDraw(
        parseInt(req.params.id), parseInt(req.params.seasonId),
      );
      return { data };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  },
);

// Start
const PORT = parseInt(process.env.PORT ?? '3001');
await app.listen({ port: PORT, host: '0.0.0.0' });
console.log(`🎾 TennisHQ API running on http://localhost:${PORT}`);
