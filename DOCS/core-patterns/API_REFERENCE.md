# API Reference Guide

## Overview

This document provides a comprehensive reference for the GitHub Explorer API, detailing how the frontend and backend components communicate. It covers all API endpoints, request/response formats, and usage patterns for both client-side and server-side implementations.

## Related Documents

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - For deploying the API server and frontend
- [Development/Production Parity Guide](./DEVELOPMENT_PRODUCTION_PARITY.md) - Ensuring consistent API behavior across environments
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md) - Resolving common API connectivity issues
- [Project Structure](./PROJECT_STRUCTURE.md) - Understanding the overall architecture

## When to Use This Document

- When implementing frontend components that need to fetch data from the backend
- When adding new API endpoints to the backend
- When debugging API connectivity issues between frontend and backend
- When optimizing API performance

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend API Client](#frontend-api-client)
3. [Next.js API Routes](#nextjs-api-routes)
4. [Backend API Endpoints](#backend-api-endpoints)
5. [Authentication and Security](#authentication-and-security)
6. [Common Patterns and Best Practices](#common-patterns-and-best-practices)
7. [Troubleshooting](#troubleshooting)

## Architecture Overview

The GitHub Explorer application uses a tiered API architecture:

1. **Backend API Server** - Express.js server providing data endpoints from the database
2. **Next.js API Routes** - Acts as a proxy/adapter between frontend and backend
3. **Frontend API Client** - TypeScript modules that interface with the API

```
Frontend Components → Frontend API Client → Next.js API Routes → Backend API → Database
```

### Environment Configuration

API base URLs are configured using environment variables:

- **Frontend**: `NEXT_PUBLIC_BACKEND_API_URL` (defaults to `http://localhost:3001/api`)
- **Next.js API Routes**: `PIPELINE_SERVER_URL` for connecting to the backend server

## Frontend API Client

### Core API Client

The foundation of frontend API communication is in `github-explorer/lib/client/api.ts`:

```typescript
export async function fetchFromApi<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  params?: Record<string, string>,
  body?: any
): Promise<T> {
  // Base URL for the backend server
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api';
  
  // Build URL with query parameters
  let url = `${baseUrl}/${endpoint}`;
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
```

### API Client Modules

Domain-specific API functionality is broken into separate files:

- `entities-api.ts` - Entity counts
- `pipeline-api.ts` - Pipeline operations
- `repositories-api.ts` - Repository data
- `contributors-api.ts` - Contributor data
- `merge-requests-api.ts` - Merge request data
- `commits-api.ts` - Commit data
- `rankings-api.ts` - Ranking data

### Using the API Client

Example of using the Pipeline API:

```typescript
import { pipelineApi } from '@/lib/client/pipeline-api';

// In a React component
async function startPipeline(type: string) {
  try {
    const result = await pipelineApi.start(type);
    // Handle success
    console.log("Pipeline started:", result);
    return result;
  } catch (error) {
    // Handle error
    console.error("Failed to start pipeline:", error);
    throw error;
  }
}
```

## Next.js API Routes

Next.js API routes serve as intermediaries between the frontend and backend, providing several benefits:

1. Additional processing or validation
2. Authentication/authorization
3. Adapting between different API formats
4. Error handling and logging

### Available Next.js API Routes

- `/api/entity-counts` - Get entity statistics
- `/api/pipeline-operations` - Execute pipeline operations
- `/api/pipeline-history` - Get pipeline execution history
- `/api/pipeline-item-count` - Get pipeline item counts
- `/api/pipeline-schedules` - Get pipeline schedules
- `/api/repositories` - Access repository data
- `/api/supabase-health` - Verify Supabase connectivity
- `/api/supabase-test` - Test Supabase queries

### Example: Pipeline Operations API

The Next.js API route in `github-explorer/app/api/pipeline-operations/route.ts` processes pipeline operation requests:

1. Receives operation requests from frontend
2. Logs the operation to the database (Supabase)
3. Forwards the request to the backend server
4. Returns the result to the frontend

> **Critical Note**: The Next.js API route creates `/api/pipeline/${actualOperation}` URLs when forwarding to the backend, which must match exactly with the paths in the backend's router configuration. This is a potential source of errors - the frontend client calls `/api/pipeline/start` but the backend router may have defined the endpoint as `/api/pipeline-operations`. Always check both implementations when debugging 404 errors.

## Backend API Endpoints

The Express server provides these main API categories:

### Entity Counting Endpoints

#### GET `/api/entity-counts`

Returns count statistics for various entities in the system.

**Response:**
```json
{
  "repositories": 123,
  "contributors": 456,
  "mergeRequests": 789,
  "commits": 1023
}
```

### Pipeline Endpoints

#### GET `/api/pipeline-status`

Get the status of a specific pipeline.

**Query Parameters:**
- `pipeline_type` (required) - The type of pipeline to query

**Response:**
```json
{
  "pipelineType": "merge_request_processor",
  "status": "idle",
  "isRunning": false,
  "updatedAt": "2023-03-26T12:00:00Z"
}
```

#### POST `/api/pipeline-operations`

Execute pipeline operations (start, stop, restart).

**Request Body:**
```json
{
  "operation": "start",
  "pipelineType": "merge_request_processor",
  "parameters": {
    "limit": 100
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pipeline started successfully"
}
```

#### GET `/api/pipeline-history`

Get pipeline execution history.

**Query Parameters:**
- `pipeline_type` (optional) - Filter by pipeline type
- `limit` (optional) - Maximum items to return (default: 10)

**Response:**
```json
[
  {
    "id": "123",
    "pipelineType": "merge_request_processor",
    "status": "completed",
    "startedAt": "2023-03-26T12:00:00Z",
    "completedAt": "2023-03-26T12:05:00Z",
    "itemsProcessed": 50,
    "errorMessage": null
  }
]
```

#### GET `/api/pipeline-item-count`

Get the number of items processed by a pipeline.

**Query Parameters:**
- `pipeline_type` (required) - The type of pipeline

**Response:**
```json
{
  "count": 50
}
```

#### GET `/api/pipeline-schedules`

Get pipeline schedules.

**Response:**
```json
[
  {
    "id": "123",
    "pipelineType": "merge_request_processor",
    "cronExpression": "0 0 * * *",
    "isActive": true,
    "description": "Daily merge request processing"
  }
]
```

#### POST `/api/pipeline-history-clear`

Clear pipeline execution history.

**Query Parameters:**
- `pipeline_type` (optional) - Clear history for specific pipeline type only

**Response:**
```json
{
  "success": true,
  "message": "Pipeline history cleared"
}
```

### Repository Endpoints

#### GET `/api/repositories`

Get a list of repositories.

**Query Parameters:**
- `limit` (optional) - Maximum items to return (default: 10)
- `offset` (optional) - Pagination offset
- `order_by` (optional) - Field to order by
- `order_direction` (optional) - Sort direction (asc/desc)

**Response:**
```json
[
  {
    "id": "123",
    "name": "example-repo",
    "full_name": "owner/example-repo",
    "description": "An example repository",
    "html_url": "https://github.com/owner/example-repo",
    "stars": 100,
    "created_at": "2022-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
]
```

#### GET `/api/repositories/id/:id`

Get a repository by ID.

**Path Parameters:**
- `id` (required) - Repository ID

**Response:**
```json
{
  "id": "123",
  "name": "example-repo",
  "full_name": "owner/example-repo",
  "description": "An example repository",
  "html_url": "https://github.com/owner/example-repo",
  "stars": 100,
  "created_at": "2022-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

#### GET `/api/repositories/:slug`

Get a repository by slug.

**Path Parameters:**
- `slug` (required) - Repository slug (owner-repo format)

**Response:** Same as `/api/repositories/id/:id`

### Contributor Endpoints

#### GET `/api/contributors`

Get a list of contributors.

**Query Parameters:**
- `limit` (optional) - Maximum items to return (default: 10)
- `offset` (optional) - Pagination offset
- `order_by` (optional) - Field to order by
- `order_direction` (optional) - Sort direction (asc/desc)

**Response:**
```json
[
  {
    "id": "123",
    "login": "username",
    "avatar_url": "https://github.com/avatar.png",
    "html_url": "https://github.com/username",
    "contributions": 50,
    "company": "Company Name",
    "location": "City, Country"
  }
]
```

#### GET `/api/contributors/id/:id`

Get a contributor by ID.

**Path Parameters:**
- `id` (required) - Contributor ID

**Response:** Single contributor object

#### GET `/api/contributors/:login`

Get a contributor by GitHub login.

**Path Parameters:**
- `login` (required) - GitHub username

**Response:** Single contributor object

### Merge Request Endpoints

#### GET `/api/merge-requests`

Get a list of merge requests.

**Query Parameters:**
- Various filter and pagination parameters

**Response:**
```json
[
  {
    "id": "123",
    "number": 42,
    "title": "Feature implementation",
    "state": "merged",
    "created_at": "2023-01-01T00:00:00Z",
    "merged_at": "2023-01-02T00:00:00Z",
    "html_url": "https://github.com/owner/repo/pull/42",
    "user": {
      "id": "456",
      "login": "username"
    },
    "repository_id": "789"
  }
]
```

#### GET `/api/merge-requests/id/:id`

Get a merge request by ID.

**Path Parameters:**
- `id` (required) - Merge request ID

**Response:** Single merge request object

#### GET `/api/merge-requests/repository/:repository_id/number/:number`

Get a merge request by repository ID and PR number.

**Path Parameters:**
- `repository_id` (required) - Repository ID
- `number` (required) - PR number

**Response:** Single merge request object

### Commit Endpoints

#### GET `/api/commits`

Get a list of commits.

**Query Parameters:**
- Various filter and pagination parameters

**Response:**
```json
[
  {
    "id": "123",
    "sha": "abcdef1234567890",
    "message": "Commit message",
    "author": {
      "id": "456",
      "login": "username"
    },
    "repository_id": "789",
    "created_at": "2023-01-01T00:00:00Z",
    "html_url": "https://github.com/owner/repo/commit/abcdef1234567890"
  }
]
```

#### GET `/api/commits/id/:id`

Get a commit by ID.

**Path Parameters:**
- `id` (required) - Commit ID

**Response:** Single commit object

#### GET `/api/commits/repository/:repository_id/sha/:sha`

Get a commit by repository ID and commit SHA.

**Path Parameters:**
- `repository_id` (required) - Repository ID
- `sha` (required) - Commit SHA

**Response:** Single commit object

### Sitemap Endpoints

#### GET `/api/sitemap-status`

Get sitemap generation status.

**Response:**
```json
{
  "exists": true,
  "lastGenerated": "2023-03-26T12:00:00Z",
  "url": "/sitemap.xml"
}
```

#### POST `/api/generate-sitemap`

Trigger sitemap generation.

**Response:**
```json
{
  "success": true,
  "message": "Sitemap generation started"
}
```

#### GET `/api/sitemap.xml`

Get the generated sitemap XML.

**Response:** XML content

### Ranking Endpoints

#### POST `/api/contributor-rankings`

Get contributor rankings based on various metrics.

**Request Body:**
```json
{
  "timeframe": "30days",
  "metric": "commits",
  "limit": 10
}
```

**Response:**
```json
[
  {
    "contributor_id": "123",
    "login": "username",
    "avatar_url": "https://github.com/avatar.png",
    "score": 50,
    "rank": 1
  }
]
```

## Authentication and Security

### Cross-Origin Resource Sharing (CORS)

The backend server implements CORS to restrict access to authorized origins:

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

> **Important**: Ensure `CORS_ORIGIN` is properly configured in your backend environment variables.

### API Keys

Some endpoints (particularly pipeline operations) may require an API key:

```javascript
headers: {
  'Content-Type': 'application/json',
  'X-API-Key': process.env.PIPELINE_SERVER_API_KEY || ''
}
```

## Common Patterns and Best Practices

### Loading States

When fetching data in React components, implement loading states:

```typescript
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  async function fetchData() {
    try {
      setIsLoading(true);
      const result = await apiClient.getData();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }
  
  fetchData();
}, [dependencies]);

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

### Error Handling

Consistently handle errors across the application:

1. **Log the error** for debugging
2. **Provide user feedback** with appropriate error messages
3. **Include retry mechanisms** where appropriate

### Caching Strategies

Consider implementing caching for frequently accessed data:

```typescript
const cachedData = useMemo(() => {
  // Process or transform API data
  return processData(data);
}, [data]);
```

## Troubleshooting

### Issue: 404 Not Found for API Endpoints

**Symptom**: Frontend receives 404 errors when trying to access backend API endpoints

**Possible Causes**:
1. Backend server is not running
2. Incorrect API base URL configuration
3. Endpoint path mismatch between frontend and backend
4. Server is running with different entry point script

**Resolution**:
1. Verify backend server is running (`npm start` in server directory)
2. Check `NEXT_PUBLIC_BACKEND_API_URL` in frontend environment
3. Ensure endpoint paths match exactly between frontend and backend
4. Verify server is using `server.js` as entry point, not `index.js`

### Issue: CORS Errors

**Symptom**: Console errors about Cross-Origin Resource Sharing policy

**Resolution**:
1. Check `CORS_ORIGIN` in backend environment variables
2. Ensure it includes the frontend domain (with correct protocol)
3. Verify no trailing slashes in the origin configuration
4. Restart backend server after changing configuration

### Issue: 500 Internal Server Error

**Symptom**: Backend returns 500 errors

**Resolution**:
1. Check backend server logs for detailed error information
2. Verify database connectivity
3. Check environment variable configuration

## Further Reading

- [Express.js Documentation](https://expressjs.com/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

**Last Updated**: [Current Date] 