import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/client/api-client';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook to provide pipeline operations (start/stop)
 * @returns Functions to start and stop pipelines
 */
export function usePipelineOperations() {
  const queryClient = useQueryClient();

  // Mutation for starting a pipeline
  const startPipelineMutation = useMutation({
    mutationFn: async (pipelineType: string) => {
      return await apiClient.pipeline.start(pipelineType);
    },
    onSuccess: (data, pipelineType) => {
      // Show success toast
      toast({
        title: "Pipeline Started",
        description: `Started ${pipelineType} pipeline successfully`,
        variant: "default"
      });
      
      // Invalidate relevant queries to refresh their data
      queryClient.invalidateQueries({ queryKey: ['pipeline-status', pipelineType] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-history'] });
    },
    onError: (error: Error, pipelineType) => {
      // Show error toast
      toast({
        title: "Pipeline Start Failed",
        description: `Failed to start ${pipelineType} pipeline: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Mutation for stopping a pipeline
  const stopPipelineMutation = useMutation({
    mutationFn: async (pipelineType: string) => {
      return await apiClient.pipeline.stop(pipelineType);
    },
    onSuccess: (data, pipelineType) => {
      // Show success toast
      toast({
        title: "Pipeline Stopped",
        description: `Stopped ${pipelineType} pipeline successfully`,
        variant: "default"
      });
      
      // Invalidate relevant queries to refresh their data
      queryClient.invalidateQueries({ queryKey: ['pipeline-status', pipelineType] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-history'] });
    },
    onError: (error: Error, pipelineType) => {
      // Show error toast
      toast({
        title: "Pipeline Stop Failed",
        description: `Failed to stop ${pipelineType} pipeline: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return {
    startPipeline: startPipelineMutation.mutate,
    stopPipeline: stopPipelineMutation.mutate,
    isStarting: startPipelineMutation.isPending,
    isStopping: stopPipelineMutation.isPending
  };
} 