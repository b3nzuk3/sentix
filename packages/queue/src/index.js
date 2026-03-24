"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueScheduler = exports.ingestQueue = exports.synthesizeQueue = void 0;
exports.getConnection = getConnection;
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
const connection = new ioredis_1.IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: null,
});
exports.synthesizeQueue = new bullmq_1.Queue('synthesize', {
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
exports.ingestQueue = new bullmq_1.Queue('ingest', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 3000,
        },
    },
});
// Required for delayed jobs and repeatable jobs
exports.queueScheduler = new bullmq_1.QueueScheduler(['synthesize', 'ingest'], {
    connection,
});
function getConnection() {
    return connection;
}
//# sourceMappingURL=index.js.map