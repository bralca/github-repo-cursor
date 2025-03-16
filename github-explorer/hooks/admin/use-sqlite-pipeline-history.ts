import { useQuery } from '@tanstack/react-query';
import { sqliteClient } from '@/lib/database/sqlite';

/**
 * Hook to fetch pipeline history using SQLite
 * @param pipelineType Optional pipeline type to filter history by
 * @param limit Maximum number of history entries to fetch
 * @returns Pipeline history data, loading state, and error
 */
export function useSQLitePipelineHistory(pipelineType?: string, limit: number = 10) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sqlite-pipeline-history', pipelineType, limit],
    queryFn: async () => {
      try {
        return await sqliteClient.pipeline.getHistory(pipelineType, limit);
      } catch (error: any) {
        console.error('Error fetching pipeline history:', error);
        throw new Error(error.message || 'Failed to fetch pipeline history');
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    history: data || [],
    isLoading,
    error,
    refetch,
  };
} 