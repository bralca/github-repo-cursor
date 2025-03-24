# Backend/Frontend Separation Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for restructuring the GitHub Explorer application to properly separate frontend and backend concerns, specifically focusing on database access. The current architecture has the frontend directly accessing the SQLite database, which is problematic for production deployment on render.com.

## Current Architecture Issues

1. **Database Location**: SQLite database (`github_explorer.db`) is at the workspace root and accessible to both frontend and backend
2. **Direct Database Access**: Frontend code in `github-explorer/lib/database/` directly connects to SQLite
3. **Frontend API with Backend Logic**: `/app/api/sqlite/` endpoints contain database logic that should be in the backend
4. **Monolithic Development**: Current structure doesn't facilitate separate deployment of frontend and backend
5. **Production Incompatibility**: The architecture doesn't work well when deployed as separate services on render.com

## Target Architecture

1. **Backend-Owned Database**: Database will be owned and managed exclusively by the Node.js backend
2. **API-Based Communication**: Frontend will interact with the database only through REST API calls to the backend
3. **Clear Separation of Concerns**: Backend handles data persistence; frontend handles presentation
4. **Development/Production Consistency**: Same architecture works in both environments
5. **Clean Implementation**: No legacy code or compatibility layers

## Detailed Implementation Plan

### Phase 1: Backend API Development

#### Step 1: Establish Database Directory in Backend

1. Create backend database directory
   ```
   - Create folder: github-explorer/server/db/
   ```

2. Update database path utility
   ```
   - Edit file: github-explorer/server/src/utils/db-path.js
   - Modify getDbPath() to prioritize process.env.DB_PATH but fall back to the server/db path:
   
   export function getDbPath() {
     if (process.env.DB_PATH) {
       return process.env.DB_PATH;
     }
     
     // Fall back to the standard location within the server directory
     const path = require('path');
     return path.resolve(process.cwd(), 'server/db/github_explorer.db');
   }
   ```

   > **Important Note**: The existing `db-path.js` already has a getDbPath function that we should modify rather than replace completely.

#### Step 2: Create Backend API Controllers

1. Create API controller structure
   ```
   - Create folder: github-explorer/server/src/controllers/api/
   ```

2. Create controllers for each entity type
   ```
   - Create file: github-explorer/server/src/controllers/api/entity-counts.js
   - Create file: github-explorer/server/src/controllers/api/pipeline-status.js
   - Create file: github-explorer/server/src/controllers/api/pipeline-operations.js
   - Create file: github-explorer/server/src/controllers/api/pipeline-history.js
   - Create file: github-explorer/server/src/controllers/api/pipeline-schedules.js
   - Create file: github-explorer/server/src/controllers/api/pipeline-item-count.js
   - Create file: github-explorer/server/src/controllers/api/sitemap.js
   - Create file: github-explorer/server/src/controllers/api/contributor-rankings.js
   - Create file: github-explorer/server/src/controllers/api/bot-detection.js
   - Create file: github-explorer/server/src/controllers/api/repositories.js
   - Create file: github-explorer/server/src/controllers/api/contributors.js
   - Create file: github-explorer/server/src/controllers/api/merge-requests.js
   - Create file: github-explorer/server/src/controllers/api/commits.js
   ```

3. Implement the entity-counts controller
   ```
   - Edit file: github-explorer/server/src/controllers/api/entity-counts.js
   - Implement logic based on the query in github-explorer/app/api/sqlite/handlers/entity-counts.ts
   - Make sure to match the response format expected by frontend components
   
   // Example implementation:
   import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';
   
   export async function getEntityCounts(req, res) {
     let db = null;
     try {
       db = await openSQLiteConnection();
       
       // Execute the same queries that are in the frontend handler
       const repositories = await db.get('SELECT COUNT(*) as count FROM repositories');
       const contributors = await db.get('SELECT COUNT(*) as count FROM contributors');
       const mergeRequests = await db.get('SELECT COUNT(*) as count FROM merge_requests');
       const commits = await db.get('SELECT COUNT(*) as count FROM commits');
       
       return res.json({
         repositories: repositories.count,
         contributors: contributors.count,
         mergeRequests: mergeRequests.count,
         commits: commits.count
       });
     } catch (error) {
       console.error('Error getting entity counts:', error);
       return res.status(500).json({ error: error.message });
     } finally {
       if (db) {
         await closeSQLiteConnection(db);
       }
     }
   }
   ```

4. Implement the pipeline-status controller
   ```
   - Edit file: github-explorer/server/src/controllers/api/pipeline-status.js
   - Implement logic based on the query in github-explorer/app/api/sqlite/handlers/pipeline-status.ts
   - Match the response format expected by frontend components
   
   // Example implementation:
   import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';
   
   export async function getPipelineStatus(req, res) {
     const pipelineType = req.query.pipeline_type;
     
     if (!pipelineType) {
       return res.status(400).json({ error: 'Pipeline type is required' });
     }
     
     let db = null;
     try {
       db = await openSQLiteConnection();
       
       const result = await db.get(
         'SELECT pipeline_type, status, is_running as isRunning, last_run as lastRun, updated_at as updatedAt FROM pipeline_status WHERE pipeline_type = ?',
         [pipelineType]
       );
       
       if (!result) {
         return res.status(404).json({ error: 'Pipeline status not found' });
       }
       
       return res.json(result);
     } catch (error) {
       console.error(`Error getting pipeline status for ${pipelineType}:`, error);
       return res.status(500).json({ error: error.message });
     } finally {
       if (db) {
         await closeSQLiteConnection(db);
       }
     }
   }
   ```

5. Implement remaining controllers
   ```
   - Each controller should be implemented based on the corresponding frontend handler
   - Match the response format expected by frontend components
   - Use the backend's connection utilities (openSQLiteConnection/closeSQLiteConnection)
   ```

   > **Critical Consideration**: When examining the frontend handler code, focus on understanding the response format and query logic, not the HTTP handling which will be different in Express.

#### Step 3: Create Express Routes for Backend API

1. Create route files
   ```
   - Create file: github-explorer/server/src/routes/api-routes.js
   ```

2. Implement the routes
   ```
   - Edit file: github-explorer/server/src/routes/api-routes.js
   - Import the controller functions
   - Define routes with a RESTful structure
   
   // Example implementation:
   import express from 'express';
   import { getEntityCounts } from '../controllers/api/entity-counts.js';
   import { getPipelineStatus } from '../controllers/api/pipeline-status.js';
   import { handlePipelineOperations } from '../controllers/api/pipeline-operations.js';
   import { getRepositories, getRepositoryById } from '../controllers/api/repositories.js';
   import { getContributors, getContributorById } from '../controllers/api/contributors.js';
   // Import other controllers...
   
   const router = express.Router();
   
   // Entity counts
   router.get('/entity-counts', getEntityCounts);
   
   // Pipeline endpoints
   router.get('/pipeline-status', getPipelineStatus);
   router.get('/pipeline-history', getPipelineHistory);
   router.get('/pipeline-schedules', getPipelineSchedules);
   router.get('/pipeline-item-count', getPipelineItemCount);
   router.post('/pipeline-operations', handlePipelineOperations);
   router.post('/pipeline-history-clear', handlePipelineHistoryClear);
   
   // Repository endpoints
   router.get('/repositories', getRepositories);
   router.get('/repositories/:id', getRepositoryById);
   
   // Contributor endpoints
   router.get('/contributors', getContributors);
   router.get('/contributors/:id', getContributorById);
   
   // Merge request endpoints
   router.get('/merge-requests', getMergeRequests);
   router.get('/merge-requests/:id', getMergeRequestById);
   
   // Commit endpoints
   router.get('/commits', getCommits);
   router.get('/commits/:id', getCommitById);
   
   // Sitemap endpoints
   router.get('/sitemap-status', getSitemapStatus);
   router.post('/generate-sitemap', triggerSitemapGeneration);
   
   // Ranking endpoints
   router.post('/contributor-rankings', handleContributorRankings);
   router.post('/bot-detection', handleBotDetection);
   
   export default router;
   ```

3. Update the main server file
   ```
   - Edit file: github-explorer/server/src/index.js
   - Import and use the API routes
   - Add CORS configuration to allow frontend requests
   
   // Add to imports:
   import cors from 'cors';
   import apiRoutes from './routes/api-routes.js';
   
   // Add CORS middleware (before route definitions):
   app.use(cors({
     origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     allowedHeaders: ['Content-Type']
   }));
   
   // Add API routes (with the other route definitions):
   app.use('/api', apiRoutes);
   ```

   > **Important Note**: Make sure to install the cors package if not already present: `npm install cors --save`

### Phase 2: Frontend Adaptation

#### Step 1: Create New API Client for Backend Communication

1. Create API client directory and core file
   ```
   - Create folder: github-explorer/lib/api/
   - Create file: github-explorer/lib/api/client.ts
   
   // Example implementation:
   
   /**
    * Core API client for making requests to the backend
    */
   
   // Configuration object for the API client
   interface ApiClientConfig {
     baseUrl: string;
   }
   
   // Default configuration
   const defaultConfig: ApiClientConfig = {
     baseUrl: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api'
   };
   
   // Error class for API errors
   export class ApiError extends Error {
     status: number;
     
     constructor(message: string, status: number) {
       super(message);
       this.status = status;
       this.name = 'ApiError';
     }
   }
   
   // Core fetch function
   export async function apiFetch<T>(
     endpoint: string,
     options: RequestInit = {},
     config: Partial<ApiClientConfig> = {}
   ): Promise<T> {
     const { baseUrl } = { ...defaultConfig, ...config };
     
     const url = `${baseUrl}/${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;
     
     const response = await fetch(url, {
       headers: {
         'Content-Type': 'application/json',
         ...options.headers
       },
       ...options
     });
     
     if (!response.ok) {
       const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
       throw new ApiError(
         errorData.error || `API request failed with status ${response.status}`,
         response.status
       );
     }
     
     return await response.json();
   }
   ```

2. Create entity-specific API modules
   ```
   - Create file: github-explorer/lib/api/entities.ts
   - Create file: github-explorer/lib/api/repositories.ts
   - Create file: github-explorer/lib/api/contributors.ts
   - Create file: github-explorer/lib/api/merge-requests.ts
   - Create file: github-explorer/lib/api/commits.ts
   - Create file: github-explorer/lib/api/pipeline.ts
   ```

3. Implement entities API module
   ```
   - Edit file: github-explorer/lib/api/entities.ts
   
   import { apiFetch } from './client';
   
   export interface EntityCounts {
     repositories: number;
     contributors: number;
     mergeRequests: number;
     commits: number;
   }
   
   export const entitiesApi = {
     /**
      * Get counts of all entity types
      */
     async getCounts(): Promise<EntityCounts> {
       return await apiFetch<EntityCounts>('entity-counts');
     }
   };
   ```

4. Implement pipeline API module
   ```
   - Edit file: github-explorer/lib/api/pipeline.ts
   
   import { apiFetch } from './client';
   
   export interface PipelineStatus {
     pipelineType: string;
     status: string;
     isRunning: boolean;
     lastRun: string | null;
     updatedAt: string | null;
   }
   
   export interface PipelineOperationResult {
     success: boolean;
     message: string;
   }
   
   export interface PipelineItemCount {
     count: number;
   }
   
   export interface PipelineHistoryItem {
     id: string;
     pipelineType: string;
     status: string;
     startedAt: string;
     completedAt: string | null;
     itemsProcessed: number;
     errorMessage: string | null;
   }
   
   export interface PipelineSchedule {
     id: string;
     pipelineType: string;
     cronExpression: string;
     isActive: boolean;
     parameters: any;
     description: string;
     createdAt: string;
     updatedAt: string;
   }
   
   export const pipelineApi = {
     /**
      * Get status of a specific pipeline
      */
     async getStatus(pipelineType: string): Promise<PipelineStatus> {
       return await apiFetch<PipelineStatus>(`pipeline-status?pipeline_type=${pipelineType}`);
     },
     
     /**
      * Start or stop a pipeline
      */
     async performOperation(
       pipelineType: string, 
       operation: 'start' | 'stop'
     ): Promise<PipelineOperationResult> {
       return await apiFetch<PipelineOperationResult>('pipeline-operations', {
         method: 'POST',
         body: JSON.stringify({ pipelineType, operation })
       });
     },
     
     /**
      * Get pipeline history
      */
     async getHistory(pipelineType?: string): Promise<PipelineHistoryItem[]> {
       const endpoint = pipelineType ? 
         `pipeline-history?pipeline_type=${pipelineType}` : 
         'pipeline-history';
       
       return await apiFetch<PipelineHistoryItem[]>(endpoint);
     },
     
     /**
      * Clear pipeline history
      */
     async clearHistory(): Promise<PipelineOperationResult> {
       return await apiFetch<PipelineOperationResult>('pipeline-history-clear', {
         method: 'POST'
       });
     },
     
     /**
      * Get item count for a pipeline
      */
     async getItemCount(pipelineType: string): Promise<number> {
       const response = await apiFetch<PipelineItemCount>(
         `pipeline-item-count?pipeline_type=${pipelineType}`
       );
       return response.count;
     },
     
     /**
      * Get pipeline schedules
      */
     async getSchedules(): Promise<PipelineSchedule[]> {
       return await apiFetch<PipelineSchedule[]>('pipeline-schedules');
     }
   };
   ```

5. Implement repositories API module
   ```
   - Edit file: github-explorer/lib/api/repositories.ts
   - Mirror the response formats and method signatures from current code
   ```

6. Implement remaining API modules
   ```
   - Follow the same pattern for contributors, merge-requests, commits, etc.
   - Ensure the API methods match the response formats expected by components
   ```

7. Create index file to export all APIs
   ```
   - Edit file: github-explorer/lib/api/index.ts
   
   export * from './client';
   export { entitiesApi } from './entities';
   export { pipelineApi } from './pipeline';
   export { repositoriesApi } from './repositories';
   export { contributorsApi } from './contributors';
   export { mergeRequestsApi } from './merge-requests';
   export { commitsApi } from './commits';
   ```

#### Step 2: Update Frontend Components to Use New API Client

1. Remove database initialization from app layout
   ```
   - Edit file: github-explorer/app/layout.tsx
   - Remove the import line: import '@/lib/database/init-sqlite';
   ```

2. Update admin component imports
   ```
   - Edit file: github-explorer/components/admin/EntityStatsOverview.tsx
   - Replace:
     import { useSQLiteEntityCounts } from '@/hooks/admin/use-sqlite-entity-counts';
   - With:
     import { useEntityCounts } from '@/hooks/admin/use-entity-counts';
   ```

3. Update hooks to use the new API
   ```
   - Create file: github-explorer/hooks/admin/use-entity-counts.ts
   
   import { useState, useEffect } from 'react';
   import { entitiesApi } from '@/lib/api';
   
   export interface EntityCounts {
     repositories: number;
     contributors: number;
     mergeRequests: number;
     commits: number;
     isLoading: boolean;
     error: Error | null;
   }
   
   export function useEntityCounts(): EntityCounts {
     const [counts, setCounts] = useState({
       repositories: 0,
       contributors: 0,
       mergeRequests: 0,
       commits: 0,
     });
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState<Error | null>(null);
     
     useEffect(() => {
       async function fetchCounts() {
         try {
           setIsLoading(true);
           const data = await entitiesApi.getCounts();
           setCounts(data);
         } catch (err) {
           console.error('Error fetching entity counts:', err);
           setError(err instanceof Error ? err : new Error('Failed to fetch entity counts'));
         } finally {
           setIsLoading(false);
         }
       }
       
       fetchCounts();
     }, []);
     
     return {
       ...counts,
       isLoading,
       error,
     };
   }
   ```

4. Update pipeline-related hooks
   ```
   - Create file: github-explorer/hooks/admin/use-pipeline-status.ts
   
   import { useState, useEffect } from 'react';
   import { pipelineApi, PipelineStatus } from '@/lib/api';
   
   export interface UsePipelineStatusResult {
     status: PipelineStatus | null;
     isLoading: boolean;
     error: Error | null;
     refetch: () => Promise<void>;
   }
   
   export function usePipelineStatus(pipelineType: string): UsePipelineStatusResult {
     const [status, setStatus] = useState<PipelineStatus | null>(null);
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState<Error | null>(null);
     
     async function fetchStatus() {
       try {
         setIsLoading(true);
         const data = await pipelineApi.getStatus(pipelineType);
         setStatus(data);
         setError(null);
       } catch (err) {
         console.error(`Error fetching pipeline status for ${pipelineType}:`, err);
         setError(err instanceof Error ? err : new Error('Failed to fetch pipeline status'));
       } finally {
         setIsLoading(false);
       }
     }
     
     useEffect(() => {
       fetchStatus();
       
       // Poll for updates every 5 seconds
       const interval = setInterval(fetchStatus, 5000);
       return () => clearInterval(interval);
     }, [pipelineType]);
     
     return {
       status,
       isLoading,
       error,
       refetch: fetchStatus
     };
   }
   ```

5. Update PipelineControlCard component
   ```
   - Edit file: github-explorer/components/admin/PipelineControlCard.tsx
   - Replace:
     import { useSQLitePipelineStatus } from '@/hooks/admin/use-sqlite-pipeline-status';
     import { useSQLitePipelineOperations } from '@/hooks/admin/use-sqlite-pipeline-operations';
     import { useSQLiteEntityCounts } from '@/hooks/admin/use-sqlite-entity-counts';
   - With:
     import { usePipelineStatus } from '@/hooks/admin/use-pipeline-status';
     import { usePipelineOperations } from '@/hooks/admin/use-pipeline-operations';
     import { useEntityCounts } from '@/hooks/admin/use-entity-counts';
   
   - Update function calls throughout the component to use the new hooks
   ```

6. Create operations hook
   ```
   - Create file: github-explorer/hooks/admin/use-pipeline-operations.ts
   
   import { useState } from 'react';
   import { pipelineApi } from '@/lib/api';
   
   interface UsePipelineOperationsResult {
     startPipeline: () => Promise<void>;
     stopPipeline: () => Promise<void>;
     isLoading: boolean;
     error: Error | null;
   }
   
   export function usePipelineOperations(
     pipelineType: string,
     onSuccess?: () => void
   ): UsePipelineOperationsResult {
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<Error | null>(null);
     
     async function startPipeline() {
       try {
         setIsLoading(true);
         setError(null);
         await pipelineApi.performOperation(pipelineType, 'start');
         if (onSuccess) onSuccess();
       } catch (err) {
         console.error(`Error starting pipeline ${pipelineType}:`, err);
         setError(err instanceof Error ? err : new Error('Failed to start pipeline'));
       } finally {
         setIsLoading(false);
       }
     }
     
     async function stopPipeline() {
       try {
         setIsLoading(true);
         setError(null);
         await pipelineApi.performOperation(pipelineType, 'stop');
         if (onSuccess) onSuccess();
       } catch (err) {
         console.error(`Error stopping pipeline ${pipelineType}:`, err);
         setError(err instanceof Error ? err : new Error('Failed to stop pipeline'));
       } finally {
         setIsLoading(false);
       }
     }
     
     return {
       startPipeline,
       stopPipeline,
       isLoading,
       error
     };
   }
   ```

7. Update remaining hooks and components
   ```
   - Create replacement hooks for all use-sqlite-* hooks
   - Update all components that import from these hooks
   ```

8. Delete the old SQLite-related files
   ```
   - Delete directory: github-explorer/app/api/sqlite/
   - Delete directory: github-explorer/lib/database/
   ```

   > **Note**: It's best to do this after all components have been updated and tested with the new API client.

#### Step 3: Update Environment Configuration

1. Update frontend environment file
   ```
   - Edit file: github-explorer/.env.local
   - Add: NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001/api
   - Remove: DB_PATH (if present)
   ```

2. Update backend environment file
   ```
   - Create file: github-explorer/server/.env
   - Add: DB_PATH=./db/github_explorer.db
   - Add: PORT=3001
   - Add: CORS_ORIGIN=http://localhost:3000
   ```

3. Create production environment templates
   ```
   - Create file: github-explorer/.env.production
   - Add: NEXT_PUBLIC_BACKEND_API_URL=https://your-backend-service.render.com/api
   
   - Create file: github-explorer/server/.env.production
   - Add: PORT=10000 (or whatever port Render.com assigns)
   - Add: CORS_ORIGIN=https://your-frontend-service.render.com
   ```

### Phase 3: Database Migration and Infrastructure

#### Step 1: Create Database Migration Script

1. Create migration script
   ```
   - Create file: github-explorer/server/scripts/migrate-db.js
   - Implement a script to copy the database from workspace root to server/db/
   
   import fs from 'fs';
   import path from 'path';
   
   const sourceDbPath = path.resolve(process.cwd(), '../github_explorer.db');
   const targetDbDir = path.resolve(process.cwd(), 'db');
   const targetDbPath = path.resolve(targetDbDir, 'github_explorer.db');
   
   // Create the db directory if it doesn't exist
   if (!fs.existsSync(targetDbDir)) {
     console.log(`Creating directory: ${targetDbDir}`);
     fs.mkdirSync(targetDbDir, { recursive: true });
   }
   
   // Check if source database exists
   if (!fs.existsSync(sourceDbPath)) {
     console.error(`Source database not found at: ${sourceDbPath}`);
     process.exit(1);
   }
   
   // Copy the database file
   console.log(`Copying database from ${sourceDbPath} to ${targetDbPath}`);
   fs.copyFileSync(sourceDbPath, targetDbPath);
   
   console.log('Database migration completed successfully');
   ```

2. Add script to package.json
   ```
   - Edit file: github-explorer/server/package.json
   - Add script: "migrate-db": "node scripts/migrate-db.js"
   ```

#### Step 2: Update Deployment Configuration

1. Create backend Render.com configuration
   ```
   - Create file: github-explorer/server/render.yaml
   
   services:
     - type: web
       name: github-explorer-backend
       env: node
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: PORT
           value: 10000
         - key: DB_PATH
           value: ./db/github_explorer.db
         - key: CORS_ORIGIN
           value: https://your-frontend-service.render.com
       disk:
         name: database
         mountPath: /opt/render/project/src/db
         sizeGB: 1
   ```

2. Create frontend Render.com configuration
   ```
   - Create file: github-explorer/render.yaml
   
   services:
     - type: web
       name: github-explorer-frontend
       env: node
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: NEXT_PUBLIC_BACKEND_API_URL
           value: https://your-backend-service.render.com/api
         - key: NODE_ENV
           value: production
   ```

   > **Important Note**: Replace `your-frontend-service.render.com` and `your-backend-service.render.com` with your actual Render.com service URLs.

3. Update documentation
   ```
   - Edit file: DOCS/PROJECT_STRUCTURE.md
   - Update to reflect the new architecture and database location
   
   - Edit file: DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md
   - Update database access patterns section to reflect API-based access
   ```

## Implementation Sequence and Testing Strategy

### Implementation Sequence

1. **Develop Backend API First**
   - Set up the database directory structure
   - Implement backend API endpoints
   - Test each endpoint directly before proceeding

2. **Create Frontend API Client**
   - Implement the API client to communicate with the backend
   - Create entity-specific API modules

3. **Update Frontend Components**
   - Create new hooks that use the API client
   - Update components to use the new hooks
   - Test each updated component

4. **Remove Legacy Code**
   - Delete frontend SQLite API endpoints
   - Delete direct database access code
   - Run final tests to ensure everything works

5. **Implement Infrastructure Changes**
   - Set up the database migration script
   - Create deployment configurations
   - Update documentation

### Testing Strategy

#### Local Development Testing

1. **Backend API Testing**
   - Test each endpoint using tools like Postman or curl
   - Verify response formats match what the frontend expects
   - Test error handling and edge cases

2. **Frontend Component Testing**
   - Test each updated component in isolation
   - Verify data is displayed correctly
   - Test loading states and error handling

3. **End-to-End Testing**
   - Run both services together
   - Test the complete user flow
   - Verify all features work as expected

#### Production-Like Testing

1. **Test with Production Environment Variables**
   - Use .env.production files
   - Verify the application works with production settings

2. **Database Migration Testing**
   - Test the migration script
   - Verify the application works with the migrated database

## Common Pitfalls and Considerations

### API Response Formats

It's critical that backend API endpoints return exactly the same data structure that frontend components expect. Key considerations:

1. **Field Names**: Match the camelCase or snake_case conventions used in the existing code
2. **Data Types**: Ensure numbers, strings, booleans, and dates are returned in the expected format
3. **Nested Objects**: Preserve the structure of nested objects and arrays

### Environment Variables

- **Frontend Environment Variables** must be prefixed with `NEXT_PUBLIC_` to be accessible from the browser
- **Backend Environment Variables** should be accessible server-side only
- **Database Path** should be configurable but have a sensible default

### Error Handling

Implement consistent error handling across the stack:

1. **Backend API**: Return standardized error responses with appropriate HTTP status codes
2. **Frontend Client**: Handle and parse error responses consistently
3. **Frontend Components**: Display appropriate error messages to users

### Performance Considerations

1. **Connection Pooling**: Use connection pooling on the backend to avoid creating new connections for each request
2. **Request Batching**: Consider implementing request batching for frequently accessed data
3. **Caching**: Implement appropriate caching strategies both on the client and server

## Conclusions

This separation of frontend and backend concerns addresses the core architectural issue while creating a clean, modern solution without legacy code or compatibility layers. The implementation plan is designed to be incremental, allowing for testing and validation at each step.

The resulting architecture will be more maintainable, more secure, and better suited for production deployment on platforms like render.com where services are deployed separately. 