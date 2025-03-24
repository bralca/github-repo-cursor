import { useQuery } from '@tanstack/react-query';
import { apiClient, PipelineStatusResponse } from '@/lib/client/api-client';

export interface PipelineStatus {
  itemCount?: number;
  lastRun?: string | null;
  isActive?: boolean;
  isRunning: boolean;
  errorMessage?: string;
}

/**
 * Hook to fetch pipeline status from the backend API
 * @param pipelineType The type of pipeline to fetch status for
 * @returns The pipeline status data, loading state, and error
 */
export function usePipelineStatus(pipelineType: string) {
  const { data, isLoading, error, refetch } = useQuery<PipelineStatusResponse>({
    queryKey: ['pipeline-status', pipelineType],
    queryFn: async () => {
      try {
        console.log(`Fetching status for pipeline type: ${pipelineType}`);
        return await apiClient.pipeline.getStatus(pipelineType);
      } catch (error: any) {
        console.error(`Error fetching status for pipeline type ${pipelineType}:`, error);
        throw new Error(error.message || `Failed to fetch status for pipeline type ${pipelineType}`);
      }
    },
    // Refresh status frequently to keep UI up to date
    refetchInterval: 5000, 
    // Short stale time to ensure fresh data
    staleTime: 3000,
    // Always refetch on window focus
    refetchOnWindowFocus: true,
  });

  // Get item count for the pipeline
  const { data: itemCountData } = useQuery({
    queryKey: ['pipeline-item-count', pipelineType],
    queryFn: async () => {
      try {
        return await apiClient.pipeline.getItemCount(pipelineType);
      } catch (error) {
        console.error(`Error fetching item count for pipeline type ${pipelineType}:`, error);
        return { count: 0 };
      }
    },
    enabled: !!data, // Only fetch item count if we have pipeline status
    refetchInterval: 10000,
  });

  // Convert API response to match existing interface
  const status: PipelineStatus | null = data ? {
    itemCount: itemCountData?.count || 0,
    lastRun: data.updatedAt,
    isActive: data.status === 'active' || data.status === 'running',
    isRunning: data.isRunning,
    errorMessage: data.status === 'failed' ? 'Pipeline execution failed' : undefined,
  } : null;

  return {
    status,
    isLoading,
    error,
    refetch,
    isRunning: status?.isRunning || false
  };
} 