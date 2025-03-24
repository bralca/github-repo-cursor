#!/bin/bash

# GitHub Explorer Server Startup Script
# This script initializes the database and then starts the server

# Display current environment
echo "Running in environment: $NODE_ENV"
echo "Database path: $DB_PATH"

# Set default DB directory path if not provided
if [ -z "$DB_PATH" ]; then
  echo "DB_PATH not set, using default server/db directory"
  export DB_PATH="./db/github_explorer.db"
fi

# Create database directory if it doesn't exist
mkdir -p ./db
echo "Created database directory: ./db"

# Determine correct script path
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
INIT_DB_SCRIPT="${SCRIPT_DIR}/scripts/init-db.js"

if [ ! -f "$INIT_DB_SCRIPT" ]; then
  echo "Cannot find init-db.js at $INIT_DB_SCRIPT"
  echo "Current directory: $(pwd)"
  echo "Listing files in scripts directory:"
  ls -la ./scripts/
  
  # Let's create the script directly here as a fallback
  echo "Creating init-db.js in ./scripts directory"
  mkdir -p ./scripts
  
  cat > ./scripts/init-db.js << 'EOL'
/**
 * SQLite Database Initialization Script
 * 
 * This script initializes the SQLite database with the exact schema used in the application.
 * It creates all necessary tables, indices, and triggers according to the schema.
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Simple logger for render.com compatibility
const logger = {
  info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
  error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args)
};

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverRoot = path.resolve(__dirname, '../');

/**
 * Get the absolute path to the main database file
 * Uses environment variable if set or falls back to standard location
 * @returns {string} Absolute path to database file
 */
function getDbPath() {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  
  // Fall back to the standard location within the server directory
  return path.resolve(serverRoot, 'db/github_explorer.db');
}

/**
 * Get the directory containing the database
 * @returns {string} Directory containing the database
 */
function getDbDir() {
  // Simply get the directory from the DB_PATH without creating anything
  return path.dirname(getDbPath());
}

/**
 * Initialize the database with all required tables and indexes
 */
async function initializeDatabase() {
  const dbPath = getDbPath();
  const dbDir = getDbDir();
  
  // Create database directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    logger.info(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  logger.info(`Initializing SQLite database at: ${dbPath}`);
  
  // Open database connection
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  try {
    // Enable foreign keys support
    await db.exec('PRAGMA foreign_keys = ON;');
    
    // Core Entity Tables
    
    // Contributors table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS contributors (
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
        enrichment_attempts INTEGER DEFAULT 0,
        is_bot BOOLEAN DEFAULT 0,
        UNIQUE(github_id)
      );
    `);
    
    // Repositories table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS repositories (
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
        enrichment_attempts INTEGER DEFAULT 0,
        FOREIGN KEY (owner_id) REFERENCES contributors(id) ON DELETE SET NULL,
        UNIQUE(github_id),
        UNIQUE(full_name)
      );
    `);
    
    // Merge Requests table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS merge_requests (
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
        enrichment_attempts INTEGER DEFAULT 0,
        FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES contributors(id) ON DELETE CASCADE,
        FOREIGN KEY (merged_by_id) REFERENCES contributors(id) ON DELETE SET NULL,
        UNIQUE(repository_id, github_id)
      );
    `);
    
    // Contributor Repository junction table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS contributor_repository (
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
    `);
    
    // Create indices for contributors
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_contributors_github_id ON contributors(github_id);
      CREATE INDEX IF NOT EXISTS idx_contributors_username ON contributors(username);
    `);
    
    // Create indices for repositories
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_repositories_github_id ON repositories(github_id);
      CREATE INDEX IF NOT EXISTS idx_repositories_full_name ON repositories(full_name);
      CREATE INDEX IF NOT EXISTS idx_repositories_owner_github_id ON repositories(owner_github_id);
      CREATE INDEX IF NOT EXISTS idx_repositories_owner_id ON repositories(owner_id);
    `);
    
    // Create indices for merge requests
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_merge_requests_github_id ON merge_requests(github_id);
      CREATE INDEX IF NOT EXISTS idx_merge_requests_repository_id ON merge_requests(repository_id);
      CREATE INDEX IF NOT EXISTS idx_merge_requests_repository_github_id ON merge_requests(repository_github_id);
      CREATE INDEX IF NOT EXISTS idx_merge_requests_author_id ON merge_requests(author_id);
      CREATE INDEX IF NOT EXISTS idx_merge_requests_author_github_id ON merge_requests(author_github_id);
      CREATE INDEX IF NOT EXISTS idx_merge_requests_merged_by_github_id ON merge_requests(merged_by_github_id);
      CREATE INDEX IF NOT EXISTS idx_merge_requests_state ON merge_requests(state);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_merge_requests_repo_pr ON merge_requests(repository_github_id, github_id);
    `);
    
    // Create indices for contributor repository
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_contrib_repo_contributor_id ON contributor_repository(contributor_id);
      CREATE INDEX IF NOT EXISTS idx_contrib_repo_contributor_github_id ON contributor_repository(contributor_github_id);
      CREATE INDEX IF NOT EXISTS idx_contrib_repo_repository_id ON contributor_repository(repository_id);
      CREATE INDEX IF NOT EXISTS idx_contrib_repo_repository_github_id ON contributor_repository(repository_github_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_contrib_repo_unique ON contributor_repository(contributor_id, repository_id);
    `);
    
    // Pipeline Management Tables
    
    // Pipeline Schedules
    await db.exec(`
      CREATE TABLE IF NOT EXISTS pipeline_schedules (
        id TEXT PRIMARY KEY,
        pipeline_type TEXT NOT NULL,
        cron_expression TEXT,
        is_active BOOLEAN DEFAULT 0,
        parameters TEXT,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(pipeline_type)
      );
    `);
    
    // Pipeline History
    await db.exec(`
      CREATE TABLE IF NOT EXISTS pipeline_history (
        id TEXT PRIMARY KEY,
        pipeline_type TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        items_processed INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Pipeline Status
    await db.exec(`
      CREATE TABLE IF NOT EXISTS pipeline_status (
        pipeline_type TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        is_running INTEGER NOT NULL DEFAULT 0,
        last_run TIMESTAMP,
        updated_at TIMESTAMP NOT NULL
      );
    `);
    
    // Create indices for pipeline tables
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_type ON pipeline_schedules(pipeline_type);
      CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_active ON pipeline_schedules(is_active);
      CREATE INDEX IF NOT EXISTS idx_pipeline_history_type ON pipeline_history(pipeline_type);
      CREATE INDEX IF NOT EXISTS idx_pipeline_history_status ON pipeline_history(status);
      CREATE INDEX IF NOT EXISTS idx_pipeline_history_started_at ON pipeline_history(started_at);
    `);
    
    // Raw Data Tables
    
    // Raw Merge Requests
    await db.exec(`
      CREATE TABLE IF NOT EXISTS closed_merge_requests_raw (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        data TEXT NOT NULL,
        is_processed INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_closed_mr_is_processed ON closed_merge_requests_raw(is_processed);
    `);
    
    // Create triggers for timestamps
    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_closed_merge_requests_raw_created_at 
      AFTER INSERT ON closed_merge_requests_raw 
      BEGIN 
        UPDATE closed_merge_requests_raw 
        SET created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id = new.id; 
      END;
      
      CREATE TRIGGER IF NOT EXISTS update_closed_merge_requests_raw_updated_at 
      AFTER UPDATE ON closed_merge_requests_raw 
      BEGIN 
        UPDATE closed_merge_requests_raw 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = new.id; 
      END;
    `);
    
    // Commits table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS commits (
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
        enrichment_attempts INTEGER DEFAULT 0,
        FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
        FOREIGN KEY (contributor_id) REFERENCES contributors(id) ON DELETE SET NULL,
        FOREIGN KEY (pull_request_id) REFERENCES merge_requests(id) ON DELETE SET NULL
      );
    `);
    
    // Create indices for commits
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_commits_github_id ON commits(github_id);
      CREATE INDEX IF NOT EXISTS idx_commits_repository_id ON commits(repository_id);
      CREATE INDEX IF NOT EXISTS idx_commits_contributor_id ON commits(contributor_id);
      CREATE INDEX IF NOT EXISTS idx_commits_pull_request_id ON commits(pull_request_id);
      CREATE INDEX IF NOT EXISTS idx_commits_filename ON commits(filename);
      CREATE INDEX IF NOT EXISTS idx_commits_is_enriched ON commits(is_enriched);
      CREATE INDEX IF NOT EXISTS idx_commits_committed_at ON commits(committed_at);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_commits_unique ON commits(github_id, repository_id, filename);
    `);
    
    // SEO Management Tables
    
    // Sitemap Metadata
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sitemap_metadata (
        entity_type TEXT PRIMARY KEY,
        current_page INTEGER NOT NULL DEFAULT 1,
        url_count INTEGER NOT NULL DEFAULT 0,
        last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Analytics Tables
    
    // Contributor Rankings
    await db.exec(`
      CREATE TABLE IF NOT EXISTS contributor_rankings (
        id TEXT PRIMARY KEY,
        contributor_id TEXT NOT NULL,
        contributor_github_id BIGINT NOT NULL,
        rank_position INTEGER NOT NULL,
        total_score REAL NOT NULL,
        code_volume_score REAL NOT NULL,
        code_efficiency_score REAL NOT NULL,
        commit_impact_score REAL NOT NULL,
        collaboration_score REAL DEFAULT 30,
        repo_popularity_score REAL DEFAULT 0,
        repo_influence_score REAL NOT NULL,
        followers_score REAL NOT NULL,
        profile_completeness_score REAL NOT NULL,
        followers_count INTEGER NOT NULL,
        raw_lines_added INTEGER NOT NULL,
        raw_lines_removed INTEGER NOT NULL,
        raw_commits_count INTEGER NOT NULL,
        repositories_contributed INTEGER NOT NULL,
        calculation_timestamp TIMESTAMP NOT NULL,
        FOREIGN KEY (contributor_id) REFERENCES contributors(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_contributor_rankings_contributor_id ON contributor_rankings(contributor_id);
      CREATE INDEX IF NOT EXISTS idx_contributor_rankings_timestamp ON contributor_rankings(calculation_timestamp);
      CREATE INDEX IF NOT EXISTS idx_contributor_rankings_rank ON contributor_rankings(rank_position);
    `);
    
    // Verify the created tables
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    logger.info('Database tables created:', tables.map(t => t.name).join(', '));
    
    logger.info('Database initialization completed successfully');
  } catch (error) {
    logger.error('Error initializing database:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run the initialization
initializeDatabase().catch(err => {
  logger.error('Failed to initialize database:', err);
  process.exit(1);
});
EOL
  
  INIT_DB_SCRIPT="./scripts/init-db.js"
fi

# Initialize the database
echo "Initializing database..."
node "$INIT_DB_SCRIPT"
DB_INIT_RESULT=$?

# Check if database initialization was successful
if [ $DB_INIT_RESULT -ne 0 ]; then
    echo "Database initialization failed with code $DB_INIT_RESULT! Exiting..."
    exit 1
fi

echo "Database initialization successful"

# Start the server
echo "Starting server..."
exec node src/server.js 