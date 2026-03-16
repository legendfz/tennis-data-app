import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { env } from '../utils/env.js';

export function apiKeyAuth(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
): void {
  if (!env.API_KEY) {
    done();
    return;
  }

  const apiKey = request.headers['x-api-key'];

  if (!apiKey || apiKey !== env.API_KEY) {
    void reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or missing API key' });
    return;
  }

  done();
}
