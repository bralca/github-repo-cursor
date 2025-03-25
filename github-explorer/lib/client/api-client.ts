/**
 * API Client for the GitHub Explorer Backend
 * 
 * This module exports a collection of API clients for interacting with
 * the backend server's REST API endpoints. Each client handles a specific
 * domain of functionality.
 */

import { fetchFromApi } from './api';
import { entitiesApi } from './entities-api';
import { pipelineApi } from './pipeline-api';
import { sitemapApi } from './sitemap-api';
import { rankingsApi } from './rankings-api';
import * as commitsApi from './commits-api';
import * as mergeRequestsApi from './merge-requests-api';
import * as repositoriesApi from './repositories-api';
import * as contributorsApi from './contributors-api';

// Export the core API function
export { fetchFromApi };

// Export all API clients
export const apiClient = {
  entities: entitiesApi,
  pipeline: pipelineApi,
  sitemap: sitemapApi,
  rankings: rankingsApi,
  commits: commitsApi,
  mergeRequests: mergeRequestsApi,
  repositories: repositoriesApi,
  contributors: contributorsApi
};

// Export individual API clients and their types
export * from './entities-api';
export * from './pipeline-api';
export * from './sitemap-api';
export * from './rankings-api';
export * from './commits-api';
export * from './merge-requests-api';
export * from './repositories-api';
export * from './contributors-api'; 