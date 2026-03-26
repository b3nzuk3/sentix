import { PrismaClient } from '@prisma/client';
import { synthesizeQueue } from '@sentix/queue';

export interface SynthesizeService {
  triggerSynthesis(
    organizationId: string,
    projectId: string,
    userId: string,
    options?: { signal_limit?: number }
  ): Promise<{ job_id: string; analysis_id: string; status: string }>;

  getJobStatus(jobId: string, organizationId: string): Promise<any>;
}

export function createSynthesizeService(prisma: PrismaClient): SynthesizeService {
  return {
    async triggerSynthesis(organizationId, projectId, userId, options) {
      // Verify project belongs to org
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.organization_id !== organizationId) {
        throw { statusCode: 403, error: 'FORBIDDEN', message: 'Invalid project' };
      }

      // Create Analysis record
      const analysis = await prisma.analysis.create({
        data: {
          project_id: projectId,
          status: 'PENDING',
        },
      });

      // Enqueue job
      const job = await synthesizeQueue.add('process', {
        analysis_id: analysis.id,
        project_id: projectId,
        user_id: userId,
      });

      return {
        job_id: job.id!,
        analysis_id: analysis.id,
        status: 'queued',
      };
    },

    async getJobStatus(jobId, organizationId) {
      // Try to get job from queue
      const job = await synthesizeQueue.getJob(jobId);

      if (!job) {
        // Check if we have an analysis record to determine if job was completed and cleaned up
        const [analysis] = await Promise.all([
          prisma.analysis.findFirst({
            where: { id: jobId },
            include: { project: true },
          }),
        ]);

        if (analysis) {
          if (analysis.status === 'COMPLETED') {
            return {
              status: 'completed',
              result: { analysis_id: analysis.id },
            };
          }
          if (analysis.status === 'FAILED') {
            return {
              status: 'failed',
              error: { message: analysis.error_message || 'Analysis failed' },
            };
          }
          // PENDING or PROCESSING but job not found
          throw { statusCode: 500, error: 'JOB_NOT_FOUND', message: 'Job not found in queue' };
        }

        throw { statusCode: 404, error: 'NOT_FOUND', message: 'Job not found' };
      }

      const state = await job.getState();

      const response: any = { status: state };

      if (state === 'completed') {
        const result = await job.returnvalue;
        response.result = result;
      }

      if (state === 'failed') {
        response.error = {
          message: job.failedReason || 'Job failed',
        };
      }

      return response;
    },
  };
}
