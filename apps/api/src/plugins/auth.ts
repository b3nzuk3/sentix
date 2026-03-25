import { registerSchema, loginSchema, refreshSchema } from '../schemas/auth';
import { signAccessToken, signRefreshToken } from '../utils/auth';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const plugin = async (server: any) => {
  console.log('🔌 AuthPlugin: server.prisma exists?', !!server.prisma);
  console.log('🔌 AuthPlugin: server.prisma keys:', server.prisma ? Object.keys(server.prisma).filter(k => typeof server.prisma[k] === 'object' && k !== '$$' && !k.startsWith('_')) : 'N/A');

  // Register auth routes inline for simplicity
  server.post('/auth/register', async (request: any, reply: any) => {
    try {
      const { email, password, org_name, user_name } = request.body;

      // Use server.prisma from plugin closure
      const existing = await server.prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw reply.code(400).createError({ message: 'User already exists' });
      }

      const password_hash = await bcrypt.hash(password, 10);

      // Generate unique slug for organization by appending a random suffix
      const baseSlug = org_name.toLowerCase().replace(/\s+/g, '-');
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const slug = `${baseSlug}-${randomSuffix}`;

      const result = await server.prisma.$transaction(async (tx: any) => {
        const org = await tx.organization.create({
          data: {
            name: org_name,
            slug
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
    } catch (err) {
      console.error('❌ Register error:', err);
      throw err;
    }
  });

  server.post('/auth/login', async (request: any, reply: any) => {
    const { email, password } = request.body;

    const user = await server.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw reply.code(401).createError({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw reply.code(401).createError({ message: 'Invalid credentials' });
    }

    const org = await server.prisma.organization.findUnique({
      where: { id: user.organization_id }
    });

    if (!org) {
      throw reply.code(500).createError({ message: 'Organization not found' });
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

  server.post('/auth/refresh', async (request: any, reply: any) => {
    const { refresh_token } = request.body;

    try {
      const decoded = jwt.verify(refresh_token, process.env.API_SECRET_KEY!) as any;

      if (decoded.type !== 'refresh') {
        throw new Error('Not a refresh token');
      }

      const user = await server.prisma.user.findUnique({
        where: { id: decoded.user_id }
      });

      if (!user) {
        throw reply.code(401).createError({ message: 'User not found' });
      }

      const newAccessToken = signAccessToken({
        user_id: user.id,
        org_id: user.organization_id,
        role: user.role
      });

      return reply.send({ tokens: { access_token: newAccessToken } });
    } catch (err) {
      // If token invalid, return 401
      throw reply.code(401).createError({ message: 'Invalid refresh token' });
    }
  });
};

export default plugin;
