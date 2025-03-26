/**
 * API Client for the GitHub Explorer Backend
 * 
 * This module exports a collection of API clients for interacting with
 * the backend server's REST API endpoints. Each client handles a specific
 * domain of functionality.
 */

import { fetchFromApi } from './api';
import { entitiesApi } from './entities-api';
import { pipelineApi, PipelineStatusResponse, PipelineStatsResponse } from './pipeline-api';
import { sitemapApi } from './sitemap-api';
import { rankingsApi } from './rankings-api';
import * as commitsApi from './commits-api';
import * as mergeRequestsApi from './merge-requests-api';
import * as repositoriesApi from './repositories-api';
import * as contributorsApi from './contributors-api';

// Export the core API function
export { fetchFromApi };

// Export the API client
export const apiClient = {
  entities: entitiesApi,
  pipeline: pipelineApi,
  repositories: repositoriesApi,
  contributors: contributorsApi,
  mergeRequests: mergeRequestsApi,
  commits: commitsApi,
  sitemap: sitemapApi,
  rankings: rankingsApi,
};

// Re-export the types we need
export type { PipelineStatusResponse, PipelineStatsResponse };

// Export individual API clients and their types
export * from './entities-api';
export * from './pipeline-api';
export * from './sitemap-api';
export * from './rankings-api';
export * from './commits-api';
export * from './merge-requests-api';
export * from './repositories-api';
export * from './contributors-api'; 