import dotenv from 'dotenv';
dotenv.config();

import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';
import fastifyMultipart from '@fastify/multipart';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerRoutes as registerProjects } from './routes/projects';
import { registerRoutes as registerSignals } from './routes/signals';
import { registerRoutes as registerSynthesize } from './routes/synthesize';
import { registerRoutes as registerAnalysis } from './routes/analysis';
import { registerRoutes as registerAdmin } from './routes/admin';
import { signAccessToken, signRefreshToken } from './utils/auth';

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

  // Add authenticate hook
  server.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  console.log('🔐 server.authenticate exists:', !!server.authenticate);

  await server.register(fastifyMultipart);

  // Set up Prisma directly on server to make it available to all plugins/routes
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  server.decorate('prisma', prisma);
  console.log('🔌 Prisma decorated server directly');
  console.log('🔧 Prisma client model keys:', Object.keys(prisma).filter(k => typeof prisma[k] === 'object' && k !== '$$' && !k.startsWith('_')));

  // Disconnect Prisma on server close
  server.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  // Health check
  server.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Auth routes (inline to avoid encapsulation issues)
  server.post('/auth/register', async (request: any, reply: any) => {
    try {
      const { email, password, org_name, user_name } = request.body;
      console.error('>>>REGISTER HANDLER START<<<', { email, org_name, user_name });

      // Check if user already exists
      const existing = await server.prisma.user.findUnique({ where: { email } });
      if (existing) {
        return reply.code(400).send({ error: 'UserAlreadyExists', message: 'User already exists' });
      }

      const password_hash = await bcrypt.hash(password, 10);

      // Generate unique slug for organization by appending a random suffix
      const baseSlug = org_name.toLowerCase().replace(/\s+/g, '-');
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const slug = `${baseSlug}-${randomSuffix}`;

      const result = await server.prisma.$transaction(async (tx: any) => {
        const org = await tx.organization.create({
          data: {
            name: org_name,
            slug
          }
        });

        const user = await tx.user.create({
          data: {
            email,
            password_hash,
            name: user_name,
            organization_id: org.id,
            role: 'ADMIN'
          }
        });

        return { user, org };
      });

      const access_token = signAccessToken({
        user_id: result.user.id,
        org_id: result.org.id,
        role: result.user.role
      });

      const refresh_token = signRefreshToken({
        user_id: result.user.id,
        org_id: result.org.id,
        role: result.user.role
      });

      return reply.status(201).send({
        user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role },
        org: { id: result.org.id, name: result.org.name, slug: result.org.slug },
        tokens: { access_token, refresh_token }
      });
    } catch (err) {
      console.error('❌ Register error:', err);
      throw err;
    }
  });

  server.post('/auth/login', async (request: any, reply: any) => {
    const { email, password } = request.body;

    const user = await server.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.code(401).send({ error: 'InvalidCredentials', message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return reply.code(401).send({ error: 'InvalidCredentials', message: 'Invalid credentials' });
    }

    const org = await server.prisma.organization.findUnique({
      where: { id: user.organization_id }
    });

    if (!org) {
      return reply.code(500).send({ error: 'OrganizationNotFound', message: 'Organization not found' });
    }

    const access_token = signAccessToken({
      user_id: user.id,
      org_id: user.organization_id,
      role: user.role
    });

    const refresh_token = signRefreshToken({
      user_id: user.id,
      org_id: user.organization_id,
      role: user.role
    });

    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      org: { id: org.id, name: org.name, slug: org.slug },
      tokens: { access_token, refresh_token }
    });
  });

  server.post('/auth/refresh', async (request: any, reply: any) => {
    const { refresh_token } = request.body;

    try {
      const decoded = jwt.verify(refresh_token, process.env.API_SECRET_KEY!) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Not a refresh token');
      }

      const user = await server.prisma.user.findUnique({
        where: { id: decoded.user_id }
      });

      if (!user) {
        return reply.code(401).send({ error: 'UserNotFound', message: 'User not found' });
      }

      const newAccessToken = signAccessToken({
        user_id: user.id,
        org_id: user.organization_id,
        role: user.role
      });

      return reply.send({ tokens: { access_token: newAccessToken } });
    } catch (err) {
      // If token invalid, return 401
      return reply.code(401).send({ error: 'InvalidRefreshToken', message: 'Invalid refresh token' });
    }
  });

  // Register route groups
  registerProjects(server);
  registerSignals(server);
  registerSynthesize(server);
  registerAnalysis(server);
  registerAdmin(server);

  return server;
}
