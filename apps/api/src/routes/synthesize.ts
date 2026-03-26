import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { synthesizeSchema, jobIdParamSchema } from '../schemas/synthesize';
import { createValidator, getValidatedBody, getValidatedParams } from '../utils/validation';
import { createSynthesizeService } from '../services/synthesize.service';

export async function registerRoutes(server: FastifyInstance) {
  const synthesizeService = createSynthesizeService(server.prisma);

  // POST /synthesize - Trigger synthesis job
  server.post('/synthesize', {
    preValidation: [server.authenticate, createValidator(synthesizeSchema, 'body')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { project_id, options } = getValidatedBody<typeof synthesizeSchema._type>(request);

    const result = await synthesizeService.triggerSynthesis(user.organization_id, project_id, user.id, options);
    return reply.status(202).send(result);
  });

  // GET /synthesize/:job_id - Poll job status
  server.get('/synthesize/:job_id', {
    preValidation: [
      server.authenticate,
      createValidator(jobIdParamSchema, 'params')
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { job_id } = getValidatedParams<{ job_id: string }>(request);

    const response = await synthesizeService.getJobStatus(job_id, user.organization_id);
    return reply.send(response);
  });
}
