import { Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Base Controller class that provides common methods for controllers
 */
export abstract class BaseController {
  /**
   * Sends a successful response with data
   */
  protected sendSuccess(res: Response, data: any, statusCode = 200): void {
    logger.debug('Sending successful response', { statusCode, data });
    res.status(statusCode).json({
      success: true,
      data,
    });
  }

  /**
   * Sends an error response
   */
  protected sendError(
    res: Response,
    message: string,
    statusCode = 500,
    error?: any
  ): void {
    logger.error('Error in controller', { statusCode, message, error });
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        ...(error && { details: error }),
      },
    });
  }

  /**
   * Wraps a controller method with try/catch for error handling
   */
  protected asyncWrapper(fn: (req: Request, res: Response) => Promise<void>) {
    return async (req: Request, res: Response): Promise<void> => {
      try {
        await fn(req, res);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        this.sendError(res, message, 500, error);
      }
    };
  }
} 