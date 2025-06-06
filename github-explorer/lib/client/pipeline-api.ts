import { fetchFromApi } from './api';

// Types for pipeline status
export interface PipelineStatusResponse {
  pipelineType: string;
  status: string;
  isRunning: boolean;
  updatedAt: string | null;
}

// Types for pipeline operations
export interface PipelineOperationResponse {
  success: boolean;
  message: string;
}

// Types for pipeline item count
export interface PipelineItemCountResponse {
  pipelineType: string;
  count: number;
}

// Types for pipeline history
export interface PipelineHistoryEntry {
  id: string;
  pipelineType: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  itemsProcessed: number | null;
  errorMessage: string | null;
  duration: number | null;
}

// Add new pipeline stats response interface
export interface PipelineStatsResponse {
  repositories: number;
  contributors: number;
  mergeRequests: number;
  commits: number;
  closedMergeRequestsRaw: number;
  unprocessedMergeRequests: number;
  unenrichedRepositories: number;
  unenrichedContributors: number;
  unenrichedMergeRequests: number;
  totalUnenriched: number;
  pipelineStatus: {
    github_sync: {
      status: string;
      isRunning: boolean;
      lastRun: string | null;
    };
    data_processing: {
      status: string;
      isRunning: boolean;
      lastRun: string | null;
    };
    data_enrichment: {
      status: string;
      isRunning: boolean;
      lastRun: string | null;
    };
  };
}

/**
 * Pipeline API client for interacting with pipeline-related endpoints
 */
export const pipelineApi = {
  /**
   * Get the status of a specific pipeline
   * @param pipelineType The type of pipeline to get status for
   * @returns The current status of the pipeline
   */
  async getStatus(pipelineType: string): Promise<PipelineStatusResponse> {
    return await fetchFromApi<PipelineStatusResponse>(
      'pipeline-status',
      'GET',
      { pipeline_type: pipelineType }
    );
  },
  
  /**
   * Start a pipeline
   * @param pipelineType The type of pipeline to start
   * @returns Response indicating success or failure
   */
  async start(pipelineType: string): Promise<PipelineOperationResponse> {
    // Log the request body to debug
    console.log("Pipeline API start request body:", {
      pipeline_type: pipelineType,
      direct_execution: true
    });
    
    return await fetchFromApi<PipelineOperationResponse>(
      'pipeline/start',
      'POST',
      undefined,
      {
        pipeline_type: pipelineType,
        direct_execution: true
      }
    );
  },
  
  /**
   * Stop a pipeline
   * @param pipelineType The type of pipeline to stop
   * @returns Response indicating success or failure
   */
  async stop(pipelineType: string): Promise<PipelineOperationResponse> {
    return await fetchFromApi<PipelineOperationResponse>(
      'pipeline/stop',
      'POST',
      undefined,
      {
        pipeline_type: pipelineType,
        direct_execution: true
      }
    );
  },
  
  /**
   * Get the item count for a pipeline
   * @param pipelineType The type of pipeline to get item count for
   * @returns The current item count for the pipeline
   */
  async getItemCount(pipelineType: string): Promise<PipelineItemCountResponse> {
    return await fetchFromApi<PipelineItemCountResponse>(
      'pipeline-item-count',
      'GET',
      { pipeline_type: pipelineType }
    );
  },
  
  /**
   * Get pipeline execution history
   * @param pipelineType Optional pipeline type to filter history
   * @param limit Maximum number of history items to return
   * @returns Array of pipeline history entries
   */
  async getHistory(pipelineType?: string, limit: number = 10): Promise<PipelineHistoryEntry[]> {
    const params: Record<string, string> = {};
    
    if (pipelineType) {
      params.pipeline_type = pipelineType;
    }
    
    params.limit = limit.toString();
    
    return await fetchFromApi<PipelineHistoryEntry[]>(
      'pipeline-history',
      'GET',
      params
    );
  },
  
  /**
   * Clear pipeline history
   * @param pipelineType Optional pipeline type to clear history for
   * @returns Response indicating success or failure
   */
  async clearHistory(pipelineType?: string): Promise<PipelineOperationResponse> {
    const params: Record<string, string> = {};
    
    if (pipelineType) {
      params.pipeline_type = pipelineType;
    }
    
    return await fetchFromApi<PipelineOperationResponse>(
      'pipeline-history-clear',
      'POST',
      params
    );
  },

  /**
   * Get statistics for all pipelines and their processing counts
   * @returns Pipeline statistics including counts for each stage
   */
  async getStats(): Promise<PipelineStatsResponse> {
    const response = await fetchFromApi<PipelineStatsResponse>(
      'pipeline-stats',
      'GET'
    );
    console.log("Pipeline stats API response:", response);
    return response;
  },
}; 