import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';

export async function registerRoutes(server: FastifyInstance) {
  // POST /auth/register - Register new user and organization (public)
  server.post(
    '/auth/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password', 'org_name', 'user_name'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            org_name: { type: 'string', minLength: 1, maxLength: 100 },
            user_name: { type: 'string', minLength: 1, maxLength: 100 },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { email, password, org_name, user_name } = request.body as any;

      try {
        const result = await authService.register({ email, password, org_name, user_name });

        return reply.status(201).send({
          user: result.user,
          org: result.org,
          tokens: {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
          },
        });
      } catch (err: any) {
        if (err.statusCode) {
          return reply.code(err.statusCode).send({
            error: err.error,
            message: err.message,
          });
        }
        console.error('❌ Register error:', err);
        throw err;
      }
    }
  );

  // POST /auth/login - Login user (public)
  server.post(
    '/auth/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { email, password } = request.body as any;

      try {
        const result = await authService.login(email, password);

        return reply.send({
          user: result.user,
          org: result.org,
          tokens: {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
          },
        });
      } catch (err: any) {
        if (err.statusCode) {
          return reply.code(err.statusCode).send({
            error: err.error,
            message: err.message,
          });
        }
        console.error('❌ Login error:', err);
        throw err;
      }
    }
  );

  // POST /auth/refresh - Refresh access token (public, uses refresh token in body)
  server.post(
    '/auth/refresh',
    {
      schema: {
        body: {
          type: 'object',
          required: ['refresh_token'],
          properties: {
            refresh_token: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { refresh_token } = request.body as any;

      try {
        const result = await authService.refresh(refresh_token);

        return reply.send({
          tokens: {
            access_token: result.access_token,
          },
        });
      } catch (err: any) {
        if (err.statusCode) {
          return reply.code(err.statusCode).send({
            error: err.error,
            message: err.message,
          });
        }
        console.error('❌ Refresh error:', err);
        throw err;
      }
    }
  );
}
