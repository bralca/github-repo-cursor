import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, EntityCountsResponse } from '@/lib/client/api-client';

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
      const queryData = queryClient.getQueryData(['pipeline-status', pipelineType]);
      
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
 * Hook to fetch entity counts from the backend API
 * @returns Entity counts data, loading state, and error
 */
export function useEntityCounts() {
  // Check if any pipeline is running to adjust refetch interval
  const anyPipelineRunning = useAnyPipelineRunning();
  
  const { data, isLoading, error, refetch } = useQuery<EntityCountsResponse>({
    queryKey: ['entity-counts'],
    queryFn: async () => {
      try {
        console.log('Fetching entity counts from API...');
        const counts = await apiClient.entities.getCounts();
        console.log('API returned entity counts:', counts);
        return counts;
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
      commits: 0
    },
    isLoading,
    error,
    refetch,
  };
} 