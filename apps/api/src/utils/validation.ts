import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodSchema, ZodError } from 'zod';

export interface ValidatedRequest<TBody = any, TParams = any, TQuery = any> extends FastifyRequest {
  validatedBody?: TBody;
  validatedParams?: TParams;
  validatedQuery?: TQuery;
}

type ValidationSource = 'body' | 'params' | 'query';

export function createValidator<T extends ZodSchema<any>>(schema: T, source: ValidationSource = 'body') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    let data: any;
    try {
      switch (source) {
        case 'body':
          data = request.body;
          break;
        case 'params':
          data = request.params;
          break;
        case 'query':
          data = request.query;
          break;
      }

      const validated = schema.parse(data);

      // Attach validated data to request based on source
      if (source === 'body') {
        (request as any).validatedBody = validated;
      } else if (source === 'params') {
        (request as any).validatedParams = validated;
      } else if (source === 'query') {
        (request as any).validatedQuery = validated;
      }
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        }));

        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
        });
      }

      // Unexpected error
      return reply.code(400).send({
        error: 'BAD_REQUEST',
        message: 'Invalid request',
      });
    }
  };
}

// Helper to get validated data in handlers
export function getValidatedBody<T>(request: FastifyRequest): T {
  return (request as any).validatedBody;
}

export function getValidatedParams<T>(request: FastifyRequest): T {
  return (request as any).validatedParams;
}

export function getValidatedQuery<T>(request: FastifyRequest): T {
  return (request as any).validatedQuery;
}
