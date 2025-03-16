# SQLite Database Documentation

## Overview

This document outlines the SQLite database implementation for GitHub Explorer. The database follows the standardization plan outlined in `DATABASE_STANDARDIZATION_PLAN.md` and provides a complete schema for storing GitHub data locally.

## Database Configuration

The SQLite database is configured in the `.env` file:

```
DB_TYPE=sqlite
DB_PATH=/path/to/your/github_explorer.db
```

## Schema Structure

The database schema includes the following tables:

### github_raw_data

Stores raw JSON data from the GitHub API.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key |
| entity_type | TEXT | Type of entity (repository, user, commit, etc.) |
| github_id | TEXT | GitHub identifier |
| data | TEXT | JSON data stored as text |
| fetched_at | TIMESTAMP | When the data was fetched |
| api_endpoint | TEXT | API endpoint used |
| etag | TEXT | ETag for caching |
| created_at | TIMESTAMP | When the record was created |

### contributors

Stores information about GitHub users.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| github_id | TEXT | GitHub user ID |
| username | TEXT | GitHub username |
| name | TEXT | Display name |
| avatar_url | TEXT | URL to avatar image |
| bio | TEXT | User bio |
| company | TEXT | Company affiliation |
| location | TEXT | User location |
| email | TEXT | Email address |
| blog | TEXT | Blog URL |
| hireable | BOOLEAN | Availability for hire |
| twitter_username | TEXT | Twitter username |
| followers_count | INTEGER | Follower count |
| following_count | INTEGER | Following count |
| public_repos_count | INTEGER | Number of public repositories |
| public_gists_count | INTEGER | Number of public gists |
| created_at | TIMESTAMP | When the record was created |
| updated_at | TIMESTAMP | When the record was last updated |

### repositories

Stores information about GitHub repositories.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| github_id | TEXT | GitHub repository ID |
| name | TEXT | Repository name |
| full_name | TEXT | Full repository name (owner/name) |
| description | TEXT | Repository description |
| owner_id | TEXT | Foreign key to contributors |
| is_private | BOOLEAN | Whether repo is private |
| is_fork | BOOLEAN | Whether repo is a fork |
| url | TEXT | Repository URL |
| html_url | TEXT | HTML URL for repository |
| git_url | TEXT | Git URL |
| ssh_url | TEXT | SSH URL |
| clone_url | TEXT | Clone URL |
| default_branch | TEXT | Default branch |
| homepage | TEXT | Homepage URL |
| size | INTEGER | Repository size |
| stargazers_count | INTEGER | Star count |
| watchers_count | INTEGER | Watcher count |
| forks_count | INTEGER | Fork count |
| open_issues_count | INTEGER | Open issues count |
| language | TEXT | Primary language |
| has_issues | BOOLEAN | Has issues enabled |
| has_wiki | BOOLEAN | Has wiki enabled |
| has_pages | BOOLEAN | Has pages enabled |
| has_downloads | BOOLEAN | Has downloads enabled |
| archived | BOOLEAN | Whether repo is archived |
| disabled | BOOLEAN | Whether repo is disabled |
| topics | TEXT | Topics (JSON array as text) |
| license | TEXT | License info (JSON object as text) |
| created_at | TIMESTAMP | When the record was created |
| updated_at | TIMESTAMP | When the record was last updated |
| pushed_at | TIMESTAMP | Last push date |

### contributor_repository

Links contributors to repositories with contribution information.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| contributor_id | TEXT | Foreign key to contributors |
| repository_id | TEXT | Foreign key to repositories |
| contribution_type | TEXT | Type of contribution (owner, collaborator, contributor) |
| contributions_count | INTEGER | Number of contributions |
| created_at | TIMESTAMP | When the record was created |
| updated_at | TIMESTAMP | When the record was last updated |

### merge_requests

Stores pull request (PR) information.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| github_id | TEXT | GitHub PR ID |
| repository_id | TEXT | Foreign key to repositories |
| number | INTEGER | PR number |
| state | TEXT | State (open, closed, merged) |
| title | TEXT | PR title |
| body | TEXT | PR description |
| user_id | TEXT | Foreign key to contributors (author) |
| assignee_id | TEXT | Foreign key to contributors (assignee) |
| milestone | TEXT | Milestone info (JSON object as text) |
| locked | BOOLEAN | Whether PR is locked |
| draft | BOOLEAN | Whether PR is draft |
| merged | BOOLEAN | Whether PR is merged |
| mergeable | BOOLEAN | Whether PR is mergeable |
| rebaseable | BOOLEAN | Whether PR is rebaseable |
| mergeable_state | TEXT | Mergeable state |
| merged_by | TEXT | User who merged the PR |
| comments_count | INTEGER | Number of comments |
| review_comments_count | INTEGER | Number of review comments |
| commits_count | INTEGER | Number of commits |
| additions_count | INTEGER | Lines added |
| deletions_count | INTEGER | Lines deleted |
| changed_files_count | INTEGER | Files changed |
| labels | TEXT | Labels (JSON array as text) |
| created_at | TIMESTAMP | When the record was created |
| updated_at | TIMESTAMP | When the record was last updated |
| closed_at | TIMESTAMP | When the PR was closed |
| merged_at | TIMESTAMP | When the PR was merged |

### commits

Stores commit information.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (UUID) |
| sha | TEXT | Commit SHA |
| repository_id | TEXT | Foreign key to repositories |
| author_id | TEXT | Foreign key to contributors (author) |
| committer_id | TEXT | Foreign key to contributors (committer) |
| message | TEXT | Commit message |
| author_date | TIMESTAMP | Author date |
| committer_date | TIMESTAMP | Committer date |
| url | TEXT | Commit URL |
| commit_data | TEXT | Detailed commit data (JSON object as text) |
| stats | TEXT | Stats (JSON object as text) |
| files | TEXT | Changed files (JSON array as text) |
| created_at | TIMESTAMP | When the record was created |
| updated_at | TIMESTAMP | When the record was last updated |

## Database Utility Functions

The database is accessed through utility functions in `lib/database.js`. These functions support both SQLite and Supabase backends, with the backend determined by the `DB_TYPE` environment variable.

### Basic Functions

- `getDb()`: Get a database connection
- `getSQLiteDb()`: Get a SQLite-specific connection
- `getSupabaseClient()`: Get a Supabase client for authentication
- `closeDb()`: Close the database connection

### GitHub Raw Data Functions

- `fetchGithubRawData(entityType, githubId)`: Fetch a specific raw data record
- `queryGithubRawData(entityType, options)`: Query raw data records by entity type
- `storeGithubRawData(record)`: Store or update a raw data record

## Setting Up the Database

The database can be set up using the provided scripts:

1. Install dependencies:
   ```
   npm install
   ```

2. Configure your environment variables in `.env`:
   ```
   DB_TYPE=sqlite
   DB_PATH=/path/to/your/github_explorer.db
   ```

3. Run the setup script:
   ```
   npm run setup-db
   ```

This will create the database with the full schema and sample data.

## Testing the Database

You can test the database using the provided test script:

```
npm run test-db
```

This script verifies that all tables are created correctly and tests basic query operations.

## Usage in Next.js Application

To use the database in the Next.js application:

1. Import the required functions from the database utility:

```javascript
import { getDb, fetchGithubRawData, queryGithubRawData } from '@/lib/database';
```

2. Use the functions in your server components or API routes:

```javascript
// Example: Server component fetching repository data
export async function RepoDetails({ repoId }) {
  const db = await getDb();
  const repository = await db.get('SELECT * FROM repositories WHERE id = ?', repoId);
  
  // For SQLite connections, remember to close the connection when done
  if (db.close) {
    await db.close();
  }
  
  return (
    <div>
      <h1>{repository.name}</h1>
      <p>{repository.description}</p>
      {/* ... */}
    </div>
  );
}
```

## Performance Considerations

- SQLite provides improved performance for read operations compared to remote database access
- When using SQLite, all database operations happen locally, reducing network latency
- For write-heavy operations, consider batching updates to improve performance

## Security Considerations

- The SQLite database file should be properly secured with appropriate file permissions
- The database file should not be committed to version control
- In production, consider encrypting the database file for added security 