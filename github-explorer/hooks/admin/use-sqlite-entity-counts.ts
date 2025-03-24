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
  unenriched_repositories?: number;
  unenriched_contributors?: number;
  unenriched_merge_requests?: number;
  total_unenriched_entities?: number;
  enrichedRepositories?: number;
  enrichedContributors?: number;
  enrichedMergeRequests?: number;
  unenrichedRepositories?: number;
  unenrichedContributors?: number;
  unenrichedMergeRequests?: number;
  unprocessedMergeRequests?: number;
  closedMergeRequestsRaw?: number;
  totalUnenriched?: number;
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
  unenriched_repositories?: number;
  unenriched_contributors?: number;
  unenriched_merge_requests?: number;
  total_unenriched_entities?: number;
  enrichedRepositories?: number;
  enrichedContributors?: number;
  enrichedMergeRequests?: number;
  unenrichedRepositories?: number;
  unenrichedContributors?: number;
  unenrichedMergeRequests?: number;
  unprocessedMergeRequests?: number;
  closedMergeRequestsRaw?: number;
  totalUnenriched?: number;
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
        
        // IMPORTANT: Check if totalUnenriched is present in the response
        console.log('totalUnenriched in API response:', rawCounts.totalUnenriched);
        
        // Normalize the response to ensure consistent field names
        const normalizedCounts: EntityCounts = {
          // Basic counts
          repositories: rawCounts.repositories || 0,
          contributors: rawCounts.contributors || 0,
          mergeRequests: rawCounts.mergeRequests || rawCounts.merge_requests || 0,
          merge_requests: rawCounts.merge_requests || rawCounts.mergeRequests || 0,
          commits: rawCounts.commits || 0,
          files: rawCounts.files,
          comments: rawCounts.comments,
          
          // Enriched counts - support both camelCase and snake_case
          enriched_repositories: rawCounts.enriched_repositories || rawCounts.enrichedRepositories || 0,
          enriched_contributors: rawCounts.enriched_contributors || rawCounts.enrichedContributors || 0,
          enriched_merge_requests: rawCounts.enriched_merge_requests || rawCounts.enrichedMergeRequests || 0,
          enriched_mergeRequests: rawCounts.enriched_mergeRequests || rawCounts.enrichedMergeRequests || 0,
          enriched_commits: rawCounts.enriched_commits || 0,
          
          // Unenriched counts - support both formats
          unenriched_repositories: rawCounts.unenriched_repositories || rawCounts.unenrichedRepositories || 0,
          unenriched_contributors: rawCounts.unenriched_contributors || rawCounts.unenrichedContributors || 0,
          unenriched_merge_requests: rawCounts.unenriched_merge_requests || rawCounts.unenrichedMergeRequests || 0,
          
          // Pipeline-specific counts - support both formats
          unprocessed_merge_requests: rawCounts.unprocessed_merge_requests || rawCounts.unprocessedMergeRequests || 0,
          total_raw_merge_requests: rawCounts.total_raw_merge_requests || rawCounts.closedMergeRequestsRaw || 0,
          total_unenriched_entities: rawCounts.total_unenriched_entities || rawCounts.totalUnenriched || 0,
          
          // Add new camelCase fields directly
          enrichedRepositories: rawCounts.enrichedRepositories || rawCounts.enriched_repositories || 0,
          enrichedContributors: rawCounts.enrichedContributors || rawCounts.enriched_contributors || 0, 
          enrichedMergeRequests: rawCounts.enrichedMergeRequests || rawCounts.enriched_merge_requests || 0,
          unenrichedRepositories: rawCounts.unenrichedRepositories || rawCounts.unenriched_repositories || 0,
          unenrichedContributors: rawCounts.unenrichedContributors || rawCounts.unenriched_contributors || 0,
          unenrichedMergeRequests: rawCounts.unenrichedMergeRequests || rawCounts.unenriched_merge_requests || 0,
          unprocessedMergeRequests: rawCounts.unprocessedMergeRequests || rawCounts.unprocessed_merge_requests || 0, 
          closedMergeRequestsRaw: rawCounts.closedMergeRequestsRaw || rawCounts.total_raw_merge_requests || 0,
          totalUnenriched: rawCounts.totalUnenriched || rawCounts.total_unenriched_entities || 0
        };
        
        // IMPORTANT: Explicitly check for totalUnenriched value
        console.log('totalUnenriched in normalized counts:', normalizedCounts.totalUnenriched);
        
        // Calculate totalUnenriched directly if not present
        if (!normalizedCounts.totalUnenriched) {
          normalizedCounts.totalUnenriched = (
            (normalizedCounts.unenrichedRepositories || 0) + 
            (normalizedCounts.unenrichedContributors || 0) + 
            (normalizedCounts.unenrichedMergeRequests || 0)
          );
          console.log('Calculated totalUnenriched:', normalizedCounts.totalUnenriched);
        }
        
        console.log('Final normalized entity counts:', normalizedCounts);
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
      total_raw_merge_requests: 0,
      total_unenriched_entities: 0,
      
      // Add new camelCase fields
      enrichedRepositories: 0,
      enrichedContributors: 0,
      enrichedMergeRequests: 0,
      unenrichedRepositories: 0,
      unenrichedContributors: 0,
      unenrichedMergeRequests: 0,
      unprocessedMergeRequests: 0,
      closedMergeRequestsRaw: 0,
      totalUnenriched: 0
    },
    isLoading,
    error,
    refetch,
  };
} 