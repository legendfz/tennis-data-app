import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { healthRoutes } from './routes/health.js';
import { env } from './utils/env.js';

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport:
      env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

// Plugins
await app.register(helmet);
await app.register(cors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
});
await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Routes
await app.register(healthRoutes, { prefix: '/api' });

// Start
const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`TennisHQ API running on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

await start();
