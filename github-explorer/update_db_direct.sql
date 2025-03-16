-- Start transaction
BEGIN TRANSACTION;

-- Force recreation of closed_merge_requests_raw table
DROP TABLE IF EXISTS closed_merge_requests_raw_backup;
CREATE TABLE closed_merge_requests_raw_backup (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  github_id TEXT NOT NULL,
  data TEXT NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  api_endpoint TEXT,
  etag TEXT,
  is_processed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert example data to make sure the table is visible
INSERT INTO closed_merge_requests_raw_backup (entity_type, github_id, data, is_processed) 
VALUES ('merge_request', '12345', '{"title": "Sample merge request"}', 0);

-- Drop and recreate tables
DROP TABLE IF EXISTS closed_merge_requests_raw;
ALTER TABLE closed_merge_requests_raw_backup RENAME TO closed_merge_requests_raw;

-- Drop unwanted tables
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS raw_data;

-- Ensure core tables exist
CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  github_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  is_enriched INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contributors (
  id TEXT PRIMARY KEY,
  github_id BIGINT NOT NULL,
  username TEXT,
  name TEXT,
  avatar TEXT,
  is_enriched INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merge_requests (
  id TEXT PRIMARY KEY,
  github_id INTEGER NOT NULL,
  repository_id TEXT NOT NULL,
  title TEXT NOT NULL,
  state TEXT NOT NULL,
  is_enriched INTEGER DEFAULT 0,
  author_id TEXT NOT NULL,
  author_github_id BIGINT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repository_id) REFERENCES repositories(id),
  FOREIGN KEY (author_id) REFERENCES contributors(id)
);

CREATE TABLE IF NOT EXISTS commits (
  id TEXT PRIMARY KEY,
  github_id TEXT NOT NULL,
  sha TEXT NOT NULL,
  repository_id TEXT NOT NULL,
  message TEXT NOT NULL,
  complexity_score INTEGER,
  contributor_id TEXT,
  is_enriched INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (repository_id) REFERENCES repositories(id)
);

-- Commit changes
COMMIT; 