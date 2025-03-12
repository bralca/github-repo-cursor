-- Migration: 007_extend_bigint_support.sql
-- Description: Extend BIGINT support for all GitHub ID columns

-- Alter github_id in repositories table
ALTER TABLE IF EXISTS repositories
  ALTER COLUMN github_id TYPE BIGINT;

-- Alter github_id in contributors table
ALTER TABLE IF EXISTS contributors
  ALTER COLUMN github_id TYPE BIGINT;

-- Alter contributor_id in repository_contributors table
ALTER TABLE IF EXISTS repository_contributors
  ALTER COLUMN contributor_id TYPE BIGINT;

-- Alter contributor_id in commits table
ALTER TABLE IF EXISTS commits
  ALTER COLUMN contributor_id TYPE BIGINT;

-- Alter github_id in issues table
ALTER TABLE IF EXISTS issues
  ALTER COLUMN github_id TYPE BIGINT,
  ALTER COLUMN creator_id TYPE BIGINT,
  ALTER COLUMN assignee_id TYPE BIGINT;

-- Alter github_id in pull_requests table
ALTER TABLE IF EXISTS pull_requests
  ALTER COLUMN github_id TYPE BIGINT,
  ALTER COLUMN creator_id TYPE BIGINT,
  ALTER COLUMN merged_by_id TYPE BIGINT;

-- Log the migration
INSERT INTO schema_migrations (migration_name, checksum, execution_time, success)
VALUES ('007_extend_bigint_support.sql', md5('007_extend_bigint_support.sql'), 0, TRUE); 