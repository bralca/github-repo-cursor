# Database Migrations

This directory contains database migration scripts for the GitHub Explorer application.

## Available Migrations

- `combine-commits-tables.sql`: Combines the `commits` and `files_commits` tables into a single `commits` table to simplify the database schema and improve performance.

## Running Migrations

To run a migration:

1. Make sure the server is not running to avoid data corruption
2. Navigate to the migrations directory
3. Run the migration script using Node.js

```bash
cd github-explorer/server/src/migrations
node run-migration.js combine-commits-tables.sql
```

## Migration: Combining Commits Tables

The `combine-commits-tables.sql` migration merges the `commits` and `files_commits` tables into a single `commits` table with the following structure:

- `id`: Primary key (UUID)
- `github_id`: Commit SHA hash
- `repository_id`: Repository UUID foreign key
- `repository_github_id`: GitHub's internal ID for the repository
- `contributor_id`: Contributor UUID foreign key
- `contributor_github_id`: GitHub's internal ID for the contributor
- `pull_request_id`: Pull request UUID foreign key
- `pull_request_github_id`: Pull request number within the repository
- `message`: Commit message
- `committed_at`: When the commit was made
- `parents`: JSON array of parent commit SHAs
- `filename`: Path of the file that was changed
- `status`: Status of the file change (added, modified, removed)
- `additions`: Number of lines added to this file
- `deletions`: Number of lines removed from this file
- `patch`: The actual diff/patch content
- `complexity_score`: AI-generated complexity score
- `is_merge_commit`: Whether this is a merge commit
- `is_enriched`: Whether the commit has been enriched with additional data
- `created_at`: When this record was created
- `updated_at`: When this record was last updated

### Changes to Database Structure

This migration:

1. Preserves all data from both tables
2. Removes redundant fields:
   - `sha` (duplicate of `github_id`)
   - `author` (we use `contributor_id` instead)
3. Standardizes field naming
4. The combined table includes proper foreign key constraints

### Impact on Queries

After this migration:

- Each commit that changes multiple files will have multiple rows, one per file
- Queries for commit metadata need to be conscious of this 1:many relationship
- Use distinct when querying metadata to avoid duplicates

### Backup Recommendation

Before running this migration, it's recommended to create a backup of your database:

```bash
cp github_explorer.db github_explorer.db.backup
``` 