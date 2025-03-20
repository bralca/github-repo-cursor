-- Migration script to combine commits and files_commits tables
-- This script will:
-- 1. Create a new combined table
-- 2. Insert data from both original tables
-- 3. Drop the old tables
-- 4. Rename the new table to "commits"

-- Begin transaction
BEGIN TRANSACTION;

-- Create the new combined table
CREATE TABLE new_commits (
  id TEXT PRIMARY KEY,
  github_id TEXT NOT NULL,  -- Commit SHA (shared across files in same commit)
  repository_id TEXT NOT NULL,
  repository_github_id BIGINT,
  contributor_id TEXT,
  contributor_github_id BIGINT,
  pull_request_id TEXT,
  pull_request_github_id INTEGER,
  message TEXT,
  committed_at TIMESTAMP,
  parents TEXT,            -- JSON array of parent commit SHAs
  filename TEXT,           -- Path of the changed file
  status TEXT,             -- Status of change (added, modified, deleted)
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  patch TEXT,              -- Actual diff/patch content
  complexity_score INTEGER,
  is_merge_commit BOOLEAN DEFAULT 0,
  is_enriched BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE SET NULL,
  FOREIGN KEY (pull_request_id) REFERENCES merge_requests(id) ON DELETE SET NULL
);

-- Create indices for the new table
CREATE INDEX idx_new_commits_github_id ON new_commits(github_id);
CREATE INDEX idx_new_commits_repository_id ON new_commits(repository_id);
CREATE INDEX idx_new_commits_contributor_id ON new_commits(contributor_id);
CREATE INDEX idx_new_commits_pull_request_id ON new_commits(pull_request_id);
CREATE INDEX idx_new_commits_filename ON new_commits(filename);
CREATE INDEX idx_new_commits_is_enriched ON new_commits(is_enriched);
CREATE INDEX idx_new_commits_committed_at ON new_commits(committed_at);

-- Insert data from both tables into the new combined table
INSERT INTO new_commits (
  id, github_id, repository_id, repository_github_id, 
  contributor_id, contributor_github_id, pull_request_id, pull_request_github_id,
  message, committed_at, parents, complexity_score, is_merge_commit, is_enriched,
  filename, status, additions, deletions, patch, created_at, updated_at
)
SELECT 
  fc.id, 
  c.github_id, 
  fc.repository_id, 
  fc.repository_github_id,
  fc.commit_author_id AS contributor_id, 
  fc.commit_author_github_id AS contributor_github_id, 
  fc.merge_request_id AS pull_request_id, 
  fc.merge_request_github_id AS pull_request_github_id,
  c.message, 
  c.committed_at, 
  c.parents, 
  c.complexity_score, 
  c.is_merge_commit, 
  c.is_enriched,
  fc.filename, 
  fc.status, 
  fc.additions, 
  fc.deletions, 
  fc.patch, 
  fc.created_at, 
  fc.updated_at
FROM files_commits fc
JOIN commits c ON fc.commit_id = c.id;

-- Note: In SQLite we can't verify row counts in a PL/SQL block, so we skip that check

-- Drop the old tables and recreate the main one
DROP TABLE files_commits;
DROP TABLE commits;

-- In SQLite we don't rename tables directly
-- Instead we create the final table and insert data from our new table
CREATE TABLE commits (
  id TEXT PRIMARY KEY,
  github_id TEXT NOT NULL,  -- Commit SHA (shared across files in same commit)
  repository_id TEXT NOT NULL,
  repository_github_id BIGINT,
  contributor_id TEXT,
  contributor_github_id BIGINT,
  pull_request_id TEXT,
  pull_request_github_id INTEGER,
  message TEXT,
  committed_at TIMESTAMP,
  parents TEXT,            -- JSON array of parent commit SHAs
  filename TEXT,           -- Path of the changed file
  status TEXT,             -- Status of change (added, modified, deleted)
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  patch TEXT,              -- Actual diff/patch content
  complexity_score INTEGER,
  is_merge_commit BOOLEAN DEFAULT 0,
  is_enriched BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
  FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE SET NULL,
  FOREIGN KEY (pull_request_id) REFERENCES merge_requests(id) ON DELETE SET NULL
);

-- Copy data from new_commits to commits
INSERT INTO commits SELECT * FROM new_commits;

-- Create indices for the final table
CREATE INDEX idx_commits_github_id ON commits(github_id);
CREATE INDEX idx_commits_repository_id ON commits(repository_id);
CREATE INDEX idx_commits_contributor_id ON commits(contributor_id);
CREATE INDEX idx_commits_pull_request_id ON commits(pull_request_id);
CREATE INDEX idx_commits_filename ON commits(filename);
CREATE INDEX idx_commits_is_enriched ON commits(is_enriched);
CREATE INDEX idx_commits_committed_at ON commits(committed_at);

-- Drop the temporary new_commits table
DROP TABLE new_commits;

-- Commit transaction
COMMIT; 