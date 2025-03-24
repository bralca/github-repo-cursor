import { fetchFromApi } from './api';

// Types for entity counts
export interface EntityCountsResponse {
  repositories: number;
  contributors: number;
  mergeRequests: number;
  commits: number;
  files?: number;
  comments?: number;
  enriched_repositories?: number;
  enriched_contributors?: number;
  enriched_merge_requests?: number;
  enriched_commits?: number;
  unprocessed_merge_requests?: number;
  total_raw_merge_requests?: number;
}

/**
 * Entities API client for interacting with entity-related endpoints
 */
export const entitiesApi = {
  /**
   * Get counts of all entities
   * @returns Object containing counts of all entity types
   */
  async getCounts(): Promise<EntityCountsResponse> {
    return await fetchFromApi<EntityCountsResponse>('entity-counts');
  }
}; 