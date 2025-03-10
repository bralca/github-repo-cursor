import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { logger } from '../utils/logger';

export enum ValidationSource {
  BODY = 'body',
  QUERY = 'query',
  PARAM = 'params',
}

/**
 * Middleware factory that validates request data against a Zod schema
 */
export const validate =
  (schema: AnyZodObject, source: ValidationSource = ValidationSource.BODY) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req[source];
      await schema.parseAsync(data);
      next();
    } catch (error) {
      logger.error('Validation error', { error });
      
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: {
          message: 'Unexpected validation error',
          details: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }; 