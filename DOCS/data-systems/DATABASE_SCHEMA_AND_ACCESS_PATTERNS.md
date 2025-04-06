# GitHub Explorer Database Schema and Access Patterns

## Overview

This document serves as the **single source of truth** for the GitHub Explorer database schema and access patterns. It provides a comprehensive reference for all database tables, fields, and access patterns used throughout the application.

## Database Configuration

The SQLite database is configured in the `.env` file:

```
DB_PATH=/path/to/your/github_explorer.db
```

If not specified, the database will be located at the server/db directory as `github_explorer.db`. A standardized utility module (`github-explorer/server/src/utils/db-path.js`) is used throughout the application to ensure consistent database path resolution.

## Core Schema Principles

The database follows these standardized principles:

1. **Primary Keys**: Most tables use text-based UUIDs as primary keys, though some use auto-incremented integers
2. **GitHub Identifiers**: All entities have a `github_id` field that stores the original GitHub identifier
3. **Dual Reference**: Many tables include both the UUID foreign key AND the actual GitHub ID for direct querying
4. **Complete Relationships**: Relationships between entities are enforced using foreign key constraints
5. **Tracking Metadata**: All entity tables include `created_at` and `updated_at` timestamp fields

## Database Schema

### Raw Data Tables

#### `closed_merge_requests_raw`

Stores raw GitHub API data for closed merge requests before processing.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key (auto-incremented) |
| `data` | TEXT | JSON blob of the raw API response |
| `is_processed` | INTEGER | Flag indicating whether this record has been processed (0=unprocessed, 1=processed) |
| `created_at` | TIMESTAMP | When this record was created |
| `updated_at` | TIMESTAMP | When this record was last updated |

**Indices:**
- `idx_closed_mr_is_processed` on the `is_processed` column - used for efficiently querying unprocessed items

**Triggers:**
- `update_closed_merge_requests_raw_created_at` - Sets created_at and updated_at on insert
- `update_closed_merge_requests_raw_updated_at` - Updates updated_at on update

### Core Entity Tables

#### `repositories`

Stores information about GitHub repositories.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `github_id` | BIGINT | GitHub's internal ID for the repository |
| `name` | TEXT | Repository name |
| `full_name` | TEXT | Full repository name with owner (e.g., "owner/repo") |
| `description` | TEXT | Repository description |
| `url` | TEXT | GitHub URL for the repository |
| `api_url` | TEXT | GitHub API URL for the repository |
| `stars` | INTEGER | Number of repository stars |
| `forks` | INTEGER | Number of repository forks |
| `is_enriched` | BOOLEAN | Whether additional data has been fetched |
| `health_percentage` | INTEGER | Repository health score |
| `open_issues_count` | INTEGER | Number of open issues |
| `last_updated` | TIMESTAMP | When the repository was last updated on GitHub |
| `size_kb` | INTEGER | Repository size in kilobytes |
| `watchers_count` | INTEGER | Number of repository watchers |
| `primary_language` | TEXT | Primary language of the repository |
| `license` | TEXT | Repository license |
| `is_fork` | BOOLEAN | Whether the repository is a fork |
| `is_archived` | BOOLEAN | Whether the repository is archived |
| `default_branch` | TEXT | Default branch name (default: 'main') |
| `source` | TEXT | Source of the repository data (default: 'github_api') |
| `owner_id` | TEXT | Reference to the contributor ID who owns the repository |
| `owner_github_id` | BIGINT | GitHub ID of the repository owner |
| `enrichment_attempts` | INTEGER | Number of times enrichment has been attempted |
| `created_at` | TIMESTAMP | When this record was created |
| `updated_at` | TIMESTAMP | When this record was last updated |

**Indices:**
- `idx_repositories_github_id` on the `github_id` column
- `idx_repositories_full_name` on the `full_name` column
- `idx_repositories_owner_github_id` on the `owner_github_id` column
- `idx_repositories_owner_id` on the `owner_id` column

**Constraints:**
- Foreign key `owner_id` references `contributors(id)` with ON DELETE SET NULL
- Unique constraint on `github_id`
- Unique constraint on `full_name`

#### `contributors`

Stores information about GitHub users who contribute to repositories.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `github_id` | BIGINT | GitHub's internal ID for the user |
| `username` | TEXT | GitHub username (nullable) |
| `name` | TEXT | Full name (if available) |
| `avatar` | TEXT | URL to profile picture |
| `is_enriched` | BOOLEAN | Whether additional data has been fetched |
| `bio` | TEXT | User bio |
| `company` | TEXT | Company affiliation |
| `blog` | TEXT | Blog URL |
| `twitter_username` | TEXT | Twitter username |
| `location` | TEXT | User location |
| `followers` | INTEGER | Number of followers |
| `repositories` | INTEGER | Number of public repositories |
| `impact_score` | INTEGER | Calculated contribution impact score |
| `role_classification` | TEXT | Classified contributor role |
| `top_languages` | TEXT | JSON array of top languages |
| `organizations` | TEXT | JSON array of organization memberships |
| `first_contribution` | TIMESTAMP | Date of first contribution |
| `last_contribution` | TIMESTAMP | Date of last contribution |
| `direct_commits` | INTEGER | Number of direct commits |
| `pull_requests_merged` | INTEGER | Number of PRs merged |
| `pull_requests_rejected` | INTEGER | Number of PRs rejected |
| `code_reviews` | INTEGER | Number of code reviews |
| `is_placeholder` | BOOLEAN | Whether this is a placeholder for an unknown contributor |
| `is_bot` | BOOLEAN | Whether this contributor is a bot |
| `enrichment_attempts` | INTEGER | Number of times enrichment has been attempted |
| `created_at` | TIMESTAMP | When this record was created |
| `updated_at` | TIMESTAMP | When this record was last updated |

**Indices:**
- `idx_contributors_github_id` on the `github_id` column
- `idx_contributors_username` on the `username` column

**Constraints:**
- Unique constraint on `github_id`

#### `merge_requests`

Stores information about pull/merge requests.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `github_id` | INTEGER | PR number within the repository |
| `repository_id` | TEXT | Reference to the repository ID |
| `repository_github_id` | BIGINT | GitHub ID of the repository |
| `author_id` | TEXT | Reference to the contributor who authored the PR |
| `author_github_id` | BIGINT | GitHub ID of the author |
| `title` | TEXT | Merge request title |
| `description` | TEXT | Merge request description/body |
| `state` | TEXT | Current state (open, closed, merged) |
| `is_draft` | BOOLEAN | Whether the PR is a draft |
| `created_at` | TIMESTAMP | When this record was created |
| `updated_at` | TIMESTAMP | When this record was last updated |
| `closed_at` | TIMESTAMP | When the PR was closed |
| `merged_at` | TIMESTAMP | When the PR was merged |
| `merged_by_id` | TEXT | Reference to the contributor who merged the PR |
| `merged_by_github_id` | BIGINT | GitHub ID of the user who merged the PR |
| `commits_count` | INTEGER | Number of commits in the PR |
| `additions` | INTEGER | Number of lines added |
| `deletions` | INTEGER | Number of lines removed |
| `changed_files` | INTEGER | Number of files changed |
| `complexity_score` | INTEGER | Calculated complexity score |
| `review_time_hours` | INTEGER | Hours from creation to first review |
| `cycle_time_hours` | INTEGER | Hours from creation to merge/close |
| `labels` | TEXT | JSON array of PR labels |
| `source_branch` | TEXT | Source branch name |
| `target_branch` | TEXT | Target branch name |
| `is_enriched` | BOOLEAN | Whether additional data has been fetched |
| `review_count` | INTEGER | Number of reviews |
| `comment_count` | INTEGER | Number of comments |
| `enrichment_attempts` | INTEGER | Number of times enrichment has been attempted |

**Indices:**
- `idx_merge_requests_github_id` on the `github_id` column
- `idx_merge_requests_repository_id` on the `repository_id` column
- `idx_merge_requests_repository_github_id` on the `repository_github_id` column
- `idx_merge_requests_author_id` on the `author_id` column
- `idx_merge_requests_author_github_id` on the `author_github_id` column
- `idx_merge_requests_merged_by_github_id` on the `merged_by_github_id` column
- `idx_merge_requests_state` on the `state` column
- Unique index `idx_merge_requests_repo_pr` on `(repository_github_id, github_id)`

**Constraints:**
- Foreign key `repository_id` references `repositories(id)` with ON DELETE CASCADE
- Foreign key `author_id` references `contributors(id)` with ON DELETE CASCADE
- Foreign key `merged_by_id` references `contributors(id)` with ON DELETE SET NULL
- Unique constraint on `(repository_id, github_id)`

#### `commits`

Stores information about repository commits and their file changes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `github_id` | TEXT | Commit SHA (shared across files in same commit) |
| `repository_id` | TEXT | Reference to the repository ID |
| `repository_github_id` | BIGINT | GitHub ID of the repository |
| `contributor_id` | TEXT | Reference to the contributor who authored the commit |
| `contributor_github_id` | BIGINT | GitHub ID of the contributor |
| `pull_request_id` | TEXT | Reference to the merge request ID (if applicable) |
| `pull_request_github_id` | INTEGER | GitHub PR number (if applicable) |
| `message` | TEXT | Commit message |
| `committed_at` | TIMESTAMP | When the commit was made |
| `parents` | TEXT | JSON array of parent commit SHAs |
| `filename` | TEXT | Path of the changed file |
| `status` | TEXT | Status of change (added, modified, deleted) |
| `additions` | INTEGER | Number of lines added to this file |
| `deletions` | INTEGER | Number of lines removed from this file |
| `patch` | TEXT | The actual diff/patch content |
| `complexity_score` | INTEGER | AI-generated complexity score |
| `is_merge_commit` | BOOLEAN | Whether this is a merge commit |
| `is_enriched` | BOOLEAN | Whether additional data has been fetched |
| `enrichment_attempts` | INTEGER | Number of times enrichment has been attempted |
| `created_at` | TIMESTAMP | When this record was created |
| `updated_at` | TIMESTAMP | When this record was last updated |

**Note**: Each commit record represents a single file change, and the total number of files changed must be counted across records with the same commit SHA.

**Indices:**
- `idx_commits_github_id` on the `github_id` column
- `idx_commits_repository_id` on the `repository_id` column
- `idx_commits_contributor_id` on the `contributor_id` column
- `idx_commits_pull_request_id` on the `pull_request_id` column
- `idx_commits_filename` on the `filename` column
- `idx_commits_committed_at` on the `committed_at` column
- `idx_commits_is_enriched` on the `is_enriched` column
- Unique index `idx_commits_unique` on `(github_id, repository_id, filename)`

**Constraints:**
- Foreign key `repository_id` references `repositories(id)` with ON DELETE CASCADE
- Foreign key `contributor_id` references `contributors(id)` with ON DELETE SET NULL
- Foreign key `pull_request_id` references `merge_requests(id)` with ON DELETE SET NULL

#### `contributor_repository`

Junction table to track contributor involvement in repositories.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `contributor_id` | TEXT | Reference to the contributor ID |
| `contributor_github_id` | BIGINT | GitHub ID of the contributor |
| `repository_id` | TEXT | Reference to the repository ID |
| `repository_github_id` | BIGINT | GitHub ID of the repository |
| `commit_count` | INTEGER | Number of commits by this contributor |
| `pull_requests` | INTEGER | Number of PRs opened by this contributor |
| `reviews` | INTEGER | Number of reviews by this contributor |
| `issues_opened` | INTEGER | Number of issues opened by this contributor |
| `first_contribution_date` | TIMESTAMP | Date of first contribution |
| `last_contribution_date` | TIMESTAMP | Date of last contribution |
| `lines_added` | INTEGER | Total lines of code added |
| `lines_removed` | INTEGER | Total lines of code removed |
| `created_at` | TIMESTAMP | When this record was created |
| `updated_at` | TIMESTAMP | When this record was last updated |

**Indices:**
- `idx_contrib_repo_contributor_id` on the `contributor_id` column
- `idx_contrib_repo_contributor_github_id` on the `contributor_github_id` column
- `idx_contrib_repo_repository_id` on the `repository_id` column
- `idx_contrib_repo_repository_github_id` on the `repository_github_id` column
- Unique index `idx_contrib_repo_unique` on `(contributor_id, repository_id)`

**Constraints:**
- Foreign key `contributor_id` references `contributors(id)` with ON DELETE CASCADE
- Foreign key `repository_id` references `repositories(id)` with ON DELETE CASCADE
- Unique constraint on `(contributor_id, repository_id)`

### Pipeline Management Tables

The following tables manage pipeline operations and execution tracking:

#### `pipeline_schedules`

Schema for scheduled pipeline operations:

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `pipeline_type` | TEXT | Type of pipeline (github_sync, data_processing, etc.) |
| `cron_expression` | TEXT | Cron schedule expression |
| `is_active` | BOOLEAN | Whether this schedule is currently active |
| `parameters` | TEXT | JSON blob with pipeline parameters |
| `description` | TEXT | Human-readable description of the schedule |
| `created_at` | TIMESTAMP | When this record was created |
| `updated_at` | TIMESTAMP | When this record was last updated |

**Indices:**
- `idx_pipeline_schedules_type` on the `pipeline_type` column
- `idx_pipeline_schedules_active` on the `is_active` column

**Constraints:**
- Unique constraint on `pipeline_type`

#### `pipeline_history`

Schema for tracking pipeline execution history:

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `pipeline_type` | TEXT | Type of pipeline that was run |
| `status` | TEXT | Current status (running, completed, failed, stopped) |
| `started_at` | TIMESTAMP | When the pipeline run started |
| `completed_at` | TIMESTAMP | When the pipeline run completed |
| `items_processed` | INTEGER | Number of items processed in this run |
| `error_message` | TEXT | Error message if the pipeline failed |
| `created_at` | TIMESTAMP | When this record was created |

**Indices:**
- `idx_pipeline_history_type` on the `pipeline_type` column
- `idx_pipeline_history_status` on the `status` column
- `idx_pipeline_history_started_at` on the `started_at` column

#### `pipeline_status`

Schema for storing the current status of each pipeline type:

| Column | Type | Description |
|--------|------|-------------|
| `pipeline_type` | TEXT | Primary key - Type of pipeline |
| `status` | TEXT | Current status text (running, idle, failed, etc.) |
| `is_running` | INTEGER | Whether the pipeline is currently running (0=stopped, 1=running) |
| `last_run` | TIMESTAMP | When the pipeline was last run |
| `updated_at` | TIMESTAMP | When this record was last updated |

### SEO Management Tables

The following tables manage sitemap generation for SEO purposes:

#### `sitemap_metadata`

Schema for tracking sitemap files and URL counts:

| Column | Type | Description |
|--------|------|-------------|
| `entity_type` | TEXT | Primary key - Type of entity (repositories, contributors, etc.) |
| `current_page` | INTEGER | Current sitemap page number for this entity type |
| `url_count` | INTEGER | Number of URLs in the current sitemap page |
| `last_updated` | TIMESTAMP | When this record was last updated |

#### `sitemap_status`

Schema for tracking the status of sitemap generation:

| Column | Type | Description |
|--------|------|-------------|
| `status` | TEXT | Status description |
| `is_generating` | BOOLEAN | Whether a sitemap is currently being generated |
| `last_generated` | TIMESTAMP | When the sitemap was last generated |
| `item_count` | INTEGER | Total number of items in the sitemap |
| `file_size` | INTEGER | Size of the generated sitemap files |
| `error_message` | TEXT | Error message if generation failed |
| `updated_at` | TIMESTAMP | When this record was last updated |

### Analytics Tables

The following table manages developer rankings for the leaderboard homepage:

#### `contributor_rankings`

Schema for storing calculated developer rankings and metrics:

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `contributor_id` | TEXT | Reference to the contributor ID |
| `contributor_github_id` | BIGINT | GitHub ID of the contributor |
| `rank_position` | INTEGER | Numerical rank position (1st, 2nd, etc.) |
| `total_score` | REAL | Combined ranking score (0-100) |
| `code_volume_score` | REAL | Score based on total code volume (0-100) |
| `code_efficiency_score` | REAL | Score based on code efficiency metrics (0-100) |
| `commit_impact_score` | REAL | Score based on commit impact (0-100) |
| `repo_influence_score` | REAL | Score based on repository influence (0-100) |
| `followers_score` | REAL | Score based on follower count (0-100) |
| `profile_completeness_score` | REAL | Score based on profile data completeness (0-100) |
| `collaboration_score` | REAL | Score based on collaboration metrics (0-100) |
| `repo_popularity_score` | REAL | Score based on repository popularity (0-100) |
| `followers_count` | INTEGER | Raw count of GitHub followers |
| `raw_lines_added` | INTEGER | Total lines of code added |
| `raw_lines_removed` | INTEGER | Total lines of code removed |
| `raw_commits_count` | INTEGER | Total number of commits |
| `repositories_contributed` | INTEGER | Number of repositories contributed to |
| `calculation_timestamp` | TIMESTAMP | When this ranking was calculated |

**Indices:**
- `idx_contributor_rankings_contributor_id` on the `contributor_id` column
- `idx_contributor_rankings_timestamp` on the `calculation_timestamp` column
- `idx_contributor_rankings_rank` on the `rank_position` column

**Constraints:**
- Foreign key `contributor_id` references `contributors(id)`

## Common Access Patterns

### Pipeline Status and Control

1. **Pipeline Status Check**
   - Frontend calls the API endpoint `/api/pipeline-status?pipeline_type=<type>`
   - Backend controller queries the database and returns current pipeline status
   - Frontend uses React Query to manage data fetching and caching

2. **Pipeline Control Operations**
   - Start pipeline: Frontend sends POST request to `/api/pipeline-operations` with operation="start"
   - Stop pipeline: Frontend sends POST request to `/api/pipeline-operations` with operation="stop"
   - Backend controller handles the database operations and pipeline state changes

3. **Entity Counts**
   - Frontend calls the API endpoint `/api/entity-counts`
   - Backend executes consolidated queries to count repositories, contributors, merge requests, and commits
   - Frontend displays the results in dashboard cards with automatic refresh

### Data Processing Flow

1. **GitHub Sync Pipeline**
   - Backend pipeline fetches public events from GitHub API to find recently merged pull requests
   - Stores raw data in the `closed_merge_requests_raw` table with `is_processed = 0`
   - Checks for duplicates by examining the pull request ID in the JSON data
   - Updates existing records if the same pull request is fetched again

2. **Data Processing Pipeline**
   - Backend reads from `closed_merge_requests_raw` where `is_processed = 0` 
   - Extracts entities (repositories, contributors, merge requests, commits) from the raw JSON data
   - Writes extracted entities to their respective tables
   - Updates the `is_processed` flag to `1` after successful processing

3. **Data Enrichment Pipeline**
   - Backend reads entities where `is_enriched = false` from core tables
   - Fetches additional data from GitHub API
   - Updates records with enriched information

4. **AI Analysis Pipeline**
   - Backend reads `commits` where `complexity_score IS NULL`
   - Generates scores with AI models
   - Updates records with complexity metrics

### SEO Management

1. **Sitemap Generation**
   - Frontend triggers sitemap generation via `/api/generate-sitemap` endpoint
   - Backend checks `sitemap_metadata` to determine current page for each entity type
   - Backend generates sitemap XML files with up to 49,000 URLs per file
   - Backend updates metadata when new pages are needed

2. **Entity URL Updates**
   - When new entities are added via backend processing, sitemap metadata is updated
   - URL count for the appropriate entity type is incremented
   - New sitemap pages are created when current page is full (>49,000 URLs)

### Developer Rankings

1. **Ranking Calculation**
   - Frontend triggers ranking calculation via `/api/contributor-rankings` endpoint
   - Backend calculates developer scores based on code volume, efficiency, impact, and repository influence
   - Backend excludes all contributions from forked repositories to focus on original work
   - Backend stores calculated rankings in the `contributor_rankings` table with timestamp
   - Each calculation creates a new set of records with the same timestamp

2. **Homepage Leaderboard Display**
   - Frontend queries the backend `/api/contributor-rankings` endpoint
   - Backend retrieves the most recent rankings by maximum `calculation_timestamp`
   - Backend sorts by `rank_position` to return the top developers
   - Frontend displays the formatted results

3. **Trend Analysis**
   - Frontend queries the backend for ranking data over time
   - Backend compares ranking positions across different calculation timestamps
   - Backend calculates changes in rank position and scores over time
   - Frontend generates trend data visualization

## API-Based Data Access

All data access from the frontend follows these principles:

1. **No Direct Database Access**: Frontend code never connects directly to the database
2. **API-Based Communication**: All data is accessed through HTTP calls to the backend API
3. **Consistent Error Handling**: API endpoints provide standardized error responses
4. **Clear Separation of Concerns**:
   - Backend is responsible for data persistence and business logic
   - Frontend is responsible for presentation and user interaction

The API client is implemented in the `github-explorer/lib/client` directory, with specialized modules for different entity types:

```typescript
// Example API client usage
import { apiClient } from '@/lib/client/api-client';

// Fetch entity counts
const counts = await apiClient.entities.getCounts();

// Start a pipeline
await apiClient.pipeline.performOperation('github_sync', 'start');

// Get repositories
const repos = await apiClient.repositories.getAll({ limit: 10, offset: 0 });
```

## Connection Management

Database connections are managed through the connection manager in `github-explorer/server/src/db/connection-manager.js`, which implements a singleton pattern to maintain a persistent SQLite connection throughout the application lifecycle.

### Key Features

1. **Persistent Connection**: Maintains a single, long-lived database connection
2. **Connection Pooling**: Reuses the same connection across multiple requests
3. **Automatic Recovery**: Detects and recovers from invalid connections
4. **Graceful Shutdown**: Properly closes the connection when the application shuts down

### Using the Connection Manager

```javascript
import { getConnection } from '../db/connection-manager.js';

async function performDatabaseOperation() {
  // Get the shared database connection
  const db = await getConnection();
  
  // Use the connection for database operations
  const results = await db.all('SELECT * FROM repositories LIMIT 10');
  
  // No need to close the connection - it's managed by the connection manager
  return results;
}
```

### Best Practices

1. **Never Close Connections Manually**: Don't call `db.close()` on connections from the manager
2. **Always Use getConnection()**: Avoid creating direct database connections
3. **Handle Connection Errors**: Implement proper error handling around database operations
4. **Log Connection Issues**: Use the logger to track connection failures for debugging

### Legacy Connection Methods (Deprecated)

The following methods have been deprecated and should not be used in new code:

- `openSQLiteConnection()` - Use `getConnection()` instead
- `closeSQLiteConnection()` - Don't close connections manually
- `withDb()` utility - Use direct `getConnection()` calls instead

### Connection Lifecycle

The connection manager handles the entire lifecycle of the database connection:

1. **Initialization**: Connection is created on first request
2. **Validation**: Connection is validated before each use
3. **Recovery**: Invalid connections are automatically recreated
4. **Cleanup**: Connection is properly closed during application shutdown
