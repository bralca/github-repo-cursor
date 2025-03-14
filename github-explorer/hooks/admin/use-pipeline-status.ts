import { useSupabaseQuery } from '@/hooks/supabase/use-supabase-query';

export interface PipelineStatus {
  itemCount: number;
  lastRun: string | null;
  isActive: boolean;
  isRunning: boolean;
  errorMessage?: string;
}

/**
 * Hook to fetch the status of a specific pipeline
 * @param pipelineType The type of pipeline to fetch status for
 * @returns The pipeline status data, loading state, and error
 */
export function usePipelineStatus(pipelineType: string) {
  // First, try to get the pipeline schedule from the database
  const scheduleQuery = useSupabaseQuery<any[]>(
    ['pipeline-schedule', pipelineType],
    async () => {
      const response = await fetch(`/api/pipeline-schedules?pipeline_type=${pipelineType}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pipeline schedule');
      }
      const data = await response.json();
      return { data: data.schedules || [], error: null };
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Then, get the item counts for this pipeline type
  const itemCountQuery = useSupabaseQuery<{ count: number }>(
    ['pipeline-item-count', pipelineType],
    async () => {
      const response = await fetch(`/api/pipeline-item-count?pipeline_type=${pipelineType}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pipeline item count');
      }
      const data = await response.json();
      return { data, error: null };
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Get the pipeline history for this type
  const historyQuery = useSupabaseQuery<any[]>(
    ['pipeline-history', pipelineType],
    async () => {
      const response = await fetch(`/api/pipeline-history?pipeline_type=${pipelineType}&limit=1`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pipeline history');
      }
      const data = await response.json();
      return { data: data.history || [], error: null };
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Function to refetch all queries
  const refetch = async () => {
    await Promise.all([
      scheduleQuery.refetch(),
      itemCountQuery.refetch(),
      historyQuery.refetch()
    ]);
  };

  // If any of the queries are loading, the overall status is loading
  const isLoading = scheduleQuery.isLoading || itemCountQuery.isLoading || historyQuery.isLoading;

  // If any of the queries have an error, the overall status has an error
  const error = scheduleQuery.error || itemCountQuery.error || historyQuery.error;

  // If we're loading or have an error, return early
  if (isLoading || error) {
    return {
      status: null,
      isLoading,
      error,
      refetch,
    };
  }

  // Process the data to create a pipeline status object
  const schedule = scheduleQuery.data?.[0];
  const itemCount = itemCountQuery.data?.count || 0;
  const lastRun = historyQuery.data?.[0];

  // Create the pipeline status object
  const status: PipelineStatus = {
    itemCount,
    lastRun: lastRun?.completed_at || lastRun?.started_at || null,
    isActive: schedule?.is_active || false,
    isRunning: lastRun?.status === 'running',
    errorMessage: lastRun?.status === 'failed' ? lastRun.error_message : undefined,
  };

  return {
    status,
    isLoading,
    error,
    refetch,
  };
} 