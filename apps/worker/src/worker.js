"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const queue_1 = require("@sentix/queue");
const pino_1 = __importDefault(require("pino"));
const db_1 = require("./db");
const synthesizeJob_1 = require("./jobs/synthesizeJob");
const logger = (0, pino_1.default)({ level: process.env.LOG_LEVEL || 'info' });
const worker = new bullmq_1.Worker('synthesize', synthesizeJob_1.processSynthesizeJob, {
    connection: (0, queue_1.getConnection)(),
    concurrency: 3,
});
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
    await db_1.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger.info('SIGINT received, closing worker gracefully');
    await worker.close();
    await db_1.prisma.$disconnect();
    process.exit(0);
});
logger.info('Worker started, listening for jobs');
worker.run();
//# sourceMappingURL=worker.js.map