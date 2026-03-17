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

const dateParamSchema = z.object({
  year: z.string().regex(/^\d{4}$/, 'year must be 4 digits'),
  month: z.string().regex(/^\d{1,2}$/, 'month must be 1-2 digits'),
  day: z.string().regex(/^\d{1,2}$/, 'day must be 1-2 digits'),
});

function handleError(err: unknown, reply: Parameters<FastifyPluginAsync>[0]['log'] extends unknown ? any : any) {
  if (err instanceof ApiError) {
    return reply.status(err.statusCode).send({ error: err.message });
  }
  if (err instanceof Error) {
    return reply.status(500).send({ error: err.message });
  }
  return reply.status(500).send({ error: 'Internal server error' });
}

export const matchRoutes: FastifyPluginAsync<RouteOptions> = async (app, opts) => {
  const { tennis } = opts;

  // GET /api/matches/live
  app.get('/matches/live', async (_request, reply) => {
    try {
      const data = await tennis.events.getLiveMatches();
      return reply.send({ data });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /api/matches/date/:year/:month/:day
  app.get<{ Params: { year: string; month: string; day: string } }>(
    '/matches/date/:year/:month/:day',
    async (request, reply) => {
      const parsed = dateParamSchema.safeParse(request.params);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.errors[0]?.message ?? 'Invalid date params' });
      }
      const { year, month, day } = parsed.data;
      try {
        const data = await tennis.events.getEventsByDate({
          year: parseInt(year),
          month: parseInt(month),
          day: parseInt(day),
        });
        return reply.send({ data });
      } catch (err) {
        return handleError(err, reply);
      }
    },
  );

  // GET /api/matches/:id
  app.get<{ Params: { id: string } }>('/matches/:id', async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'id must be a positive integer' });
    }
    try {
      const data = await tennis.events.getMatchDetails(parseInt(parsed.data.id));
      return reply.send({ data });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /api/matches/:id/statistics
  app.get<{ Params: { id: string } }>('/matches/:id/statistics', async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'id must be a positive integer' });
    }
    try {
      const data = await tennis.events.getMatchStatistics(parseInt(parsed.data.id));
      return reply.send({ data });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /api/matches/:id/h2h  — :id here is the customId (string like "player1-vs-player2")
  app.get<{ Params: { id: string } }>('/matches/:id/h2h', async (request, reply) => {
    const { id } = request.params;
    if (!id || id.trim() === '') {
      return reply.status(400).send({ error: 'id is required' });
    }
    try {
      const data = await tennis.events.getHeadToHead(id);
      return reply.send({ data });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // GET /api/matches/:id/point-by-point
  app.get<{ Params: { id: string } }>('/matches/:id/point-by-point', async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'id must be a positive integer' });
    }
    try {
      const data = await tennis.events.getPointByPoint(parseInt(parsed.data.id));
      return reply.send({ data });
    } catch (err) {
      return handleError(err, reply);
    }
  });
};
