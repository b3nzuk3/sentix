import { PrismaClient } from '@prisma/client';

export interface AnalysisService {
  getLatestAnalysis(organizationId: string, projectId: string): Promise<any>;
  getAnalysisHistory(organizationId: string, projectId: string): Promise<any[]>;
  getAnalysis(organizationId: string, analysisId: string): Promise<any>;
  deleteAnalysis(organizationId: string, analysisId: string): Promise<void>;
  getTrace(organizationId: string, analysisThemeId: string): Promise<any>;
}

export function createAnalysisService(prisma: PrismaClient): AnalysisService {
  return {
    async getLatestAnalysis(organizationId, projectId) {
      // Verify project belongs to org
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.organization_id !== organizationId) {
        throw { statusCode: 403, error: 'FORBIDDEN', message: 'Invalid project' };
      }

      const analysis = await prisma.analysis.findFirst({
        where: {
          project_id: projectId,
          status: 'COMPLETED',
        },
        orderBy: { created_at: 'desc' },
        include: {
          themes: {
            include: { theme: true },
            orderBy: { created_at: 'desc' },
          },
        },
      });

      if (!analysis) {
        throw { statusCode: 404, error: 'NOT_FOUND', message: 'No completed analysis found' };
      }

      return analysis;
    },

    async getAnalysisHistory(organizationId, projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.organization_id !== organizationId) {
        throw { statusCode: 403, error: 'FORBIDDEN', message: 'Invalid project' };
      }

      const analyses = await prisma.analysis.findMany({
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

      return analyses;
    },

    async getAnalysis(organizationId, analysisId) {
      const analysis = await prisma.analysis.findUnique({
        where: { id: analysisId },
        include: {
          project: true,
          themes: {
            include: { theme: true },
          },
        },
      });

      if (!analysis) {
        throw { statusCode: 404, error: 'NOT_FOUND', message: 'Analysis not found' };
      }

      if (analysis.project.organization_id !== organizationId) {
        throw { statusCode: 403, error: 'FORBIDDEN', message: 'Access denied' };
      }

      return analysis;
    },

    async deleteAnalysis(organizationId, analysisId) {
      const analysis = await prisma.analysis.findUnique({
        where: { id: analysisId },
        include: { project: true },
      });

      if (!analysis) {
        throw { statusCode: 404, error: 'NOT_FOUND', message: 'Analysis not found' };
      }

      if (analysis.project.organization_id !== organizationId) {
        throw { statusCode: 403, error: 'FORBIDDEN', message: 'Access denied' };
      }

      // Delete associated AnalysisTheme records first
      await prisma.analysisTheme.deleteMany({
        where: { analysis_id: analysisId },
      });

      await prisma.analysis.delete({ where: { id: analysisId } });
    },

    async getTrace(organizationId, analysisThemeId) {
      const analysisTheme = await prisma.analysisTheme.findUnique({
        where: { id: analysisThemeId },
        include: {
          theme: true,
          analysis: {
            include: { project: true },
          },
        },
      });

      if (!analysisTheme) {
        throw { statusCode: 404, error: 'NOT_FOUND', message: 'Analysis theme not found' };
      }

      if (analysisTheme.analysis.project.organization_id !== organizationId) {
        throw { statusCode: 403, error: 'FORBIDDEN', message: 'Access denied' };
      }

      const signalIds = (analysisTheme.evidence_ids as string[]) || [];

      const signals = await prisma.signal.findMany({
        where: {
          id: { in: signalIds },
          project_id: analysisTheme.analysis.project_id,
        },
      });

      return {
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
      };
    },
  };
}
