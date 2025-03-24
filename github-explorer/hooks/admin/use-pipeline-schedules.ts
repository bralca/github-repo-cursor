import { useQuery } from '@tanstack/react-query';
import { apiClient, PipelineHistoryEntry } from '@/lib/client/api-client';

/**
 * Hook to fetch pipeline schedules from the backend API
 * @param pipelineType Optional pipeline type to filter schedules by
 * @returns Pipeline schedules data, loading state, and error
 */
export function usePipelineSchedules(pipelineType?: string) {
  const { data, isLoading, error, refetch } = useQuery<PipelineHistoryEntry[]>({
    queryKey: ['pipeline-schedules', pipelineType],
    queryFn: async () => {
      try {
        // Use getHistory since dedicated schedules endpoint isn't available yet
        return await apiClient.pipeline.getHistory(pipelineType);
      } catch (error: any) {
        console.error('Error fetching pipeline schedules:', error);
        throw new Error(error.message || 'Failed to fetch pipeline schedules');
      }
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Data is stale after 30 seconds
  });

  return {
    schedules: data || [],
    isLoading,
    error,
    refetch,
  };
} 