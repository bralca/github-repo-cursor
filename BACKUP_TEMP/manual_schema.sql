-- SQLite Schema for GitHub Explorer
-- This file defines the basic tables needed for the GitHub Explorer application

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- github_raw_data table - Stores raw JSON data from GitHub API
CREATE TABLE IF NOT EXISTS github_raw_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT,
  github_id TEXT,
  data TEXT NOT NULL,
  fetched_at TEXT,
  api_endpoint TEXT,
  etag TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for github_raw_data
CREATE INDEX IF NOT EXISTS idx_github_raw_data_entity_github_id ON github_raw_data(entity_type, github_id);
CREATE INDEX IF NOT EXISTS idx_github_raw_data_fetched_at ON github_raw_data(fetched_at);

-- contributors table - Stores information about GitHub users
CREATE TABLE IF NOT EXISTS contributors (
  id TEXT PRIMARY KEY,
  github_id TEXT UNIQUE,
  username TEXT,
  name TEXT,
  avatar TEXT,
  bio TEXT,
  company TEXT,
  blog TEXT,
  twitter_username TEXT,
  location TEXT,
  followers INTEGER DEFAULT 0,
  repositories INTEGER DEFAULT 0,
  impact_score INTEGER DEFAULT 0,
  role_classification TEXT,
  top_languages TEXT, -- Stored as JSON array
  organizations TEXT, -- Stored as JSON array
  first_contribution TEXT,
  last_contribution TEXT,
  direct_commits INTEGER DEFAULT 0,
  pull_requests_merged INTEGER DEFAULT 0,
  pull_requests_rejected INTEGER DEFAULT 0,
  code_reviews INTEGER DEFAULT 0,
  is_placeholder BOOLEAN DEFAULT 0,
  is_enriched BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for contributors
CREATE INDEX IF NOT EXISTS idx_contributors_username ON contributors(username);
CREATE INDEX IF NOT EXISTS idx_contributors_github_id ON contributors(github_id);

-- repositories table - Stores information about GitHub repositories
CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  github_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  is_enriched BOOLEAN DEFAULT 0,
  health_percentage INTEGER,
  open_issues_count INTEGER DEFAULT 0,
  last_updated TEXT,
  size_kb INTEGER,
  watchers_count INTEGER DEFAULT 0,
  primary_language TEXT,
  license TEXT,
  source TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for repositories
CREATE INDEX IF NOT EXISTS idx_repositories_github_id ON repositories(github_id);
CREATE INDEX IF NOT EXISTS idx_repositories_name ON repositories(name);

-- contributor_repository table - Links contributors to repositories
CREATE TABLE IF NOT EXISTS contributor_repository (
  id TEXT PRIMARY KEY,
  contributor_id TEXT NOT NULL,
  repository_id TEXT NOT NULL,
  commit_count INTEGER DEFAULT 0,
  pull_requests INTEGER DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  issues_opened INTEGER DEFAULT 0,
  first_contribution_date TEXT,
  last_contribution_date TEXT,
  lines_added INTEGER DEFAULT 0,
  lines_removed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (contributor_id) REFERENCES contributors(id),
  FOREIGN KEY (repository_id) REFERENCES repositories(id)
);

-- Create indexes for contributor_repository
CREATE INDEX IF NOT EXISTS idx_contributor_repository_contributor ON contributor_repository(contributor_id);
CREATE INDEX IF NOT EXISTS idx_contributor_repository_repository ON contributor_repository(repository_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contributor_repository_unique ON contributor_repository(contributor_id, repository_id);

-- merge_requests table - Stores information about pull requests
CREATE TABLE IF NOT EXISTS merge_requests (
  id TEXT PRIMARY KEY,
  github_id INTEGER NOT NULL,
  repository_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  state TEXT NOT NULL,
  is_draft BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  closed_at TEXT,
  merged_at TEXT,
  merged_by_id TEXT,
  commits_count INTEGER DEFAULT 0,
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  changed_files INTEGER DEFAULT 0,
  complexity_score INTEGER,
  review_time_hours INTEGER,
  cycle_time_hours INTEGER,
  labels TEXT, -- Stored as JSON array
  source_branch TEXT,
  target_branch TEXT,
  FOREIGN KEY (repository_id) REFERENCES repositories(id),
  FOREIGN KEY (author_id) REFERENCES contributors(id),
  FOREIGN KEY (merged_by_id) REFERENCES contributors(id)
);

-- Create indexes for merge_requests
CREATE INDEX IF NOT EXISTS idx_merge_requests_github_id ON merge_requests(github_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_repository ON merge_requests(repository_id);
CREATE INDEX IF NOT EXISTS idx_merge_requests_author ON merge_requests(author_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_merge_requests_unique ON merge_requests(repository_id, github_id);

-- commits table - Stores information about commits
CREATE TABLE IF NOT EXISTS commits (
  id TEXT PRIMARY KEY,
  sha TEXT NOT NULL,
  repository_id TEXT NOT NULL,
  contributor_id TEXT,
  author TEXT,
  message TEXT NOT NULL,
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  files_changed INTEGER DEFAULT 0,
  is_merge_commit BOOLEAN DEFAULT 0,
  committed_at TEXT NOT NULL,
  pull_request_id TEXT,
  complexity_score INTEGER,
  is_placeholder_author BOOLEAN DEFAULT 0,
  parents TEXT, -- Stored as JSON array
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (repository_id) REFERENCES repositories(id),
  FOREIGN KEY (contributor_id) REFERENCES contributors(id),
  FOREIGN KEY (pull_request_id) REFERENCES merge_requests(id)
);

-- Create indexes for commits
CREATE INDEX IF NOT EXISTS idx_commits_sha ON commits(sha);
CREATE INDEX IF NOT EXISTS idx_commits_repository ON commits(repository_id);
CREATE INDEX IF NOT EXISTS idx_commits_contributor ON commits(contributor_id);
CREATE INDEX IF NOT EXISTS idx_commits_committed_at ON commits(committed_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_commits_unique ON commits(repository_id, sha); 