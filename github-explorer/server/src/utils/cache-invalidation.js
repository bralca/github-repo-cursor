/**
 * Cache Invalidation Service
 * 
 * Provides an event-based system for cache invalidation to maintain data freshness.
 * This service handles clearing appropriate caches when data changes, with support
 * for entity-specific invalidation patterns and selective invalidation capabilities.
 */

import { invalidateCache, invalidateCacheByPrefix, clearCache } from './cache.js';
import { setupLogger } from './logger.js';

// Setup component logger
const logger = setupLogger('cache-invalidation');

// Cache key prefixes for different entity types
export const ENTITY_PREFIXES = {
  CONTRIBUTORS: 'contributors',
  REPOSITORIES: 'repositories',
  COMMITS: 'commits',
  MERGE_REQUESTS: 'merge-requests',
  ENTITY_COUNTS: 'entity-counts',
  ACTIVITY: 'activity',
  IMPACT: 'impact'
};

/**
 * Invalidate cache for a specific contributor
 * @param {string|number} contributorId - The contributor ID
 * @returns {Object} Results of invalidation operations
 */
export function invalidateContributorCache(contributorId) {
  logger.info(`Invalidating cache for contributor: ${contributorId}`);
  
  const results = {
    profile: invalidateCache(`${ENTITY_PREFIXES.CONTRIBUTORS}:${contributorId}`),
    activity: invalidateCache(`${ENTITY_PREFIXES.ACTIVITY}:${contributorId}`),
    repositories: invalidateCache(`${ENTITY_PREFIXES.REPOSITORIES}:contributor:${contributorId}`),
    impact: invalidateCache(`${ENTITY_PREFIXES.IMPACT}:${contributorId}`)
  };
  
  // Also invalidate any lists that might include this contributor
  invalidateCache(`${ENTITY_PREFIXES.CONTRIBUTORS}:list`);
  
  logger.debug('Contributor cache invalidation results', results);
  return results;
}

/**
 * Invalidate cache for a specific repository
 * @param {string|number} repositoryId - The repository ID
 * @returns {Object} Results of invalidation operations
 */
export function invalidateRepositoryCache(repositoryId) {
  logger.info(`Invalidating cache for repository: ${repositoryId}`);
  
  const results = {
    repository: invalidateCache(`${ENTITY_PREFIXES.REPOSITORIES}:${repositoryId}`),
    commits: invalidateCache(`${ENTITY_PREFIXES.COMMITS}:repository:${repositoryId}`),
    mergeRequests: invalidateCache(`${ENTITY_PREFIXES.MERGE_REQUESTS}:repository:${repositoryId}`)
  };
  
  // Also invalidate any lists that might include this repository
  invalidateCache(`${ENTITY_PREFIXES.REPOSITORIES}:list`);
  
  logger.debug('Repository cache invalidation results', results);
  return results;
}

/**
 * Invalidate entity counts cache
 * @returns {number} Number of cache entries invalidated
 */
export function invalidateEntityCountsCache() {
  logger.info('Invalidating entity counts cache');
  return invalidateCacheByPrefix(ENTITY_PREFIXES.ENTITY_COUNTS);
}

/**
 * Invalidate all caches for a specific entity type
 * @param {string} entityType - The entity type (use ENTITY_PREFIXES constants)
 * @returns {number} Number of cache entries invalidated
 */
export function invalidateEntityTypeCache(entityType) {
  if (!Object.values(ENTITY_PREFIXES).includes(entityType)) {
    logger.warn(`Invalid entity type for cache invalidation: ${entityType}`);
    return 0;
  }
  
  logger.info(`Invalidating all caches for entity type: ${entityType}`);
  return invalidateCacheByPrefix(entityType);
}

/**
 * Invalidate caches based on data update event
 * @param {string} eventType - The type of update event
 * @param {Object} data - Data related to the update event
 * @returns {Object} Results of invalidation operations
 */
export function invalidateOnDataUpdate(eventType, data = {}) {
  logger.info(`Invalidating caches for event: ${eventType}`, data);
  
  const results = {};
  
  switch (eventType) {
    case 'contributor_updated':
      if (data.contributorId) {
        results.contributor = invalidateContributorCache(data.contributorId);
      }
      break;
      
    case 'repository_updated':
      if (data.repositoryId) {
        results.repository = invalidateRepositoryCache(data.repositoryId);
      }
      break;
      
    case 'new_commit_processed':
      if (data.repositoryId) {
        results.repository = invalidateRepositoryCache(data.repositoryId);
      }
      if (data.contributorId) {
        results.contributor = invalidateContributorCache(data.contributorId);
      }
      results.entityCounts = invalidateEntityCountsCache();
      break;
      
    case 'new_merge_request_processed':
      if (data.repositoryId) {
        results.repository = invalidateRepositoryCache(data.repositoryId);
      }
      if (data.contributorId) {
        results.contributor = invalidateContributorCache(data.contributorId);
      }
      results.entityCounts = invalidateEntityCountsCache();
      break;
      
    case 'pipeline_completed':
      // After a complete pipeline run, invalidate all entity counts
      results.entityCounts = invalidateEntityCountsCache();
      // Also invalidate contributor rankings
      results.contributors = invalidateCacheByPrefix(ENTITY_PREFIXES.CONTRIBUTORS);
      break;
      
    case 'full_refresh_required':
      // In case of major data changes, clear all caches
      clearCache();
      results.fullClear = true;
      break;
      
    default:
      logger.warn(`Unknown event type for cache invalidation: ${eventType}`);
      break;
  }
  
  logger.debug('Data update cache invalidation results', results);
  return results;
}

/**
 * Schedule cache invalidation for entities at a future time
 * This is useful for eventual consistency when data changes might
 * not be immediately visible
 * 
 * @param {string} entityType - The entity type to invalidate
 * @param {string|number} entityId - The entity ID
 * @param {number} delayMs - Delay in milliseconds
 * @returns {NodeJS.Timeout} The timer object
 */
export function scheduleInvalidation(entityType, entityId, delayMs = 5000) {
  logger.info(`Scheduling cache invalidation for ${entityType}:${entityId} in ${delayMs}ms`);
  
  return setTimeout(() => {
    logger.info(`Executing scheduled invalidation for ${entityType}:${entityId}`);
    
    switch (entityType) {
      case ENTITY_PREFIXES.CONTRIBUTORS:
        invalidateContributorCache(entityId);
        break;
        
      case ENTITY_PREFIXES.REPOSITORIES:
        invalidateRepositoryCache(entityId);
        break;
        
      default:
        invalidateCache(`${entityType}:${entityId}`);
        break;
    }
  }, delayMs);
}

export default {
  invalidateContributorCache,
  invalidateRepositoryCache,
  invalidateEntityCountsCache,
  invalidateEntityTypeCache,
  invalidateOnDataUpdate,
  scheduleInvalidation,
  ENTITY_PREFIXES
}; 