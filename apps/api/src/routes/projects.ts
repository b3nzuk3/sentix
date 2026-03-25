import fastify = require('fastify');
import { ZodError } from 'zod';
import { createProjectSchema, updateProjectSchema } from '../schemas/project';

type FastifyInstance = fastify.FastifyInstance;
type FastifyRequest = fastify.FastifyRequest;
type FastifyReply = fastify.FastifyReply;

export async function registerRoutes(server: FastifyInstance) {
  // GET /projects - List projects user has access to
  server.get('/projects', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const projects = await request.server.prisma.project.findMany({
      where: {
        organization_id: user.organization_id,
      },
      include: {
        team: true,
        _count: {
          select: {
            signals: true,
            analyses: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return reply.send(projects);
  });

  // GET /projects/:id - Get project with details
  server.get('/projects/:id', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { id } = request.params as { id: string };

    const project = await request.server.prisma.project.findUnique({
      where: { id },
      include: {
        team: true,
        signals: {
          orderBy: { created_at: 'desc' },
          take: 5,
        },
        analyses: {
          orderBy: { created_at: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            signals: true,
            analyses: true,
            themes: true,
          },
        },
      },
    });

    if (!project) {
      throw reply.code(404).send({ error: 'NotFound', message: 'Project not found' });
    }

    if (project.organization_id !== user.organization_id) {
      throw reply.code(403).send({ error: 'Forbidden', message: 'Access denied' });
    }

    return reply.send(project);
  });

  // POST /projects - Create new project
  server.post('/projects', {
    preValidation: [server.authenticate],
    schema: { body: createProjectSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const body = request.body as any;

    // Validate team_id belongs to user's org if provided
    if (body.team_id) {
      const team = await request.server.prisma.team.findUnique({
        where: { id: body.team_id },
      });
      if (!team || team.organization_id !== user.organization_id) {
        throw reply.code(400).send({ error: 'BadRequest', message: 'Invalid team_id' });
      }
    }

    const project = await request.server.prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        organization_id: user.organization_id,
        team_id: body.team_id,
      },
    });

    return reply.status(201).send(project);
  });

  // PATCH /projects/:id - Update project
  server.patch('/projects/:id', {
    preValidation: [server.authenticate],
    schema: { body: updateProjectSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const existing = await request.server.prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      throw reply.code(404).send({ error: 'NotFound', message: 'Project not found' });
    }

    if (existing.organization_id !== user.organization_id) {
      throw reply.code(403).send({ error: 'Forbidden', message: 'Access denied' });
    }

    const project = await request.server.prisma.project.update({
      where: { id },
      data: body,
    });

    return reply.send(project);
  });

  // DELETE /projects/:id - Delete project
  server.delete('/projects/:id', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { id } = request.params as { id: string };

    const existing = await request.server.prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      throw reply.code(404).send({ error: 'NotFound', message: 'Project not found' });
    }

    if (existing.organization_id !== user.organization_id) {
      throw reply.code(403).send({ error: 'Forbidden', message: 'Access denied' });
    }

    await request.server.prisma.project.delete({
      where: { id },
    });

    return reply.code(204).send();
  });
}
