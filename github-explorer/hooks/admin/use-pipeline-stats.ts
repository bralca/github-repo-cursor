import { useQuery } from '@tanstack/react-query';
import { apiClient, PipelineStatsResponse } from '@/lib/client/api-client';

/**
 * Custom hook to fetch pipeline statistics
 */
export function usePipelineStats() {
  const { 
    data, 
    isLoading, 
    error,
    refetch
  } = useQuery<PipelineStatsResponse>({
    queryKey: ['pipeline-stats'],
    queryFn: () => apiClient.pipeline.getStats(),
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnWindowFocus: true,
  });

  // Convenience getters
  const getClosedMergeRequestsCount = () => data?.closedMergeRequestsRaw || 0;
  const getUnprocessedMergeRequestsCount = () => data?.unprocessedMergeRequests || 0;
  const getRepositoriesCount = () => data?.repositories || 0;
  const getContributorsCount = () => data?.contributors || 0;
  const getMergeRequestsCount = () => data?.mergeRequests || 0;
  const getUnenrichedEntitiesCount = () => data?.totalUnenriched || 0;

  return {
    stats: data,
    isLoading,
    error,
    refetch,
    // Convenience getters
    getClosedMergeRequestsCount,
    getUnprocessedMergeRequestsCount,
    getRepositoriesCount,
    getContributorsCount,
    getMergeRequestsCount,
    getUnenrichedEntitiesCount,
  };
} 