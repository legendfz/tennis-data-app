import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async (_request, reply) => {
    let dbStatus: 'ok' | 'error' = 'ok';

    try {
      await db.execute(sql`SELECT 1`);
    } catch {
      dbStatus = 'error';
    }

    const status = dbStatus === 'ok' ? 200 : 503;

    return reply.status(status).send({
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      services: {
        database: dbStatus,
      },
    });
  });
};
