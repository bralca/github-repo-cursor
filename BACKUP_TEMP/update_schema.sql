-- SQLite schema update script
-- This script updates the database schema to match the documented structure in DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md

-- Enable foreign keys
PRAGMA foreign_keys = OFF;

-- Begin transaction to ensure all changes are atomic
BEGIN TRANSACTION;

-- ============================
-- Update Contributors Table
-- ============================
-- Create a backup of the contributors table
CREATE TABLE contributors_backup AS SELECT * FROM contributors;

-- Drop the old table
DROP TABLE contributors;

-- Create the new contributors table with updated schema
CREATE TABLE contributors (
    id TEXT PRIMARY KEY, -- UUID
    github_id BIGINT NOT NULL,
    username TEXT,  -- Now nullable for unknown contributors
    name TEXT,
    avatar TEXT,  -- Renamed from avatar_url
    is_enriched BOOLEAN DEFAULT 0,
    bio TEXT,
    company TEXT,
    blog TEXT,
    twitter_username TEXT,
    location TEXT,
    followers INTEGER DEFAULT 0,  -- Renamed from followers_count
    repositories INTEGER DEFAULT 0,  -- Renamed from public_repos_count
    impact_score INTEGER DEFAULT 0,
    role_classification TEXT,
    top_languages TEXT,  -- JSON array
    organizations TEXT,  -- JSON array
    first_contribution TIMESTAMP,
    last_contribution TIMESTAMP,
    direct_commits INTEGER DEFAULT 0,
    pull_requests_merged INTEGER DEFAULT 0,
    pull_requests_rejected INTEGER DEFAULT 0,
    code_reviews INTEGER DEFAULT 0,
    is_placeholder BOOLEAN DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(github_id)
);

-- Fix duplicate github_id issue by creating a temporary view to get unique contributors
CREATE TEMPORARY VIEW unique_contributors AS
SELECT 
    id, 
    github_id, 
    username, 
    name, 
    avatar_url, 
    bio, 
    company, 
    location, 
    blog, 
    twitter_username, 
    followers_count, 
    public_repos_count, 
    created_at, 
    updated_at
FROM contributors_backup
GROUP BY github_id;  -- This will select one row for each unique github_id

-- Restore data from backup using the unique view
INSERT INTO contributors (
    id, 
    github_id, 
    username, 
    name, 
    avatar, 
    bio, 
    company, 
    location, 
    blog, 
    twitter_username, 
    followers, 
    repositories, 
    created_at, 
    updated_at
)
SELECT 
    id, 
    CAST(github_id AS BIGINT), 
    username, 
    name, 
    avatar_url, 
    bio, 
    company, 
    location, 
    blog, 
    twitter_username, 
    followers_count, 
    public_repos_count, 
    created_at, 
    updated_at
FROM unique_contributors;

-- Drop the backup table
DROP TABLE contributors_backup;

-- Create indices for contributors
CREATE INDEX IF NOT EXISTS idx_contributors_github_id ON contributors(github_id);
CREATE INDEX IF NOT EXISTS idx_contributors_username ON contributors(username);

-- ============================
-- Update Repositories Table
-- ============================
-- Create a backup of the repositories table
CREATE TABLE repositories_backup AS SELECT * FROM repositories;

-- Drop the old table
DROP TABLE repositories;

-- Create the new repositories table with updated schema
CREATE TABLE repositories (
    id TEXT PRIMARY KEY, -- UUID
    github_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    description TEXT,
    url TEXT,  -- Make URL nullable to prevent NOT NULL constraint errors
    api_url TEXT,
    stars INTEGER DEFAULT 0,
    forks INTEGER DEFAULT 0,
    is_enriched BOOLEAN DEFAULT 0,
    health_percentage INTEGER,
    open_issues_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP,
    size_kb INTEGER,
    watchers_count INTEGER DEFAULT 0,
    primary_language TEXT,
    license TEXT,
    is_fork BOOLEAN DEFAULT 0,
    is_archived BOOLEAN DEFAULT 0,
    default_branch TEXT DEFAULT 'main' NOT NULL,
    source TEXT DEFAULT 'github_api' NOT NULL,
    owner_id TEXT,  -- Now nullable
    owner_github_id BIGINT,  -- Added for direct querying
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES contributors(id) ON DELETE SET NULL,
    UNIQUE(github_id),
    UNIQUE(full_name)
);

-- Restore data from backup
INSERT INTO repositories (
    id,
    github_id,
    name,
    full_name,
    description,
    url,
    stars,
    forks,
    open_issues_count,
    size_kb,
    watchers_count,
    primary_language,
    license,
    is_fork,
    is_archived,
    default_branch,
    owner_id,
    created_at,
    updated_at
)
SELECT 
    id,
    CAST(github_id AS BIGINT),
    name,
    full_name,
    description,
    html_url,
    stargazers_count,
    forks_count,
    open_issues_count,
    size,
    watchers_count,
    language,
    license,
    is_fork,
    archived,
    default_branch,
    owner_id,
    created_at,
    updated_at
FROM repositories_backup;

-- Update owner_github_id based on the contributors table
UPDATE repositories
SET owner_github_id = (
    SELECT github_id 
    FROM contributors 
    WHERE id = repositories.owner_id
)
WHERE owner_id IS NOT NULL;

-- Drop the backup table
DROP TABLE repositories_backup;

-- Create indices for repositories
CREATE INDEX IF NOT EXISTS idx_repositories_github_id ON repositories(github_id);
CREATE INDEX IF NOT EXISTS idx_repositories_full_name ON repositories(full_name);
CREATE INDEX IF NOT EXISTS idx_repositories_owner_github_id ON repositories(owner_github_id);
CREATE INDEX IF NOT EXISTS idx_repositories_owner_id ON repositories(owner_id);

-- ============================
-- Update Merge Requests Table
-- ============================
-- Create a backup of the merge_requests table
CREATE TABLE merge_requests_backup AS SELECT * FROM merge_requests;

-- Drop the old table
DROP TABLE merge_requests;

-- Create the new merge_requests table with updated schema
CREATE TABLE merge_requests (
    id TEXT PRIMARY KEY, -- UUID
    github_id INTEGER NOT NULL,  -- PR number
    repository_id TEXT NOT NULL,
    repository_github_id BIGINT,  -- Added for direct querying
    author_id TEXT NOT NULL,
    author_github_id BIGINT,  -- Added for direct querying
    title TEXT NOT NULL,
    description TEXT,
    state TEXT NOT NULL,  -- 'open', 'closed', 'merged'
    is_draft BOOLEAN DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    merged_at TIMESTAMP,
    merged_by_id TEXT,
    merged_by_github_id BIGINT,  -- Added for direct querying
    commits_count INTEGER DEFAULT 0,
    additions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    changed_files INTEGER DEFAULT 0,
    complexity_score INTEGER,
    review_time_hours INTEGER,
    cycle_time_hours INTEGER,
    labels TEXT,  -- JSON array
    source_branch TEXT,
    target_branch TEXT,
    is_enriched BOOLEAN DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES contributors(id) ON DELETE CASCADE,
    FOREIGN KEY (merged_by_id) REFERENCES contributors(id) ON DELETE SET NULL,
    UNIQUE(repository_id, github_id)
);

-- Restore data from merge_requests_backup
INSERT INTO merge_requests (
    id,
    github_id,
    repository_id,
    author_id,
    title,
    description,
    state,
    is_draft,
    created_at,
    updated_at,
    closed_at,
    merged_at,
    commits_count,
    additions,
    deletions,
    changed_files,
    labels
)
SELECT 
    id,
    CAST(number AS INTEGER),  -- Use number as github_id
    repository_id,
    user_id,
    title,
    body,
    state,
    draft,
    created_at,
    updated_at,
    closed_at,
    merged_at,
    commits_count,
    additions_count,
    deletions_count,
    changed_files_count,
    labels
FROM merge_requests_backup;

-- Update repository_github_id based on the repositories table
UPDATE merge_requests
SET repository_github_id = (
    SELECT github_id
    FROM repositories
    WHERE id = merge_requests.repository_id
);

-- Update author_github_id based on the contributors table
UPDATE merge_requests
SET author_github_id = (
    SELECT github_id
    FROM contributors
    WHERE id = merge_requests.author_id
);

-- Drop the backup table
DROP TABLE merge_requests_backup;

-- Create indices for merge_requests
CREATE INDEX IF NOT EXISTS idx_merge_requests_github_id ON merge_requests(github_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_repository_id ON merge_requests(repository_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_repository_github_id ON merge_requests(repository_github_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_author_id ON merge_requests(author_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_author_github_id ON merge_requests(author_github_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_merged_by_github_id ON merge_requests(merged_by_github_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_state ON merge_requests(state);
CREATE UNIQUE INDEX IF NOT EXISTS idx_merge_requests_repo_pr ON merge_requests(repository_github_id, github_id);

-- ============================
-- Update Commits Table
-- ============================
-- Create a backup of the commits table
CREATE TABLE commits_backup AS SELECT * FROM commits;

-- Drop the old table
DROP TABLE commits;

-- Create the new commits table with updated schema
CREATE TABLE commits (
    id TEXT PRIMARY KEY, -- UUID
    github_id TEXT NOT NULL,  -- SHA
    sha TEXT NOT NULL,  -- For compatibility
    repository_id TEXT NOT NULL,
    repository_github_id BIGINT,  -- Added for direct querying
    contributor_id TEXT,
    contributor_github_id BIGINT,  -- Added for direct querying
    author TEXT,  -- For backward compatibility
    message TEXT NOT NULL,
    additions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    files_changed INTEGER DEFAULT 0,
    is_merge_commit BOOLEAN DEFAULT 0,
    committed_at TIMESTAMP,  -- Allow null for compatibility with existing data
    pull_request_id TEXT,
    pull_request_github_id INTEGER,  -- Added for direct querying
    complexity_score INTEGER,
    is_placeholder_author BOOLEAN DEFAULT 0,
    parents TEXT,  -- JSON array of parent SHAs
    is_enriched BOOLEAN DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
    FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE SET NULL,
    FOREIGN KEY (pull_request_id) REFERENCES merge_requests(id) ON DELETE SET NULL,
    UNIQUE(repository_id, github_id)
);

-- Restore data from commits_backup
INSERT INTO commits (
    id,
    github_id,
    sha,
    repository_id,
    contributor_id,
    author,
    message,
    committed_at,
    created_at,
    updated_at
)
SELECT 
    id,
    sha,
    sha,
    repository_id,
    author_id,
    (SELECT username FROM contributors WHERE id = commits_backup.author_id),
    message,
    author_date,
    created_at,
    updated_at
FROM commits_backup;

-- Update repository_github_id based on the repositories table
UPDATE commits
SET repository_github_id = (
    SELECT github_id
    FROM repositories
    WHERE id = commits.repository_id
);

-- Update contributor_github_id based on the contributors table
UPDATE commits
SET contributor_github_id = (
    SELECT github_id
    FROM contributors
    WHERE id = commits.contributor_id
)
WHERE contributor_id IS NOT NULL;

-- Create indices for commits
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

-- ============================
-- Update Contributor_Repository Table
-- ============================
-- Create a backup of the contributor_repository table
CREATE TABLE contributor_repository_backup AS SELECT * FROM contributor_repository;

-- Drop the old table
DROP TABLE contributor_repository;

-- Create the new contributor_repository table with updated schema
CREATE TABLE contributor_repository (
    id TEXT PRIMARY KEY, -- UUID
    contributor_id TEXT NOT NULL,
    contributor_github_id BIGINT,  -- Added for direct querying
    repository_id TEXT NOT NULL,
    repository_github_id BIGINT,  -- Added for direct querying
    commit_count INTEGER DEFAULT 0,
    pull_requests INTEGER DEFAULT 0,
    reviews INTEGER DEFAULT 0,
    issues_opened INTEGER DEFAULT 0,
    first_contribution_date TIMESTAMP,
    last_contribution_date TIMESTAMP,
    lines_added INTEGER DEFAULT 0,
    lines_removed INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE CASCADE,
    FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
    UNIQUE(contributor_id, repository_id)
);

-- Restore data from contributor_repository_backup
INSERT INTO contributor_repository (
    id,
    contributor_id,
    repository_id,
    commit_count,
    created_at,
    updated_at
)
SELECT 
    id,
    contributor_id,
    repository_id,
    contributions_count,
    created_at,
    updated_at
FROM contributor_repository_backup
-- Make sure the contributor and repository references still exist
WHERE EXISTS (SELECT 1 FROM contributors WHERE id = contributor_id)
AND EXISTS (SELECT 1 FROM repositories WHERE id = repository_id);

-- Update contributor_github_id based on the contributors table
UPDATE contributor_repository
SET contributor_github_id = (
    SELECT github_id
    FROM contributors
    WHERE id = contributor_repository.contributor_id
);

-- Update repository_github_id based on the repositories table
UPDATE contributor_repository
SET repository_github_id = (
    SELECT github_id
    FROM repositories
    WHERE id = contributor_repository.repository_id
);

-- Drop the backup table
DROP TABLE contributor_repository_backup;

-- Create indices for contributor_repository
CREATE INDEX IF NOT EXISTS idx_contrib_repo_contributor_id ON contributor_repository(contributor_id);
CREATE INDEX IF NOT EXISTS idx_contrib_repo_contributor_github_id ON contributor_repository(contributor_github_id);
CREATE INDEX IF NOT EXISTS idx_contrib_repo_repository_id ON contributor_repository(repository_id);
CREATE INDEX IF NOT EXISTS idx_contrib_repo_repository_github_id ON contributor_repository(repository_github_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contrib_repo_unique ON contributor_repository(contributor_id, repository_id);

-- ============================
-- Update closed_merge_requests_raw Table
-- ============================

-- Table is already good, just add any missing indices
CREATE INDEX IF NOT EXISTS idx_cmr_raw_entity_type ON closed_merge_requests_raw(entity_type);

-- Commit all changes
COMMIT;

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;

-- Create database optimization pragmas
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -20000; -- 20MB cache 