import { Worker as BullWorker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { getConnection, synthesizeQueue } from '@sentix/queue';
import pino from 'pino';

const prisma = new PrismaClient();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

// Phase 2 stub: Simple worker that just marks analysis as complete after delay
// Phase 3 will replace this with actual AI + engines logic
async function synthesizeJobProcessor(job: any) {
  const { analysis_id, project_id, user_id } = job.data;
  logger.info({ job_id: job.id, analysis_id, project_id, user_id }, 'Starting synthesize job');

  try {
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For Phase 2 stub: just mark analysis as completed without creating themes
    await prisma.analysis.update({
      where: { id: analysis_id },
      data: {
        status: 'COMPLETED',
        total_revenue_lost: 0,
        total_revenue_at_risk: 0,
      },
    });

    logger.info({ job_id: job.id, analysis_id }, 'Synthesize job completed');
    return { analysis_id, theme_count: 0 };
  } catch (error) {
    logger.error({ job_id: job.id, analysis_id, error }, 'Synthesize job failed');
    await prisma.analysis.update({
      where: { id: analysis_id },
      data: {
        status: 'FAILED',
        error_message: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

const worker = new BullWorker(
  'synthesize',
  synthesizeJobProcessor,
  {
    connection: getConnection(),
    concurrency: 3,
  }
);

worker.on('completed', (job) => {
  logger.info({ job_id: job.id }, 'Job completed');
});

worker.on('failed', (job, error) => {
  logger.error({ job_id: job?.id, error }, 'Job failed');
});

worker.on('error', (error) => {
  logger.error({ error }, 'Worker error');
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker gracefully');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing worker gracefully');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

logger.info('Worker started, listening for jobs');
worker.run();
