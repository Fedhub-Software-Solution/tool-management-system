import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Validation middleware factory
 * @param schema - Zod schema to validate against
 * @param target - Where to validate (body, query, params)
 */
export const validate =
  (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        throw new ValidationError('Validation error', details);
      }
      next(error);
    }
  };

