import { createServer } from '../server';
import type { FastifyInstance } from 'fastify';

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

interface TestResponse {
  status: number;
  body: any;
  headers: Record<string, string>;
  raw: any;
}

export function request() {
  const fastifyPromise = getServer();
  const transform = (injectPromise: Promise<any>): Promise<TestResponse> => {
    return injectPromise.then(res => ({
      status: res.statusCode,
      body: res.json ? res.json() : res.body,
      headers: res.headers,
      raw: res.raw
    })) as Promise<TestResponse>;
  };

  return {
    get: (url: string, options: any = {}) => transform(fastifyPromise.then(fastify => fastify.inject({ method: 'GET', url, ...options }))),
    post: (url: string, options: any = {}) => transform(fastifyPromise.then(fastify => fastify.inject({ method: 'POST', url, ...options }))),
    put: (url: string, options: any = {}) => transform(fastifyPromise.then(fastify => fastify.inject({ method: 'PUT', url, ...options }))),
    patch: (url: string, options: any = {}) => transform(fastifyPromise.then(fastify => fastify.inject({ method: 'PATCH', url, ...options }))),
    delete: (url: string, options: any = {}) => transform(fastifyPromise.then(fastify => fastify.inject({ method: 'DELETE', url, ...options })))
  };
}

export function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}
