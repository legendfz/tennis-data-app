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

const drawParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'id must be a positive integer'),
  seasonId: z.string().regex(/^\d+$/, 'seasonId must be a positive integer'),
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

export const tournamentRoutes: FastifyPluginAsync<RouteOptions> = async (app, opts) => {
  const { tennis } = opts;

  // GET /api/tournaments/:id
  app.get<{ Params: { id: string } }>('/tournaments/:id', async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'id must be a positive integer' });
    }
    try {
      const data = await tennis.tournaments.getTournamentDetails(parseInt(parsed.data.id));
      return reply.send({ data });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /api/tournaments/:id/draw/:seasonId
  app.get<{ Params: { id: string; seasonId: string } }>(
    '/tournaments/:id/draw/:seasonId',
    async (request, reply) => {
      const parsed = drawParamSchema.safeParse(request.params);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.errors[0]?.message ?? 'Invalid params' });
      }
      try {
        const data = await tennis.tournaments.getTournamentDraw(
          parseInt(parsed.data.id),
          parseInt(parsed.data.seasonId),
        );
        return reply.send({ data });
      } catch (err) {
        return handleError(err, reply);
      }
    },
  );
};
