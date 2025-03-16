-- SQLite schema cleanup script
-- This script removes the leftover backup table and ensures all indices are created

-- Begin transaction
BEGIN TRANSACTION;

-- Drop the leftover backup table
DROP TABLE IF EXISTS commits_backup;

-- Ensure all indexes are created
CREATE INDEX IF NOT EXISTS idx_commits_github_id ON commits(github_id);
CREATE INDEX IF NOT EXISTS idx_commits_sha ON commits(sha);
CREATE INDEX IF NOT EXISTS idx_commits_repository_id ON commits(repository_id);
CREATE INDEX IF NOT EXISTS idx_commits_repository_github_id ON commits(repository_github_id);
CREATE INDEX IF NOT EXISTS idx_commits_contributor_id ON commits(contributor_id);
CREATE INDEX IF NOT EXISTS idx_commits_contributor_github_id ON commits(contributor_github_id);
CREATE INDEX IF NOT EXISTS idx_commits_pull_request_id ON commits(pull_request_id);
CREATE INDEX IF NOT EXISTS idx_commits_pull_request_github_id ON commits(pull_request_github_id);
CREATE INDEX IF NOT EXISTS idx_commits_committed_at ON commits(committed_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_commits_repo_sha ON commits(repository_github_id, github_id);

CREATE INDEX IF NOT EXISTS idx_contributors_github_id ON contributors(github_id);
CREATE INDEX IF NOT EXISTS idx_contributors_username ON contributors(username);

CREATE INDEX IF NOT EXISTS idx_repositories_github_id ON repositories(github_id);
CREATE INDEX IF NOT EXISTS idx_repositories_full_name ON repositories(full_name);
CREATE INDEX IF NOT EXISTS idx_repositories_owner_github_id ON repositories(owner_github_id);
CREATE INDEX IF NOT EXISTS idx_repositories_owner_id ON repositories(owner_id);

CREATE INDEX IF NOT EXISTS idx_merge_requests_github_id ON merge_requests(github_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_repository_id ON merge_requests(repository_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_repository_github_id ON merge_requests(repository_github_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_author_id ON merge_requests(author_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_author_github_id ON merge_requests(author_github_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_merged_by_github_id ON merge_requests(merged_by_github_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_state ON merge_requests(state);
CREATE UNIQUE INDEX IF NOT EXISTS idx_merge_requests_repo_pr ON merge_requests(repository_github_id, github_id);

CREATE INDEX IF NOT EXISTS idx_contrib_repo_contributor_id ON contributor_repository(contributor_id);
CREATE INDEX IF NOT EXISTS idx_contrib_repo_contributor_github_id ON contributor_repository(contributor_github_id);
CREATE INDEX IF NOT EXISTS idx_contrib_repo_repository_id ON contributor_repository(repository_id);
CREATE INDEX IF NOT EXISTS idx_contrib_repo_repository_github_id ON contributor_repository(repository_github_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contrib_repo_unique ON contributor_repository(contributor_id, repository_id);

CREATE INDEX IF NOT EXISTS idx_cmr_raw_entity_type ON closed_merge_requests_raw(entity_type);
CREATE INDEX IF NOT EXISTS idx_closed_merge_requests_raw_entity_github_id ON closed_merge_requests_raw(entity_type, github_id);
CREATE INDEX IF NOT EXISTS idx_closed_merge_requests_raw_fetched_at ON closed_merge_requests_raw(fetched_at);

-- Analyze all tables to optimize query planning
ANALYZE;

-- Commit all changes
COMMIT;

-- Optimize the database (must be outside transaction)
VACUUM;

-- Set optimal pragmas for performance
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -20000; -- 20MB cache 