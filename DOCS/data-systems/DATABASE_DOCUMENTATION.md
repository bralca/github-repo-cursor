# GitHub Explorer Database Documentation

## Overview

This document provides comprehensive documentation of the GitHub Explorer database schema. The application now uses SQLite as the primary database for data storage.

## Database Configuration

The SQLite database is configured in the `.env` file:

```
DB_PATH=/path/to/your/github_explorer.db
```

If not specified, the database will be located at the workspace root as `github_explorer.db`. A standardized utility module (`github-explorer/server/src/utils/db-path.js`) is used throughout the application to ensure consistent database path resolution.

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
| `entity_type` | TEXT | Entity type identifier (e.g., "merge_request") |
| `github_id` | TEXT | GitHub's identifier for the entity |
| `data` | TEXT | JSON blob of the raw API response |
| `fetched_at` | TEXT | When the data was fetched from GitHub |
| `api_endpoint` | TEXT | The API endpoint used to fetch the data |
| `etag` | TEXT | GitHub API ETag for caching |
| `created_at` | TEXT | When the record was created |

**Indexes**:
- `idx_closed_merge_requests_raw_entity_github_id` on `(entity_type, github_id)`
- `idx_closed_merge_requests_raw_fetched_at` on `(fetched_at)`
- `idx_cmr_raw_entity_type` on `(entity_type)`

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

**Indexes**:
- `idx_repositories_github_id` on `(github_id)`
- `idx_repositories_full_name` on `(full_name)`
- `idx_repositories_owner_github_id` on `(owner_github_id)`
- `idx_repositories_owner_id` on `(owner_id)`

**Constraints**:
- `UNIQUE(github_id)`
- `UNIQUE(full_name)`
- `FOREIGN KEY (owner_id) REFERENCES contributors(id) ON DELETE SET NULL`

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

**Indexes**:
- `idx_contributors_github_id` on `(github_id)`
- `idx_contributors_username` on `(username)`

**Constraints**:
- `UNIQUE(github_id)`

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

**Indexes**:
- `idx_merge_requests_github_id` on `(github_id)`
- `idx_merge_requests_repository_id` on `(repository_id)`
- `idx_merge_requests_repository_github_id` on `(repository_github_id)`
- `idx_merge_requests_author_id` on `(author_id)`
- `idx_merge_requests_author_github_id` on `(author_github_id)`
- `idx_merge_requests_merged_by_github_id` on `(merged_by_github_id)`
- `idx_merge_requests_state` on `(state)`
- `idx_merge_requests_repo_pr` on `(repository_github_id, github_id)` (UNIQUE)

**Constraints**:
- `UNIQUE(repository_id, github_id)`
- `FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE`
- `FOREIGN KEY (author_id) REFERENCES contributors(id) ON DELETE CASCADE`
- `FOREIGN KEY (merged_by_id) REFERENCES contributors(id) ON DELETE SET NULL`

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

**Indexes**:
- `idx_commits_github_id` on `(github_id)`
- `idx_commits_sha` on `(sha)`
- `idx_commits_repository_id` on `(repository_id)`
- `idx_commits_repository_github_id` on `(repository_github_id)`
- `idx_commits_contributor_id` on `(contributor_id)`
- `idx_commits_contributor_github_id` on `(contributor_github_id)`
- `idx_commits_pull_request_id` on `(pull_request_id)`
- `idx_commits_pull_request_github_id` on `(pull_request_github_id)`
- `idx_commits_committed_at` on `(committed_at)`
- `idx_commits_repo_sha` on `(repository_github_id, github_id)` (UNIQUE)

**Constraints**:
- `UNIQUE(repository_id, github_id)`
- `FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE`
- `FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE SET NULL`
- `FOREIGN KEY (pull_request_id) REFERENCES merge_requests(id) ON DELETE SET NULL`

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

**Indexes**:
- `idx_contrib_repo_contributor_id` on `(contributor_id)`
- `idx_contrib_repo_contributor_github_id` on `(contributor_github_id)`
- `idx_contrib_repo_repository_id` on `(repository_id)`
- `idx_contrib_repo_repository_github_id` on `(repository_github_id)`
- `idx_contrib_repo_unique` on `(contributor_id, repository_id)` (UNIQUE)

**Constraints**:
- `UNIQUE(contributor_id, repository_id)`
- `FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE CASCADE`
- `FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE`

### Pipeline Management Tables

For pipeline management, the application uses a separate set of tables that will be created during the application server initialization:

#### `pipeline_schedules` (To Be Created)

Schema for scheduled pipeline operations:

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (UUID) |
| `pipeline_type` | TEXT | Type of pipeline (github_sync, data_processing, etc.) |
| `cron_expression` | TEXT | Cron schedule expression |
| `is_active` | BOOLEAN | Whether this schedule is currently active |
| `parameters` | TEXT | JSON blob with pipeline parameters |
| `created_at` | TIMESTAMP | When this record was created |
| `updated_at` | TIMESTAMP | When this record was last updated |

#### `pipeline_history` (To Be Created)

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

## Access Patterns and Database Operations

### Entity Retrieval

For large tables like commits and merge requests, use indexed queries:

```sql
-- Get commits for a specific repository using indexed fields
SELECT * FROM commits 
WHERE repository_github_id = ? 
ORDER BY committed_at DESC
LIMIT 50;

-- Get merge requests by contributor
SELECT * FROM merge_requests
WHERE author_github_id = ?
ORDER BY created_at DESC;
```

### Pipeline Status Queries

For pipeline management, queries retrieve information about pending work:

```sql
-- Count unprocessed raw data
SELECT COUNT(*) FROM closed_merge_requests_raw
WHERE fetched_at IS NOT NULL;

-- Count entities needing enrichment
SELECT COUNT(*) FROM repositories
WHERE is_enriched = 0;

-- Count commits needing AI analysis
SELECT COUNT(*) FROM commits
WHERE complexity_score IS NULL;
```

### Connection Management

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

## API Integration

The database schema is accessed through a set of API endpoints in `/app/api/sqlite/[...endpoint]/route.ts` with specialized handlers for different operations. The client uses these endpoints through the SQLite client interface in `lib/database/sqlite.ts`. 