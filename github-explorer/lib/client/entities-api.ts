import { fetchFromApi } from './api';

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
   * @returns Object containing counts of all entity types
   */
  async getCounts(): Promise<EntityCountsResponse> {
    return await fetchFromApi<EntityCountsResponse>('entity-counts');
  }
}; 