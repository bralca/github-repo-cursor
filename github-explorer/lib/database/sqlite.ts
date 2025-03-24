// SQLite database adapter for frontend operations
// This file provides a client for interacting with the SQLite database

import { Database } from '@/types/database';

/**
 * Function to make a request to the SQLite API endpoint
 * @param endpoint The API endpoint to call
 * @param method The HTTP method to use
 * @param params Optional query parameters
 * @param body Optional request body
 * @returns The response from the API
 */
export async function fetchFromSQLiteApi<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  params?: Record<string, string>,
  body?: any
): Promise<T> {
  // Build URL with query parameters
  let url = `/api/sqlite/${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  // Configure request options
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  // Add body if provided
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  // Make the request
  const response = await fetch(url, options);
  
  // Handle errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }
  
  // Parse and return the response
  return await response.json();
}

/**
 * SQLite client for interacting with the SQLite API endpoints from the frontend
 */

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

// Types for entity counts
export interface EntityCountsResponse {
  repositories: number;
  contributors: number;
  mergeRequests: number;
  commits: number;
  files?: number;
  comments?: number;
  
  // Enriched counts
  enrichedRepositories?: number;
  enrichedContributors?: number;
  enrichedMergeRequests?: number;
  
  // Unenriched counts
  unenrichedRepositories?: number;
  unenrichedContributors?: number;
  unenrichedMergeRequests?: number;
  
  // Pipeline-specific counts
  closedMergeRequestsRaw?: number;
  unprocessedMergeRequests?: number;
  totalUnenriched?: number;
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

// SQLite client implementation
export const sqliteClient = {
  /**
   * Pipeline-related operations
   */
  pipeline: {
    /**
     * Get the status of a specific pipeline
     */
    async getStatus(pipelineType: string): Promise<PipelineStatusResponse> {
      console.log(`Fetching status for pipeline type: ${pipelineType}`);
      const response = await fetch(`/api/sqlite/pipeline-status?pipeline_type=${pipelineType}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch pipeline status');
      }
      
      const data = await response.json();
      return {
        pipelineType: data.pipelineType,
        status: data.status,
        isRunning: data.isRunning,
        updatedAt: data.updatedAt
      };
    },
    
    /**
     * Start a pipeline
     */
    async start(pipelineType: string): Promise<PipelineOperationResponse> {
      console.log(`Starting pipeline: ${pipelineType}`);
      const response = await fetch('/api/sqlite/pipeline-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'start',
          pipelineType,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to start ${pipelineType} pipeline`);
      }
      
      return await response.json();
    },
    
    /**
     * Stop a pipeline
     */
    async stop(pipelineType: string): Promise<PipelineOperationResponse> {
      console.log(`Stopping pipeline: ${pipelineType}`);
      const response = await fetch('/api/sqlite/pipeline-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'stop',
          pipelineType,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to stop ${pipelineType} pipeline`);
      }
      
      return await response.json();
    },
    
    /**
     * Get the item count for a pipeline
     */
    async getItemCount(pipelineType: string): Promise<PipelineItemCountResponse> {
      console.log(`Fetching item count for pipeline type: ${pipelineType}`);
      const response = await fetch(`/api/sqlite/pipeline-item-count?pipeline_type=${pipelineType}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch pipeline item count');
      }
      
      return await response.json();
    },
    
    /**
     * Get pipeline execution history
     */
    async getHistory(pipelineType?: string, limit: number = 10): Promise<PipelineHistoryEntry[]> {
      console.log(`Fetching pipeline history${pipelineType ? ` for type: ${pipelineType}` : ''}`);
      
      let url = '/api/sqlite/pipeline-history';
      const params = new URLSearchParams();
      
      if (pipelineType) {
        params.append('pipeline_type', pipelineType);
      }
      
      params.append('limit', limit.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch pipeline history');
      }
      
      return await response.json();
    },
  },
  
  /**
   * Entity-related operations
   */
  entities: {
    /**
     * Get counts of all entities
     */
    async getCounts(): Promise<EntityCountsResponse> {
      console.log('Fetching entity counts');
      const response = await fetch('/api/sqlite/entity-counts');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch entity counts');
      }
      
      return await response.json();
    },
  },
}; 