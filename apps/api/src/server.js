"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const prisma_1 = __importDefault(require("./plugins/prisma"));
const auth_1 = __importDefault(require("./plugins/auth"));
const projects_1 = require("./routes/projects");
const signals_1 = require("./routes/signals");
const synthesize_1 = require("./routes/synthesize");
const analysis_1 = require("./routes/analysis");
require("./types/global"); // Import for side-effect type augmentation
require("./fastify-augmentation"); // Import to ensure augmentation is included
async function createServer() {
    const server = (0, fastify_1.default)({
        logger: {
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined
        }
    });
    await server.register(cors_1.default, { origin: true, credentials: true });
    await server.register(helmet_1.default);
    await server.register(rate_limit_1.default, {
        max: 100,
        timeWindow: '1 hour'
    });
    await server.register(jwt_1.default, {
        secret: process.env.API_SECRET_KEY,
        sign: { expiresIn: '15m' },
        verify: { maxAge: '15m' }
    });
    await server.register(multipart_1.default);
    await server.register(prisma_1.default);
    await server.register(auth_1.default);
    // Health check
    server.get('/health', async (request, reply) => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });
    // Register route groups
    (0, projects_1.registerRoutes)(server);
    (0, signals_1.registerRoutes)(server);
    (0, synthesize_1.registerRoutes)(server);
    (0, analysis_1.registerRoutes)(server);
    return server;
}
//# sourceMappingURL=server.js.map