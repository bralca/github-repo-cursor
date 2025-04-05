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

#### GET `/api/contributors/:id/activity`

Get a contributor's activity data for calendar heatmap visualization.

**Path Parameters:**
- `id` (required) - Contributor's GitHub ID

**Query Parameters:**
- `timeframe` (optional) - Time period to include (default: "1year")
  - Supported values: "30days", "90days", "6months", "1year", "all"

**Response:**
```json
{
  "total_commits": 427,
  "first_commit_date": "2023-01-01T00:00:00Z",
  "last_commit_date": "2024-01-01T00:00:00Z",
  "activity": {
    "2023-01-01": 5,
    "2023-01-02": 3,
    "2023-01-03": 0,
    "2023-01-04": 8,
    // Additional dates with commit counts
    "2024-01-01": 4
  },
  "monthly_averages": [
    { "month": "2023-01", "average": 4.2 },
    { "month": "2023-02", "average": 3.8 },
    // Additional months
    { "month": "2024-01", "average": 5.1 }
  ]
}
```

The `activity` object contains date strings (YYYY-MM-DD format) as keys and the corresponding commit count for each day as values. Days with no activity will have a value of 0 if they fall within the requested timeframe.

The `monthly_averages` array provides average daily commit counts for each month, useful for trend visualization.

For large timeframes, pagination is not used; instead, the data is filtered to the specified timeframe. This approach ensures the front-end receives a complete dataset for calendar visualization without needing multiple requests.

#### GET `/api/contributors/:id/impact`

Get a contributor's code impact metrics for visualizing additions vs deletions.

**Path Parameters:**
- `id` (required) - Contributor's GitHub ID

**Response:**
```json
{
  "added": 8423,
  "removed": 3127,
  "total": 11550,
  "ratio": {
    "additions": 73,
    "deletions": 27
  },
  "repository_breakdown": [
    {
      "repository": "owner/repo1",
      "added": 3200,
      "removed": 1100,
      "total": 4300,
      "percentage": 37
    },
    {
      "repository": "owner/repo2",
      "added": 2800,
      "removed": 940,
      "total": 3740,
      "percentage": 32
    },
    {
      "repository": "owner/repo3",
      "added": 1300,
      "removed": 600,
      "total": 1900,
      "percentage": 16
    }
  ]
}
```

The response provides comprehensive code impact metrics:
- Total lines added, removed, and combined total
- Ratio of additions to deletions as percentages (always adds up to 100%)
- Breakdown by top repositories showing each repository's contribution to the overall impact

This endpoint is designed for visualizing code impact in pie charts or bar graphs, with the percentage values ready to use for visualization.

#### GET `/api/contributors/:id/repositories`

Get repositories a contributor has contributed to, with detailed contribution metrics.

**Path Parameters:**
- `id` (required) - Contributor's GitHub ID

**Query Parameters:**
- `limit` (optional) - Maximum items to return (default: 10)
- `offset` (optional) - Pagination offset (default: 0)
- `sort_by` (optional) - Field to sort by (default: "commit_count")
  - Supported values: "commit_count", "stars", "forks", "last_contribution_date", "pull_requests", "lines_added", "lines_removed"
- `sort_direction` (optional) - Sort direction (default: "desc")
  - Supported values: "asc", "desc"

**Response:**
```json
{
  "data": [
    {
      "id": "123",
      "github_id": 45678,
      "name": "project-name",
      "full_name": "owner/project-name",
      "description": "Repository description",
      "url": "https://github.com/owner/project-name",
      "stars": 250,
      "forks": 120,
      "commit_count": 87,
      "pull_requests": 15,
      "reviews": 8,
      "issues_opened": 12,
      "lines_added": 4382,
      "lines_removed": 1253,
      "first_contribution_date": "2022-05-10T00:00:00Z",
      "last_contribution_date": "2023-12-15T00:00:00Z",
      "merged_pull_requests": 12,
      "rejected_pull_requests": 3
    },
    // Additional repositories
  ],
  "pagination": {
    "total": 35,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}
```

The response includes:
- Repository data (id, name, description, etc.)
- Repository popularity metrics (stars, forks)
- Contributor-specific metrics (commit_count, pull_requests, lines added/removed)
- Contribution timeline data (first and last contribution dates)
- PR success metrics (merged vs. rejected pull requests)
- Pagination metadata

This endpoint is designed for both list views and detailed repository contribution analysis.

#### GET `/api/contributors/:id/merge-requests`

Get merge requests created by a contributor.

**Path Parameters:**
- `id` (required) - Contributor's GitHub ID

**Query Parameters:**
- `limit` (optional) - Maximum items to return (default: 10)
- `offset` (optional) - Pagination offset (default: 0)
- `state` (optional) - Filter by merge request state (default: "all")
  - Supported values: "all", "open", "closed", "merged"

**Response:**
```json
{
  "data": [
    {
      "id": "123",
      "github_id": 45678,
      "title": "Add new feature",
      "description": "This PR implements the new feature...",
      "state": "merged",
      "is_draft": false,
      "created_at": "2023-05-15T00:00:00Z",
      "updated_at": "2023-05-20T00:00:00Z",
      "closed_at": "2023-05-20T00:00:00Z",
      "merged_at": "2023-05-20T00:00:00Z",
      "repository_id": "456",
      "repository_name": "owner/project-name",
      "repository_description": "A project description",
      "commits_count": 5,
      "additions": 230,
      "deletions": 85,
      "changed_files": 8,
      "complexity_score": 65,
      "review_time_hours": 24,
      "cycle_time_hours": 120,
      "labels": ["feature", "enhancement"],
      "merged_by_username": "reviewer",
      "merged_by_avatar": "https://github.com/avatar.png"
    },
    // Additional merge requests
  ],
  "pagination": {
    "total": 42,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}
```

The response includes:
- Merge request data (id, title, description, state, etc.)
- Repository context (repository_name, repository_description)
- Impact metrics (commits_count, additions, deletions, changed_files)
- Time metrics (review_time_hours, cycle_time_hours)
- Additional metadata (labels, complexity score)
- Merger information (merged_by_username, merged_by_avatar)
- Pagination metadata

This endpoint supports building comprehensive PR lists and detailed PR analysis views.

#### GET `/api/contributors/:id/recent-activity`

Get a contributor's recent activity for timeline visualization.

**Path Parameters:**
- `id` (required) - Contributor's GitHub ID

**Query Parameters:**
- `limit` (optional) - Maximum items to return (default: 20)
- `offset` (optional) - Pagination offset (default: 0)

**Response:**
```json
{
  "data": [
    {
      "date": "2023-12-15",
      "activities": [
        {
          "id": "123",
          "type": "commit",
          "timestamp": "2023-12-15T14:35:27Z",
          "repository": {
            "id": "456",
            "name": "owner/project-name",
            "url": "https://github.com/owner/project-name"
          },
          "message": "Fix bug in authentication service",
          "sha": "abcdef1234567890",
          "filename": "src/auth/service.js",
          "status": "modified",
          "additions": 15,
          "deletions": 7
        },
        {
          "id": "124",
          "type": "pull_request",
          "timestamp": "2023-12-15T10:22:43Z",
          "repository": {
            "id": "789",
            "name": "owner/other-project",
            "url": "https://github.com/owner/other-project"
          },
          "title": "Add new feature",
          "number": 42,
          "state": "merged",
          "additions": 230,
          "deletions": 85
        }
      ]
    },
    {
      "date": "2023-12-14",
      "activities": [
        // Activities from this date
      ]
    }
    // Additional days
  ],
  "pagination": {
    "total": 142,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

The response has these key characteristics:
- Activities are grouped by date for timeline display
- Each day includes multiple activities of different types (commits, pull requests)
- Activity data includes repository context for each item
- Type-specific fields provide the relevant details for each activity type
- Data is ordered chronologically (newest first) for easy timeline rendering
- Standard pagination is supported

This endpoint is specifically designed for creating activity feed or timeline visualizations.

#### GET `/api/contributors/:id/rankings`

Get a contributor's ranking data with detailed scores and percentiles.

**Path Parameters:**
- `id` (required) - Contributor's GitHub ID

**Response:**
```json
{
  "rank": 42,
  "absolute_rank": 42,
  "total_ranked": 5000,
  "percentile": 99.2,
  "calculation_date": "2023-12-01T00:00:00Z",
  "scores": {
    "total": 87.4,
    "code_volume": 92.1,
    "code_efficiency": 85.6,
    "commit_impact": 88.3,
    "repo_influence": 90.2,
    "followers": 78.5,
    "profile_completeness": 95.0,
    "collaboration": 82.7,
    "repo_popularity": 86.4
  },
  "percentiles": {
    "total": 99.2,
    "code_volume": 98.7,
    "code_efficiency": 97.2,
    "commit_impact": 98.9,
    "repo_influence": 99.1,
    "followers": 94.8
  },
  "raw_metrics": {
    "followers_count": 1250,
    "lines_added": 138720,
    "lines_removed": 42310,
    "commits_count": 1872,
    "repositories_contributed": 35
  },
  "trend": {
    "previous_timestamp": "2023-11-01T00:00:00Z",
    "previous_rank": 53,
    "previous_score": 85.1,
    "rank_change": 11,
    "score_change": 2.3
  }
}
```

The response provides comprehensive ranking metrics:
- Absolute rank and percentile information
- Detailed scores across multiple evaluation dimensions
- Percentile calculations for each score component
- Raw metrics that went into the score calculations
- Trend data showing changes since the previous ranking calculation

This endpoint is designed for detailed contributor profile pages and leaderboard displays. The percentile values are particularly useful for visualizations like radar charts or score comparison displays.

#### GET `/api/contributors/:id/profile-metadata`

Get a contributor's profile metadata for the profile display.

**Path Parameters:**
- `id` (required) - Contributor's GitHub ID

**Response:**
```json
{
  "active_period": {
    "first_contribution": "2021-04-15T00:00:00Z",
    "last_contribution": "2024-03-28T00:00:00Z",
    "duration_days": 1079,
    "duration_formatted": "2 years, 11 months"
  },
  "organizations": [
    { "name": "Microsoft", "id": "123" },
    { "name": "Google", "id": "456" },
    { "name": "Meta", "id": "789" }
  ],
  "top_languages": [
    { "name": "TypeScript", "percentage": 45 },
    { "name": "JavaScript", "percentage": 30 },
    { "name": "Python", "percentage": 15 },
    { "name": "Go", "percentage": 10 }
  ]
}
```

The response provides supplementary profile information:
- Active time period including first and last contribution dates
- Duration of activity in days and a human-readable format
- Organizations the contributor belongs to
- Top programming languages with percentage breakdown

This endpoint is designed to provide supporting metadata for contributor profile displays that isn't included in the main profile endpoint.

#### GET `/api/contributors/:id/profile-data`

Get comprehensive profile data for a contributor directly from commits data, bypassing the need for the contributor_repository junction table.

**Path Parameters:**
- `id` (required) - Contributor's GitHub ID

**Query Parameters:**
- `limit` (optional) - Maximum number of repositories to return (default: 5)
- `offset` (optional) - Pagination offset for repositories (default: 0)

**Response:**
```json
{
  "contributor": {
    "id": "4fdfb98f-9b2d-46ac-b776-fd56057effe9",
    "github_id": 49186168,
    "username": "KelvinTegelaar",
    "name": null,
    "avatar": "https://avatars.githubusercontent.com/u/49186168?v=4",
    "bio": "CTO @ Lime Networks, Blogger @ CyberDrain.com :) Microsoft MVP"
  },
  "active_period": {
    "first_contribution": "2025-03-07T12:46:52Z",
    "last_contribution": "2025-03-17T11:51:29Z",
    "duration_days": 9,
    "duration_formatted": "9 days"
  },
  "top_languages": [
    {
      "name": "PowerShell",
      "percentage": 94.71,
      "count": 197
    },
    {
      "name": "CSV",
      "percentage": 1.92,
      "count": 4
    },
    {
      "name": "JSON",
      "percentage": 1.44,
      "count": 3
    }
  ],
  "repositories": {
    "data": [
      {
        "repository_id": "7af352f3-31aa-4184-bc30-7c011ea91fe2",
        "repository_github_id": 930239709,
        "commit_count": 208,
        "lines_added": 235498,
        "lines_removed": 1000,
        "first_commit_date": "2025-03-07T12:46:52Z",
        "last_commit_date": "2025-03-17T11:51:29Z",
        "name": "CIPP-API",
        "full_name": "drtun5726/CIPP-API",
        "description": null,
        "primary_language": "PowerShell",
        "stars_count": 0,
        "forks_count": 0,
        "license": "AGPL-3.0"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 5,
      "offset": 0,
      "has_more": false
    }
  }
}
```

**Field Descriptions:**

- **contributor**: Basic information about the contributor
  - `id`: UUID of the contributor in the database
  - `github_id`: GitHub's numeric ID for the contributor
  - `username`: GitHub username
  - `name`: Full name (if available, may be null)
  - `avatar`: URL to the contributor's GitHub avatar
  - `bio`: Contributor's GitHub bio text

- **active_period**: Information about the contributor's activity timeline
  - `first_contribution`: ISO timestamp of first commit
  - `last_contribution`: ISO timestamp of most recent commit
  - `duration_days`: Number of days between first and last contribution
  - `duration_formatted`: Human-readable duration (e.g., "9 days", "3 months", "2 years 5 months")

- **top_languages**: Array of the contributor's most used programming languages
  - `name`: Programming language name (derived from file extensions)
  - `percentage`: Percentage of usage compared to other languages
  - `count`: Raw count of files in this language

- **repositories**: Information about repositories the contributor has worked on
  - **data**: Array of repository objects
    - `repository_id`: UUID of the repository in the database
    - `repository_github_id`: GitHub's numeric ID for the repository
    - `commit_count`: Number of commits by this contributor
    - `lines_added`: Total lines of code added by this contributor
    - `lines_removed`: Total lines of code removed by this contributor
    - `first_commit_date`: ISO timestamp of contributor's first commit to this repository
    - `last_commit_date`: ISO timestamp of contributor's most recent commit to this repository
    - `name`: Repository name
    - `full_name`: Full repository name with owner (e.g., "owner/repo")
    - `description`: Repository description (may be null)
    - `primary_language`: Primary programming language of the repository
    - `stars_count`: Number of GitHub stars
    - `forks_count`: Number of GitHub forks
    - `license`: Repository license identifier
  - **pagination**: Information for paginating through repositories
    - `total`: Total count of repositories the contributor has worked on
    - `limit`: Maximum number of repositories per page
    - `offset`: Current offset in the result set
    - `has_more`: Boolean indicating if more repositories are available

This endpoint calculates contributor profile data directly from commits, analyzing file extensions for language statistics and grouping commits by repository to determine repository-level metrics. All data is derived directly from the commits table, making it resilient even when contributor-repository junction tables are incomplete.

**Usage example with fetch:**
```javascript
const response = await fetch('http://localhost:3001/api/contributors/49186168/profile-data');
const profileData = await response.json();
```

**Usage with React Query:**
```javascript
const { data, isLoading, error } = useQuery(['contributorProfile', contributorId], 
  () => fetchFromApi(`contributors/${contributorId}/profile-data`));
```

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