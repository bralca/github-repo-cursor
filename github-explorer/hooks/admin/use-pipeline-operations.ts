import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

type PipelineType = 'github_sync' | 'data_processing' | 'data_enrichment' | 'ai_analysis';
type Operation = 'start' | 'stop';

interface UsePipelineOperationsResult {
  startPipeline: (pipelineType: PipelineType) => Promise<void>;
  stopPipeline: (pipelineType: PipelineType) => Promise<void>;
  isStarting: Record<PipelineType, boolean>;
  isStopping: Record<PipelineType, boolean>;
  error: string | null;
}

export function usePipelineOperations(): UsePipelineOperationsResult {
  const [isStarting, setIsStarting] = useState<Record<PipelineType, boolean>>({
    github_sync: false,
    data_processing: false,
    data_enrichment: false,
    ai_analysis: false,
  });
  
  const [isStopping, setIsStopping] = useState<Record<PipelineType, boolean>>({
    github_sync: false,
    data_processing: false,
    data_enrichment: false,
    ai_analysis: false,
  });
  
  const [error, setError] = useState<string | null>(null);
  
  const executePipelineOperation = async (pipelineType: PipelineType, operation: Operation) => {
    const isStartOp = operation === 'start';
    const loadingStateSetter = isStartOp ? setIsStarting : setIsStopping;
    
    try {
      // Reset error state
      setError(null);
      
      // Set loading state
      loadingStateSetter(prev => ({ ...prev, [pipelineType]: true }));
      
      // Call the API
      const response = await fetch('/api/pipeline-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation,
          pipelineType,
        }),
      });
      
      // Handle API response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${operation} pipeline`);
      }
      
      const data = await response.json();
      
      // Show success toast
      toast({
        title: `Pipeline ${isStartOp ? 'Started' : 'Stopped'}`,
        description: data.message || `${pipelineType} pipeline ${isStartOp ? 'started' : 'stopped'} successfully`,
        variant: 'default',
      });
      
    } catch (error: any) {
      // Set error state
      setError(error.message || `An error occurred while trying to ${operation} the pipeline`);
      
      // Show error toast
      toast({
        title: `Pipeline ${isStartOp ? 'Start' : 'Stop'} Failed`,
        description: error.message || `Failed to ${operation} ${pipelineType} pipeline`,
        variant: 'destructive',
      });
      
    } finally {
      // Reset loading state
      loadingStateSetter(prev => ({ ...prev, [pipelineType]: false }));
    }
  };
  
  const startPipeline = async (pipelineType: PipelineType) => {
    await executePipelineOperation(pipelineType, 'start');
  };
  
  const stopPipeline = async (pipelineType: PipelineType) => {
    await executePipelineOperation(pipelineType, 'stop');
  };
  
  return {
    startPipeline,
    stopPipeline,
    isStarting,
    isStopping,
    error,
  };
} 