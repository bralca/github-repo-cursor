/**
 * Cache Invalidation Controller
 * 
 * This controller provides endpoints for managing cache invalidation.
 * It allows manual and programmatic invalidation of caches for different entities
 * to ensure data freshness.
 */

import { 
  invalidateContributorCache,
  invalidateRepositoryCache,
  invalidateEntityCountsCache,
  invalidateEntityTypeCache,
  invalidateOnDataUpdate,
  ENTITY_PREFIXES
} from '../../utils/cache-invalidation.js';
import { setupLogger } from '../../utils/logger.js';

const logger = setupLogger('cache-invalidation-controller');

/**
 * Clear cache for a specific entity type
 */
export async function clearCacheByEntityType(req, res) {
  const { entityType } = req.params;
  
  // Validate entity type
  if (!Object.values(ENTITY_PREFIXES).includes(entityType)) {
    logger.warn(`Invalid entity type for cache invalidation: ${entityType}`);
    return res.status(400).json({ 
      error: 'Invalid entity type',
      validTypes: Object.values(ENTITY_PREFIXES)
    });
  }
  
  try {
    const count = invalidateEntityTypeCache(entityType);
    
    logger.info(`Cache cleared for entity type: ${entityType}, entries invalidated: ${count}`);
    res.json({ 
      success: true, 
      entityType,
      entriesInvalidated: count
    });
  } catch (error) {
    logger.error('Error clearing cache', { error, entityType });
    res.status(500).json({ error: 'Failed to clear cache', message: error.message });
  }
}

/**
 * Clear cache for a specific contributor
 */
export async function clearContributorCache(req, res) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Contributor ID is required' });
  }
  
  try {
    const result = invalidateContributorCache(id);
    
    logger.info(`Cache cleared for contributor: ${id}`, result);
    res.json({ 
      success: true, 
      contributorId: id,
      invalidationResult: result
    });
  } catch (error) {
    logger.error('Error clearing contributor cache', { error, contributorId: id });
    res.status(500).json({ error: 'Failed to clear contributor cache', message: error.message });
  }
}

/**
 * Clear cache for a specific repository
 */
export async function clearRepositoryCache(req, res) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Repository ID is required' });
  }
  
  try {
    const result = invalidateRepositoryCache(id);
    
    logger.info(`Cache cleared for repository: ${id}`, result);
    res.json({ 
      success: true, 
      repositoryId: id,
      invalidationResult: result
    });
  } catch (error) {
    logger.error('Error clearing repository cache', { error, repositoryId: id });
    res.status(500).json({ error: 'Failed to clear repository cache', message: error.message });
  }
}

/**
 * Clear entity counts cache
 */
export async function clearEntityCountsCache(req, res) {
  try {
    const count = invalidateEntityCountsCache();
    
    logger.info(`Entity counts cache cleared, entries invalidated: ${count}`);
    res.json({ 
      success: true, 
      entriesInvalidated: count
    });
  } catch (error) {
    logger.error('Error clearing entity counts cache', { error });
    res.status(500).json({ error: 'Failed to clear entity counts cache', message: error.message });
  }
}

/**
 * Trigger cache invalidation based on a data update event
 */
export async function triggerDataUpdateInvalidation(req, res) {
  const { eventType, data } = req.body;
  
  if (!eventType) {
    return res.status(400).json({ error: 'Event type is required' });
  }
  
  try {
    const result = invalidateOnDataUpdate(eventType, data);
    
    logger.info(`Cache invalidation triggered for event: ${eventType}`, result);
    res.json({ 
      success: true, 
      eventType,
      invalidationResult: result
    });
  } catch (error) {
    logger.error('Error triggering cache invalidation', { error, eventType });
    res.status(500).json({ error: 'Failed to trigger cache invalidation', message: error.message });
  }
}

/**
 * Get available entity types for cache invalidation
 */
export async function getEntityTypes(req, res) {
  res.json({
    entityTypes: Object.values(ENTITY_PREFIXES),
    prefixes: ENTITY_PREFIXES
  });
} 