import { registerSchema, loginSchema, refreshSchema } from '../schemas/auth';
import { signAccessToken, signRefreshToken } from '../utils/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fastify from 'fastify';

const plugin = async (fastify: any) => {
  // Register auth routes inline for simplicity
  fastify.post('/auth/register', async (request: any, reply: any) => {
    const { email, password, org_name, user_name } = request.body;

    const existing = await fastify.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw fastify.httpErrors.create(400, 'User already exists');
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await fastify.prisma.$transaction(async (tx: any) => {
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

    const access_token = signAccessToken({
      user_id: result.user.id,
      org_id: result.org.id,
      role: result.user.role
    });

    const refresh_token = signRefreshToken({
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

  fastify.post('/auth/login', async (request: any, reply: any) => {
    const { email, password } = request.body;

    const user = await fastify.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw fastify.httpErrors.create(401, 'Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw fastify.httpErrors.create(401, 'Invalid credentials');
    }

    const org = await fastify.prisma.organization.findUnique({
      where: { id: user.organization_id }
    });

    if (!org) {
      throw fastify.httpErrors.create(500, 'Organization not found');
    }

    const access_token = signAccessToken({
      user_id: user.id,
      org_id: user.organization_id,
      role: user.role
    });

    const refresh_token = signRefreshToken({
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

  fastify.post('/auth/refresh', async (request: any, reply: any) => {
    const { refresh_token } = request.body;

    try {
      const decoded = jwt.verify(refresh_token, process.env.API_SECRET_KEY!) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Not a refresh token');
      }

      const user = await fastify.prisma.user.findUnique({
        where: { id: decoded.user_id }
      });

      if (!user) {
        throw fastify.httpErrors.create(401, 'User not found');
      }

      const newAccessToken = signAccessToken({
        user_id: user.id,
        org_id: user.organization_id,
        role: user.role
      });

      return reply.send({ tokens: { access_token: newAccessToken } });
    } catch (err) {
      throw fastify.httpErrors.create(401, 'Invalid refresh token');
    }
  });
};

export default plugin;
