# GitHub Explorer Database Documentation

This document provides a comprehensive guide to the GitHub Explorer database, covering the schema design, migration history, and database management practices.

## Important Note on Schema Management

**In this project, all database schema changes are managed manually through the Supabase dashboard.** 
The documentation in this file serves as the single source of truth for the database schema. When making any changes to the database structure:

1. First make the change directly in the Supabase dashboard using SQL
2. Then update this documentation to reflect the changes
3. Finally, inform other team members about the change

## Database Access Options

GitHub Explorer supports two database backends:

1. **Supabase (Primary)**: Used for production and team development
2. **SQLite (Local Development)**: Used for local development and testing

The application automatically selects the appropriate database based on the `DB_TYPE` environment variable:

```
# For Supabase (default)
DB_TYPE=supabase
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

# For SQLite
DB_TYPE=sqlite
DB_PATH=path/to/github_explorer.db
```

## Table of Contents

- [Schema Overview](#schema-overview)
- [Tables](#tables)
  - [Repositories](#repositories)
  - [Contributors](#contributors)
  - [Contributor_Repository](#contributor_repository)
  - [Merge Requests](#merge_requests)
  - [Commits](#commits)
  - [Closed_Merge_Requests_Raw](#closed_merge_requests_raw)
  - [Contribution_History](#contribution_history)
  - [Pull_Request_Activities](#pull_request_activities)
  - [Pull_Request_Comments](#pull_request_comments)
  - [Pull_Request_Reviewers](#pull_request_reviewers)
  - [Star_History](#star_history)
  - [Commit_Analyses](#commit_analyses)
  - [Analysis_Prompts](#analysis_prompts)
  - [Pipeline_Runs](#pipeline_runs)
  - [Schema_Migrations](#schema_migrations)
  - [Pipeline_Schedules](#pipeline_schedules)
  - [Pipeline_Configurations](#pipeline_configurations)
  - [Notification_Settings](#notification_settings)
- [Database Functions and Triggers](#database-functions-and-triggers)
- [Entity-Relationship Diagram](#entity-relationship-diagram)
- [Feature Relationships](#feature-relationships)
- [Data Integrity and Validation](#data-integrity-and-validation)
- [Performance Considerations](#performance-considerations)
- [Migration History](#migration-history)
- [Schema Management](#schema-management)
- [Common Database Operations](#common-database-operations)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [SQLite Implementation](#sqlite-implementation)

## Schema Overview

The GitHub Explorer database is structured around core GitHub entities: repositories, contributors, merge requests (pull requests), and commits. It includes additional tables for analytics, historical data tracking, and metadata. The schema supports the application's core functionality of visualizing, analyzing, and exploring GitHub project data.

## Tables

### Repositories

Stores information about GitHub repositories being tracked in the system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('repositories_id_seq') | Primary key |
| name | text | NO | | Repository name |
| description | text | YES | | Repository description |
| url | text | NO | | Repository URL |
| stars | integer | NO | 0 | Star count |
| forks | integer | NO | 0 | Fork count |
| is_enriched | boolean | YES | false | Flag indicating if repository has been enriched with additional data |
| health_percentage | integer | YES | | Repository health score (0-100) |
| open_issues_count | integer | NO | 0 | Count of open issues |
| last_updated | timestamp with time zone | YES | | Last update timestamp |
| size_kb | integer | YES | | Repository size in KB |
| watchers_count | integer | NO | 0 | Number of watchers |
| primary_language | text | YES | | Primary programming language |
| license | text | YES | | License information |
| source | text | YES | | Identifies the source of this repository data |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Creation timestamp |

**Primary Key**: id  
**Indexes**: Primary key index on id  

### Contributors

Stores information about GitHub users who have contributed to tracked repositories.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | text | NO | | Primary key (GitHub username) |
| username | text | YES | | GitHub username (nullable for unknown users) |
| name | text | YES | | Display name |
| avatar | text | YES | | URL to avatar image |
| is_enriched | boolean | YES | false | Flag indicating if profile has been enriched |
| bio | text | YES | | User bio |
| company | text | YES | | Company affiliation |
| blog | text | YES | | Blog URL |
| twitter_username | text | YES | | Twitter username |
| location | text | YES | | User location |
| followers | integer | YES | 0 | Follower count |
| repositories | integer | YES | 0 | Number of public repositories |
| impact_score | integer | YES | 0 | Calculated impact score |
| role_classification | text | YES | | Classified contributor role |
| top_languages | text[] | YES | | Array of most used languages |
| organizations | text[] | YES | | Array of organization memberships |
| first_contribution | timestamp with time zone | YES | | Date of first contribution |
| last_contribution | timestamp with time zone | YES | | Date of most recent contribution |
| direct_commits | integer | YES | 0 | Number of direct commits |
| pull_requests_merged | integer | YES | 0 | Number of merged PRs |
| pull_requests_rejected | integer | YES | 0 | Number of rejected PRs |
| code_reviews | integer | YES | 0 | Number of code reviews |
| is_placeholder | boolean | NO | false | Whether this is a placeholder for an unknown contributor |
| github_id | BIGINT | YES | | GitHub numeric ID (persistent identifier) |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Creation timestamp |

**Primary Key**: id  
**Indexes**: Primary key index on id, index on username

### Contributor_Repository

Represents the many-to-many relationship between contributors and repositories.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('contributor_repository_id_seq') | Primary key |
| contributor_id | text | NO | | Reference to contributor |
| repository_id | integer | NO | | Reference to repository |
| commit_count | integer | NO | 0 | Number of commits made |
| pull_requests | integer | NO | 0 | Number of PRs submitted |
| reviews | integer | NO | 0 | Number of reviews performed |
| issues_opened | integer | NO | 0 | Number of issues opened |
| first_contribution_date | timestamp with time zone | YES | | Date of first contribution |
| last_contribution_date | timestamp with time zone | YES | | Date of most recent contribution |
| lines_added | integer | YES | 0 | Total lines of code added |
| lines_removed | integer | YES | 0 | Total lines of code removed |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Creation timestamp |

**Primary Key**: id  
**Foreign Keys**: contributor_id → contributors.id, repository_id → repositories.id  
**Indexes**: Primary key index, composite index on (repository_id, contributor_id)

### Merge_Requests

Stores information about merge requests (pull requests) submitted to repositories.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('merge_requests_id_seq') | Primary key |
| github_id | integer | NO | | GitHub's PR ID |
| repository_id | integer | NO | | Repository reference |
| author_id | text | NO | | Contributor reference |
| title | text | NO | | PR title |
| description | text | YES | | PR description |
| state | text | NO | | Current state (open, closed, merged) |
| is_draft | boolean | NO | false | Whether PR is a draft |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Creation timestamp |
| updated_at | timestamp with time zone | YES | | Last update timestamp |
| closed_at | timestamp with time zone | YES | | Closure timestamp |
| merged_at | timestamp with time zone | YES | | Merge timestamp |
| merged_by_id | text | YES | | Contributor who merged the PR |
| commits_count | integer | NO | 0 | Number of commits in PR |
| additions | integer | NO | 0 | Lines added |
| deletions | integer | NO | 0 | Lines removed |
| changed_files | integer | NO | 0 | Files modified |
| complexity_score | integer | YES | | Calculated complexity |
| review_time_hours | integer | YES | | Time in review |
| cycle_time_hours | integer | YES | | Total PR lifecycle time |
| labels | text[] | YES | | Array of PR labels |
| source_branch | text | YES | | Source branch name |
| target_branch | text | YES | | Target branch name |

**Primary Key**: id  
**Foreign Keys**: repository_id → repositories.id, author_id → contributors.id, merged_by_id → contributors.id  
**Indexes**: Primary key index, index on github_id, index on repository_id, index on author_id

### Commits

Stores information about commits made to repositories.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('commits_id_seq') | Primary key |
| sha | text | NO | | Commit SHA hash |
| repository_id | integer | NO | | Repository reference |
| contributor_id | text | YES | | Contributor reference |
| author | text | YES | | Author name (deprecated) |
| message | text | NO | | Commit message |
| additions | integer | NO | 0 | Lines added |
| deletions | integer | NO | 0 | Lines removed |
| files_changed | integer | NO | 0 | Files modified |
| is_merge_commit | boolean | NO | false | Whether it's a merge commit |
| committed_at | timestamp with time zone | NO | | Timestamp of the commit |
| pull_request_id | integer | YES | | PR reference if from a PR |
| complexity_score | integer | YES | | Calculated complexity |
| is_placeholder_author | boolean | NO | false | Whether author is unknown |
| parents | text[] | YES | | Array of parent commit SHAs |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Creation timestamp |

**Primary Key**: id  
**Foreign Keys**: repository_id → repositories.id, contributor_id → contributors.id, pull_request_id → merge_requests.id  
**Indexes**: Primary key index, index on sha, index on repository_id, index on contributor_id, index on committed_at

### Closed_Merge_Requests_Raw

Stores raw JSON data from GitHub API specifically for closed merge requests.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | AUTOINCREMENT | Primary key (auto-incrementing integer) |
| entity_type | TEXT | YES | | Type of entity (repository, contributor, etc.) |
| github_id | TEXT | YES | | GitHub entity ID |
| data | TEXT | NO | | Raw JSON data from GitHub API |
| fetched_at | TEXT | YES | | When data was fetched |
| api_endpoint | TEXT | YES | | API endpoint used to fetch data |
| etag | TEXT | YES | | GitHub API ETag for caching |
| created_at | TEXT | NO | datetime('now') | Creation timestamp |

**Primary Key**: id (auto-incrementing integer)  
**Indexes**: Index on (entity_type, github_id), index on fetched_at

**Note**: This table replaced the previous `github_raw_data` table in the SQLite implementation to optimize storage and improve database structure with proper auto-incrementing integer IDs instead of storing JSON data as IDs.

### Contribution_History

Tracks contributor activity over time for historical analysis.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('contribution_history_id_seq') | Primary key |
| contributor_id | text | NO | | Contributor reference |
| repository_id | integer | NO | | Repository reference |
| year | integer | NO | | Year of contribution |
| month | integer | NO | | Month of contribution |
| commits | integer | NO | 0 | Commit count |
| pull_requests | integer | NO | 0 | PR count |
| reviews | integer | NO | 0 | Review count |
| issues | integer | NO | 0 | Issue count |
| lines_added | integer | NO | 0 | Lines added |
| lines_removed | integer | NO | 0 | Lines removed |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Creation timestamp |

**Primary Key**: id  
**Foreign Keys**: contributor_id → contributors.id, repository_id → repositories.id  
**Indexes**: Primary key index, composite index on (contributor_id, repository_id, year, month)

### Pipeline_Schedules

Stores information about scheduled data pipeline jobs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('pipeline_schedules_id_seq') | Primary key |
| name | text | NO | | Schedule name |
| description | text | YES | | Schedule description |
| pipeline_type | text | NO | | Type of pipeline to run |
| cron_expression | text | NO | | Cron scheduling expression |
| timezone | text | NO | 'UTC' | Timezone for the schedule |
| parameters | jsonb | YES | | Pipeline parameters |
| is_active | boolean | NO | true | Whether schedule is active |
| last_run_at | timestamp with time zone | YES | | Last execution time |
| next_run_at | timestamp with time zone | YES | | Next scheduled time |
| created_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Creation timestamp |
| updated_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Last update timestamp |

**Primary Key**: id  
**Indexes**: Primary key index, index on pipeline_type, index on is_active, index on next_run_at

### Schema_Migrations

Tracks database migrations that have been applied to the database.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | integer | NO | nextval('schema_migrations_id_seq') | Primary key |
| migration_name | text | NO | | Migration identifier |
| executed_at | timestamp with time zone | NO | timezone('utc'::text, now()) | Execution timestamp |
| checksum | text | YES | | Migration content checksum |
| execution_time | numeric | YES | | Execution duration in seconds |
| success | boolean | NO | true | Whether migration succeeded |

**Primary Key**: id  
**Indexes**: Primary key index, unique index on migration_name

## Relationships

Here are the key relationships between tables:

1. **repositories** ← one-to-many → **commits**
2. **repositories** ← one-to-many → **merge_requests**
3. **repositories** ← many-to-many → **contributors** (via contributor_repository)
4. **contributors** ← one-to-many → **merge_requests** (as author)
5. **contributors** ← one-to-many → **merge_requests** (as merger)
6. **contributors** ← one-to-many → **commits**
7. **merge_requests** ← one-to-many → **commits**
8. **contributors** ← one-to-many → **contribution_history**
9. **repositories** ← one-to-many → **contribution_history**

## Database Access

We use multiple methods to access the database:

1. **Direct Supabase Client**: For standard CRUD operations using the Supabase JavaScript client
2. **Management API**: For SQL execution in the Supabase dashboard

### Common Operations

#### Upserting Data

When adding or updating data, use upsert operations to prevent duplicate records. Example:

```javascript
// JavaScript example using supabase-js
const { data, error } = await supabaseClient
  .from('repositories')
  .upsert([{ github_id: 123, name: 'repo1', owner: 'user1' }])
  .match(['github_id']);

// Always check for errors
if (error) {
  console.error('Error upserting data:', error);
}
```

## Migration History

The following sections document significant database schema changes that have been made over time.

### Migration 011: Added Placeholder Flags for Unknown Contributors

To improve data quality and prevent enrichment processes from attempting to fetch data for placeholder contributors, we've added the following fields:

1. **Added `is_placeholder` to Contributors Table**: This boolean flag indicates if a contributor record represents an unknown GitHub user (default: FALSE).
   - When TRUE, it signifies that this contributor record is a placeholder and should not be enriched with GitHub API data.
   - Automatically flags usernames that are 'unknown', 'placeholder', or start with 'placeholder-'.

2. **Added `is_placeholder_author` to Commits Table**: This flag indicates if a commit's author is unknown or cannot be linked to a real GitHub user (default: FALSE).
   - When TRUE, it signifies that the commit's author is a placeholder and should not be processed for user enrichment.
   - Automatically flags authors that are 'unknown', 'placeholder', or start with 'placeholder-'.

These changes improve data quality and enrichment processes by:
- Preventing the enrichment pipeline from trying to fetch GitHub data for non-existent users
- Clearly distinguishing between real and placeholder data in analytics and reports
- Avoiding issues with the "unknown" GitHub username in data processing
- Allowing better filtering of data for reports and visualizations

### Migration 012: Standardized Placeholder Implementation

We've enhanced the placeholder functionality with a standardized implementation:

### Migration 013: Improved Contributor Identity Management

We've implemented a more robust approach to handling GitHub contributor identities:

1. **Made `username` Nullable in Contributors Table**: The `username` field can now be NULL to properly represent unknown usernames.
   - This replaces the previous approach of using placeholder strings like "unknown" or "placeholder-*".
   - NULL properly represents "absence of a value" semantically, improving data quality.

2. **Using GitHub ID for API Calls**: Modified the enrichment process to use GitHub numeric IDs instead of usernames when available.
   - GitHub IDs are permanent and stable, while usernames can change over time.
   - The system now supports fetching user data by ID using the GitHub API endpoint: `/user/{id}`.
   - Includes fallback to username when ID lookup fails, ensuring robustness.

3. **Automatic Username Updates**: When a GitHub user changes their username, our system will now detect this and update the stored username automatically during enrichment.

These changes significantly improve data integrity by:
- Using the permanent GitHub ID as the primary identifier
- Properly representing unknown usernames with NULL
- Maintaining accurate usernames even when users rename their GitHub accounts
- Eliminating the need for special handling of placeholder username values
- Improving enrichment success rates by using the more stable ID-based API endpoint

### Migration 014: Direct Contributor-Commit Linking

This migration adds a more direct and reliable way to link commits to contributors:

1. **Added `contributor_id` to Commits Table**: This field directly references the `id` column in the contributors table.
   - Provides a more reliable way to link commits to contributors using their stable GitHub ID.
   - Adds a proper foreign key constraint to ensure data integrity.
   - Includes an index for optimized query performance when joining these tables.

2. **Deprecated the `author` field**: The `author` field is now marked as deprecated but retained for backward compatibility.
   - Added a comment to the field indicating its deprecated status.
   - New code should use the `contributor_id` field instead.

3. **Updated Repository-Contributors Relationship**: Ensured the `contributor_id` in the repository_contributors table is of type TEXT.
   - This matches the `id` column in the contributors table for proper referential integrity.
   - The previous BIGINT type was updated to TEXT to maintain consistency across the schema.

4. **Optimized Data Migration Approach**: To handle large datasets without timeouts:
   - Schema changes were implemented first without data updates
   - Data updates were designed to run in separate, smaller batches
   - Progress tracking was added to enable partial updates

These changes enhance the database in several ways:
- Improved data integrity through proper foreign key relationships
- Better performance for queries joining commits and contributors
- More reliable commit attribution even when usernames change
- Consistent data types across related columns
- Better scalability for large datasets

### Migration 015: Comprehensive Schema Update (March 2025)

We performed a complete overhaul of several key database elements to improve data integrity, query performance, and maintainability:

1. **Comprehensive Nullable Username Implementation**:
   - Removed NOT NULL constraint from the username column in the contributors table
   - Added detailed column comment explaining that NULL indicates unknown usernames
   - Ensured GitHub ID remains the primary identifier for contributors

2. **Standardized Placeholder Indicators**:
   - Implemented consistent DEFAULT FALSE for all placeholder flags
   - Added descriptive comments explaining the purpose of each placeholder field
   - Ensured consistent behavior across all related tables

3. **Optimized Contributor-Commit Relationships**:
   - Added proper indexing for the contributor_id column in the commits table
   - Implemented foreign key constraint to enforce referential integrity
   - Added detailed comments explaining the relationship and migration strategy

4. **Type Consistency Across Related Tables**:
   - Ensured all contributor ID references use the TEXT type consistently
   - Updated any mismatched column types in junction tables
   - Preserved existing relationships during the migration process

5. **Migration Tracking**:
   - Recorded all schema changes in the schema_migrations table
   - Added detailed checksum verification for change tracking
   - Implemented execution timestamp recording for audit purposes

This comprehensive update ensures our database schema is now fully consistent, properly documented, and optimized for the specific needs of our GitHub data processing pipeline.

## Schema Management

### Approach

In this project, database schema changes are made **manually** through the Supabase dashboard's SQL Editor. This approach was chosen for:

1. **Simplicity**: Direct SQL execution for immediate changes
2. **Visibility**: All team members can see schema changes in one place
3. **Control**: Complete oversight of all database operations
4. **Reliability**: Avoiding complexities of automated migration tools

### Prerequisites

Before performing any schema operations, ensure you have the following:

1. **Supabase Dashboard Access**: Administrator access to the Supabase dashboard
2. **SQL Knowledge**: Understanding of PostgreSQL syntax
3. **Documentation Access**: Ability to update this documentation file

### Migration Workflow

For schema changes, follow this process:

1. **Plan the Change**: Document the change requirements and impact assessment
2. **Create SQL Script**: Write the SQL commands for the schema change
3. **Test in Development**: Apply the change to a development environment first
4. **Apply to Production**: Execute the SQL in the Supabase SQL Editor
5. **Document the Change**: Update this documentation with details of the change
6. **Notify Team**: Inform team members about the schema change
7. **Verify**: Check that the application works correctly with the new schema

## Common Database Operations

### Creating New Tables

When creating new tables:

1. Always include `created_at` and `updated_at` timestamp fields
2. Add appropriate indexes for frequently queried columns
3. Use proper data types (e.g., TEXT for variable-length strings)
4. Implement foreign key constraints for referential integrity
5. Add comments to document column purposes

Example:

```sql
CREATE TABLE new_table (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  related_id INTEGER REFERENCES other_table(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for frequently queried columns
CREATE INDEX idx_new_table_name ON new_table(name);

-- Add comments
COMMENT ON TABLE new_table IS 'Stores information about new features';
COMMENT ON COLUMN new_table.name IS 'Name of the feature';
```

### Modifying Existing Tables

When modifying existing tables:

1. Always backup data before structural changes
2. Consider backward compatibility
3. Use transactions for complex changes
4. Update application code before schema changes, when possible
5. Document the change in this file

Example:

```sql
-- Add a new column
ALTER TABLE existing_table ADD COLUMN new_field TEXT;

-- Modify a column type
ALTER TABLE existing_table ALTER COLUMN existing_field TYPE INTEGER USING existing_field::INTEGER;

-- Add a constraint
ALTER TABLE existing_table ADD CONSTRAINT check_positive CHECK (value > 0);
```

## Troubleshooting

### Common Issues

1. **Schema Cache Issues**:
   - Symptoms: Tables not appearing, recent changes not reflected
   - Solution: Refresh the Supabase dashboard or wait a few minutes

2. **Foreign Key Constraints**:
   - Symptoms: Cannot delete rows due to references
   - Solution: Update or delete dependent rows first, or use CASCADE

3. **Migration Failures**:
   - Symptoms: SQL execution errors, partial schema changes
   - Solution: Use transactions to ensure atomic changes

## Best Practices

1. **Documentation First**: Always update this documentation when making schema changes
2. **Backward Compatibility**: Maintain compatibility with existing code when possible
3. **Incremental Changes**: Make small, testable changes rather than large schema overhauls
4. **Use Transactions**: Wrap complex schema changes in transactions
5. **Indexing Strategy**: Index frequently queried columns, but avoid over-indexing
6. **Column Naming**: Use clear, consistent naming patterns
7. **Testing**: Test schema changes thoroughly in development before applying to production

## SQLite Implementation

The GitHub Explorer application supports SQLite as an alternative database backend for local development and testing. This section describes the SQLite implementation details.

### SQLite Schema

The SQLite schema is a simplified version of the Supabase schema, focusing on the core tables needed for the application. The primary table is:

#### closed_merge_requests_raw

Stores raw JSON data from GitHub API specifically for closed merge requests.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | INTEGER | NO | AUTOINCREMENT | Primary key (auto-incrementing integer) |
| entity_type | TEXT | YES | | Type of entity (repository, contributor, etc.) |
| github_id | TEXT | YES | | GitHub entity ID |
| data | TEXT | NO | | Raw JSON data from GitHub API stored as text |
| fetched_at | TEXT | YES | | When data was fetched |
| api_endpoint | TEXT | YES | | API endpoint used to fetch data |
| etag | TEXT | YES | | GitHub API ETag for caching |
| created_at | TEXT | NO | datetime('now') | Creation timestamp |

Additional tables (contributors, repositories, merge_requests, commits, contributor_repository) follow the same structure as in Supabase but with SQLite-compatible data types.

### Data Import/Export

To facilitate data transfer between Supabase and SQLite:

1. **Export from Supabase**:
   ```
   node export-raw-data-to-sqlite.js
   ```
   This script exports data from Supabase to a format that can be imported into SQLite.

2. **Import to SQLite**:
   ```
   node migrate_table.js
   ```
   This script creates the `closed_merge_requests_raw` table with proper auto-incrementing IDs and imports the data.

### Database Utility Functions

The application includes utility functions in `lib/database.js` that abstract the database backend:

```javascript
// Functions for closed merge requests data
export async function fetchClosedMergeRequest(entityType, githubId) {
  // Implementation details...
}

export async function storeClosedMergeRequest(record) {
  // Implementation details...
}

export async function queryClosedMergeRequests(entityType, options) {
  // Implementation details...
}

// Generic database functions
export async function getDb() {
  // Implementation details...
}

export async function closeDb() {
  // Implementation details...
}
```

### Using SQLite in Development

To use SQLite for local development:

1. Set environment variables in `.env`:
   ```
   DB_TYPE=sqlite
   DB_PATH=github_explorer.db
   ```

2. Initialize the database:
   ```
   sqlite3 github_explorer.db < manual_schema.sql
   ```

3. Import data:
   ```
   node migrate_table.js
   ```

4. Test the connection:
   ```
   node test-closed-merge-requests.js
   ```

The application code automatically detects the database type and uses the appropriate connection method.

### Database Size Optimization

We've optimized the SQLite database by:
1. Using auto-incrementing integer IDs instead of large string IDs
2. Properly indexing frequently queried columns
3. Structuring the database to specifically handle closed merge requests

These optimizations have resulted in a ~61% reduction in database size while maintaining full functionality.

---

*This document should be updated whenever there are changes to the database schema or management approach.* 