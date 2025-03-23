import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sqliteClient } from '@/lib/database/sqlite';

interface RawEntityCounts {
  repositories?: number;
  contributors?: number;
  mergeRequests?: number;
  merge_requests?: number;
  commits?: number;
  files?: number;
  comments?: number;
  enriched_repositories?: number;
  enriched_contributors?: number;
  enriched_merge_requests?: number;
  enriched_mergeRequests?: number;
  enriched_commits?: number;
  unprocessed_merge_requests?: number;
  total_raw_merge_requests?: number;
  [key: string]: number | undefined;
}

interface EntityCounts {
  repositories: number;
  contributors: number;
  mergeRequests: number;
  merge_requests?: number;
  commits: number;
  files?: number;
  comments?: number;
  enriched_repositories?: number;
  enriched_contributors?: number;
  enriched_merge_requests?: number;
  enriched_mergeRequests?: number;
  enriched_commits?: number;
  unprocessed_merge_requests?: number;
  total_raw_merge_requests?: number;
}

/**
 * Check if any pipeline is running by looking at the query cache
 * @returns boolean indicating if any pipeline is running
 */
function useAnyPipelineRunning() {
  const queryClient = useQueryClient();
  
  // Look for pipeline status queries in the cache
  const isPipelineRunning = () => {
    const pipelineTypes = ['github_sync', 'data_processing', 'data_enrichment', 'ai_analysis'];
    
    for (const pipelineType of pipelineTypes) {
      // Check if we have status data for this pipeline type
      const queryData = queryClient.getQueryData(['sqlite-pipeline-status', pipelineType]);
      
      // If the pipeline is running, return true
      if (queryData && typeof queryData === 'object' && 'isRunning' in queryData && queryData.isRunning) {
        return true;
      }
    }
    
    // No pipelines are running
    return false;
  };
  
  return isPipelineRunning();
}

/**
 * Hook to fetch entity counts using SQLite
 * @returns Entity counts data, loading state, and error
 */
export function useSQLiteEntityCounts() {
  // Check if any pipeline is running to adjust refetch interval
  const anyPipelineRunning = useAnyPipelineRunning();
  
  const { data, isLoading, error, refetch } = useQuery<EntityCounts>({
    queryKey: ['sqlite-entity-counts'],
    queryFn: async () => {
      try {
        console.log('Fetching entity counts from API...');
        const rawCounts = await sqliteClient.entities.getCounts() as RawEntityCounts;
        console.log('API returned entity counts:', rawCounts);
        
        // Normalize the response to ensure consistent field names
        const normalizedCounts: EntityCounts = {
          repositories: rawCounts.repositories || 0,
          contributors: rawCounts.contributors || 0,
          mergeRequests: rawCounts.mergeRequests || rawCounts.merge_requests || 0,
          merge_requests: rawCounts.merge_requests || rawCounts.mergeRequests || 0,
          commits: rawCounts.commits || 0,
          files: rawCounts.files,
          comments: rawCounts.comments,
          enriched_repositories: rawCounts.enriched_repositories || 0,
          enriched_contributors: rawCounts.enriched_contributors || 0,
          enriched_merge_requests: rawCounts.enriched_merge_requests || rawCounts.enriched_mergeRequests || 0,
          enriched_mergeRequests: rawCounts.enriched_mergeRequests || rawCounts.enriched_merge_requests || 0,
          enriched_commits: rawCounts.enriched_commits || 0,
          unprocessed_merge_requests: rawCounts.unprocessed_merge_requests || 0,
          total_raw_merge_requests: rawCounts.total_raw_merge_requests || 0,
        };
        
        console.log('Normalized entity counts:', normalizedCounts);
        return normalizedCounts;
      } catch (error: any) {
        console.error('Error fetching entity counts:', error);
        throw new Error(error.message || 'Failed to fetch entity counts');
      }
    },
    // Refresh data more frequently, especially when pipelines are running
    refetchInterval: anyPipelineRunning ? 5000 : 30000, 
    // Short stale time to ensure fresh data
    staleTime: anyPipelineRunning ? 3000 : 15000,
    // Always refetch on window focus
    refetchOnWindowFocus: true,
  });

  return {
    counts: data || { 
      repositories: 0, 
      contributors: 0, 
      mergeRequests: 0,
      merge_requests: 0,
      commits: 0,
      enriched_repositories: 0,
      enriched_contributors: 0,
      enriched_merge_requests: 0,
      enriched_mergeRequests: 0,
      enriched_commits: 0,
      unprocessed_merge_requests: 0,
      total_raw_merge_requests: 0
    },
    isLoading,
    error,
    refetch,
  };
} 