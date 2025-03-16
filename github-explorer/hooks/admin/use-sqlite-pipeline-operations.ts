import { useState } from 'react';
import { sqliteClient } from '@/lib/database/sqlite';
import { toast } from '@/components/ui/use-toast';

type PipelineType = 'github_sync' | 'data_processing' | 'data_enrichment' | 'ai_analysis';
type PipelineOperationState = Record<PipelineType, boolean>;

interface UsePipelineOperationsResult {
  startPipeline: (pipelineType: PipelineType) => Promise<void>;
  stopPipeline: (pipelineType: PipelineType) => Promise<void>;
  isStarting: PipelineOperationState;
  isStopping: PipelineOperationState;
  error: string | null;
}

/**
 * Hook for managing pipeline operations using SQLite
 * @returns Functions and state for starting and stopping pipelines
 */
export function useSQLitePipelineOperations(): UsePipelineOperationsResult {
  const [isStarting, setIsStarting] = useState<PipelineOperationState>({
    github_sync: false,
    data_processing: false,
    data_enrichment: false,
    ai_analysis: false,
  });
  
  const [isStopping, setIsStopping] = useState<PipelineOperationState>({
    github_sync: false,
    data_processing: false,
    data_enrichment: false,
    ai_analysis: false,
  });
  
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Execute a pipeline operation (start/stop)
   */
  const executePipelineOperation = async (pipelineType: PipelineType, operation: 'start' | 'stop') => {
    const isStartOp = operation === 'start';
    const loadingStateSetter = isStartOp ? setIsStarting : setIsStopping;
    const operationName = isStartOp ? 'starting' : 'stopping';
    
    try {
      // Reset error state
      setError(null);
      
      // Set loading state
      loadingStateSetter(prev => ({ ...prev, [pipelineType]: true }));
      
      console.log(`${operationName} pipeline: ${pipelineType}`);
      
      // Call the API
      const result = isStartOp
        ? await sqliteClient.pipeline.start(pipelineType)
        : await sqliteClient.pipeline.stop(pipelineType);
      
      // Show success toast
      toast({
        title: `Pipeline ${isStartOp ? 'Executed' : 'Stopped'}`,
        description: result.message || `${pipelineType} pipeline ${isStartOp ? 'executed' : 'stopped'} successfully`,
        variant: 'default',
      });
      
      console.log(`Successfully ${operationName} pipeline:`, result);
      
    } catch (error: any) {
      console.error(`Error ${operationName} pipeline:`, error);
      
      // Set error state
      const errorMessage = error.message || `An error occurred while trying to ${operation} the pipeline`;
      setError(errorMessage);
      
      // Show error toast
      toast({
        title: `Pipeline ${isStartOp ? 'Start' : 'Stop'} Failed`,
        description: errorMessage,
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