import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ApiError } from '../client.js';
import type { TennisClient } from '../tennis/index.js';

interface RouteOptions {
  tennis: TennisClient;
}

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'id must be a positive integer'),
});

const pageQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform((v) => (v ? parseInt(v) : 0)),
});

function handleError(err: unknown, reply: any) {
  if (err instanceof ApiError) {
    return reply.status(err.statusCode).send({ error: err.message });
  }
  if (err instanceof Error) {
    return reply.status(500).send({ error: err.message });
  }
  return reply.status(500).send({ error: 'Internal server error' });
}

export const playerRoutes: FastifyPluginAsync<RouteOptions> = async (app, opts) => {
  const { tennis } = opts;

  // GET /api/players/search/:term
  app.get<{ Params: { term: string } }>('/players/search/:term', async (request, reply) => {
    const { term } = request.params;
    if (!term || term.trim().length < 2) {
      return reply.status(400).send({ error: 'Search term must be at least 2 characters' });
    }
    try {
      const data = await tennis.players.searchPlayersAndTournaments(term.trim());
      return reply.send({ data });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /api/players/:id
  app.get<{ Params: { id: string } }>('/players/:id', async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'id must be a positive integer' });
    }
    try {
      const data = await tennis.players.getPlayerDetails(parseInt(parsed.data.id));
      return reply.send({ data });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /api/players/:id/matches?page=0
  app.get<{ Params: { id: string }; Querystring: { page?: string } }>(
    '/players/:id/matches',
    async (request, reply) => {
      const paramParsed = idParamSchema.safeParse(request.params);
      if (!paramParsed.success) {
        return reply.status(400).send({ error: 'id must be a positive integer' });
      }

      const queryParsed = pageQuerySchema.safeParse(request.query);
      if (!queryParsed.success) {
        return reply.status(400).send({ error: 'page must be a non-negative integer' });
      }

      try {
        const data = await tennis.players.getPlayerMatches(
          parseInt(paramParsed.data.id),
          queryParsed.data.page,
        );
        return reply.send({ data });
      } catch (err) {
        return handleError(err, reply);
      }
    },
  );
};
