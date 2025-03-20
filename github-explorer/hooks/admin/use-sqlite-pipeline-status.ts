import { useQuery } from '@tanstack/react-query';
import { sqliteClient } from '@/lib/database/sqlite';

export interface PipelineStatus {
  itemCount: number;
  lastRun: string | null;
  isActive: boolean;
  isRunning: boolean;
  errorMessage?: string;
}

/**
 * Hook to fetch the status of a specific pipeline using SQLite
 * @param pipelineType The type of pipeline to fetch status for
 * @returns The pipeline status data, loading state, and error
 */
export function useSQLitePipelineStatus(pipelineType: string) {
  // First get the pipeline status to check if it's running
  const statusQuery = useQuery({
    queryKey: ['sqlite-pipeline-status', pipelineType],
    queryFn: async () => {
      try {
        return await sqliteClient.pipeline.getStatus(pipelineType);
      } catch (error: any) {
        console.error(`Error fetching pipeline status for ${pipelineType}:`, error);
        return null;
      }
    },
    refetchInterval: (data) => {
      // Refetch more frequently if the pipeline is running
      return data && 'isRunning' in data && data.isRunning ? 5000 : 30000;
    },
    retry: 3,
  });
  
  // Get the item count, adjusting the refetch interval based on pipeline status
  const itemCountQuery = useQuery({
    queryKey: ['sqlite-pipeline-item-count', pipelineType],
    queryFn: async () => {
      try {
        return await sqliteClient.pipeline.getItemCount(pipelineType);
      } catch (error: any) {
        console.error(`Error fetching pipeline item count for ${pipelineType}:`, error);
        return { count: 0 };
      }
    },
    refetchInterval: () => {
      // Refetch more frequently if the pipeline is running
      // Use the status from the statusQuery
      return statusQuery.data && statusQuery.data.isRunning ? 5000 : 30000;
    },
    retry: 3,
  });
  
  // Combine the data from both queries
  const isLoading = itemCountQuery.isLoading || statusQuery.isLoading;
  const error = itemCountQuery.error || statusQuery.error;
  
  // Combine the data
  const data: PipelineStatus | undefined = (!statusQuery.data || !itemCountQuery.data) 
    ? undefined 
    : {
        itemCount: itemCountQuery.data.count || 0,
        lastRun: statusQuery.data.updatedAt,
        isActive: statusQuery.data.status !== 'idle' && statusQuery.data.status !== 'unknown',
        isRunning: statusQuery.data.isRunning,
        errorMessage: statusQuery.data.status === 'failed' ? 'Operation failed' : undefined
      };
  
  // Function to refetch both queries
  const refetch = () => {
    itemCountQuery.refetch();
    statusQuery.refetch();
  };

  return {
    status: data,
    isLoading,
    error,
    refetch,
  };
} 