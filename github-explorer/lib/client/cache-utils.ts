/**
 * Client-side cache utilities
 * 
 * Provides standardized functions for managing Next.js data cache
 * through consistent patterns for key generation, revalidation,
 * and cache tag management.
 */

import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from './api';

/**
 * Default TTL values (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  DEFAULT: 3600,    // 1 hour
  LONG: 86400       // 1 day
};

/**
 * Generate a consistent cache key for entity data
 * @param entityType The type of entity (e.g., 'contributor', 'repository')
 * @param id The entity ID
 * @param action Optional action or sub-resource (e.g., 'activity', 'repositories')
 * @returns Formatted cache tag
 */
export function generateEntityCacheTag(entityType: string, id: string, action?: string): string {
  return action 
    ? `${entityType}-${id}-${action}`
    : `${entityType}-${id}`;
}

/**
 * Generate a param-based cache key
 * @param prefix The prefix for the key
 * @param params Object containing params to include in the key
 * @returns Formatted cache key as string
 */
export function generateParamCacheKey(prefix: string, params: Record<string, any>): string {
  // Sort keys for consistency
  const sortedParams = Object.keys(params).sort().reduce(
    (result, key) => {
      if (params[key] !== undefined && params[key] !== null) {
        result[key] = params[key];
      }
      return result;
    }, 
    {} as Record<string, any>
  );
  
  return `${prefix}:${JSON.stringify(sortedParams)}`;
}

/**
 * Invalidate cache for a specific entity
 * @param entityType The entity type (e.g., 'contributor', 'repository')
 * @param id The entity ID
 * @param actions Optional array of actions/sub-resources to invalidate
 */
export function invalidateEntityCache(entityType: string, id: string, actions?: string[]): void {
  // Invalidate the base entity tag
  const baseTag = generateEntityCacheTag(entityType, id);
  revalidateTag(baseTag);
  
  // Invalidate action-specific tags if provided
  if (actions && actions.length > 0) {
    actions.forEach(action => {
      const actionTag = generateEntityCacheTag(entityType, id, action);
      revalidateTag(actionTag);
    });
  }
}

/**
 * Invalidate all cache for an entity type
 * @param entityType The entity type (e.g., 'contributors', 'repositories')
 */
export function invalidateTypeCache(entityType: string): void {
  // Map to the corresponding cache tag and invalidate
  switch (entityType.toLowerCase()) {
    case 'contributor':
    case 'contributors':
      revalidateTag(CACHE_TAGS.CONTRIBUTORS);
      break;
    case 'repository':
    case 'repositories':
      revalidateTag(CACHE_TAGS.REPOSITORIES);
      break;
    case 'merge_request':
    case 'merge_requests':
    case 'mergerequest':
    case 'mergerequests':
      revalidateTag(CACHE_TAGS.MERGE_REQUESTS);
      break;
    case 'commit':
    case 'commits':
      revalidateTag(CACHE_TAGS.COMMITS);
      break;
    case 'entity':
    case 'entities':
    case 'count':
    case 'counts':
    case 'entity_counts':
      revalidateTag(CACHE_TAGS.ENTITY_COUNTS);
      break;
    case 'pipeline':
    case 'pipelines':
      revalidateTag(CACHE_TAGS.PIPELINE);
      break;
    case 'all':
      // Invalidate all cache tags
      Object.values(CACHE_TAGS).forEach(tag => revalidateTag(tag));
      break;
    default:
      console.warn(`Unknown entity type for cache invalidation: ${entityType}`);
  }
}

/**
 * Force refresh for an API request
 * This can be used in components that need a fresh request
 * @param apiCall Function that makes the API call with forceRefresh=true
 * @returns The result of the API call
 */
export async function forceRefresh<T>(apiCall: () => Promise<T>): Promise<T> {
  return await apiCall();
}

/**
 * Debug function to log the current revalidation settings
 * @param prefix Cache key prefix for identification
 * @param ttl TTL value in seconds
 * @param tags Array of cache tags
 */
export function logCacheSettings(prefix: string, ttl: number, tags: string[]): void {
  console.debug('[Cache Settings]', {
    prefix,
    ttl,
    tags,
    ttlFormatted: formatTTL(ttl)
  });
}

/**
 * Format TTL for better readability
 * @param seconds TTL in seconds
 * @returns Formatted string
 */
function formatTTL(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} minutes`;
  } else if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} hours`;
  } else {
    return `${Math.floor(seconds / 86400)} days`;
  }
} 