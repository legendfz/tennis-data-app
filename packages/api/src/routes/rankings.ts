import type { FastifyPluginAsync } from 'fastify';
import { ApiError } from '../client.js';
import type { TennisClient } from '../tennis/index.js';

interface RouteOptions {
  tennis: TennisClient;
}

function handleError(err: unknown, reply: any) {
  if (err instanceof ApiError) {
    return reply.status(err.statusCode).send({ error: err.message });
  }
  if (err instanceof Error) {
    return reply.status(500).send({ error: err.message });
  }
  return reply.status(500).send({ error: 'Internal server error' });
}

export const rankingsRoutes: FastifyPluginAsync<RouteOptions> = async (app, opts) => {
  const { tennis } = opts;

  // GET /api/rankings/atp
  app.get('/rankings/atp', async (_request, reply) => {
    try {
      const data = await tennis.rankings.getAtpRankings();
      return reply.send({ data });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /api/rankings/wta
  app.get('/rankings/wta', async (_request, reply) => {
    try {
      const data = await tennis.rankings.getWtaRankings();
      return reply.send({ data });
    } catch (err) {
      return handleError(err, reply);
    }
  });
};
