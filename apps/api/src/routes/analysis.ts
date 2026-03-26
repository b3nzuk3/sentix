import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createValidator, getValidatedParams } from '../utils/validation';
import { createAnalysisService } from '../services/analysis.service';

export async function registerRoutes(server: FastifyInstance) {
  const analysisService = createAnalysisService(server.prisma);

  // GET /projects/:projectId/analysis - Latest completed Analysis with themes
  server.get('/projects/:projectId/analysis', {
    preValidation: [
      server.authenticate,
      createValidator(z.object({ projectId: z.string() }), 'params')
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { projectId } = getValidatedParams<{ projectId: string }>(request);

    const analysis = await analysisService.getLatestAnalysis(user.organization_id, projectId);
    return reply.send(analysis);
  });

  // GET /analysis/history/:projectId - All analyses for a project
  server.get('/analysis/history/:projectId', {
    preValidation: [
      server.authenticate,
      createValidator(z.object({ projectId: z.string() }), 'params')
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { projectId } = getValidatedParams<{ projectId: string }>(request);

    const analyses = await analysisService.getAnalysisHistory(user.organization_id, projectId);
    return reply.send(analyses);
  });

  // GET /analysis/:id - Full analysis details
  server.get('/analysis/:id', {
    preValidation: [
      server.authenticate,
      createValidator(z.object({ id: z.string() }), 'params')
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { id } = getValidatedParams<{ id: string }>(request);

    const analysis = await analysisService.getAnalysis(user.organization_id, id);
    return reply.send(analysis);
  });

  // DELETE /analysis/:id - Delete analysis (soft-cascade: remove AnalysisTheme records)
  server.delete('/analysis/:id', {
    preValidation: [
      server.authenticate,
      createValidator(z.object({ id: z.string() }), 'params')
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { id } = getValidatedParams<{ id: string }>(request);

    await analysisService.deleteAnalysis(user.organization_id, id);
    return reply.code(204).send();
  });

  // GET /trace/:analysisThemeId - Traceability: show evidence for a roadmap item
  server.get('/trace/:analysisThemeId', {
    preValidation: [
      server.authenticate,
      createValidator(z.object({ analysisThemeId: z.string() }), 'params')
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { analysisThemeId } = getValidatedParams<{ analysisThemeId: string }>(request);

    const trace = await analysisService.getTrace(user.organization_id, analysisThemeId);
    return reply.send(trace);
  });
}
