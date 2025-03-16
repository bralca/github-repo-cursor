import { useQuery } from '@tanstack/react-query';
import { sqliteClient } from '@/lib/database/sqlite';

/**
 * Hook to fetch pipeline schedules using SQLite
 * @param pipelineType Optional pipeline type to filter schedules by
 * @returns Pipeline schedules data, loading state, and error
 */
export function useSQLitePipelineSchedules(pipelineType?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sqlite-pipeline-schedules', pipelineType],
    queryFn: async () => {
      try {
        return await sqliteClient.pipeline.getSchedules(pipelineType);
      } catch (error: any) {
        console.error('Error fetching pipeline schedules:', error);
        throw new Error(error.message || 'Failed to fetch pipeline schedules');
      }
    },
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    schedules: data || [],
    isLoading,
    error,
    refetch,
  };
} 