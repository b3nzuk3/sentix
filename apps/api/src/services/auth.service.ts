import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { signAccessToken, signRefreshToken } from '../utils/auth';

export interface IAuthService {
  register(data: {
    email: string;
    password: string;
    org_name: string;
    user_name: string;
  }): Promise<{
    user: { id: string; email: string; name: string; role: string };
    org: { id: string; name: string; slug: string };
    access_token: string;
    refresh_token: string;
  }>;

  login(email: string, password: string): Promise<{
    user: { id: string; email: string; name: string; role: string };
    org: { id: string; name: string; slug: string };
    access_token: string;
    refresh_token: string;
  }>;

  refresh(refreshToken: string): Promise<{ access_token: string }>;
}

export function createAuthService(prisma: PrismaClient): IAuthService {
  return {
    async register({ email, password, org_name, user_name }) {
      // Check if user already exists
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw {
          statusCode: 400,
          error: 'USER_ALREADY_EXISTS',
          message: 'User already exists',
        };
      }

      const password_hash = await bcrypt.hash(password, 10);

      // Generate unique slug for organization by appending a random suffix
      const baseSlug = org_name.toLowerCase().replace(/\s+/g, '-');
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const slug = `${baseSlug}-${randomSuffix}`;

      const result = await prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            name: org_name,
            slug,
          },
        });

        const user = await tx.user.create({
          data: {
            email,
            password_hash,
            name: user_name,
            organization_id: org.id,
            role: 'ADMIN',
          },
        });

        return { user, org };
      });

      const access_token = signAccessToken({
        user_id: result.user.id,
        org_id: result.org.id,
        role: result.user.role,
      });

      const refresh_token = signRefreshToken({
        user_id: result.user.id,
        org_id: result.org.id,
        role: result.user.role,
      });

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name ?? result.user.email,
          role: result.user.role,
        },
        org: {
          id: result.org.id,
          name: result.org.name,
          slug: result.org.slug,
        },
        access_token,
        refresh_token,
      };
    },

    async login(email: string, password: string) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw {
          statusCode: 401,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials',
        };
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        throw {
          statusCode: 401,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials',
        };
      }

      const org = await prisma.organization.findUnique({
        where: { id: user.organization_id },
      });

      if (!org) {
        throw {
          statusCode: 500,
          error: 'ORGANIZATION_NOT_FOUND',
          message: 'Organization not found',
        };
      }

      const access_token = signAccessToken({
        user_id: user.id,
        org_id: user.organization_id,
        role: user.role,
      });

      const refresh_token = signRefreshToken({
        user_id: user.id,
        org_id: user.organization_id,
        role: user.role,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
        },
        org: {
          id: org.id,
          name: org.name,
          slug: org.slug,
        },
        access_token,
        refresh_token,
      };
    },

    async refresh(refreshToken: string) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.API_SECRET_KEY!) as any;

        if (decoded.type !== 'refresh') {
          throw new Error('Not a refresh token');
        }

        const user = await prisma.user.findUnique({
          where: { id: decoded.user_id },
        });

        if (!user) {
          throw {
            statusCode: 401,
            error: 'USER_NOT_FOUND',
            message: 'User not found',
          };
        }

        const accessToken = signAccessToken({
          user_id: user.id,
          org_id: user.organization_id,
          role: user.role,
        });

        return { access_token: accessToken };
      } catch (err: any) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
          throw {
            statusCode: 401,
            error: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid refresh token',
          };
        }
        throw {
          statusCode: 401,
          error: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token',
        };
      }
    },
  };
}
