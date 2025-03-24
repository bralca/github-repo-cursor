import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, PipelineHistoryEntry } from '@/lib/client/api-client';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook to fetch and manage pipeline execution history
 * @param pipelineType Optional pipeline type to filter history by
 * @param limit Maximum number of history entries to return
 * @returns Pipeline history data, loading state, error, and functions to manage history
 */
export function usePipelineHistory(pipelineType?: string, limit: number = 10) {
  const queryClient = useQueryClient();
  
  // Query for fetching pipeline history
  const { data, isLoading, error, refetch } = useQuery<PipelineHistoryEntry[]>({
    queryKey: ['pipeline-history', pipelineType, limit],
    queryFn: async () => {
      try {
        return await apiClient.pipeline.getHistory(pipelineType, limit);
      } catch (error: any) {
        console.error('Error fetching pipeline history:', error);
        throw new Error(error.message || 'Failed to fetch pipeline history');
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
  
  // Mutation for clearing pipeline history
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.pipeline.clearHistory(pipelineType);
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: "History Cleared",
        description: pipelineType 
          ? `Cleared history for ${pipelineType} pipeline` 
          : "Cleared all pipeline history",
        variant: "default"
      });
      
      // Invalidate history query to refresh data
      queryClient.invalidateQueries({ queryKey: ['pipeline-history'] });
    },
    onError: (error: Error) => {
      // Show error toast
      toast({
        title: "Clear History Failed",
        description: `Failed to clear pipeline history: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  return {
    history: data || [],
    isLoading,
    error,
    refetch,
    clearHistory: clearHistoryMutation.mutate,
    isClearing: clearHistoryMutation.isPending
  };
} 