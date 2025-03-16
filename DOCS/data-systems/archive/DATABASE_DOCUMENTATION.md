# GitHub Explorer Database Documentation

## Overview

This document serves as the **single source of truth** for the GitHub Explorer database schema and access patterns. It combines information from the database standardization plan and implementation details, reflecting the current state where SQLite is the primary database instead of Supabase.

## Database Configuration

The SQLite database is configured in the `.env` file:

```
DB_TYPE=sqlite
DB_PATH=/path/to/your/github_explorer.db
```

## Database Schema

The database follows a standardized schema with consistent approaches to identifiers:

1. **Primary Keys**: All tables use auto-generated UUIDs as the `id` field (primary key)
2. **GitHub Identifiers**: All entities have a `github_id` field that stores the original GitHub identifier
3. **Foreign Keys**: All relationships use UUIDs consistently
4. **Ghost Foreign Keys**: All entities include GitHub ID reference fields for simplified querying
5. **Nullable Usernames**: Username fields are nullable to properly handle unknown contributors

### Common Fields Across All Entities

These fields are present in all entity tables:

| Field | Type | Description | Required | Notes |
|-------|------|-------------|----------|-------|
| id | TEXT | UUID primary key | Yes | Auto-generated, never manually set |
| github_id | varies | GitHub's unique ID for this entity | Yes | Must be unique within entity type |
| created_at | TIMESTAMP | Record creation time | Yes | Default to current timestamp |
| updated_at | TIMESTAMP | Last update time | Yes | Default to current timestamp, update on changes |
| is_enriched | BOOLEAN | Whether entity has been enriched with additional data | Yes | Default to false |

## Core Tables

### 1. Contributors Table

The Contributors table stores information about GitHub users who have contributed to repositories.

| Field | Type | Description | Source in API | Validation Rules |
|-------|------|-------------|--------------|------------------|
| id | TEXT | UUID primary key | Auto-generated | Must be unique |
| github_id | BIGINT | GitHub's numeric user ID | contributor.id | Must be unique, not null |
| username | TEXT | GitHub username | contributor.login | Can be null for unknown users |
| name | TEXT | Display name | contributor.name | Can be null |
| avatar | TEXT | URL to avatar image | contributor.avatar_url | Should be a valid URL |
| is_enriched | BOOLEAN | Has profile been enriched with additional data | false initially | true/false |
| bio | TEXT | User bio | contributor.bio | Can be null |
| company | TEXT | Company affiliation | contributor.company | Can be null |
| blog | TEXT | Blog URL | contributor.blog | Should be a valid URL if present |
| twitter_username | TEXT | Twitter username | contributor.twitter_username | Can be null |
| location | TEXT | User location | contributor.location | Can be null |
| followers | INTEGER | Follower count | contributor.followers | Should be ≥ 0 |
| repositories | INTEGER | Number of public repositories | contributor.public_repos | Should be ≥ 0 |
| impact_score | INTEGER | Calculated impact score | Derived metric | Should be ≥ 0 |
| role_classification | TEXT | Classified contributor role | Derived classification | Can be null |
| top_languages | TEXT | Array of most used languages (JSON) | From user's repos | Can be null |
| organizations | TEXT | Array of organization memberships (JSON) | From user's orgs | Can be null |
| first_contribution | TIMESTAMP | Date of first contribution | Derived from activity | Can be null |
| last_contribution | TIMESTAMP | Date of most recent contribution | Derived from activity | Can be null |
| direct_commits | INTEGER | Number of direct commits | Count from commits table | Should be ≥ 0 |
| pull_requests_merged | INTEGER | Number of merged PRs | Count from PRs | Should be ≥ 0 |
| pull_requests_rejected | INTEGER | Number of rejected PRs | Count from PRs | Should be ≥ 0 |
| code_reviews | INTEGER | Number of code reviews | Count from reviews | Should be ≥ 0 |
| is_placeholder | BOOLEAN | Whether this is a placeholder | false (normally) | true for unknown contributors |
| created_at | TIMESTAMP | Creation timestamp | Now() | Not null |
| updated_at | TIMESTAMP | Last update timestamp | Now() | Not null |

**Querying By**:
- Primary lookups: `github_id` (most reliable)
- Secondary lookups: `username` (less reliable as usernames can change)

**Indexing**:
- Primary index on `id`
- Unique index on `github_id`
- Regular index on `username`

### 2. Repositories Table

The Repositories table stores information about GitHub repositories being tracked in the system.

| Field | Type | Description | Source in API | Validation Rules |
|-------|------|-------------|--------------|------------------|
| id | TEXT | UUID primary key | Auto-generated | Must be unique |
| github_id | BIGINT | GitHub repository ID | repository.id | Must be unique, not null |
| name | TEXT | Repository name | repository.name | Not null |
| full_name | TEXT | Full repository name (owner/repo) | repository.full_name | Not null, format: "owner/repo" |
| description | TEXT | Repository description | repository.description | Can be null |
| url | TEXT | Repository URL | repository.html_url | Not null, valid URL |
| api_url | TEXT | GitHub API URL for repo | repository.url | Not null, valid URL |
| stars | INTEGER | Star count | repository.stargazers_count | Default 0, not null |
| forks | INTEGER | Fork count | repository.forks_count | Default 0, not null |
| is_enriched | BOOLEAN | Has repo been enriched | false initially | true/false |
| health_percentage | INTEGER | Repository health score (0-100) | Calculated metric | 0-100 range if present |
| open_issues_count | INTEGER | Count of open issues | repository.open_issues_count | Default 0, not null |
| last_updated | TIMESTAMP | Last update timestamp | repository.updated_at | Can be null |
| size_kb | INTEGER | Repository size in KB | repository.size | Can be null |
| watchers_count | INTEGER | Number of watchers | repository.watchers_count | Default 0, not null |
| primary_language | TEXT | Primary programming language | repository.language | Can be null |
| license | TEXT | License information | repository.license?.name | Can be null |
| is_fork | BOOLEAN | Whether repo is a fork | repository.fork | Default false, not null |
| is_archived | BOOLEAN | Whether repo is archived | repository.archived | Default false, not null |
| default_branch | TEXT | Default branch name | repository.default_branch | Default "main", not null |
| source | TEXT | Data source identifier | "github_api" | Not null |
| owner_id | TEXT | UUID reference to contributor | From contributor lookup | Can be null |
| owner_github_id | BIGINT | GitHub ID of repository owner | repository.owner.id | For querying, not a foreign key |
| created_at | TIMESTAMP | Creation timestamp | Now() | Not null |
| updated_at | TIMESTAMP | Last update timestamp | Now() | Not null |

**Querying By**:
- Primary lookups: `github_id` (unique repository ID)
- Secondary lookups: `full_name` (owner/repo format)
- Owner lookups: `owner_github_id` (for all repos by owner)

**Indexing**:
- Primary index on `id`
- Unique index on `github_id`
- Index on `full_name`
- Index on `owner_github_id`

### 3. Merge Requests Table

The Merge Requests table stores information about pull requests (PRs) submitted to repositories.

| Field | Type | Description | Source in API | Validation Rules |
|-------|------|-------------|--------------|------------------|
| id | TEXT | UUID primary key | Auto-generated | Must be unique |
| github_id | INTEGER | GitHub PR number | pull_request.number | Part of composite unique constraint |
| repository_id | TEXT | UUID reference to repositories | From repository lookup | Not null, foreign key |
| repository_github_id | BIGINT | GitHub repository ID | repository.id | For querying, not a foreign key |
| author_id | TEXT | UUID reference to contributors | From contributor lookup | Not null, foreign key |
| author_github_id | BIGINT | GitHub user ID | pull_request.user.id | For querying, not a foreign key |
| title | TEXT | PR title | pull_request.title | Not null |
| description | TEXT | PR description | pull_request.body | Can be null |
| state | TEXT | Current state | pull_request.state or "merged" | Values: "open", "closed", "merged" |
| is_draft | BOOLEAN | Whether PR is a draft | pull_request.draft | Default false, not null |
| created_at | TIMESTAMP | Creation timestamp | pull_request.created_at | Not null |
| updated_at | TIMESTAMP | Last update timestamp | pull_request.updated_at | Not null |
| closed_at | TIMESTAMP | Closure timestamp | pull_request.closed_at | Can be null |
| merged_at | TIMESTAMP | Merge timestamp | pull_request.merged_at | Can be null |
| merged_by_id | TEXT | UUID reference to contributors | From contributor lookup | Can be null, foreign key |
| merged_by_github_id | BIGINT | GitHub user ID of merger | pull_request.merged_by?.id | For querying, not a foreign key |
| commits_count | INTEGER | Number of commits in PR | pull_request.commits.length | Default 0, not null |
| additions | INTEGER | Lines added | Calculate from commits | Default 0, not null |
| deletions | INTEGER | Lines removed | Calculate from commits | Default 0, not null |
| changed_files | INTEGER | Files modified | Calculate from commits | Default 0, not null |
| complexity_score | INTEGER | Calculated complexity | Derived metric | Can be null |
| review_time_hours | INTEGER | Time in review | Calculate from timestamps | Can be null |
| cycle_time_hours | INTEGER | Total PR lifecycle time | Calculate from timestamps | Can be null |
| labels | TEXT | Array of PR labels (JSON) | pull_request.labels | Can be null |
| source_branch | TEXT | Source branch name | pull_request.head.ref | Can be null |
| target_branch | TEXT | Target branch name | pull_request.base.ref | Can be null |
| is_enriched | BOOLEAN | Has PR been enriched | false initially | true/false |
| review_count | INTEGER | Number of reviews | Count from reviews | Default 0, not null |
| comment_count | INTEGER | Number of comments | Count from comments | Default 0, not null |

**Querying By**:
- Repository + PR number: `repository_github_id` + `github_id` (GitHub's natural key)
- Author lookups: `author_github_id` (for all PRs by author)
- State filtering: `state` + `repository_github_id` (e.g., all open PRs in a repo)

**Indexing**:
- Primary index on `id`
- Unique composite index on (`repository_id`, `github_id`) 
- Index on `repository_github_id`
- Index on `author_github_id`
- Index on `state`

### 4. Commits Table

The Commits table stores information about commits made to repositories.

| Field | Type | Description | Source in API | Validation Rules |
|-------|------|-------------|--------------|------------------|
| id | TEXT | UUID primary key | Auto-generated | Must be unique |
| github_id | TEXT | Commit SHA hash | commit.sha | Must be unique within a repository |
| sha | TEXT | Commit SHA hash (for compatibility) | commit.sha | Same as github_id |
| repository_id | TEXT | UUID reference to repositories | From repository lookup | Not null, foreign key |
| repository_github_id | BIGINT | GitHub repository ID | repository.id | For querying, not a foreign key |
| contributor_id | TEXT | UUID reference to contributors | From contributor lookup | Can be null, foreign key |
| contributor_github_id | BIGINT | GitHub user ID | commit.author?.id | For querying, not a foreign key |
| author | TEXT | Author name (deprecated) | commit.author?.login | For backward compatibility |
| message | TEXT | Commit message | commit.message | Not null |
| additions | INTEGER | Lines added | Calculate from patches | Default 0, not null |
| deletions | INTEGER | Lines removed | Calculate from patches | Default 0, not null |
| files_changed | INTEGER | Files modified | commit.content?.length | Default 0, not null |
| is_merge_commit | BOOLEAN | Whether it's a merge commit | Check message | Default false, not null |
| committed_at | TIMESTAMP | Timestamp of the commit | commit.timestamp | Not null |
| pull_request_id | TEXT | UUID reference to merge_requests | From PR lookup | Can be null, foreign key |
| pull_request_github_id | INTEGER | GitHub PR number | From PR | For querying, not a foreign key |
| complexity_score | INTEGER | Calculated complexity | Derived metric | Can be null |
| is_placeholder_author | BOOLEAN | Whether author is unknown | !commit.author | Default false, not null |
| parents | TEXT | Array of parent commit SHAs (JSON) | commit.parents | Can be null |
| is_enriched | BOOLEAN | Has commit been enriched | false initially | true/false |
| created_at | TIMESTAMP | Creation timestamp | Now() | Not null |
| updated_at | TIMESTAMP | Last update timestamp | Now() | Not null |

**Querying By**:
- Repository + SHA: `repository_github_id` + `github_id` (for specific commit)
- Contributor in repo: `repository_github_id` + `contributor_github_id` (all commits by user in repo)
- PR commits: `repository_github_id` + `pull_request_github_id` (all commits in a PR)

**Indexing**:
- Primary index on `id`
- Unique composite index on (`repository_id`, `github_id`) 
- Index on `repository_github_id`
- Index on `contributor_github_id`
- Composite index on (`repository_github_id`, `contributor_github_id`)
- Index on `committed_at` (for time-based queries)

### 5. Contributor_Repository Table

The Contributor_Repository table manages the many-to-many relationship between contributors and repositories.

| Field | Type | Description | Source | Validation Rules |
|-------|------|-------------|--------|------------------|
| id | TEXT | UUID primary key | Auto-generated | Must be unique |
| contributor_id | TEXT | UUID reference to contributors | From contributor lookup | Not null, foreign key |
| contributor_github_id | BIGINT | GitHub user ID | contributor.github_id | For querying, not a foreign key |
| repository_id | TEXT | UUID reference to repositories | From repository lookup | Not null, foreign key |
| repository_github_id | BIGINT | GitHub repository ID | repository.github_id | For querying, not a foreign key |
| commit_count | INTEGER | Number of commits made | Count from commits | Default 0, not null |
| pull_requests | INTEGER | Number of PRs submitted | Count from PRs | Default 0, not null |
| reviews | INTEGER | Number of reviews performed | Count from reviews | Default 0, not null |
| issues_opened | INTEGER | Number of issues opened | Count from issues | Default 0, not null |
| first_contribution_date | TIMESTAMP | Date of first contribution | Min date from activities | Can be null |
| last_contribution_date | TIMESTAMP | Date of most recent contribution | Max date from activities | Can be null |
| lines_added | INTEGER | Total lines of code added | Sum from commits | Default 0 |
| lines_removed | INTEGER | Total lines of code removed | Sum from commits | Default 0 |
| created_at | TIMESTAMP | Creation timestamp | Now() | Not null |
| updated_at | TIMESTAMP | Last update timestamp | Now() | Not null |

**Querying By**:
- Contributor in repo: `contributor_github_id` + `repository_github_id` (relationship existence)
- Repository contributions: `repository_github_id` (all contributors to a repo)
- Contributor activity: `contributor_github_id` (all repos a contributor works on)

**Indexing**:
- Primary index on `id`
- Unique composite index on (`contributor_id`, `repository_id`)
- Composite index on (`contributor_github_id`, `repository_github_id`)
- Index on `repository_github_id`
- Index on `contributor_github_id`

### 6. Closed_Merge_Requests_Raw Table

Stores raw JSON data from GitHub API specifically for closed merge requests. This replaces the previous `github_raw_data` table.

| Column | Type | Description | Source | Validation Rules |
|--------|------|-------------|--------|------------------|
| id | INTEGER | Primary key (auto-incrementing) | Auto-generated | Must be unique |
| entity_type | TEXT | Type of entity (repository, contributor, etc.) | Code | Not null |
| github_id | TEXT | GitHub entity ID | From API entity | Not null |
| data | TEXT | Raw JSON data from GitHub API | API response | Not null |
| fetched_at | TEXT | When data was fetched | Now() | Not null |
| api_endpoint | TEXT | API endpoint used to fetch data | Request URL | Can be null |
| etag | TEXT | GitHub API ETag for caching | Response header | Can be null |
| created_at | TEXT | Creation timestamp | Now() | Not null |

**Querying By**:
- Entity + ID: `entity_type` + `github_id` (to retrieve specific entity data)
- Entity type: `entity_type` (to retrieve all entities of a type)

**Indexing**:
- Primary index on `id`
- Composite index on (`entity_type`, `github_id`)
- Index on `fetched_at`

## Database Access Patterns

### Common Query Patterns by Entity

#### Contributors

```javascript
// Get a contributor by GitHub ID (most reliable)
const getContributorByGitHubId = async (githubId) => {
  const db = await getDb();
  
  if (db.get) { // SQLite
    return await db.get(
      'SELECT * FROM contributors WHERE github_id = ?', 
      githubId
    );
  } else { // Supabase
    const { data, error } = await db
      .from('contributors')
      .select('*')
      .eq('github_id', githubId)
      .maybeSingle();
      
    return error ? null : data;
  }
};

// Get a contributor by username (less reliable as usernames can change)
const getContributorByUsername = async (username) => {
  const db = await getDb();
  
  if (db.get) { // SQLite
    return await db.get(
      'SELECT * FROM contributors WHERE username = ?', 
      username
    );
  } else { // Supabase
    const { data, error } = await db
      .from('contributors')
      .select('*')
      .eq('username', username)
      .maybeSingle();
      
    return error ? null : data;
  }
};

// Get all repositories contributed to by a contributor
const getReposByContributorGitHubId = async (contributorGitHubId) => {
  const db = await getDb();
  
  if (db.all) { // SQLite
    return await db.all(`
      SELECT r.* 
      FROM repositories r
      JOIN contributor_repository cr ON r.id = cr.repository_id
      WHERE cr.contributor_github_id = ?
    `, contributorGitHubId);
  } else { // Supabase
    const { data, error } = await db
      .from('contributor_repository')
      .select(`
        repositories:repository_id(*)
      `)
      .eq('contributor_github_id', contributorGitHubId);
      
    return error ? [] : data.map(item => item.repositories);
  }
};
```

#### Repositories

```javascript
// Get a repository by GitHub ID
const getRepositoryByGitHubId = async (githubId) => {
  const db = await getDb();
  
  if (db.get) { // SQLite
    return await db.get(
      'SELECT * FROM repositories WHERE github_id = ?', 
      githubId
    );
  } else { // Supabase
    const { data, error } = await db
      .from('repositories')
      .select('*')
      .eq('github_id', githubId)
      .maybeSingle();
      
    return error ? null : data;
  }
};

// Get a repository by full name (owner/repo)
const getRepositoryByFullName = async (fullName) => {
  const db = await getDb();
  
  if (db.get) { // SQLite
    return await db.get(
      'SELECT * FROM repositories WHERE full_name = ?', 
      fullName
    );
  } else { // Supabase
    const { data, error } = await db
      .from('repositories')
      .select('*')
      .eq('full_name', fullName)
      .maybeSingle();
      
    return error ? null : data;
  }
};

// Get all repositories owned by a specific contributor
const getReposByOwnerGitHubId = async (ownerGitHubId) => {
  const db = await getDb();
  
  if (db.all) { // SQLite
    return await db.all(
      'SELECT * FROM repositories WHERE owner_github_id = ?', 
      ownerGitHubId
    );
  } else { // Supabase
    const { data, error } = await db
      .from('repositories')
      .select('*')
      .eq('owner_github_id', ownerGitHubId);
      
    return error ? [] : data;
  }
};
```

#### Merge Requests

```javascript
// Get a specific PR by repo GitHub ID and PR number
const getPullRequestByNumber = async (repoGitHubId, prNumber) => {
  const db = await getDb();
  
  if (db.get) { // SQLite
    return await db.get(`
      SELECT * FROM merge_requests 
      WHERE repository_github_id = ? AND github_id = ?
    `, [repoGitHubId, prNumber]);
  } else { // Supabase
    const { data, error } = await db
      .from('merge_requests')
      .select('*')
      .eq('repository_github_id', repoGitHubId)
      .eq('github_id', prNumber)
      .maybeSingle();
      
    return error ? null : data;
  }
};

// Get all PRs in a repository
const getPullRequestsByRepo = async (repoGitHubId) => {
  const db = await getDb();
  
  if (db.all) { // SQLite
    return await db.all(
      'SELECT * FROM merge_requests WHERE repository_github_id = ?', 
      repoGitHubId
    );
  } else { // Supabase
    const { data, error } = await db
      .from('merge_requests')
      .select('*')
      .eq('repository_github_id', repoGitHubId);
      
    return error ? [] : data;
  }
};

// Get all PRs authored by a contributor
const getPullRequestsByAuthor = async (authorGitHubId) => {
  const db = await getDb();
  
  if (db.all) { // SQLite
    return await db.all(
      'SELECT * FROM merge_requests WHERE author_github_id = ?', 
      authorGitHubId
    );
  } else { // Supabase
    const { data, error } = await db
      .from('merge_requests')
      .select('*')
      .eq('author_github_id', authorGitHubId);
      
    return error ? [] : data;
  }
};
```

#### Commits

```javascript
// Get a specific commit by repo GitHub ID and commit SHA
const getCommitBySHA = async (repoGitHubId, sha) => {
  const db = await getDb();
  
  if (db.get) { // SQLite
    return await db.get(`
      SELECT * FROM commits 
      WHERE repository_github_id = ? AND github_id = ?
    `, [repoGitHubId, sha]);
  } else { // Supabase
    const { data, error } = await db
      .from('commits')
      .select('*')
      .eq('repository_github_id', repoGitHubId)
      .eq('github_id', sha)
      .maybeSingle();
      
    return error ? null : data;
  }
};

// Get all commits by a contributor in a repository
const getCommitsByContributorInRepo = async (repoGitHubId, contributorGitHubId) => {
  const db = await getDb();
  
  if (db.all) { // SQLite
    return await db.all(`
      SELECT * FROM commits 
      WHERE repository_github_id = ? AND contributor_github_id = ?
    `, [repoGitHubId, contributorGitHubId]);
  } else { // Supabase
    const { data, error } = await db
      .from('commits')
      .select('*')
      .eq('repository_github_id', repoGitHubId)
      .eq('contributor_github_id', contributorGitHubId);
      
    return error ? [] : data;
  }
};

// Get all commits in a pull request
const getCommitsByPullRequest = async (repoGitHubId, prNumber) => {
  const db = await getDb();
  
  if (db.all) { // SQLite
    return await db.all(`
      SELECT * FROM commits 
      WHERE repository_github_id = ? AND pull_request_github_id = ?
    `, [repoGitHubId, prNumber]);
  } else { // Supabase
    const { data, error } = await db
      .from('commits')
      .select('*')
      .eq('repository_github_id', repoGitHubId)
      .eq('pull_request_github_id', prNumber);
      
    return error ? [] : data;
  }
};
```

#### Raw Data

```javascript
// Get closed merge request raw data
const getClosedMergeRequestRawData = async (entityType, githubId) => {
  const db = await getDb();
  
  if (db.get) { // SQLite
    const result = await db.get(`
      SELECT * FROM closed_merge_requests_raw 
      WHERE entity_type = ? AND github_id = ?
    `, [entityType, githubId]);
    
    if (result) {
      // Parse JSON data
      result.data = JSON.parse(result.data);
    }
    
    return result;
  } else { // Supabase - still using github_raw_data
    const { data, error } = await db
      .from('github_raw_data')
      .select('*')
      .eq('entity_type', entityType)
      .eq('github_id', githubId)
      .maybeSingle();
      
    return error ? null : data;
  }
};

// Store closed merge request raw data
const storeClosedMergeRequestRawData = async (record) => {
  const db = await getDb();
  
  if (db.run) { // SQLite
    // Ensure data is a string
    const jsonData = typeof record.data === 'object' 
      ? JSON.stringify(record.data) 
      : record.data;
    
    await db.run(`
      INSERT INTO closed_merge_requests_raw 
      (entity_type, github_id, data, fetched_at, api_endpoint, etag, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      record.entity_type,
      record.github_id,
      jsonData,
      record.fetched_at || new Date().toISOString(),
      record.api_endpoint,
      record.etag,
      record.created_at || new Date().toISOString()
    ]);
    
    return true;
  } else { // Supabase - still using github_raw_data
    const { error } = await db
      .from('github_raw_data')
      .upsert([record]);
      
    return !error;
  }
};
```

### Data Insertion and Update Patterns

#### Two-Step Entity Resolution + Upsert

For all entities, follow this pattern:

```javascript
// Example for contributors
async function resolveAndUpsertContributor(apiContributor) {
  const db = await getDb();
  
  // 1. Map the API data to our schema
  const contributorData = {
    github_id: apiContributor.id,
    username: apiContributor.login || null,
    avatar: apiContributor.avatar_url,
    is_enriched: false,
    // Other fields...
    updated_at: new Date().toISOString()
  };
  
  if (db.get) { // SQLite
    // 2. Check if entity exists by github_id
    const existing = await db.get(
      'SELECT id, github_id FROM contributors WHERE github_id = ?',
      contributorData.github_id
    );
    
    if (existing) {
      // 3a. Update existing record
      const setColumns = Object.keys(contributorData)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = Object.values(contributorData);
      values.push(existing.id); // Add ID for WHERE clause
      
      await db.run(
        `UPDATE contributors SET ${setColumns} WHERE id = ?`,
        values
      );
      
      return existing.id; // Return UUID
    } else {
      // 3b. Insert new record
      contributorData.id = crypto.randomUUID(); // Generate UUID
      contributorData.created_at = new Date().toISOString();
      
      const columns = Object.keys(contributorData).join(', ');
      const placeholders = Object.keys(contributorData)
        .map(() => '?')
        .join(', ');
      
      await db.run(
        `INSERT INTO contributors (${columns}) VALUES (${placeholders})`,
        Object.values(contributorData)
      );
      
      return contributorData.id; // Return UUID
    }
  } else { // Supabase
    // 2. Check if entity exists
    const { data: existing } = await db
      .from('contributors')
      .select('id, github_id')
      .eq('github_id', contributorData.github_id)
      .maybeSingle();
      
    // 3. Insert or update based on existence
    if (existing) {
      const { data, error } = await db
        .from('contributors')
        .update(contributorData)
        .eq('id', existing.id)
        .select('id')
        .single();
        
      if (error) throw error;
      return data.id; // Return UUID
    } else {
      const { data, error } = await db
        .from('contributors')
        .insert(contributorData)
        .select('id')
        .single();
        
      if (error) throw error;
      return data.id; // Return UUID
    }
  }
}
```

### Performance Considerations

1. Use appropriate indices on commonly queried fields:
   - Always index `github_id` fields
   - Create composite indices for common query patterns
   - Index timestamp fields used for time-based filtering

2. Use transaction batching for bulk operations:
   - Wrap multiple related operations in a transaction
   - Use prepared statements for repeated operations
   - Consider chunking large operations

3. Handle large result sets efficiently:
   - Always paginate results when retrieving large datasets
   - Use LIMIT and OFFSET in SQLite queries
   - Return only needed fields to reduce payload size

## Database Utility Functions

All database interactions are handled through utility functions in `lib/database.js`, which support both SQLite and Supabase backends.

### Basic Functions

- `getDb()`: Get a database connection based on environment settings
- `getSQLiteDb()`: Get a SQLite-specific connection
- `getSupabaseClient()`: Get a Supabase client for authentication
- `closeDb()`: Close the database connection

### GitHub Raw Data / Closed Merge Requests Functions

- `fetchClosedMergeRequest(entityType, githubId)`: Fetch a specific merge request record
- `queryClosedMergeRequests(entityType, options)`: Query merge request records by entity type
- `storeClosedMergeRequest(record)`: Store or update a merge request record

## Schema Management

For SQLite, schema changes should be managed through:

1. SQL migration scripts
2. Updates to documentation in this file
3. Updates to the database utility functions

## Data Migration

When migrating data from Supabase to SQLite:

1. Ensure SQLite schema matches the standardized schema described in this document
2. Generate UUIDs for all entities if not present
3. Maintain the relationship between GitHub IDs and internal UUIDs
4. Convert any array or JSON fields to properly escaped JSON strings in SQLite

## Best Practices

1. **Consistent Accessor Methods**: Always use the database utility functions for all database operations
2. **Error Handling**: Include proper error handling for all database operations  
3. **Resource Management**: Always close SQLite connections after use
4. **Transactions**: Use transactions for operations that modify multiple tables
5. **Validation**: Validate data before inserting or updating records
6. **Documentation**: Update this document when making any schema changes 