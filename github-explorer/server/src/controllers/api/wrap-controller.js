/**
 * Controller Wrapper with Error Handling
 * 
 * Wraps controller handlers to provide consistent error handling, 
 * logging, and database connection management.
 */

import { logger } from '../../utils/logger.js';
import { resetConnection } from '../../db/connection-manager.js';
import { handleDbError } from '../../utils/db-utils.js';
import { cacheOrCompute, generateCacheKey } from '../../utils/cache.js';

// Cache settings
const CACHE_TTL = 3600; // 1 hour in seconds
const CACHEABLE_ENDPOINTS = [
  'getContributorById',
  'getContributorByLogin',
  'getContributorActivity',
  'getContributorImpact',
  'getContributorRepositories',
  'getContributorMergeRequests',
  'getContributorRecentActivity',
  'getContributorProfileMetadata',
  'getContributorProfileData'
];

/**
 * Wrap an async controller function with error handling
 * 
 * @param {Function} handler The controller handler function to wrap
 * @returns {Function} Wrapped handler with error handling
 */
export function wrapController(handler) {
  return async (req, res) => {
    // Store the original json method
    const originalJson = res.json;
    let responseData = null;
    
    // Intercept res.json calls to capture response data
    res.json = function(data) {
      responseData = data;
      return originalJson.call(this, data);
    };
    
    try {
      logger.debug(`Running controller: ${handler.name}`);
      
      // Check if this endpoint should be cached
      const shouldCache = CACHEABLE_ENDPOINTS.includes(handler.name);
      
      if (shouldCache) {
        const cachePrefix = `controller:${handler.name}`;
        // Use both path params and query params for the cache key
        const cacheParams = {
          params: req.params,
          query: req.query
        };
        const cacheKey = generateCacheKey(cachePrefix, cacheParams);
        
        return await cacheOrCompute(
          cacheKey,
          async () => {
            logger.info(`Cache miss for ${handler.name} - executing controller`);
            await handler(req, res);
            return responseData;
          },
          CACHE_TTL
        ).then(cachedData => {
          if (!res.headersSent) {
            return res.json(cachedData);
          }
        });
      } else {
        // Non-cached controller execution
        return await handler(req, res);
      }
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