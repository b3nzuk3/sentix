import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { SynthesizeJobData, IngestJobData } from './types';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

export const synthesizeQueue = new Queue<SynthesizeJobData>('synthesize', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 60 * 60 * 1000,
    },
    removeOnFail: {
      count: 50,
      age: 7 * 24 * 60 * 60 * 1000,
    },
  },
});

export const ingestQueue = new Queue<IngestJobData>('ingest', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  },
});


export function getConnection() {
  return connection;
}
