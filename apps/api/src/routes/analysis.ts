import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function registerRoutes(server: FastifyInstance) {
  // GET /projects/:projectId/analysis - Latest completed Analysis with themes
  server.get('/projects/:projectId/analysis', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { projectId } = request.params as { projectId: string };

    // Verify project belongs to user's org
    const project = await request.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organization_id !== user.organization_id) {
      throw reply.code(403).send({ error: 'Forbidden', message: 'Invalid project' });
    }

    const analysis = await request.prisma.analysis.findFirst({
      where: {
        project_id: projectId,
        status: 'COMPLETED',
      },
      orderBy: { created_at: 'desc' },
      include: {
        themes: {
          include: {
            theme: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!analysis) {
      throw reply.code(404).send({ error: 'NotFound', message: 'No completed analysis found' });
    }

    return reply.send(analysis);
  });

  // GET /analysis/history/:projectId - All analyses for a project
  server.get('/analysis/history/:projectId', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { projectId } = request.params as { projectId: string };

    // Verify project belongs to user's org
    const project = await request.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.organization_id !== user.organization_id) {
      throw reply.code(403).send({ error: 'Forbidden', message: 'Invalid project' });
    }

    const analyses = await request.prisma.analysis.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        status: true,
        total_revenue_lost: true,
        total_revenue_at_risk: true,
        theme_count: true,
        created_at: true,
        updated_at: true,
      },
    });

    return reply.send(analyses);
  });

  // GET /analysis/:id - Full analysis details
  server.get('/analysis/:id', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { id } = request.params as { id: string };

    const analysis = await request.prisma.analysis.findUnique({
      where: { id },
      include: {
        project: true,
        themes: {
          include: {
            theme: true,
          },
        },
      },
    });

    if (!analysis) {
      throw reply.code(404).send({ error: 'NotFound', message: 'Analysis not found' });
    }

    if (analysis.project.organization_id !== user.organization_id) {
      throw reply.code(403).send({ error: 'Forbidden', message: 'Access denied' });
    }

    return reply.send(analysis);
  });

  // DELETE /analysis/:id - Delete analysis (soft-cascade: remove AnalysisTheme records)
  server.delete('/analysis/:id', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { id } = request.params as { id: string };

    const analysis = await request.prisma.analysis.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!analysis) {
      throw reply.code(404).send({ error: 'NotFound', message: 'Analysis not found' });
    }

    if (analysis.project.organization_id !== user.organization_id) {
      throw reply.code(403).send({ error: 'Forbidden', message: 'Access denied' });
    }

    // Delete associated AnalysisTheme records first
    await request.prisma.analysisTheme.deleteMany({
      where: { analysis_id: id },
    });

    await request.prisma.analysis.delete({
      where: { id },
    });

    return reply.code(204).send();
  });

  // GET /trace/:analysisThemeId - Traceability: show evidence for a roadmap item
  server.get('/trace/:analysisThemeId', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { analysisThemeId } = request.params as { analysisThemeId: string };

    const analysisTheme = await request.prisma.analysisTheme.findUnique({
      where: { id: analysisThemeId },
      include: {
        theme: true,
        analysis: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!analysisTheme) {
      throw reply.code(404).send({ error: 'NotFound', message: 'Analysis theme not found' });
    }

    if (analysisTheme.analysis.project.organization_id !== user.organization_id) {
      throw reply.code(403).send({ error: 'Forbidden', message: 'Access denied' });
    }

    const signalIds = analysisTheme.evidence_ids as string[] || [];

    const signals = await request.prisma.signal.findMany({
      where: {
        id: { in: signalIds },
        project_id: analysisTheme.analysis.project_id,
      },
    });

    return reply.send({
      analysis_theme: {
        title: analysisTheme.title,
        roadmap_bucket: analysisTheme.roadmap_bucket,
        revenue_lost: analysisTheme.revenue_lost,
        revenue_at_risk: analysisTheme.revenue_at_risk,
        churn_probability: analysisTheme.churn_probability,
        effort_days: analysisTheme.effort_days,
        effort_bucket: analysisTheme.effort_bucket,
        confidence: analysisTheme.confidence,
        engine_outputs: analysisTheme.engine_outputs,
      },
      theme: {
        title: analysisTheme.theme.title,
        summary: analysisTheme.theme.summary,
      },
      signals,
    });
  });
}
