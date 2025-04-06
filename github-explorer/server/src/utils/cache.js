/**
 * Cache Utility Module
 * 
 * Provides an in-memory caching system for the application to improve performance
 * by reducing database load for frequently accessed or computationally expensive operations.
 * 
 * Uses the singleton pattern to ensure a single shared cache instance across the application.
 */

import NodeCache from 'node-cache';
import { setupLogger } from './logger.js';

// Try to import the cache monitor, but don't fail if it doesn't exist yet
// This prevents circular dependency issues during initial setup
let cacheMonitor = null;
try {
  cacheMonitor = require('./cache-monitor.js').default;
} catch (error) {
  // Cache monitor not yet available, we'll check later
}

// Setup component logger
const logger = setupLogger('cache');

// Default TTL settings (in seconds)
const DEFAULT_TTL = 3600; // 1 hour
const CHECK_PERIOD = 120; // Check for expired keys every 2 minutes

// Cache instance (singleton)
let cacheInstance = null;

/**
 * Get the singleton cache instance
 * @returns {NodeCache} The cache instance
 */
export function getCacheInstance() {
  if (!cacheInstance) {
    logger.info('Initializing cache instance');
    
    cacheInstance = new NodeCache({
      stdTTL: DEFAULT_TTL,
      checkperiod: CHECK_PERIOD,
      useClones: false, // For better performance
      maxKeys: 1000 // Limit cache size to prevent memory issues
    });
    
    // Setup event listeners for monitoring
    cacheInstance.on('expired', (key, value) => {
      logger.debug(`Cache key expired: ${key}`);
      
      // Record deletion in monitor if available
      if (cacheMonitor) {
        cacheMonitor.recordDelete(key, 'expired');
      }
    });
    
    cacheInstance.on('del', (key, value) => {
      logger.debug(`Cache key deleted: ${key}`);
      
      // Record deletion in monitor if available
      if (cacheMonitor) {
        cacheMonitor.recordDelete(key, 'deleted');
      }
    });
    
    cacheInstance.on('flush', () => {
      logger.info('Cache flushed');
    });
  }
  
  return cacheInstance;
}

/**
 * Generate a consistent cache key based on prefix and parameters
 * @param {string} prefix - The prefix for the key (usually the entity type)
 * @param {Object|string|number} params - Parameters to include in the key
 * @returns {string} The generated cache key
 */
export function generateCacheKey(prefix, params = '') {
  if (typeof params === 'object' && params !== null) {
    return `${prefix}:${JSON.stringify(params)}`;
  }
  
  return `${prefix}:${params}`;
}

/**
 * Get a value from the cache
 * @param {string} key - The cache key
 * @returns {any|undefined} The cached value or undefined if not found
 */
export function getCacheValue(key) {
  const cache = getCacheInstance();
  const startTime = Date.now();
  const value = cache.get(key);
  const responseTime = Date.now() - startTime;
  
  // Try to load the monitor again if it wasn't available initially
  if (!cacheMonitor) {
    try {
      cacheMonitor = require('./cache-monitor.js').default;
    } catch (error) {
      // Still not available, will try again next time
    }
  }
  
  if (value === undefined) {
    logger.debug(`Cache miss: ${key}`);
    
    // Record cache miss in monitor if available
    if (cacheMonitor) {
      cacheMonitor.recordMiss(key);
    }
    
    return undefined;
  }
  
  logger.debug(`Cache hit: ${key}`);
  
  // Record cache hit in monitor if available
  if (cacheMonitor) {
    cacheMonitor.recordHit(key, responseTime);
  }
  
  return value;
}

/**
 * Set a value in the cache
 * @param {string} key - The cache key
 * @param {any} value - The value to cache
 * @param {number} ttl - Time to live in seconds (optional, uses default if not specified)
 * @returns {boolean} True if the value was set successfully
 */
export function setCacheValue(key, value, ttl = DEFAULT_TTL) {
  const cache = getCacheInstance();
  const startTime = Date.now();
  const success = cache.set(key, value, ttl);
  const responseTime = Date.now() - startTime;
  
  if (success) {
    logger.debug(`Cache set: ${key}, TTL: ${ttl}s`);
    
    // Record cache set in monitor if available
    if (cacheMonitor) {
      // Estimate the size of the value
      const objectSize = JSON.stringify(value).length;
      cacheMonitor.recordSet(key, objectSize, ttl);
    }
  } else {
    logger.warn(`Failed to set cache: ${key}`);
  }
  
  return success;
}

/**
 * Remove a value from the cache
 * @param {string} key - The cache key to invalidate
 * @returns {number} Number of keys removed (0 or 1)
 */
export function invalidateCache(key) {
  const cache = getCacheInstance();
  const count = cache.del(key);
  
  logger.debug(`Cache invalidated: ${key}, removed: ${count} entries`);
  return count;
}

/**
 * Invalidate all cache entries with a specific prefix
 * @param {string} prefix - The prefix to invalidate
 * @returns {number} Number of keys removed
 */
export function invalidateCacheByPrefix(prefix) {
  const cache = getCacheInstance();
  const allKeys = cache.keys();
  const keysToDelete = allKeys.filter(key => key.startsWith(`${prefix}:`));
  
  let count = 0;
  keysToDelete.forEach(key => {
    count += cache.del(key);
  });
  
  logger.info(`Cache invalidated by prefix: ${prefix}, removed: ${count} entries`);
  return count;
}

/**
 * Clear all cache entries
 * @returns {boolean} True if the operation was successful
 */
export function clearCache() {
  const cache = getCacheInstance();
  const success = cache.flushAll();
  
  logger.info('Cache cleared');
  return success;
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  const cache = getCacheInstance();
  const stats = {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize
  };
  
  logger.debug('Cache stats retrieved', stats);
  return stats;
}

/**
 * Cache-or-compute pattern utility function
 * Gets a value from cache or computes it if not available
 * 
 * @param {string} key - Cache key
 * @param {Function} computeFn - Function to compute the value if not in cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} The cached or computed value
 */
export async function cacheOrCompute(key, computeFn, ttl = DEFAULT_TTL) {
  // Try to get from cache first
  const cachedValue = getCacheValue(key);
  
  if (cachedValue !== undefined) {
    return cachedValue;
  }
  
  // Compute the value if not in cache
  try {
    logger.debug(`Computing value for cache key: ${key}`);
    const startTime = Date.now();
    const computedValue = await computeFn();
    const computeTime = Date.now() - startTime;
    
    // Store in cache if computation was successful
    if (computedValue !== undefined && computedValue !== null) {
      setCacheValue(key, computedValue, ttl);
      
      // Record computation time for monitoring
      if (cacheMonitor) {
        cacheMonitor.recordMiss(key, computeTime);
      }
    }
    
    return computedValue;
  } catch (error) {
    logger.error('Error computing value for cache', { error, key });
    throw error;
  }
}

// Export the default cache instance for direct use
export default getCacheInstance(); 