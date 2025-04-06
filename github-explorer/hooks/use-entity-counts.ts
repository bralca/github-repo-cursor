import useSWR from 'swr';
import { apiClient } from '@/lib/client/api-client';
import { EntityCountsResponse } from '@/lib/client/entities-api';
import { CACHE_TTL } from '@/lib/client/cache-utils';

/**
 * Options for the useEntityCounts hook
 */
export interface EntityCountsOptions {
  /**
   * Time in seconds to refresh the data
   * Default: 1 hour
   */
  refreshInterval?: number;
  
  /**
   * Whether to revalidate on focus
   * Default: true
   */
  revalidateOnFocus?: boolean;
  
  /**
   * Whether to deduplicate requests within a time window
   * Default: true
   */
  dedupingInterval?: number;
}

/**
 * Hook to fetch entity counts with SWR
 * 
 * @param options Options for SWR behavior
 * @returns Object containing entity counts and loading/error states
 */
export function useEntityCounts(options: EntityCountsOptions = {}) {
  const {
    refreshInterval = CACHE_TTL.DEFAULT, // 1 hour default
    revalidateOnFocus = true,
    dedupingInterval = 5000 // 5 seconds default
  } = options;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    'entity-counts',
    async () => {
      return await apiClient.entities.getCounts();
    },
    {
      refreshInterval: refreshInterval * 1000, // Convert to milliseconds
      revalidateOnFocus,
      dedupingInterval,
      fallbackData: getEmptyEntityCounts() // Provide empty data to avoid undefined
    }
  );
  
  /**
   * Force a refresh of the entity counts
   */
  const refresh = async () => {
    return await mutate(
      apiClient.entities.getCounts(true), // Force refresh from API
      { 
        revalidate: true, 
        populateCache: true 
      }
    );
  };
  
  return {
    data: data || getEmptyEntityCounts(),
    isLoading,
    isValidating,
    error,
    refresh
  };
}

/**
 * Helper function to get empty entity counts
 */
function getEmptyEntityCounts(): EntityCountsResponse {
  return {
    repositories: 0,
    contributors: 0,
    mergeRequests: 0,
    commits: 0,
    enrichedRepositories: 0,
    enrichedContributors: 0,
    enrichedMergeRequests: 0,
    unenrichedRepositories: 0,
    unenrichedContributors: 0,
    unenrichedMergeRequests: 0,
    totalUnenriched: 0,
    unprocessedMergeRequests: 0,
    closedMergeRequestsRaw: 0
  };
} 