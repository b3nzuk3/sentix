import fastify = require('fastify');
import { createServer } from '../server';

type FastifyInstance = fastify.FastifyInstance;

let server: FastifyInstance | null = null;
let serverPromise: Promise<FastifyInstance> | null = null;

export function getServer() {
  if (!serverPromise) {
    serverPromise = (async () => {
      server = await createServer();
      return server!;
    })();
  }
  return serverPromise!;
}

export function request() {
  const fastifyPromise = getServer();
  return {
    get: (url: string, options: any = {}) => fastifyPromise.then(fastify => fastify.inject({ method: 'GET', url, ...options })),
    post: (url: string, options: any = {}) => fastifyPromise.then(fastify => fastify.inject({ method: 'POST', url, ...options })),
    put: (url: string, options: any = {}) => fastifyPromise.then(fastify => fastify.inject({ method: 'PUT', url, ...options })),
    patch: (url: string, options: any = {}) => fastifyPromise.then(fastify => fastify.inject({ method: 'PATCH', url, ...options })),
    delete: (url: string, options: any = {}) => fastifyPromise.then(fastify => fastify.inject({ method: 'DELETE', url, ...options }))
  };
}

export function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}
