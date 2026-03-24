"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const project_1 = require("../schemas/project");
async function registerRoutes(server) {
    // GET /projects - List projects user has access to
    server.get('/projects', { preValidation: [server.authenticate] }, async (request, reply) => {
        const user = request.user;
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
    server.get('/projects/:id', { preValidation: [server.authenticate] }, async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
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
        schema: { body: project_1.createProjectSchema },
    }, async (request, reply) => {
        const user = request.user;
        const body = request.body;
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
        schema: { body: project_1.updateProjectSchema },
    }, async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        const body = request.body;
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
    server.delete('/projects/:id', { preValidation: [server.authenticate] }, async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
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
//# sourceMappingURL=projects.js.map