import { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest, reply: any) => Promise<void> | void;
    redis?: Redis;
  }

  interface FastifyRequest {
    user: {
      id: string;
      organization_id: string;
      role: string;
    };
    prisma: PrismaClient;
    redis?: Redis;
  }

  interface RouteShorthandOptions {
    multipart?: boolean;
  }
}

export {};
