import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  createValidator,
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery
} from '../utils/validation';
import {
  uploadSignalsSchema,
  signalQuerySchema,
  projectIdParamSchema,
  signalIdParamSchema
} from '../schemas/signal';
import { createSignalsService } from '../services/signals.service';

export async function registerRoutes(server: FastifyInstance) {
  const signalsService = createSignalsService(server.prisma);

  // POST /signals/upload - Upload signals via file or manual entry
  server.post('/signals/upload', {
    preValidation: [server.authenticate, createValidator(uploadSignalsSchema, 'body')],
    multipart: true,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { project_id, source_type, files, text, account_name } = getValidatedBody<typeof uploadSignalsSchema._type>(request);

    const result = await signalsService.uploadSignals(
      user.organization_id,
      project_id,
      source_type,
      files,
      text,
      account_name
    );

    return reply.status(201).send(result);
  });

  // GET /projects/:projectId/signals - List signals for a project
  server.get('/projects/:projectId/signals', {
    preValidation: [
      server.authenticate,
      createValidator(projectIdParamSchema, 'params'),
      createValidator(signalQuerySchema, 'query')
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { projectId } = getValidatedParams<typeof projectIdParamSchema._type>(request);
    const { page = 1, limit = 50, source_type, account_name, from, to } = getValidatedQuery<typeof signalQuerySchema._type>(request);

    const result = await signalsService.listSignals(user.organization_id, projectId, {
      page,
      limit,
      source_type,
      account_name,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });

    return reply.send(result);
  });

  // GET /signals/:id - Get single signal
  server.get('/signals/:id', {
    preValidation: [
      server.authenticate,
      createValidator(signalIdParamSchema, 'params')
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { id } = getValidatedParams<typeof signalIdParamSchema._type>(request);

    const signal = await signalsService.getSignal(user.organization_id, id);
    return reply.send(signal);
  });

  // DELETE /signals/:id - Delete a signal
  server.delete('/signals/:id', {
    preValidation: [
      server.authenticate,
      createValidator(signalIdParamSchema, 'params')
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { id } = getValidatedParams<typeof signalIdParamSchema._type>(request);

    await signalsService.deleteSignal(user.organization_id, id);
    return reply.code(204).send();
  });
}
