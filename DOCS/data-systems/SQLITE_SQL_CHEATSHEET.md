# SQLite SQL Cheat Sheet for GitHub Explorer

This document provides common SQL queries for working with the GitHub Explorer SQLite database.

## Basic Queries

### 1. List all tables in the database

```sql
SELECT name FROM sqlite_master WHERE type='table';
```

### 2. View table schema

```sql
PRAGMA table_info(table_name);

-- Example:
PRAGMA table_info(repositories);
```

## Query Examples by Table

### Contributors

#### List all contributors

```sql
SELECT id, username, name, followers_count 
FROM contributors
ORDER BY followers_count DESC;
```

#### Find contributor by username

```sql
SELECT * 
FROM contributors 
WHERE username = 'octocat';
```

#### Find contributors with high follower counts

```sql
SELECT id, username, name, followers_count
FROM contributors
WHERE followers_count > 100
ORDER BY followers_count DESC;
```

### Repositories

#### List all repositories

```sql
SELECT id, name, full_name, stargazers_count
FROM repositories
ORDER BY stargazers_count DESC;
```

#### Find repositories by name (partial match)

```sql
SELECT id, name, full_name
FROM repositories
WHERE name LIKE '%sample%';
```

#### Get repository with its owner

```sql
SELECT 
  r.id,
  r.name,
  r.full_name,
  r.description,
  c.username as owner_username,
  c.name as owner_name
FROM 
  repositories r
JOIN 
  contributors c ON r.owner_id = c.id
WHERE 
  r.id = 'repo-uuid-1';
```

### Contributor-Repository Relationships

#### Get all repositories for a contributor

```sql
SELECT 
  r.id,
  r.name,
  r.full_name,
  cr.contribution_type,
  cr.contributions_count
FROM 
  repositories r
JOIN 
  contributor_repository cr ON r.id = cr.repository_id
WHERE 
  cr.contributor_id = 'contrib-uuid-1';
```

#### Get all contributors for a repository

```sql
SELECT 
  c.id,
  c.username,
  c.name,
  cr.contribution_type,
  cr.contributions_count
FROM 
  contributors c
JOIN 
  contributor_repository cr ON c.id = cr.contributor_id
WHERE 
  cr.repository_id = 'repo-uuid-1'
ORDER BY 
  cr.contributions_count DESC;
```

### Merge Requests (Pull Requests)

#### List all merge requests

```sql
SELECT 
  id, 
  title, 
  state, 
  repository_id
FROM 
  merge_requests
ORDER BY 
  created_at DESC;
```

#### Find open merge requests for a repository

```sql
SELECT 
  mr.id,
  mr.title,
  mr.state,
  c.username as author
FROM 
  merge_requests mr
JOIN 
  contributors c ON mr.user_id = c.id
WHERE 
  mr.repository_id = 'repo-uuid-1'
  AND mr.state = 'open';
```

### Commits

#### List recent commits

```sql
SELECT 
  id, 
  sha, 
  message, 
  repository_id, 
  author_id
FROM 
  commits
ORDER BY 
  author_date DESC
LIMIT 10;
```

#### Get commits for a specific repository

```sql
SELECT 
  c.sha,
  c.message,
  c.author_date,
  co.username as author
FROM 
  commits c
JOIN 
  contributors co ON c.author_id = co.id
WHERE 
  c.repository_id = 'repo-uuid-1'
ORDER BY 
  c.author_date DESC;
```

### GitHub Raw Data

#### Get raw data for a specific entity

```sql
SELECT 
  id, 
  entity_type, 
  github_id,
  fetched_at,
  data
FROM 
  closed_merge_requests_raw
WHERE 
  entity_type = 'repository'
  AND github_id = '12345678';
```

## Advanced Queries

### Aggregate Data

#### Count repositories by primary language

```sql
SELECT 
  language, 
  COUNT(*) as count
FROM 
  repositories
GROUP BY 
  language
ORDER BY 
  count DESC;
```

#### Calculate average contributions by type

```sql
SELECT 
  contribution_type, 
  AVG(contributions_count) as avg_contributions,
  COUNT(*) as relationship_count
FROM 
  contributor_repository
GROUP BY 
  contribution_type;
```

### Complex Joins

#### Repository activity summary

```sql
SELECT 
  r.name as repository_name,
  r.full_name,
  COUNT(DISTINCT c.id) as commit_count,
  COUNT(DISTINCT mr.id) as merge_request_count,
  COUNT(DISTINCT cr.contributor_id) as contributor_count
FROM 
  repositories r
LEFT JOIN 
  commits c ON r.id = c.repository_id
LEFT JOIN 
  merge_requests mr ON r.id = mr.repository_id
LEFT JOIN 
  contributor_repository cr ON r.id = cr.repository_id
GROUP BY 
  r.id, r.name, r.full_name;
```

#### Most active contributors across repositories

```sql
SELECT 
  c.username,
  c.name,
  COUNT(DISTINCT com.id) as commit_count,
  COUNT(DISTINCT mr.id) as merge_request_count,
  COUNT(DISTINCT cr.repository_id) as repository_count,
  SUM(cr.contributions_count) as total_contributions
FROM 
  contributors c
LEFT JOIN 
  commits com ON c.id = com.author_id
LEFT JOIN 
  merge_requests mr ON c.id = mr.user_id
LEFT JOIN 
  contributor_repository cr ON c.id = cr.contributor_id
GROUP BY 
  c.id, c.username, c.name
ORDER BY 
  total_contributions DESC
LIMIT 10;
```

## Modifying Data

### Insert Records

```sql
-- Insert a new contributor
INSERT INTO contributors (
  id, 
  username, 
  name, 
  avatar_url, 
  created_at, 
  updated_at
) VALUES (
  'new-uuid', 
  'new-user', 
  'New User', 
  'https://example.com/avatar.png',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

### Update Records

```sql
-- Update contributor information
UPDATE contributors
SET 
  name = 'Updated Name',
  bio = 'Updated bio information',
  followers_count = 150,
  updated_at = CURRENT_TIMESTAMP
WHERE 
  username = 'sample-user';
```

### Delete Records

```sql
-- Delete a specific record
DELETE FROM contributor_repository
WHERE 
  contributor_id = 'contrib-uuid-1'
  AND repository_id = 'repo-uuid-1';
```

## Using the SQLite CLI

To run these queries from the command line:

```bash
# Basic query
sqlite3 github_explorer.db "SELECT * FROM contributors LIMIT 3;"

# Format output as column with headers
sqlite3 github_explorer.db -header -column "SELECT id, username FROM contributors LIMIT 3;"

# Load queries from a file
sqlite3 github_explorer.db < queries.sql

# Interactive mode
sqlite3 github_explorer.db
```

## SQLite-Specific Features

### Enable Foreign Keys

```sql
PRAGMA foreign_keys = ON;
```

### Get Database Information

```sql
-- List attached databases
PRAGMA database_list;

-- Get SQLite version
SELECT sqlite_version();
```

### Backup the Database

From the command line:

```bash
sqlite3 github_explorer.db ".backup 'backup-file.db'"
```

## Performance Tips

1. **Use indexes** for frequently queried columns:
   ```sql
   CREATE INDEX idx_contributors_username ON contributors(username);
   ```

2. **Use transactions** for batch operations:
   ```sql
   BEGIN TRANSACTION;
   -- Multiple operations here
   COMMIT;
   ```

3. **Analyze the database** to optimize query planning:
   ```sql
   ANALYZE;
   ```

4. **Explain query plans** to identify slow queries:
   ```sql
   EXPLAIN QUERY PLAN SELECT * FROM repositories WHERE name LIKE '%sample%';
   ``` 