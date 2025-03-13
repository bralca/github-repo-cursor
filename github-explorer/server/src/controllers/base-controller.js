/**
 * Base Controller
 * 
 * JavaScript version of the base controller that provides common controller functionality.
 * This file serves as a bridge for JavaScript files that import the base controller.
 */

import { logger } from '../utils/logger.js';

/**
 * Base Controller class that provides common methods for controllers
 */
export class BaseController {
  /**
   * Sends a successful response with data
   */
  sendSuccess(res, data, statusCode = 200) {
    logger.debug('Sending successful response', { statusCode, data });
    res.status(statusCode).json({
      success: true,
      data,
    });
  }

  /**
   * Sends an error response
   */
  sendError(res, message, statusCode = 500, error) {
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
  asyncWrapper(fn) {
    return async (req, res) => {
      try {
        await fn(req, res);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        this.sendError(res, message, 500, error);
      }
    };
  }
}

// Export a default instance for CommonJS compatibility
export default BaseController; 