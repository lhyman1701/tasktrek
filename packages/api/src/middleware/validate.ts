import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidateOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validation middleware factory
 * Validates request body, query, and/or params against Zod schemas
 */
export function validate(options: ValidateOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (options.body) {
        req.body = await options.body.parseAsync(req.body);
      }
      if (options.query) {
        req.query = await options.query.parseAsync(req.query);
      }
      if (options.params) {
        req.params = await options.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation Error',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Convenience wrapper for body validation
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return validate({ body: schema });
}

/**
 * Convenience wrapper for query validation
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return validate({ query: schema });
}

/**
 * Convenience wrapper for params validation
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return validate({ params: schema });
}
