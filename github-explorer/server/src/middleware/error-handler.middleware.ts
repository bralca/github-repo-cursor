import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Log detailed error information
 */
const logError = (error: Error, req: Request): void => {
  const errorContext = {
    path: req.path,
    method: req.method,
    query: req.query,
    // Avoid logging sensitive info
    body: req.method !== 'POST' ? req.body : '[REDACTED]',
    params: req.params,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type'),
      accept: req.get('accept'),
    },
    ip: req.ip,
  };

  if (error instanceof AppError) {
    // Log application errors with context
    const logLevel = error.statusCode >= 500 ? 'error' : 'warn';
    logger[logLevel](`Application error: ${error.message}`, {
      statusCode: error.statusCode,
      errorCode: error.code,
      isOperational: error.isOperational,
      stack: error.stack,
      ...errorContext,
    });
  } else if (error instanceof ZodError) {
    // Log validation errors
    logger.warn(`Validation error: ${error.message}`, {
      validationErrors: error.errors,
      ...errorContext,
    });
  } else {
    // Log unexpected errors
    logger.error(`Unexpected error: ${error.message}`, {
      stack: error.stack,
      ...errorContext,
    });
  }
};

/**
 * Format the error for response
 */
const formatError = (error: Error, req: Request): any => {
  if (error instanceof AppError) {
    return error.toJSON();
  }

  if (error instanceof ZodError) {
    return {
      success: false,
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    };
  }

  // For production, don't expose internal errors
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    success: false,
    error: {
      message: isProduction ? 'Internal server error' : error.message,
      code: 'INTERNAL_ERROR',
      ...(isProduction ? {} : { stack: error.stack }),
      requestId: (req as any).id,
    },
  };
};

/**
 * Determine appropriate status code
 */
const getStatusCode = (error: Error): number => {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  if (error instanceof ZodError) {
    return 400;
  }
  return 500;
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Log the error
  logError(error, req);

  // Format error for response
  const formattedError = formatError(error, req);

  // Determine status code
  const statusCode = getStatusCode(error);

  // Send response
  res.status(statusCode).json(formattedError);
};

/**
 * Not found handler middleware
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = {
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.path}`,
      code: 'NOT_FOUND',
      requestId: (req as any).id,
    },
  };

  logger.warn(`Not found: ${req.method} ${req.path}`, {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json(error);
}; 