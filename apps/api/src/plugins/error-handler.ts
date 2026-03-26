import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST',
  CONFLICT = 'CONFLICT',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export interface ErrorResponse {
  error: ErrorCode | string;
  message: string;
  details?: any;
}

function isErrorResponse(obj: any): obj is ErrorResponse {
  return obj && typeof obj === 'object' && 'error' in obj && 'message' in obj;
}

const errorHandler = fp(async (server: FastifyInstance) => {
  server.setErrorHandler(function (error: any, _request: any, reply: any) {
    this.log.error({ err: error.message || error, url: _request.url, method: _request.method });

    // Fastify wrapped errors
    if (error.output && error.output.statusCode) {
      const statusCode = error.output.statusCode;
      const payload = error.output.payload || {};

      if (payload && typeof payload === 'object' && 'error' in payload && 'message' in payload) {
        return reply.code(statusCode).send(payload);
      }

      const resp: any = { error: 'ERROR', message: payload.message || 'An error occurred' };
      if (payload.details) resp.details = payload.details;
      return reply.code(statusCode).send(resp);
    }

    // Custom AppError
    if (error.statusCode && error.code) {
      return reply.code(error.statusCode).send({ error: error.code, message: error.message || 'An error occurred', details: error.details });
    }

    // Already formatted error-response object
    if (isErrorResponse(error)) {
      return reply.code(400).send(error);
    }

    // Prisma errors
    if (error.code) {
      const code = error.code;
      if (code.startsWith('P20')) {
        return reply.code(503).send({ error: ErrorCode.SERVICE_UNAVAILABLE, message: 'Database connection error' });
      }
      if (code.startsWith('P2025')) {
        return reply.code(404).send({ error: ErrorCode.NOT_FOUND, message: error.message || 'Resource not found' });
      }
      if (code.startsWith('P2002')) {
        return reply.code(409).send({ error: ErrorCode.CONFLICT, message: 'Resource already exists' });
      }
    }

    // Zod validation error
    if (error.name === 'ZodError') {
      return reply.code(400).send({ error: ErrorCode.VALIDATION_ERROR, message: 'Request validation failed', details: error.errors });
    }

    // JWT errors
    const msg = error.message || '';
    if (msg.includes('invalid token') || msg.includes('jwt malformed')) {
      return reply.code(401).send({ error: ErrorCode.UNAUTHORIZED, message: 'Invalid or expired token' });
    }

    // Route not found
    if (msg.includes('Route') && msg.includes('not found')) {
      return reply.code(404).send({ error: ErrorCode.NOT_FOUND, message: 'Endpoint not found' });
    }

    // Default internal error
    const isDev = process.env.NODE_ENV === 'development';
    const defaultResp: any = { error: ErrorCode.INTERNAL_ERROR, message: 'An internal server error occurred' };
    if (isDev) {
      defaultResp.details = error.message;
      defaultResp.stack = error.stack;
    }
    return reply.code(500).send(defaultResp);
  });
});

export default errorHandler;
