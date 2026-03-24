import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { synthesizeQueue } from '@sentix/queue';

export async function registerRoutes(server: FastifyInstance) {
  // POST /synthesize - Trigger synthesis job
  server.post('/synthesize', {
    preValidation: [server.authenticate],
    schema: {
      body: {
        project_id: true,
        options: {
          signal_limit: true,
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const { project_id, options } = request.body as any;

    // Verify project belongs to user's org
    const project = await request.prisma.project.findUnique({
      where: { id: project_id },
    });

    if (!project || project.organization_id !== user.organization_id) {
      throw reply.code(403).send({ error: 'Forbidden', message: 'Invalid project' });
    }

    // Create Analysis record
    const analysis = await request.prisma.analysis.create({
      data: {
        project_id,
        status: 'PENDING',
      },
    });

    // Enqueue job
    const job = await synthesizeQueue.add('process', {
      analysis_id: analysis.id,
      project_id,
      user_id: user.id,
    });

    return reply.status(202).send({
      job_id: job.id,
      analysis_id: analysis.id,
      status: 'queued',
    });
  });

  // GET /synthesize/:job_id - Poll job status
  server.get('/synthesize/:job_id', { preValidation: [server.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { job_id } = request.params as { job_id: string };

    const job = await synthesizeQueue.getJob(job_id);

    if (!job) {
      // Check if we have an analysis record to determine if job was completed and cleaned up
      const [analysis, failedJob] = await Promise.all([
        request.prisma.analysis.findFirst({
          where: { id: job_id }, // job_id equals analysis_id for now
        }),
        synthesizeQueue.getFailed().catch(() => []),
      ]);

      if (analysis) {
        if (analysis.status === 'COMPLETED') {
          return reply.send({
            status: 'completed',
            result: { analysis_id: analysis.id },
          });
        }
        if (analysis.status === 'FAILED') {
          return reply.send({
            status: 'failed',
            error: { message: analysis.error_message || 'Analysis failed' },
          });
        }
        // If PENDING/PROCESSING but job not found, it's in an inconsistent state
        throw reply.code(500).send({ error: 'JobNotFound', message: 'Job not found in queue' });
      }

      throw reply.code(404).send({ error: 'NotFound', message: 'Job not found' });
    }

    const state = await job.getState();

    const response: any = {
      status: state,
    };

    if (state === 'completed') {
      // For now, our job processor returns analysis_id directly
      // In Phase 3, we'll have more detailed results
      const result = await job.returnvalue;
      response.result = result;
    }

    if (state === 'failed') {
      response.error = {
        message: job.failedReason || 'Job failed',
      };
    }

    if (state === 'active' || state === 'waiting') {
      // Progress info not implemented yet
    }

    return reply.send(response);
  });
}
