# GitHub Explorer Database Schema and Access Patterns

## Overview

This document serves as the **single source of truth** for the GitHub Explorer database schema and access patterns. It consolidates information from the database standardization plan and reflects the current state where SQLite is the primary database instead of Supabase.

## Database Configuration

The SQLite database is configured in the `.env` file:

```
DB_PATH=/path/to/your/github_explorer.db
```

If not specified, the database will be created in the project root directory as `github_explorer.db`.

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

**Indices:**
- `idx_closed_mr_is_processed` on the `is_processed` column - used for efficiently querying unprocessed items

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
| `default_branch` | TEXT | Default branch name |
| `source` | TEXT | Source of the repository data |
| `owner_id` | TEXT | Reference to the contributor ID who owns the repository |
| `owner_github_id` | BIGINT | GitHub ID of the repository owner |
| `created_at` | TIMESTAMP | When this record was created |
| `updated_at` | TIMESTAMP | When this record was last updated |

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
| `created_at` | TIMESTAMP | When this record was created |
| `updated_at` | TIMESTAMP | When this record was last updated |

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

#### `commits`

Stores information about repository commits.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `github_id` | TEXT | GitHub's SHA for the commit |
| `sha` | TEXT | SHA hash (duplicate for compatibility) |
| `repository_id` | TEXT | Reference to the repository ID |
| `repository_github_id` | BIGINT | GitHub ID of the repository |
| `contributor_id` | TEXT | Reference to the contributor who authored the commit |
| `contributor_github_id` | BIGINT | GitHub ID of the contributor |
| `author` | TEXT | Author name (for compatibility) |
| `message` | TEXT | Commit message |
| `additions` | INTEGER | Number of lines added |
| `deletions` | INTEGER | Number of lines removed |
| `files_changed` | INTEGER | Number of files changed |
| `is_merge_commit` | BOOLEAN | Whether this is a merge commit |
| `committed_at` | TIMESTAMP | When the commit was made |
| `pull_request_id` | TEXT | Reference to the merge request ID (if applicable) |
| `pull_request_github_id` | INTEGER | GitHub PR number (if applicable) |
| `complexity_score` | INTEGER | AI-generated complexity score |
| `is_placeholder_author` | BOOLEAN | Whether the author is a placeholder |
| `parents` | TEXT | JSON array of parent commit SHAs |
| `is_enriched` | BOOLEAN | Whether additional data has been fetched |
| `created_at` | TIMESTAMP | When this record was created |
| `updated_at` | TIMESTAMP | When this record was last updated |

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

#### `pipeline_status`

Schema for storing the current status of each pipeline type:

| Column | Type | Description |
|--------|------|-------------|
| `pipeline_type` | TEXT | Primary key - Type of pipeline |
| `status` | TEXT | Current status text (running, idle, failed, etc.) |
| `is_running` | INTEGER | Whether the pipeline is currently running (0=stopped, 1=running) |
| `last_run` | TIMESTAMP | When the pipeline was last run |
| `updated_at` | TIMESTAMP | When this record was last updated |

## Common Access Patterns

### Pipeline Status and Control

1. **Pipeline Status Check**
   - Get current pipeline status using the pipeline server API
   - Count relevant items based on pipeline type (e.g., unprocessed repositories)

2. **Pipeline Control Operations**
   - Start pipeline: POST request to pipeline server API
   - Stop pipeline: POST request to pipeline server API with stop command

3. **Entity Counts**
   - Count repositories, contributors, merge requests, and commits for dashboard metrics

### Data Processing Flow

1. **GitHub Sync Pipeline**
   - Fetches public events from GitHub API to find recently merged pull requests
   - Stores raw data in the `closed_merge_requests_raw` table with `is_processed = 0`
   - Checks for duplicates by examining the pull request ID in the JSON data
   - Updates existing records if the same pull request is fetched again

2. **Data Processing Pipeline**
   - Reads from `closed_merge_requests_raw` where `is_processed = 0` 
   - Extracts entities (repositories, contributors, merge requests, commits) from the raw JSON data
   - Writes extracted entities to their respective tables
   - Updates the `is_processed` flag to `1` after successful processing

3. **Data Enrichment Pipeline**
   - Reads entities where `is_enriched = false` from core tables
   - Fetches additional data from GitHub API
   - Updates records with enriched information

4. **AI Analysis Pipeline**
   - Reads `commits` where `complexity_score IS NULL`
   - Generates scores with AI models
   - Updates records with complexity metrics

## Connection Management

Database connections are managed through the `withDb` utility function in `lib/database/connection.ts` which:

1. Opens a connection to SQLite database
2. Performs the requested operation
3. Closes the connection when complete

This ensures proper resource management and prevents connection leaks.

```typescript
export async function withDb<T>(operation: (db: any) => Promise<T>): Promise<T> {
  const db = await getSQLiteDb();
  try {
    return await operation(db);
  } finally {
    await db.close();
  }
}
```
