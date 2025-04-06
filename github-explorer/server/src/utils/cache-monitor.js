/**
 * Cache Monitoring Utility
 * 
 * Provides tools for monitoring cache performance and debugging cache-related issues.
 * Tracks cache hit/miss rates, size, and other metrics to help optimize caching strategy.
 */

import { setupLogger } from './logger.js';
import { getCacheStats } from './cache.js';

// Setup component logger
const logger = setupLogger('cache-monitor');

// Cache metrics tracking
const metrics = {
  // Hit/miss counts
  hits: 0,
  misses: 0,
  // Operation counts
  sets: 0,
  gets: 0,
  deletes: 0,
  // Performance tracking
  totalGetTime: 0,
  totalSetTime: 0,
  // Hit rates by prefix
  prefixHits: {},
  prefixMisses: {},
  // Last reset time
  lastReset: Date.now()
};

/**
 * Record a cache hit event
 * @param {string} key - The cache key that was hit
 * @param {number} responseTime - Time taken to retrieve from cache in ms
 */
export function recordHit(key, responseTime = 0) {
  metrics.hits++;
  metrics.gets++;
  metrics.totalGetTime += responseTime;
  
  // Record by prefix
  const prefix = key.split(':')[0];
  if (prefix) {
    metrics.prefixHits[prefix] = (metrics.prefixHits[prefix] || 0) + 1;
  }
  
  // Periodically log hit rate
  if ((metrics.hits + metrics.misses) % 100 === 0) {
    logHitRate();
  }
}

/**
 * Record a cache miss event
 * @param {string} key - The cache key that was missed
 * @param {number} responseTime - Time taken to compute the value in ms
 */
export function recordMiss(key, responseTime = 0) {
  metrics.misses++;
  metrics.gets++;
  
  // Record by prefix
  const prefix = key.split(':')[0];
  if (prefix) {
    metrics.prefixMisses[prefix] = (metrics.prefixMisses[prefix] || 0) + 1;
  }
  
  // Log slow computations
  if (responseTime > 500) {
    logger.warn(`Slow cache miss computation for key: ${key}, took ${responseTime}ms`);
  }
  
  // Periodically log hit rate
  if ((metrics.hits + metrics.misses) % 100 === 0) {
    logHitRate();
  }
}

/**
 * Record a cache set event
 * @param {string} key - The cache key that was set
 * @param {number} objectSize - Approximate size of the object in bytes
 * @param {number} ttl - Time to live in seconds
 */
export function recordSet(key, objectSize = 0, ttl = 0) {
  metrics.sets++;
  
  // Log large objects
  if (objectSize > 1024 * 1024) { // > 1MB
    logger.warn(`Large object cached: ${key}, size: ${Math.round(objectSize / 1024)}KB, TTL: ${ttl}s`);
  }
}

/**
 * Record a cache delete event
 * @param {string} key - The cache key that was deleted
 * @param {string} reason - Reason for deletion
 */
export function recordDelete(key, reason = 'manual') {
  metrics.deletes++;
  
  // Log deletion reason for debugging
  logger.debug(`Cache key deleted: ${key}, reason: ${reason}`);
}

/**
 * Log the current hit rate
 */
function logHitRate() {
  const total = metrics.hits + metrics.misses;
  if (total === 0) return;
  
  const hitRate = (metrics.hits / total * 100).toFixed(2);
  const avgGetTime = metrics.gets > 0 ? (metrics.totalGetTime / metrics.gets).toFixed(2) : 0;
  
  logger.info(`Cache hit rate: ${hitRate}%, hits: ${metrics.hits}, misses: ${metrics.misses}, avg get time: ${avgGetTime}ms`);
}

/**
 * Get cache monitoring metrics
 * @returns {Object} Current cache metrics
 */
export function getMetrics() {
  const total = metrics.hits + metrics.misses;
  const hitRate = total > 0 ? (metrics.hits / total * 100).toFixed(2) : 0;
  const avgGetTime = metrics.gets > 0 ? (metrics.totalGetTime / metrics.gets).toFixed(2) : 0;
  
  // Calculate hit rates by prefix
  const prefixHitRates = {};
  for (const prefix in metrics.prefixHits) {
    const hits = metrics.prefixHits[prefix] || 0;
    const misses = metrics.prefixMisses[prefix] || 0;
    const total = hits + misses;
    prefixHitRates[prefix] = total > 0 ? (hits / total * 100).toFixed(2) : 0;
  }
  
  // Get current cache stats
  const cacheStats = getCacheStats();
  
  return {
    summary: {
      hitRate: `${hitRate}%`,
      hits: metrics.hits,
      misses: metrics.misses,
      sets: metrics.sets,
      deletes: metrics.deletes,
      avgGetTime: `${avgGetTime}ms`,
      monitoringSince: new Date(metrics.lastReset).toISOString()
    },
    prefixHitRates,
    cacheSize: {
      keys: cacheStats.keys,
      ksize: cacheStats.ksize,
      vsize: cacheStats.vsize,
      estimatedMemoryUsage: `${Math.round((cacheStats.ksize + cacheStats.vsize) / 1024)}KB`
    },
    cacheStats
  };
}

/**
 * Reset cache monitoring metrics
 */
export function resetMetrics() {
  metrics.hits = 0;
  metrics.misses = 0;
  metrics.sets = 0;
  metrics.gets = 0;
  metrics.deletes = 0;
  metrics.totalGetTime = 0;
  metrics.totalSetTime = 0;
  metrics.prefixHits = {};
  metrics.prefixMisses = {};
  metrics.lastReset = Date.now();
  
  logger.info('Cache monitoring metrics reset');
}

// Start periodic logging of cache stats
setInterval(() => {
  const metrics = getMetrics();
  logger.info('Periodic cache stats', { 
    hitRate: metrics.summary.hitRate,
    keys: metrics.cacheSize.keys,
    memory: metrics.cacheSize.estimatedMemoryUsage
  });
}, 60000); // Log every minute

export default {
  recordHit,
  recordMiss,
  recordSet,
  recordDelete,
  getMetrics,
  resetMetrics
}; 