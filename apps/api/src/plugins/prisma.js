"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const plugin = async (fastify) => {
    const prisma = new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    fastify.decorate('prisma', prisma);
    fastify.addHook('onClose', async () => {
        await prisma.$disconnect();
    });
};
exports.default = plugin;
//# sourceMappingURL=prisma.js.map