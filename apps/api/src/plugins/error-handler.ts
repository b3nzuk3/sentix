import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply } from 'fastify';

// Error codes for standardized responses
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
  // Set a custom error handler that normalizes all errors
  server.setErrorHandler(function (error, request, reply) {
    // Log the error for debugging
    this.log.error({ error, url: request.url, method: request.method });

    // Handle errors from reply.code().send() pattern
    // Fastify wraps these with output.statusCode and output.payload
    if ((error as any).output && (error as any).output.statusCode) {
      const statusCode = (error as any).output.statusCode;
      const payload = (error as any).output.payload || {};

      // If payload already has error/message, use it
      if (payload && typeof payload === 'object' && 'error' in payload && 'message' in payload) {
        return reply.code(statusCode).send(payload);
      }

      // Otherwise, normalize to standard format
      return reply.code(statusCode).send({
        error: 'ERROR',
        message: payload.message || 'An error occurred',
        ...(payload.details && { details: payload.details }),
      });
    }

    // If error already has statusCode and code (AppError), format it
    if ((error as any).statusCode && (error as any).code) {
      const statusCode = (error as any).statusCode;
      const errorCode = (error as any).code;
      const message = (error as any).message || 'An error occurred';
      const details = (error as any).details;

      return reply.code(statusCode).send({ error: errorCode, message, details });
    }

    // If the response is already an ErrorResponse object, use it with 400
    if (isErrorResponse(error)) {
      return reply.code(400).send(error);
    }

    // Handle Prisma errors
    if (error.code) {
      const prismaCode = error.code;
      if (prismaCode.startsWith('P20')) {
        // Database connection errors
        return reply.code(503).send({
          error: ErrorCode.SERVICE_UNAVAILABLE,
          message: 'Database connection error',
        });
      }
      if (prismaCode.startsWith('P2025')) {
        // Record not found
        return reply.code(404).send({
          error: ErrorCode.NOT_FOUND,
          message: error.message || 'Resource not found',
        });
      }
      if (prismaCode.startsWith('P2002')) {
        // Unique constraint violation
        return reply.code(409).send({
          error: ErrorCode.CONFLICT,
          message: 'Resource already exists',
        });
      }
    }

    // Handle Zod validation errors (already handled in preValidation, but catch any that slip through)
    if (error.name === 'ZodError') {
      return reply.code(400).send({
        error: ErrorCode.VALIDATION_ERROR,
        message: 'Request validation failed',
        details: error.errors,
      });
    }

    // Handle JWT errors
    if (error.message?.includes('invalid token') || error.message?.includes('jwt malformed')) {
      return reply.code(401).send({
        error: ErrorCode.UNAUTHORIZED,
        message: 'Invalid or expired token',
      });
    }

    // Handle missing route
    if (error.message?.includes('Route') && error.message?.includes('not found')) {
      return reply.code(404).send({
        error: ErrorCode.NOT_FOUND,
        message: 'Endpoint not found',
      });
    }

    // Default: internal server error
    // Don't expose error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    return reply.code(500).send({
      error: ErrorCode.INTERNAL_ERROR,
      message: 'An internal server error occurred',
      ...(isDevelopment && { details: error.message, stack: error.stack }),
    });
  };
});

export default errorHandler;
