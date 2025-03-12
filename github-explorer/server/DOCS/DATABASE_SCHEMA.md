# GitHub Explorer Database Schema Documentation

This document provides a comprehensive overview of the database schema used in the GitHub Explorer application. It includes tables, relationships, indices, and the approach used for database management.

## Database Management Approach

GitHub Explorer uses Supabase PostgreSQL for data storage. We've implemented a robust schema management system that provides:

1. **Flexible SQL Execution**: Multiple methods for executing SQL statements with fallbacks
2. **Schema Verification**: Tools to check if tables exist and create them when needed
3. **Migration Management**: Support for running SQL migrations
4. **Data Operations**: Methods for working with data including upserting records

The primary components are:

- **SupabaseSchemaManager**: Central class for managing database schema
- **SupabaseManagementClient**: Client for executing SQL and interacting with Supabase

### Schema Manager Usage

```javascript
import { SupabaseSchemaManager } from './services/supabase/supabase-schema-manager.js';

// Create a schema manager
const schemaManager = new SupabaseSchemaManager({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  projectId: process.env.SUPABASE_PROJECT_ID
});

// Initialize the manager
await schemaManager.initialize();

// Check if a table exists
const exists = await schemaManager.tableExists('repositories');

// Create a table if it doesn't exist
await schemaManager.createTableIfNotExists('repositories', `
  CREATE TABLE repositories (
    id SERIAL PRIMARY KEY,
    github_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    owner TEXT NOT NULL,
    description TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`);

// Execute custom SQL
await schemaManager.executeSql(`
  ALTER TABLE repositories 
  ADD COLUMN stars INTEGER DEFAULT 0
`);

// Upsert data
await schemaManager.upsertData(
  'repositories',
  [{ github_id: 123, name: 'repo1', owner: 'user1' }],
  ['github_id']
);
```

## Database Tables

### Table: repositories

Stores information about GitHub repositories.

```sql
CREATE TABLE repositories (
  id SERIAL PRIMARY KEY,
  github_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  description TEXT,
  url TEXT,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  language TEXT,
  is_fork BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_repositories_github_id ON repositories(github_id);
CREATE INDEX idx_repositories_owner ON repositories(owner);
CREATE INDEX idx_repositories_name ON repositories(name);
```

### Table: contributors

Stores information about contributors to repositories.

```sql
CREATE TABLE contributors (
  id SERIAL PRIMARY KEY,
  github_id BIGINT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contributors_github_id ON contributors(github_id);
CREATE INDEX idx_contributors_username ON contributors(username);
```

### Table: repository_contributors

Links repositories and contributors (many-to-many relationship).

```sql
CREATE TABLE repository_contributors (
  id SERIAL PRIMARY KEY,
  repository_id BIGINT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  contributor_id BIGINT NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
  contributions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(repository_id, contributor_id)
);

CREATE INDEX idx_repository_contributors_repo ON repository_contributors(repository_id);
CREATE INDEX idx_repository_contributors_contrib ON repository_contributors(contributor_id);
```

### Table: commits

Stores information about commits to repositories.

```sql
CREATE TABLE commits (
  id SERIAL PRIMARY KEY,
  repository_id BIGINT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  contributor_id BIGINT REFERENCES contributors(id) ON DELETE SET NULL,
  sha TEXT NOT NULL UNIQUE,
  message TEXT,
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  files_changed INTEGER DEFAULT 0,
  committed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_commits_repository_id ON commits(repository_id);
CREATE INDEX idx_commits_contributor_id ON commits(contributor_id);
CREATE INDEX idx_commits_sha ON commits(sha);
CREATE INDEX idx_commits_committed_at ON commits(committed_at);
```

### Table: issues

Stores information about issues in repositories.

```sql
CREATE TABLE issues (
  id SERIAL PRIMARY KEY,
  repository_id BIGINT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  github_id BIGINT NOT NULL UNIQUE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state TEXT NOT NULL,
  creator_id BIGINT REFERENCES contributors(id) ON DELETE SET NULL,
  assignee_id BIGINT REFERENCES contributors(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_issues_repository_id ON issues(repository_id);
CREATE INDEX idx_issues_github_id ON issues(github_id);
CREATE INDEX idx_issues_number ON issues(number);
CREATE INDEX idx_issues_state ON issues(state);
CREATE INDEX idx_issues_creator_id ON issues(creator_id);
CREATE INDEX idx_issues_assignee_id ON issues(assignee_id);
```

### Table: pull_requests

Stores information about pull requests in repositories.

```sql
CREATE TABLE pull_requests (
  id SERIAL PRIMARY KEY,
  repository_id BIGINT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  github_id BIGINT NOT NULL UNIQUE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state TEXT NOT NULL,
  creator_id BIGINT REFERENCES contributors(id) ON DELETE SET NULL,
  merged_by_id BIGINT REFERENCES contributors(id) ON DELETE SET NULL,
  is_merged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  merged_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_pull_requests_repository_id ON pull_requests(repository_id);
CREATE INDEX idx_pull_requests_github_id ON pull_requests(github_id);
CREATE INDEX idx_pull_requests_number ON pull_requests(number);
CREATE INDEX idx_pull_requests_state ON pull_requests(state);
CREATE INDEX idx_pull_requests_creator_id ON pull_requests(creator_id);
CREATE INDEX idx_pull_requests_merged_by_id ON pull_requests(merged_by_id);
```

### Table: pipeline_schedules

Stores information about scheduled data pipeline jobs.

```sql
CREATE TABLE pipeline_schedules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  pipeline_type TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  parameters JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pipeline_schedules_pipeline_type ON pipeline_schedules(pipeline_type);
CREATE INDEX idx_pipeline_schedules_is_active ON pipeline_schedules(is_active);
CREATE INDEX idx_pipeline_schedules_next_run_at ON pipeline_schedules(next_run_at);
```

## Relationships

Here are the key relationships between tables:

1. **repositories** ← one-to-many → **commits**
2. **repositories** ← one-to-many → **issues**
3. **repositories** ← one-to-many → **pull_requests**
4. **repositories** ← many-to-many → **contributors** (via repository_contributors)
5. **contributors** ← one-to-many → **issues** (as creator)
6. **contributors** ← one-to-many → **issues** (as assignee)
7. **contributors** ← one-to-many → **pull_requests** (as creator)
8. **contributors** ← one-to-many → **pull_requests** (as merger)
9. **contributors** ← one-to-many → **commits**

## Database Access

We use multiple methods to access the database:

1. **Direct Supabase Client**: For standard CRUD operations using the Supabase JavaScript client
2. **Schema Manager**: For schema management and migrations
3. **Management API Client**: For advanced operations like SQL execution

## Migrations

Migrations are handled by the Schema Manager, which can process SQL files from a migrations directory. Each migration is applied in sequence, with proper error handling and logging.

## Recent Changes

### Migration 008: Entity Enrichment Implementation

We've implemented a comprehensive enrichment process for GitHub entities that enhances the stored data with additional details from the GitHub API. This enrichment process:

1. **Enriches Repositories** with extended details including:
   - Size in kilobytes
   - Open issues count
   - Watchers count
   - Primary programming language
   - License information

2. **Enriches Contributors** with extended profile information including:
   - Full name
   - Bio and company
   - Blog and Twitter details
   - Location
   - Follower and repository counts

3. **Enriches Pull Requests** with additional metrics including:
   - Files changed count
   - Review comments count
   - Lines added and removed
   - Labels

4. **Enriches Commits** with detailed information including:
   - Files changed
   - Author and committer details (name and email)
   - Full commit message
   - Verification status
   - Line change statistics (additions, deletions, total)
   - Parent commit references
   - Timestamps for authoring and committing

The enrichment process uses the GitHub API to fetch detailed data for each entity and updates the corresponding records in the database, setting the `is_enriched` flag to `true` for enriched records. This improves the data quality and enables more advanced analytics and visualizations.

### Migration 007: Extend BIGINT Support for GitHub IDs

To fully accommodate GitHub's large ID values (which can exceed PostgreSQL's integer limit of 2,147,483,647), the following additional columns have been changed from `INTEGER` to `BIGINT`:

- `github_id` in `repositories` table
- `github_id` in `contributors` table
- `contributor_id` in `repository_contributors` table 
- `contributor_id` in `commits` table
- `github_id` in `issues` table
- `creator_id` in `issues` table
- `assignee_id` in `issues` table
- `github_id` in `pull_requests` table
- `creator_id` in `pull_requests` table
- `merged_by_id` in `pull_requests` table

This comprehensive update ensures all GitHub IDs can be stored directly without modification, maintaining data integrity across the entire database.

### Migration 006: Update ID Columns for GitHub Integration

To accommodate GitHub's large ID values (which can exceed PostgreSQL's integer limit of 2,147,483,647), the following columns have been changed from `INTEGER` to `BIGINT`:

- `repository_id` in `commits` table
- `merge_request_id` in `commits` table
- `repository_id` in `merge_requests` table
- `repository_id` in `contributor_repository` table

This change ensures that GitHub's IDs can be stored directly without modification, maintaining the integrity of references between GitHub and our database.

---

*This document should be updated whenever there are changes to the database schema or management approach.* 