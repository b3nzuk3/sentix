import * as fastify from 'fastify';
import { createValidator, getValidatedParams } from '../utils/validation';
import { queueNameParamSchema } from '../schemas/admin';

type FastifyInstance = fastify.FastifyInstance;
type FastifyRequest = fastify.FastifyRequest;
type FastifyReply = fastify.FastifyReply;

export async function registerRoutes(server: FastifyInstance) {
  // GET /admin/queues - Queue statistics
  server.get('/admin/queues', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;

    // Only admins can view admin panel
    if (user.role !== 'ADMIN') {
      throw reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' });
    }

    // Get queue stats from BullMQ
    const queues = ['synthesize'];
    const stats = await Promise.all(
      queues.map(async (queueName) => {
        const queue = (global as any)[`queue_${queueName}`] as any;
        if (!queue) return { name: queueName, error: 'Queue not found' };

        const [waiting, active, delayed, completed, failed, paused] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getDelayedCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.isPaused(),
        ]);

        return {
          name: queueName,
          waiting,
          active,
          delayed,
          completed,
          failed,
          paused,
        };
      })
    );

    return reply.send({ queues: stats });
  });

  // POST /admin/queues/:queueName/retry-failed - Retry failed jobs
  server.post('/admin/queues/:queueName/retry-failed', {
    preValidation: [
      server.authenticate,
      createValidator(queueNameParamSchema, 'params')
    ]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { queueName } = getValidatedParams<typeof queueNameParamSchema._type>(request);

    if (user.role !== 'ADMIN') {
      throw reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' });
    }

    const queue = (global as any)[`queue_${queueName}`] as any;
    if (!queue) {
      throw reply.code(404).send({ error: 'NotFound', message: 'Queue not found' });
    }

    // Move all failed jobs back to waiting
    const failedJobs = await queue.getFailed();
    const retryPromises = failedJobs.map((job: any) => job.retry());
    await Promise.all(retryPromises);

    return reply.send({
      success: true,
      retried: failedJobs.length,
    });
  });

  // GET /admin/health - System health checks
  server.get('/admin/health', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    if (user.role !== 'ADMIN') {
      throw reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' });
    }

    const health: any = {
      timestamp: new Date().toISOString(),
    };

    // Check database
    try {
      await request.prisma.$queryRaw`SELECT 1`;
      health.database = { status: 'healthy' };
    } catch (e) {
      health.database = { status: 'unhealthy', error: String(e) };
    }

    // Check Redis (if configured)
    if (request.redis) {
      try {
        await request.redis.ping();
        health.redis = { status: 'healthy' };
      } catch (e) {
        health.redis = { status: 'unhealthy', error: String(e) };
      }
    } else {
      health.redis = { status: 'unavailable', error: 'Redis not configured' };
    }

    // Check worker (simple heartbeat check)
    const workers = (global as any).workerCount || 0;
    health.workers = { count: workers, status: workers > 0 ? 'healthy' : 'warning' };

    return reply.send(health);
  });

  // GET /admin/stats - System statistics
  server.get('/admin/stats', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    if (user.role !== 'ADMIN') {
      throw reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' });
    }

    const [
      userCount,
      orgCount,
      projectCount,
      signalCount,
      analysisCount,
    ] = await Promise.all([
      request.prisma.user.count(),
      request.prisma.organization.count(),
      request.prisma.project.count(),
      request.prisma.signal.count(),
      request.prisma.analysis.count(),
    ]);

    return reply.send({
      users: userCount,
      organizations: orgCount,
      projects: projectCount,
      signals: signalCount,
      analyses: analysisCount,
    });
  });
}
