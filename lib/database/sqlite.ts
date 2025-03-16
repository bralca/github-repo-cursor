/**
 * SQLite client for frontend components
 * This module provides a client-side interface to the SQLite API endpoints
 */

interface PipelineStatus {
  itemCount: number;
  lastRun: string | null;
  isActive: boolean;
  isRunning: boolean;
  errorMessage?: string;
}

interface PipelineHistoryItem {
  id: string;
  pipeline_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  items_processed: number;
  error_message: string | null;
  created_at: string;
}

interface PipelineSchedule {
  id: string;
  pipeline_type: string;
  cron_expression: string;
  is_active: boolean;
  parameters: any;
  created_at: string;
  updated_at: string;
}

interface EntityCounts {
  repositories: number;
  contributors: number;
  merge_requests: number;
  commits: number;
}

interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pipeline API client methods
 */
const pipelineClient = {
  /**
   * Get pipeline status for a specific pipeline type
   * @param pipelineType The type of pipeline
   * @returns Promise with pipeline status
   */
  getStatus: async (pipelineType: string): Promise<PipelineStatus> => {
    const response = await fetch(`/api/sqlite/pipeline-status?pipeline_type=${pipelineType}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch pipeline status');
    }
    
    return await response.json();
  },
  
  /**
   * Get pipeline history
   * @param pipelineType Optional pipeline type to filter by
   * @param limit Maximum number of history items to return
   * @returns Promise with pipeline history items
   */
  getHistory: async (pipelineType?: string, limit: number = 10): Promise<PipelineHistoryItem[]> => {
    let url = `/api/sqlite/pipeline-history?limit=${limit}`;
    if (pipelineType) {
      url += `&pipeline_type=${pipelineType}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch pipeline history');
    }
    
    const data = await response.json();
    return data.history || [];
  },
  
  /**
   * Get pipeline schedules
   * @param pipelineType Optional pipeline type to filter by
   * @returns Promise with pipeline schedules
   */
  getSchedules: async (pipelineType?: string): Promise<PipelineSchedule[]> => {
    let url = '/api/sqlite/pipeline-schedules';
    if (pipelineType) {
      url += `?pipeline_type=${pipelineType}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch pipeline schedules');
    }
    
    const data = await response.json();
    return data.schedules || [];
  },
  
  /**
   * Start a pipeline
   * @param pipelineType The type of pipeline to start
   * @param parameters Optional parameters for the pipeline
   * @returns Promise with operation result
   */
  start: async (pipelineType: string, parameters?: any): Promise<{ success: boolean; message?: string; }> => {
    const response = await fetch('/api/sqlite/pipeline-operations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'start',
        pipeline_type: pipelineType,
        parameters,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start pipeline');
    }
    
    const data = await response.json();
    return {
      success: true,
      message: data.message || `${pipelineType} pipeline started successfully`,
    };
  },
  
  /**
   * Stop a pipeline
   * @param pipelineType The type of pipeline to stop
   * @returns Promise with operation result
   */
  stop: async (pipelineType: string): Promise<{ success: boolean; message?: string; }> => {
    const response = await fetch('/api/sqlite/pipeline-operations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'stop',
        pipeline_type: pipelineType,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to stop pipeline');
    }
    
    const data = await response.json();
    return {
      success: true,
      message: data.message || `${pipelineType} pipeline stopped successfully`,
    };
  },
  
  /**
   * Get the count of items for a specific pipeline type
   * @param pipelineType The type of pipeline
   * @returns Promise with item count
   */
  getItemCount: async (pipelineType: string): Promise<number> => {
    const response = await fetch(`/api/sqlite/pipeline-item-count?pipeline_type=${pipelineType}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch pipeline item count');
    }
    
    const data = await response.json();
    return data.count || 0;
  },
};

/**
 * Entities API client methods
 */
const entitiesClient = {
  /**
   * Get counts of all entity types
   * @returns Promise with entity counts
   */
  getCounts: async (): Promise<EntityCounts> => {
    const response = await fetch('/api/sqlite/entity-counts');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch entity counts');
    }
    
    return await response.json();
  },
};

/**
 * SQLite client for the frontend
 * Provides methods to interact with the SQLite API endpoints
 */
export const sqliteClient = {
  pipeline: pipelineClient,
  entities: entitiesClient,
}; 