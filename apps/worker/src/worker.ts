import { Worker as BullWorker } from 'bullmq';
import { getConnection, synthesizeQueue } from '@sentix/queue';
import pino from 'pino';
import { prisma } from './db';
import { processSynthesizeJob } from './jobs/synthesizeJob';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const worker = new BullWorker(
  'synthesize',
  processSynthesizeJob,
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
