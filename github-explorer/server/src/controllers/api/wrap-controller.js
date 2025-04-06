/**
 * Controller Wrapper with Error Handling
 * 
 * Wraps controller handlers to provide consistent error handling, 
 * logging, and database connection management.
 */

import { logger } from '../../utils/logger.js';
import { resetConnection } from '../../db/connection-manager.js';
import { handleDbError } from '../../utils/db-utils.js';

/**
 * Wrap an async controller function with error handling
 * 
 * @param {Function} handler The controller handler function to wrap
 * @returns {Function} Wrapped handler with error handling
 */
export function wrapController(handler) {
  return async (req, res) => {
    try {
      logger.debug(`Running controller: ${handler.name}`);
      
      // Run the handler
      return await handler(req, res);
    } catch (error) {
      logger.error(`Controller error in ${handler.name}:`, { 
        error,
        url: req.originalUrl,
        method: req.method,
        params: req.params,
        query: req.query
      });
      
      // Handle database connection errors specially
      if (error.code === 'SQLITE_MISUSE' || error.message?.includes('database is closed')) {
        logger.warn('Database connection issue detected in controller, attempting to reset connection');
        
        try {
          await resetConnection();
          logger.info('Successfully reset database connection');
        } catch (resetError) {
          logger.error('Failed to reset database connection', { error: resetError });
        }
      }
      
      // Use the standard database error handler
      return handleDbError(error, res);
    }
  };
}

export default wrapController; 