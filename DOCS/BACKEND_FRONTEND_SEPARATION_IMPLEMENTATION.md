# Backend/Frontend Separation Implementation Plan

## Overview

This document provides a comprehensive, task-based implementation plan for restructuring the GitHub Explorer application to properly separate frontend and backend concerns. The existing architecture has the frontend directly accessing the SQLite database, which is problematic for production deployment on render.com.

The implementation plan is organized into epics, stories, and tasks following our established AI collaboration workflow. Each task includes specific files to modify, code samples, and testing steps to ensure incremental progress and validation.

## Current Architecture Issues

1. **Database Location**: SQLite database (`github_explorer.db`) is at the workspace root and directly accessed by both frontend and backend
2. **Direct Database Access**: Frontend code in `github-explorer/lib/database/` directly connects to SQLite
3. **Frontend API with Backend Logic**: `/app/api/sqlite/` endpoints contain database logic that should be in the backend
4. **Monolithic Development**: Current structure doesn't facilitate separate deployment of frontend and backend

## Target Architecture

1. **Backend-Owned Database**: Database will be owned and managed exclusively by the Node.js backend
2. **API-Based Communication**: Frontend will interact with the database only through REST API calls to the backend
3. **Clear Separation of Concerns**: Backend handles data persistence; frontend handles presentation
4. **Clean Implementation**: No legacy code or compatibility layers

## Implementation Plan

### Epic 1: Backend API Development

#### Story 1: Database Location & Configuration

**Objective**: Establish a dedicated location for the database in the backend and update database path resolution.

##### Task 1.1: Create Database Directory

**Description**: Create a directory in the backend server for housing the SQLite database.

**Steps**:
1. Create the `db` directory in the backend server
```
mkdir -p github-explorer/server/db
```

**Testing**:
- Verify the directory exists: `ls -la github-explorer/server/db`

##### Task 1.2: Update Database Path Resolution

**Description**: Modify the database path utility to prioritize environment variables but fall back to the server/db location.

**Files to Modify**:
- `github-explorer/server/src/utils/db-path.js`

**Implementation**:
```javascript
/**
 * Database Path Resolver
 * 
 * Standardizes database path resolution to ensure all components
 * use the same database file.
 */

/**
 * Get the absolute path to the main database file
 * Uses environment variable if set or falls back to standard location
 * @returns {string} Absolute path to database file
 */
export function getDbPath() {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  
  // Fall back to the standard location within the server directory
  const path = require('path');
  return path.resolve(process.cwd(), 'server/db/github_explorer.db');
}

/**
 * Get the directory containing the database
 * @returns {string} Directory containing the database
 */
export function getDbDir() {
  // Simply get the directory from the DB_PATH without creating anything
  const path = require('path');
  return path.dirname(getDbPath());
}

export default getDbPath;
```

**Testing**:
1. Create a test script to verify path resolution:
```javascript
// test-db-path.js
import { getDbPath } from './utils/db-path.js';
console.log('Database path:', getDbPath());
```
2. Run with and without DB_PATH environment variable:
```
node test-db-path.js
DB_PATH=/custom/path node test-db-path.js
```

#### Story 2: Backend API Controller Implementation

**Objective**: Create backend API controllers for all database operations currently performed by the frontend.

##### Task 2.1: Set Up API Controller Structure

**Description**: Create the directory structure for API controllers.

**Steps**:
1. Create the API controllers directory structure
```
mkdir -p github-explorer/server/src/controllers/api
```

**Testing**:
- Verify the directory exists: `ls -la github-explorer/server/src/controllers/api`

##### Task 2.2: Implement Entity Counts Controller

**Description**: Create a controller to handle entity count requests.

**Files to Create**:
- `github-explorer/server/src/controllers/api/entity-counts.js`

**Implementation**:
```javascript
import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';

/**
 * Get counts of all entity types
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
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

**Testing**:
1. Create a test endpoint in the server
2. Make a request to the endpoint using curl or Postman
3. Verify the response includes repository, contributor, merge request, and commit counts

##### Task 2.3: Implement Pipeline Status Controller

**Description**: Create a controller to handle pipeline status requests.

**Files to Create**:
- `github-explorer/server/src/controllers/api/pipeline-status.js`

**Implementation**:
```javascript
import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';

/**
 * Get the status of a pipeline by type
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
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

**Testing**:
1. Create a test endpoint in the server
2. Make a request to the endpoint with a valid pipeline type parameter
3. Verify the response includes pipeline status information
4. Test error handling by making a request without a pipeline type

##### Task 2.4: Implement Pipeline Operations Controller

**Description**: Create a controller to handle pipeline start/stop operations.

**Files to Create**:
- `github-explorer/server/src/controllers/api/pipeline-operations.js`

**Implementation**:
```javascript
import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';

/**
 * Handle pipeline operations (start/stop)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function handlePipelineOperations(req, res) {
  const { pipelineType, operation } = req.body;
  
  if (!pipelineType) {
    return res.status(400).json({ error: 'Pipeline type is required' });
  }
  
  if (!operation || !['start', 'stop'].includes(operation)) {
    return res.status(400).json({ error: 'Valid operation (start or stop) is required' });
  }
  
  let db = null;
  try {
    db = await openSQLiteConnection();
    
    // Check if pipeline exists
    const exists = await db.get(
      'SELECT 1 FROM pipeline_status WHERE pipeline_type = ?',
      [pipelineType]
    );
    
    if (!exists) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    // Update pipeline status based on operation
    if (operation === 'start') {
      await db.run(
        'UPDATE pipeline_status SET status = ?, is_running = 1, updated_at = CURRENT_TIMESTAMP WHERE pipeline_type = ?',
        ['running', pipelineType]
      );
      
      return res.json({
        success: true,
        message: `${pipelineType} pipeline started successfully`
      });
    } else {
      await db.run(
        'UPDATE pipeline_status SET status = ?, is_running = 0, updated_at = CURRENT_TIMESTAMP WHERE pipeline_type = ?',
        ['stopped', pipelineType]
      );
      
      return res.json({
        success: true,
        message: `${pipelineType} pipeline stopped successfully`
      });
    }
  } catch (error) {
    console.error(`Error performing ${operation} operation on ${pipelineType} pipeline:`, error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}
```

**Testing**:
1. Create a test endpoint in the server
2. Make POST requests to start and stop a pipeline
3. Verify the database is updated correctly
4. Verify the response indicates success
5. Test error handling with invalid requests

##### Task 2.5: Implement Remaining Backend Controllers

**Description**: Create controllers for the remaining API endpoints.

**Files to Create**:
- `github-explorer/server/src/controllers/api/pipeline-history.js`
- `github-explorer/server/src/controllers/api/pipeline-schedules.js`
- `github-explorer/server/src/controllers/api/pipeline-item-count.js`
- `github-explorer/server/src/controllers/api/sitemap.js`
- `github-explorer/server/src/controllers/api/contributor-rankings.js` 
- `github-explorer/server/src/controllers/api/bot-detection.js`
- `github-explorer/server/src/controllers/api/repositories.js`
- `github-explorer/server/src/controllers/api/contributors.js`
- `github-explorer/server/src/controllers/api/merge-requests.js`
- `github-explorer/server/src/controllers/api/commits.js`

**Implementation**:
For each controller, examine the corresponding frontend handler in `github-explorer/app/api/sqlite/handlers/` to understand the query logic and response format. Implement the backend controller to match the same functionality.

**Testing**:
1. For each controller, create a test endpoint in the server
2. Make appropriate requests to each endpoint
3. Verify the responses match the expected format and data
4. Test error handling scenarios

#### Story 3: Backend API Routes Implementation

**Objective**: Create Express routes for all API endpoints.

##### Task 3.1: Create API Routes File

**Description**: Create a routes file to define all API endpoints.

**Files to Create**:
- `github-explorer/server/src/routes/api-routes.js`

**Implementation**:
```javascript
import express from 'express';
import { getEntityCounts } from '../controllers/api/entity-counts.js';
import { getPipelineStatus } from '../controllers/api/pipeline-status.js';
import { handlePipelineOperations } from '../controllers/api/pipeline-operations.js';
import { getPipelineHistory } from '../controllers/api/pipeline-history.js';
import { getPipelineSchedules } from '../controllers/api/pipeline-schedules.js';
import { getPipelineItemCount } from '../controllers/api/pipeline-item-count.js';
import { getSitemapStatus, triggerSitemapGeneration } from '../controllers/api/sitemap.js';
import { handleContributorRankings } from '../controllers/api/contributor-rankings.js';
import { handleBotDetection } from '../controllers/api/bot-detection.js';
import { getRepositories, getRepositoryById } from '../controllers/api/repositories.js';
import { getContributors, getContributorById } from '../controllers/api/contributors.js';
import { getMergeRequests, getMergeRequestById } from '../controllers/api/merge-requests.js';
import { getCommits, getCommitById } from '../controllers/api/commits.js';

const router = express.Router();

// Entity counts
router.get('/entity-counts', getEntityCounts);

// Pipeline endpoints
router.get('/pipeline-status', getPipelineStatus);
router.get('/pipeline-history', getPipelineHistory);
router.get('/pipeline-schedules', getPipelineSchedules);
router.get('/pipeline-item-count', getPipelineItemCount);
router.post('/pipeline-operations', handlePipelineOperations);
router.post('/pipeline-history-clear', clearPipelineHistory);

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

**Testing**:
1. Ensure all controller functions are properly imported
2. Check that all routes are correctly defined
3. Verify that HTTP methods match the expected operations (GET for retrieving data, POST for operations)

##### Task 3.2: Update Server Main File

**Description**: Update the main server file to use the API routes and add CORS support.

**Files to Modify**:
- `github-explorer/server/src/index.js`

**Implementation**:
```javascript
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

**Testing**:
1. Start the server
2. Make a test request to an API endpoint from a different origin
3. Verify CORS headers are present in the response
4. Verify the API endpoint is accessible

##### Task 3.3: Install Dependencies

**Description**: Install the required dependencies for CORS support.

**Steps**:
1. Install the CORS package
```
cd github-explorer/server
npm install cors --save
```

**Testing**:
1. Check the package.json file to ensure the dependency was added
2. Start the server to verify there are no errors loading the module

### Epic 2: Frontend API Client Development

#### Story 1: Core API Client Implementation

**Objective**: Develop a core API client to handle communication with the backend.

##### Task 1.1: Create API Client Directory and Core File

**Description**: Create the directory structure for the API client and implement the core client functionality.

**Steps**:
1. Create the API client directory
```
mkdir -p github-explorer/lib/api
```

**Files to Create**:
- `github-explorer/lib/api/client.ts`

**Implementation**:
```typescript
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

**Testing**:
1. Create a simple test file to verify apiFetch works:
```typescript
// test-api-client.ts
import { apiFetch } from './client';

async function testApiClient() {
  try {
    const data = await apiFetch('test-endpoint');
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testApiClient();
```
2. Mock a response for testing or test against a running backend

#### Story 2: Entity-Specific API Modules

**Objective**: Create API modules for each entity type.

##### Task 2.1: Create Entities API Module

**Description**: Implement the API module for entity counts.

**Files to Create**:
- `github-explorer/lib/api/entities.ts`

**Implementation**:
```typescript
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

**Testing**:
1. Create a test that calls the getCounts method
2. Verify it makes the correct request to the backend
3. Test error handling

##### Task 2.2: Create Pipeline API Module

**Description**: Implement the API module for pipeline operations.

**Files to Create**:
- `github-explorer/lib/api/pipeline.ts`

**Implementation**:
```typescript
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

**Testing**:
1. Create tests for each API method
2. Verify they make the correct requests to the backend
3. Test both success and error scenarios

##### Task 2.3: Create Repositories API Module

**Description**: Implement the API module for repositories.

**Files to Create**:
- `github-explorer/lib/api/repositories.ts`

**Implementation**:
Examine the frontend's use of repositories data to implement the appropriate methods with matching parameters and return types.

**Testing**:
1. Create tests for each API method
2. Verify they make the correct requests to the backend
3. Test with real repository data

##### Task 2.4: Create Additional API Modules

**Description**: Implement the remaining API modules.

**Files to Create**:
- `github-explorer/lib/api/contributors.ts`
- `github-explorer/lib/api/merge-requests.ts`
- `github-explorer/lib/api/commits.ts`

**Implementation**:
For each module, examine the frontend's use of data to implement the appropriate methods with matching parameters and return types.

**Testing**:
1. Create tests for each API module
2. Verify they make the correct requests to the backend
3. Test with real data

##### Task 2.5: Create API Index File

**Description**: Create an index file to export all API modules.

**Files to Create**:
- `github-explorer/lib/api/index.ts`

**Implementation**:
```typescript
export * from './client';
export { entitiesApi } from './entities';
export { pipelineApi } from './pipeline';
export { repositoriesApi } from './repositories';
export { contributorsApi } from './contributors';
export { mergeRequestsApi } from './merge-requests';
export { commitsApi } from './commits';
```

**Testing**:
1. Create a test file that imports from the index
2. Verify all exports are available

### Epic 3: Frontend Component Updates

#### Story 1: Update Frontend Hooks

**Objective**: Create new React hooks that use the API client instead of direct database access.

##### Task 1.1: Create Entity Counts Hook

**Description**: Create a hook for fetching entity counts from the backend API.

**Files to Create**:
- `github-explorer/hooks/admin/use-entity-counts.ts`

**Implementation**:
```typescript
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

**Testing**:
1. Create a simple test component that uses the hook
2. Verify it loads and displays data correctly
3. Test error handling and loading states

##### Task 1.2: Create Pipeline Status Hook

**Description**: Create a hook for fetching pipeline status from the backend API.

**Files to Create**:
- `github-explorer/hooks/admin/use-pipeline-status.ts`

**Implementation**:
```typescript
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

**Testing**:
1. Create a test component that uses the hook
2. Verify it polls for updates
3. Verify the refetch function works
4. Test error handling

##### Task 1.3: Create Pipeline Operations Hook

**Description**: Create a hook for performing pipeline operations.

**Files to Create**:
- `github-explorer/hooks/admin/use-pipeline-operations.ts`

**Implementation**:
```typescript
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

**Testing**:
1. Create a test component with buttons to start and stop a pipeline
2. Verify the operations work correctly
3. Verify loading state and error handling

##### Task 1.4: Create Additional Hooks

**Description**: Create the remaining hooks to replace SQLite-specific hooks.

**Files to Create**:
- `github-explorer/hooks/admin/use-pipeline-history.ts`
- `github-explorer/hooks/admin/use-pipeline-schedules.ts`
- Additional hooks as needed

**Implementation**:
For each hook, examine the current SQLite hook and implement a replacement that uses the new API client.

**Testing**:
1. Create test components for each hook
2. Verify functionality matches the original hooks
3. Test error handling and loading states

#### Story 2: Update Frontend Components

**Objective**: Update frontend components to use the new hooks instead of SQLite-specific ones.

##### Task 2.1: Update App Layout

**Description**: Remove SQLite initialization from the app layout.

**Files to Modify**:
- `github-explorer/app/layout.tsx`

**Implementation**:
```typescript
// Remove this import
// import '@/lib/database/init-sqlite';
```

**Testing**:
1. Verify the application still loads without the SQLite initialization
2. Check for any console errors

##### Task 2.2: Update Entity Stats Overview Component

**Description**: Update the EntityStatsOverview component to use the new hook.

**Files to Modify**:
- `github-explorer/components/admin/EntityStatsOverview.tsx`

**Implementation**:
```typescript
// Replace:
// import { useSQLiteEntityCounts } from '@/hooks/admin/use-sqlite-entity-counts';
// With:
import { useEntityCounts } from '@/hooks/admin/use-entity-counts';

// Then update the component to use the new hook
```

**Testing**:
1. Load the component and verify it displays data correctly
2. Check that loading and error states work

##### Task 2.3: Update Pipeline Control Card Component

**Description**: Update the PipelineControlCard component to use the new hooks.

**Files to Modify**:
- `github-explorer/components/admin/PipelineControlCard.tsx`

**Implementation**:
```typescript
// Replace:
// import { useSQLitePipelineStatus } from '@/hooks/admin/use-sqlite-pipeline-status';
// import { useSQLitePipelineOperations } from '@/hooks/admin/use-sqlite-pipeline-operations';
// import { useSQLiteEntityCounts } from '@/hooks/admin/use-sqlite-entity-counts';
// With:
import { usePipelineStatus } from '@/hooks/admin/use-pipeline-status';
import { usePipelineOperations } from '@/hooks/admin/use-pipeline-operations';
import { useEntityCounts } from '@/hooks/admin/use-entity-counts';

// Then update the component to use the new hooks
```

**Testing**:
1. Load the component and verify it displays pipeline status correctly
2. Test the start and stop pipeline buttons
3. Verify the pipeline status updates after operations

##### Task 2.4: Update Additional Components

**Description**: Update all remaining components that use SQLite-specific hooks or direct database access.

**Files to Modify**:
- All components that import SQLite-specific hooks

**Implementation**:
For each component, replace SQLite hook imports with the new API hooks and update the component logic as needed.

**Testing**:
1. For each component, verify it functions correctly with the new hooks
2. Test all interactive features
3. Verify data display is consistent with the previous implementation

##### Task 2.5: Remove Legacy SQLite Code

**Description**: Once all components are updated, remove the SQLite-specific code.

**Steps**:
1. Delete the SQLite API handlers directory
```
rm -rf github-explorer/app/api/sqlite
```
2. Delete the database directory
```
rm -rf github-explorer/lib/database
```

**Testing**:
1. Run a build to verify no imports reference the deleted files
2. Check for any console errors
3. Verify all components still function correctly

### Epic 4: Infrastructure and Deployment

#### Story 1: Environment Configuration

**Objective**: Update environment configuration for both frontend and backend.

##### Task 1.1: Update Frontend Environment

**Description**: Create or update frontend environment files.

**Files to Create/Modify**:
- `github-explorer/.env.local`
- `github-explorer/.env.production`

**Implementation**:
For `.env.local`:
```
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001/api
```

For `.env.production`:
```
NEXT_PUBLIC_BACKEND_API_URL=https://your-backend-service.render.com/api
```

**Testing**:
1. Verify the environment variables are accessible in the application
2. Test with both local and production settings

##### Task 1.2: Update Backend Environment

**Description**: Create backend environment files.

**Files to Create**:
- `github-explorer/server/.env`
- `github-explorer/server/.env.production`

**Implementation**:
For `.env`:
```
DB_PATH=./db/github_explorer.db
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

For `.env.production`:
```
PORT=10000
CORS_ORIGIN=https://your-frontend-service.render.com
```

**Testing**:
1. Start the server with the environment files
2. Verify the server uses the correct configuration

#### Story 2: Database Migration

**Objective**: Implement database migration to move the database to the backend.

##### Task 2.1: Create Database Migration Script

**Description**: Create a script to copy the database from the workspace root to the backend server directory.

**Files to Create**:
- `github-explorer/server/scripts/migrate-db.js`

**Implementation**:
```javascript
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

**Testing**:
1. Run the script
2. Verify the database is copied to the target location
3. Test database access from the backend

##### Task 2.2: Add Migration Script to Package.json

**Description**: Add the migration script to the backend package.json.

**Files to Modify**:
- `github-explorer/server/package.json`

**Implementation**:
```json
"scripts": {
  "migrate-db": "node scripts/migrate-db.js"
}
```

**Testing**:
1. Run the script using npm: `npm run migrate-db`
2. Verify it executes successfully

#### Story 3: Deployment Configuration

**Objective**: Create deployment configuration for render.com.

##### Task 3.1: Create Backend Render Configuration

**Description**: Create a render.yaml file for the backend service.

**Files to Create**:
- `github-explorer/server/render.yaml`

**Implementation**:
```yaml
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

**Testing**:
1. Validate the YAML syntax
2. Review the configuration for correctness

##### Task 3.2: Create Frontend Render Configuration

**Description**: Create a render.yaml file for the frontend service.

**Files to Create**:
- `github-explorer/render.yaml`

**Implementation**:
```yaml
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

**Testing**:
1. Validate the YAML syntax
2. Review the configuration for correctness

##### Task 3.3: Update Documentation

**Description**: Update the project documentation to reflect the new architecture.

**Files to Modify**:
- `DOCS/PROJECT_STRUCTURE.md`
- `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md`

**Implementation**:
Update the documentation to reflect:
- The new database location in the backend
- The API-based access pattern
- The deployment configuration

**Testing**:
1. Review the updated documentation for accuracy
2. Verify all references to database access are updated

## Testing Strategy

### Local Development Testing

#### Backend API Testing

1. **Direct API Endpoint Testing**
   - Use tools like Postman or curl to test each endpoint directly
   - Verify the response format matches what the frontend expects
   - Test error handling by sending invalid requests

2. **Backend Unit Testing**
   - Create unit tests for each controller function
   - Mock the database connection for testing
   - Test both success and error scenarios

#### Frontend API Client Testing

1. **API Client Unit Testing**
   - Create tests for the core `apiFetch` function
   - Test each API module method
   - Mock the fetch API to simulate responses

2. **Hook Testing**
   - Create tests for each React hook
   - Verify data fetching, loading states, and error handling
   - Test with both success and error responses

#### Integration Testing

1. **Run Both Services Together**
   - Start the backend on port 3001
   - Start the frontend on port 3000
   - Test the full user flow through the UI

2. **Database Operations Testing**
   - Verify read operations work through the new architecture
   - Test write operations when applicable
   - Verify performance is acceptable

### Production-Like Testing

1. **Environment Variable Testing**
   - Test with production environment settings
   - Verify cross-origin requests work with production URLs

2. **Database Migration Testing**
   - Run the migration script against a copy of the production database
   - Verify all data is migrated correctly
   - Test the application against the migrated database

## Implementation Sequence

Follow this sequence for the most efficient implementation:

1. **Backend First Approach**
   - Complete Epic 1 (Backend API Development) first
   - Test each endpoint thoroughly before moving to the frontend

2. **Incremental Frontend Updates**
   - Implement the API client (Epic 2)
   - Update one component at a time to use the new client
   - Test after each component is updated

3. **Transition Period**
   - Keep both SQLite and API approaches working during transition
   - Only remove SQLite code after all components are updated

4. **Infrastructure Last**
   - Complete Epic 4 (Infrastructure and Deployment) last
   - Test deployment thoroughly in a staging environment

## Common Pitfalls

### API Response Format Matching

It's critical that backend API endpoints return exactly the same data structure that frontend components expect:

- Match field names (camelCase vs. snake_case)
- Maintain the same data types
- Preserve nested object structures

### Cross-Origin Issues

Ensure CORS is properly configured:

- Set the correct allowed origins
- Include all necessary HTTP methods
- Configure allowed headers properly

### Environment Variables

Handle environment variables correctly:

- Frontend variables must be prefixed with `NEXT_PUBLIC_`
- Update all deployment configurations with the correct variables
- Test with both development and production environments

### Database Path Resolution

Ensure database path resolution works in all environments:

- Local development
- Production deployment
- CI/CD environments

## Conclusion

This implementation plan provides a comprehensive roadmap for separating the frontend and backend concerns in the GitHub Explorer application. By following the epic-story-task structure and testing at each step, the migration can be completed with minimal disruption to the application's functionality.

The resulting architecture will be more maintainable, more secure, and better suited for production deployment on platforms like render.com where services are deployed separately. 