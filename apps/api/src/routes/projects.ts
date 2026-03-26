import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createProjectsService } from '../services/projects.service';
import { createProjectSchema, updateProjectSchema } from '../schemas/project';
import { createValidator, getValidatedBody } from '../utils/validation';

export async function registerRoutes(server: FastifyInstance) {
  const projectsService = createProjectsService(server.prisma);

  // GET /projects - List projects user has access to
  server.get('/projects', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const projects = await projectsService.listProjects(user.organization_id);
    return reply.send(projects);
  });

  // GET /projects/:id - Get project with details
  server.get('/projects/:id', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { id } = request.params as { id: string };
    const project = await projectsService.getProject(user.organization_id, id);
    return reply.send(project);
  });

  // POST /projects - Create new project
  server.post('/projects', {
    preValidation: [server.authenticate, createValidator(createProjectSchema, 'body')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const body = getValidatedBody<typeof createProjectSchema._type>(request);
    const project = await projectsService.createProject(user.organization_id, body);
    return reply.status(201).send(project);
  });

  // PATCH /projects/:id - Update project
  server.patch('/projects/:id', {
    preValidation: [server.authenticate, createValidator(updateProjectSchema, 'body')],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { id } = request.params as { id: string };
    const body = getValidatedBody<typeof updateProjectSchema._type>(request);
    const project = await projectsService.updateProject(user.organization_id, id, body);
    return reply.send(project);
  });

  // DELETE /projects/:id - Delete project
  server.delete('/projects/:id', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { id } = request.params as { id: string };
    await projectsService.deleteProject(user.organization_id, id);
    return reply.code(204).send();
  });
}
