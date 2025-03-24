#!/bin/bash

# GitHub Explorer Server Startup Script
# This script initializes the database and then starts the server

# Enable error handling
set -e

# Function to log with timestamp
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Display current environment
log "Running in environment: $NODE_ENV"
log "Database path: $DB_PATH"

# Set default DB directory path if not provided
if [ -z "$DB_PATH" ]; then
  log "DB_PATH not set, using default server/db directory"
  export DB_PATH="./db/github_explorer.db"
fi

# Create database directory if it doesn't exist
mkdir -p ./db
log "Created database directory: ./db"

# Determine correct script path - try multiple approaches for reliability
SCRIPT_DIR="$(dirname "$(realpath "$0" 2>/dev/null)" 2>/dev/null || pwd)"
INIT_DB_SCRIPT="${SCRIPT_DIR}/scripts/init-db.js"
ABSOLUTE_SCRIPT_PATH="$(realpath "${INIT_DB_SCRIPT}" 2>/dev/null || echo '')"

log "Looking for init-db.js at: ${INIT_DB_SCRIPT}"
log "Absolute path (if available): ${ABSOLUTE_SCRIPT_PATH}"
log "Current directory: $(pwd)"

# Check if the script exists using multiple approaches for reliability
if [ -f "$INIT_DB_SCRIPT" ]; then
  log "Found init-db.js at $INIT_DB_SCRIPT"
  SCRIPT_TO_RUN="$INIT_DB_SCRIPT"
elif [ -f "./scripts/init-db.js" ]; then
  log "Found init-db.js at ./scripts/init-db.js"
  SCRIPT_TO_RUN="./scripts/init-db.js"
else
  log "Cannot find init-db.js. Listing available scripts:"
  ls -la ./scripts/ 2>/dev/null || log "Scripts directory not found or accessible"
  
  # Create a temporary directory for our script if needed
  mkdir -p ./scripts
  log "Creating init-db.js in ./scripts directory"
  
  # Write the initialization script
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
  warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
  success: (message, ...args) => console.log(`[SUCCESS] ${message}`, ...args)
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
 * Check if a table exists in the database
 */
async function tableExists(db, tableName) {
  try {
    const result = await db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, 
      [tableName]
    );
    return !!result;
  } catch (error) {
    logger.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

/**
 * Check if a column exists in a table
 */
async function columnExists(db, tableName, columnName) {
  try {
    const tableInfo = await db.all(`PRAGMA table_info(${tableName})`);
    return tableInfo.some(column => column.name === columnName);
  } catch (error) {
    logger.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
    return false;
  }
}

/**
 * Verify critical database components are properly initialized
 */
async function verifyDatabase(db) {
  const criticalTables = [
    'commits', 
    'contributor_repository', 
    'contributors', 
    'repositories', 
    'merge_requests',
    'pipeline_status'
  ];
  
  for (const table of criticalTables) {
    const exists = await tableExists(db, table);
    if (!exists) {
      logger.error(`CRITICAL: Table '${table}' is missing from the database!`);
      return false;
    }
  }
  
  // Check for critical columns
  const commitsHasCommittedAt = await columnExists(db, 'commits', 'committed_at');
  if (!commitsHasCommittedAt) {
    logger.error(`CRITICAL: Column 'committed_at' is missing from the 'commits' table!`);
    return false;
  }
  
  // Check for pipeline_status entries
  const pipelineStatusEntries = await db.all('SELECT pipeline_type FROM pipeline_status');
  if (pipelineStatusEntries.length === 0) {
    logger.error(`CRITICAL: No entries in the pipeline_status table!`);
    return false;
  }
  
  logger.success(`Database verification successful! All critical tables and columns are present.`);
  return true;
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
    
    // Create tables exactly as they appear in development database
    logger.info('Creating contributors table...');
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
    logger.success('Contributors table created or already exists');
    
    logger.info('Creating repositories table...');
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
    logger.success('Repositories table created or already exists');
    
    logger.info('Creating merge_requests table...');
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
    logger.success('Merge requests table created or already exists');
    
    logger.info('Creating contributor_repository table...');
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
    logger.success('Contributor repository table created or already exists');
    
    // Create indices for contributors
    logger.info('Creating indices for contributors...');
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_contributors_github_id ON contributors(github_id);
      CREATE INDEX IF NOT EXISTS idx_contributors_username ON contributors(username);
    `);
    
    // Create indices for repositories
    logger.info('Creating indices for repositories...');
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_repositories_github_id ON repositories(github_id);
      CREATE INDEX IF NOT EXISTS idx_repositories_full_name ON repositories(full_name);
      CREATE INDEX IF NOT EXISTS idx_repositories_owner_github_id ON repositories(owner_github_id);
      CREATE INDEX IF NOT EXISTS idx_repositories_owner_id ON repositories(owner_id);
    `);
    
    // Create indices for merge requests
    logger.info('Creating indices for merge requests...');
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
    logger.info('Creating indices for contributor repository...');
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_contrib_repo_contributor_id ON contributor_repository(contributor_id);
      CREATE INDEX IF NOT EXISTS idx_contrib_repo_contributor_github_id ON contributor_repository(contributor_github_id);
      CREATE INDEX IF NOT EXISTS idx_contrib_repo_repository_id ON contributor_repository(repository_id);
      CREATE INDEX IF NOT EXISTS idx_contrib_repo_repository_github_id ON contributor_repository(repository_github_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_contrib_repo_unique ON contributor_repository(contributor_id, repository_id);
    `);
    
    // Pipeline Management Tables
    
    logger.info('Creating pipeline_schedules table...');
    // Pipeline Schedules
    await db.exec(`
      CREATE TABLE IF NOT EXISTS pipeline_schedules (
        id TEXT PRIMARY KEY,
        pipeline_type TEXT NOT NULL,
        cron_expression TEXT,
        is_active BOOLEAN DEFAULT 0,
        parameters TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
        description TEXT,
        UNIQUE(pipeline_type)
      );
    `);
    logger.success('Pipeline schedules table created or already exists');
    
    logger.info('Creating pipeline_history table...');
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
    logger.success('Pipeline history table created or already exists');
    
    logger.info('Creating pipeline_status table...');
    // Pipeline Status - exactly as in development
    await db.exec(`
      CREATE TABLE IF NOT EXISTS pipeline_status (
        pipeline_type TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        is_running INTEGER NOT NULL DEFAULT 0,
        last_run TIMESTAMP,
        updated_at TIMESTAMP NOT NULL
      );
    `);
    logger.success('Pipeline status table created or already exists');
    
    // Create indices for pipeline tables
    logger.info('Creating indices for pipeline tables...');
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_type ON pipeline_schedules(pipeline_type);
      CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_active ON pipeline_schedules(is_active);
      CREATE INDEX IF NOT EXISTS idx_pipeline_history_type ON pipeline_history(pipeline_type);
      CREATE INDEX IF NOT EXISTS idx_pipeline_history_status ON pipeline_history(status);
      CREATE INDEX IF NOT EXISTS idx_pipeline_history_started_at ON pipeline_history(started_at);
    `);
    
    // Raw Data Tables
    
    logger.info('Creating closed_merge_requests_raw table...');
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
    logger.success('Closed merge requests raw table created or already exists');
    
    // Create triggers for timestamps
    logger.info('Creating triggers for timestamps...');
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
    
    logger.info('Creating commits table...');
    // Commits table - exactly as in development
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
    logger.success('Commits table created or already exists');
    
    // Create indices for commits
    logger.info('Creating indices for commits...');
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
    
    logger.info('Creating sitemap_metadata table...');
    // Sitemap Metadata - exactly as in development
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sitemap_metadata (
        entity_type TEXT PRIMARY KEY, 
        current_page INTEGER NOT NULL DEFAULT 1, 
        url_count INTEGER NOT NULL DEFAULT 0, 
        last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.success('Sitemap metadata table created or already exists');
    
    // Analytics Tables
    
    logger.info('Creating contributor_rankings table...');
    // Contributor Rankings - exactly as in development
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
        repo_influence_score REAL NOT NULL,
        followers_score REAL NOT NULL,
        profile_completeness_score REAL NOT NULL,
        followers_count INTEGER NOT NULL,
        raw_lines_added INTEGER NOT NULL,
        raw_lines_removed INTEGER NOT NULL,
        raw_commits_count INTEGER NOT NULL,
        repositories_contributed INTEGER NOT NULL,
        calculation_timestamp TIMESTAMP NOT NULL, 
        collaboration_score REAL DEFAULT 30, 
        repo_popularity_score REAL DEFAULT 0,
        FOREIGN KEY (contributor_id) REFERENCES contributors(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_contributor_rankings_contributor_id 
        ON contributor_rankings(contributor_id);
      CREATE INDEX IF NOT EXISTS idx_contributor_rankings_timestamp 
        ON contributor_rankings(calculation_timestamp);
      CREATE INDEX IF NOT EXISTS idx_contributor_rankings_rank 
        ON contributor_rankings(rank_position);
    `);
    logger.success('Contributor rankings table created or already exists');
    
    // Insert default values for pipeline_status table
    logger.info('Setting up default pipeline status records...');
    await db.exec(`
      INSERT OR IGNORE INTO pipeline_status (pipeline_type, status, is_running, updated_at) 
      VALUES 
        ('github-repo-sync', 'idle', 0, CURRENT_TIMESTAMP),
        ('github-pr-sync', 'idle', 0, CURRENT_TIMESTAMP),
        ('github-commit-sync', 'idle', 0, CURRENT_TIMESTAMP),
        ('github-contributor-sync', 'idle', 0, CURRENT_TIMESTAMP),
        ('github-contributor-enrichment', 'idle', 0, CURRENT_TIMESTAMP),
        ('sitemap-generation', 'idle', 0, CURRENT_TIMESTAMP),
        ('contributor-ranking', 'idle', 0, CURRENT_TIMESTAMP);
    `);
    logger.success('Default pipeline status records created');
    
    // Verify the created tables
    logger.info('Verifying database integrity...');
    const isValid = await verifyDatabase(db);
    
    if (!isValid) {
      logger.error('Database verification failed! Some critical components are missing.');
      throw new Error('Database verification failed');
    }
    
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    logger.info('Database tables created:', tables.map(t => t.name).join(', '));
    
    logger.success('Database initialization completed successfully');
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

  SCRIPT_TO_RUN="./scripts/init-db.js"
  log "Created init-db.js script at $SCRIPT_TO_RUN"
fi

# Initialize the database
log "Initializing database using: $SCRIPT_TO_RUN"
node "$SCRIPT_TO_RUN"
DB_INIT_RESULT=$?

# Check if database initialization was successful
if [ $DB_INIT_RESULT -ne 0 ]; then
    log "Database initialization failed with code $DB_INIT_RESULT! Exiting..."
    exit 1
fi

log "Database initialization successful"

# Validate the database structure after initialization
log "Validating database structure..."

# Simple validation query 
node -e "
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function validateDb() {
  const dbPath = process.env.DB_PATH || './db/github_explorer.db';
  console.log('Validating database at: ' + dbPath);
  
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Check critical tables
    const tables = await db.all(\"SELECT name FROM sqlite_master WHERE type='table'\");
    const tableNames = tables.map(t => t.name);
    console.log('Found tables:', tableNames.join(', '));
    
    const criticalTables = [
      'commits', 
      'contributor_repository', 
      'contributors', 
      'repositories', 
      'pipeline_status'
    ];
    
    for (const table of criticalTables) {
      if (!tableNames.includes(table)) {
        console.error(\`CRITICAL: Table '\${table}' is missing!\`);
        process.exit(1);
      }
    }
    
    // Check for committed_at column in commits table
    const commitsCols = await db.all('PRAGMA table_info(commits)');
    const hasCommittedAt = commitsCols.some(col => col.name === 'committed_at');
    if (!hasCommittedAt) {
      console.error(\"CRITICAL: 'committed_at' column is missing from commits table!\");
      process.exit(1);
    }
    
    // Check pipeline_status entries
    const pipelineEntries = await db.get('SELECT COUNT(*) as count FROM pipeline_status');
    if (pipelineEntries.count === 0) {
      console.error(\"CRITICAL: No entries in pipeline_status table!\");
      process.exit(1);
    }
    
    console.log('Database validation successful!');
    await db.close();
  } catch (err) {
    console.error('Database validation failed:', err);
    process.exit(1);
  }
}

validateDb();
"

DB_VALIDATION_RESULT=$?

if [ $DB_VALIDATION_RESULT -ne 0 ]; then
    log "Database validation failed with code $DB_VALIDATION_RESULT! Exiting..."
    exit 1
fi

log "Database validation successful"

# Start the server
log "Starting server..."
exec node src/server.js 