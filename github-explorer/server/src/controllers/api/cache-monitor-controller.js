/**
 * Cache Monitoring Controller
 * 
 * Provides endpoints for monitoring cache performance and debugging cache-related issues.
 * These endpoints allow administrators to view cache metrics, get insights into cache
 * performance, and reset monitoring statistics.
 */

import { getMetrics, resetMetrics } from '../../utils/cache-monitor.js';
import { setupLogger } from '../../utils/logger.js';
import { getCacheInstance, getCacheStats } from '../../utils/cache.js';

const logger = setupLogger('cache-monitor-controller');

/**
 * Get cache monitoring metrics
 */
export async function getCacheMetrics(req, res) {
  try {
    const metrics = getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting cache metrics', { error });
    res.status(500).json({ error: 'Failed to get cache metrics', message: error.message });
  }
}

/**
 * Reset cache monitoring metrics
 */
export async function resetCacheMetrics(req, res) {
  try {
    resetMetrics();
    res.json({ success: true, message: 'Cache monitoring metrics reset successfully' });
  } catch (error) {
    logger.error('Error resetting cache metrics', { error });
    res.status(500).json({ error: 'Failed to reset cache metrics', message: error.message });
  }
}

/**
 * Get cache keys (admin only, limited to first 100 keys)
 */
export async function getCacheKeys(req, res) {
  try {
    const cache = getCacheInstance();
    // Only return the first 100 keys to prevent overwhelming response
    const keys = cache.keys().slice(0, 100);
    
    // Get key metadata (TTL, size) if requested
    const includeMetadata = req.query.metadata === 'true';
    
    if (includeMetadata) {
      const keysWithMetadata = keys.map(key => {
        const ttl = cache.getTtl(key);
        const value = cache.get(key);
        const size = value !== undefined ? 
          JSON.stringify(value).length : 0;
        
        return {
          key,
          ttl: ttl ? Math.round((ttl - Date.now()) / 1000) : 'no TTL',
          size: `${Math.round(size / 1024)}KB`,
          expiresAt: ttl ? new Date(ttl).toISOString() : 'never'
        };
      });
      
      res.json({ 
        keys: keysWithMetadata,
        total: cache.keys().length,
        showing: keys.length
      });
    } else {
      res.json({ 
        keys,
        total: cache.keys().length,
        showing: keys.length
      });
    }
  } catch (error) {
    logger.error('Error getting cache keys', { error });
    res.status(500).json({ error: 'Failed to get cache keys', message: error.message });
  }
}

/**
 * Get a specific cached value by key (admin only)
 */
export async function getCacheValue(req, res) {
  const { key } = req.params;
  
  if (!key) {
    return res.status(400).json({ error: 'Cache key is required' });
  }
  
  try {
    const cache = getCacheInstance();
    const value = cache.get(key);
    
    if (value === undefined) {
      return res.status(404).json({ error: 'Cache key not found' });
    }
    
    // Get TTL if available
    const ttl = cache.getTtl(key);
    const remainingTtl = ttl ? Math.round((ttl - Date.now()) / 1000) : 'no TTL';
    
    res.json({
      key,
      value,
      ttl: remainingTtl,
      expiresAt: ttl ? new Date(ttl).toISOString() : 'never'
    });
  } catch (error) {
    logger.error('Error getting cache value', { error, key });
    res.status(500).json({ error: 'Failed to get cache value', message: error.message });
  }
}

/**
 * Search for cache keys by pattern (admin only)
 */
export async function searchCacheKeys(req, res) {
  const { pattern } = req.query;
  
  if (!pattern) {
    return res.status(400).json({ error: 'Search pattern is required' });
  }
  
  try {
    const cache = getCacheInstance();
    const keys = cache.keys();
    
    // Search for keys matching the pattern
    const matchingKeys = keys.filter(key => 
      key.toLowerCase().includes(pattern.toLowerCase())
    ).slice(0, 100); // Limit to 100 results
    
    res.json({
      pattern,
      keys: matchingKeys,
      total: matchingKeys.length,
      showing: matchingKeys.length
    });
  } catch (error) {
    logger.error('Error searching cache keys', { error, pattern });
    res.status(500).json({ error: 'Failed to search cache keys', message: error.message });
  }
} 