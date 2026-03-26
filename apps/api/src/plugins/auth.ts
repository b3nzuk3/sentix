import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

const authPlugin = fp(async (server: FastifyInstance) => {
  // Ensure authenticate decorator exists
  if (!server.authenticate) {
    server.decorate('authenticate', async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Unauthorized' });
      }
    });
  }
});

export default authPlugin;
