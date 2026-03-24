"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../schemas/auth");
const auth_2 = require("../utils/auth");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const plugin = async (fastify) => {
    // Register auth routes inline for simplicity
    fastify.post('/auth/register', {
        schema: { body: auth_1.registerSchema },
        preValidation: [fastify.authenticate.allowAnonymous]
    }, async (request, reply) => {
        const { email, password, org_name, user_name } = request.body;
        const existing = await fastify.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw fastify.httpErrors.create(400, 'User already exists');
        }
        const password_hash = await bcryptjs_1.default.hash(password, 10);
        const result = await fastify.prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name: org_name,
                    slug: org_name.toLowerCase().replace(/\s+/g, '-')
                }
            });
            const user = await tx.user.create({
                data: {
                    email,
                    password_hash,
                    name: user_name,
                    organization_id: org.id,
                    role: 'ADMIN'
                }
            });
            return { user, org };
        });
        const access_token = (0, auth_2.signAccessToken)({
            user_id: result.user.id,
            org_id: result.org.id,
            role: result.user.role
        });
        const refresh_token = (0, auth_2.signRefreshToken)({
            user_id: result.user.id,
            org_id: result.org.id,
            role: result.user.role
        });
        return reply.status(201).send({
            user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role },
            org: { id: result.org.id, name: result.org.name, slug: result.org.slug },
            tokens: { access_token, refresh_token }
        });
    });
    fastify.post('/auth/login', {
        schema: { body: auth_1.loginSchema },
        preValidation: [fastify.authenticate.allowAnonymous]
    }, async (request, reply) => {
        const { email, password } = request.body;
        const user = await fastify.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw fastify.httpErrors.create(401, 'Invalid credentials');
        }
        const valid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!valid) {
            throw fastify.httpErrors.create(401, 'Invalid credentials');
        }
        const org = await fastify.prisma.organization.findUnique({
            where: { id: user.organization_id }
        });
        if (!org) {
            throw fastify.httpErrors.create(500, 'Organization not found');
        }
        const access_token = (0, auth_2.signAccessToken)({
            user_id: user.id,
            org_id: user.organization_id,
            role: user.role
        });
        const refresh_token = (0, auth_2.signRefreshToken)({
            user_id: user.id,
            org_id: user.organization_id,
            role: user.role
        });
        return reply.send({
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            org: { id: org.id, name: org.name, slug: org.slug },
            tokens: { access_token, refresh_token }
        });
    });
    fastify.post('/auth/refresh', {
        schema: { body: auth_1.refreshSchema },
        preValidation: [fastify.authenticate.allowAnonymous]
    }, async (request, reply) => {
        const { refresh_token } = request.body;
        try {
            const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.API_SECRET_KEY);
            if (decoded.type !== 'refresh') {
                throw new Error('Not a refresh token');
            }
            const user = await fastify.prisma.user.findUnique({
                where: { id: decoded.user_id }
            });
            if (!user) {
                throw fastify.httpErrors.create(401, 'User not found');
            }
            const newAccessToken = (0, auth_2.signAccessToken)({
                user_id: user.id,
                org_id: user.organization_id,
                role: user.role
            });
            return reply.send({ tokens: { access_token: newAccessToken } });
        }
        catch (err) {
            throw fastify.httpErrors.create(401, 'Invalid refresh token');
        }
    });
};
exports.default = plugin;
//# sourceMappingURL=auth.js.map