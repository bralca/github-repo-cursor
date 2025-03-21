import { useSupabaseQuery } from '@/hooks/supabase/use-supabase-query';

/**
 * Hook to fetch pipeline history using Supabase
 * @param pipelineType Optional pipeline type to filter history by
 * @param limit Maximum number of history entries to fetch
 * @returns Pipeline history data, loading state, and error
 */
export function usePipelineHistory(pipelineType?: string, limit: number = 10) {
  const { data, isLoading, error, refetch } = useSupabaseQuery<any[]>(
    ['pipeline-history', pipelineType || 'all', limit.toString()],
    async () => {
      const url = pipelineType 
        ? `/api/pipeline-history?pipeline_type=${pipelineType}&limit=${limit}`
        : `/api/pipeline-history?limit=${limit}`;
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline history');
      }
      const data = await response.json();
      return { data: data.history || [], error: null };
    },
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );

  return {
    history: data || [],
    isLoading,
    error,
    refetch,
  };
} 