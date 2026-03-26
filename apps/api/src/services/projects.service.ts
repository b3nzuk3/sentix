import { PrismaClient } from '@prisma/client';

export interface ProjectsService {
  listProjects(organizationId: string): Promise<any[]>;
  getProject(organizationId: string, projectId: string): Promise<any>;
  createProject(organizationId: string, data: { name: string; description?: string; team_id?: string }): Promise<any>;
  updateProject(organizationId: string, projectId: string, data: { name?: string; description?: string }): Promise<any>;
  deleteProject(organizationId: string, projectId: string): Promise<void>;
}

export function createProjectsService(prisma: PrismaClient): ProjectsService {
  return {
    async listProjects(organizationId) {
      return prisma.project.findMany({
        where: { organization_id: organizationId },
        include: {
          team: true,
          _count: {
            select: { signals: true, analyses: true },
          },
        },
        orderBy: { created_at: 'desc' },
      });
    },

    async getProject(organizationId, projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          team: true,
          signals: { orderBy: { created_at: 'desc' }, take: 5 },
          analyses: { orderBy: { created_at: 'desc' }, take: 5 },
          _count: { select: { signals: true, analyses: true, themes: true } },
        },
      });

      if (!project) {
        throw { statusCode: 404, error: 'NOT_FOUND', message: 'Project not found' };
      }

      if (project.organization_id !== organizationId) {
        throw { statusCode: 403, error: 'FORBIDDEN', message: 'Access denied' };
      }

      return project;
    },

    async createProject(organizationId, data) {
      // Validate team_id if provided
      if (data.team_id) {
        const team = await prisma.team.findUnique({
          where: { id: data.team_id },
        });
        if (!team || team.organization_id !== organizationId) {
          throw { statusCode: 400, error: 'BAD_REQUEST', message: 'Invalid team_id' };
        }
      }

      return prisma.project.create({
        data: {
          name: data.name,
          description: data.description,
          organization_id: organizationId,
          team_id: data.team_id,
        },
      });
    },

    async updateProject(organizationId, projectId, data) {
      const existing = await prisma.project.findUnique({ where: { id: projectId } });
      if (!existing) {
        throw { statusCode: 404, error: 'NOT_FOUND', message: 'Project not found' };
      }
      if (existing.organization_id !== organizationId) {
        throw { statusCode: 403, error: 'FORBIDDEN', message: 'Access denied' };
      }

      return prisma.project.update({
        where: { id: projectId },
        data,
      });
    },

    async deleteProject(organizationId, projectId) {
      const existing = await prisma.project.findUnique({ where: { id: projectId } });
      if (!existing) {
        throw { statusCode: 404, error: 'NOT_FOUND', message: 'Project not found' };
      }
      if (existing.organization_id !== organizationId) {
        throw { statusCode: 403, error: 'FORBIDDEN', message: 'Access denied' };
      }

      await prisma.project.delete({ where: { id: projectId } });
    },
  };
}
