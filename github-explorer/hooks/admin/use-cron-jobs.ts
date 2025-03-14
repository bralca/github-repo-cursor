import { useSupabaseQuery } from '@/hooks/supabase/use-supabase-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface CronJob {
  id: string;
  pipeline_type: string;
  cron_expression: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch and manage cron jobs
 */
export function useCronJobs(pipelineType?: string) {
  const queryClient = useQueryClient();
  
  // Fetch cron jobs
  const queryKey = pipelineType 
    ? ['cron-jobs', pipelineType] 
    : ['cron-jobs'];
  
  const url = pipelineType 
    ? `/api/cron-jobs?pipeline_type=${pipelineType}` 
    : '/api/cron-jobs';
  
  const { data, isLoading, error } = useSupabaseQuery<CronJob[]>(
    queryKey,
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch cron jobs');
      }
      const data = await response.json();
      return { data, error: null };
    },
    { refetchInterval: 30000 } // Refetch every 30 seconds
  );
  
  // Create or update a cron job
  const createOrUpdateCronJob = useMutation({
    mutationFn: async (cronJob: { 
      pipeline_type: string; 
      cron_expression: string; 
      is_active?: boolean;
    }) => {
      const response = await fetch('/api/cron-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cronJob),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create/update cron job');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
      if (pipelineType) {
        queryClient.invalidateQueries({ queryKey: ['cron-jobs', pipelineType] });
      }
    },
  });
  
  // Toggle cron job active status
  const toggleCronJobStatus = useMutation({
    mutationFn: async ({ 
      pipeline_type, 
      is_active 
    }: { 
      pipeline_type: string; 
      is_active: boolean;
    }) => {
      const response = await fetch('/api/cron-jobs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pipeline_type, is_active }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle cron job status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
      if (pipelineType) {
        queryClient.invalidateQueries({ queryKey: ['cron-jobs', pipelineType] });
      }
    },
  });
  
  return {
    cronJobs: data || [],
    isLoading,
    error,
    createOrUpdateCronJob,
    toggleCronJobStatus,
  };
} 