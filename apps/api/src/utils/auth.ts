import jwt from 'jsonwebtoken';
import { FastifyRequest } from 'fastify';

export interface TokenPayload {
  user_id: string;
  org_id: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.API_SECRET_KEY!, { expiresIn: '15m' });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, type: 'refresh' }, process.env.API_SECRET_KEY!, { expiresIn: '30d' });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.API_SECRET_KEY!) as TokenPayload;
}

export async function authenticateRequest(
  request: FastifyRequest,
  _token: string
) {
  const token = request.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Missing token');

  const payload = verifyAccessToken(token);

  // Verify user still exists
  const user = await request.prisma.user.findUnique({
    where: { id: payload.user_id },
    select: { id: true, organization_id: true, role: true }
  });

  if (!user) throw new Error('User not found');

  // Attach user to request
  (request as any).user = user;
}
