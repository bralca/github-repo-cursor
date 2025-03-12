-- Migration: Update ID columns to support GitHub's large IDs
-- Description: Changes integer ID columns to bigint to accommodate GitHub's large ID values

-- First, check if migration has already been applied
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE migration_name = '006_update_id_columns_for_github.sql') THEN
        -- Update repository_id in commits table
        ALTER TABLE commits
        ALTER COLUMN repository_id TYPE bigint;

        -- Update merge_request_id in commits table
        ALTER TABLE commits
        ALTER COLUMN merge_request_id TYPE bigint;

        -- Update repository_id in merge_requests table if it's integer
        ALTER TABLE merge_requests
        ALTER COLUMN repository_id TYPE bigint;

        -- Update foreign key references in contributor_repository if needed
        ALTER TABLE contributor_repository
        ALTER COLUMN repository_id TYPE bigint;

        -- Log successful migration
        INSERT INTO schema_migrations (migration_name, checksum, execution_time, success)
        VALUES ('006_update_id_columns_for_github.sql', md5('006_update_id_columns_for_github.sql'), 0, TRUE);
    END IF;
END
$$; 