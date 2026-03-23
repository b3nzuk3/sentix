import { FastifyPluginCallback } from 'fastify';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const plugin: FastifyPluginCallback = async (fastify) => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (instance) => {
    await prisma.$disconnect();
  });
};

export default plugin;
