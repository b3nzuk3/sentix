import dotenv from 'dotenv';
dotenv.config();

import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import { PrismaClient } from '@prisma/client';
import AuthPlugin from './plugins/auth';
import { registerRoutes as registerAuth } from './routes/auth';
import { registerRoutes as registerProjects } from './routes/projects';
import { registerRoutes as registerSignals } from './routes/signals';
import { registerRoutes as registerSynthesize } from './routes/synthesize';
import { registerRoutes as registerAnalysis } from './routes/analysis';
import { registerRoutes as registerAdmin } from './routes/admin';

export async function createServer() {
  const server = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
    }
  });

  await server.register(fastifyCors, { origin: true, credentials: true });
  await server.register(fastifyHelmet);
  await server.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 hour'
  });

  const secret = process.env.API_SECRET_KEY;
  console.log('🔑 API_SECRET_KEY loaded:', secret ? 'YES' : 'NO', secret ? `(${secret.length} chars)` : '');
  if (!secret) throw new Error('Missing API_SECRET_KEY');

  await server.register(fastifyJwt, {
    secret,
    sign: { expiresIn: '15m' },
    verify: { maxAge: '15m' }
  });
  console.log('✅ fastify-jwt registered');

  await server.register(fastifyMultipart);

  // Set up Prisma directly on server to make it available to all plugins/routes
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  server.decorate('prisma', prisma);
  console.log('🔌 Prisma decorated server directly');
  // Log Prisma model keys safely
  const modelKeys = (Object.keys(prisma) as string[]).filter(
    (k) => typeof (prisma as any)[k] === 'object' && !k.startsWith('_')
  );
  console.log('🔧 Prisma client model keys:', modelKeys);

  // Disconnect Prisma on server close
  server.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  // Health check
  server.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register auth plugin and routes
  await server.register(AuthPlugin);
  registerAuth(server);

  // Register route groups
  registerProjects(server);
  registerSignals(server);
  registerSynthesize(server);
  registerAnalysis(server);
  registerAdmin(server);

  return server;
}
