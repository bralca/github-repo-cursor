import { fetchFromApi, CACHE_TAGS } from './api';

// Default cache TTL for entity data (1 hour in seconds)
const ENTITY_DATA_TTL = 3600;

// Types for entity counts
export interface EntityCountsResponse {
  repositories: number;
  contributors: number;
  mergeRequests: number;
  commits: number;
  files?: number;
  comments?: number;
  // Enriched counts - snake_case
  enriched_repositories?: number;
  enriched_contributors?: number;
  enriched_merge_requests?: number;
  enriched_commits?: number;
  // Unenriched counts - snake_case
  unenriched_repositories?: number;
  unenriched_contributors?: number;
  unenriched_merge_requests?: number;
  total_unenriched_entities?: number;
  // Pipeline-specific counts
  unprocessed_merge_requests?: number;
  total_raw_merge_requests?: number;
  // Enriched counts - camelCase
  enrichedRepositories?: number;
  enrichedContributors?: number;
  enrichedMergeRequests?: number;
  // Unenriched counts - camelCase
  unenrichedRepositories?: number;
  unenrichedContributors?: number;
  unenrichedMergeRequests?: number;
  totalUnenriched?: number;
  // Other counts
  unprocessedMergeRequests?: number;
  closedMergeRequestsRaw?: number;
}

/**
 * Entities API client for interacting with entity-related endpoints
 */
export const entitiesApi = {
  /**
   * Get counts of all entities
   * @param forceRefresh Optional flag to force a fresh request bypassing the cache
   * @returns Object containing counts of all entity types
   */
  async getCounts(forceRefresh = false): Promise<EntityCountsResponse> {
    return await fetchFromApi<EntityCountsResponse>(
      'entity-counts',
      'GET',
      undefined,
      undefined,
      {
        // 1-hour cache with selective revalidation through cache tags
        revalidate: ENTITY_DATA_TTL,
        forceRefresh,
        tags: [CACHE_TAGS.ENTITY_COUNTS]
      }
    );
  }
}; 