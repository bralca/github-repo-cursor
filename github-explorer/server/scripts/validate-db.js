/**
 * Database Validation Script
 * This script validates that the database has the expected structure for the application.
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getConnection } from '../src/db/connection-manager.js';

// Simple logger for compatibility
const logger = {
  info: (message, ...args) => console.log(message, ...args),
  error: (message, ...args) => console.error(message, ...args),
  warn: (message, ...args) => console.warn(message, ...args)
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
 * Validate the database structure
 */
async function validateDatabase() {
  const dbPath = getDbPath();
  console.log(`Validating database at: ${dbPath}`);
  
  try {
    // Get database connection from connection manager
    const db = await getConnection();
    
    // Check critical tables
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables.map(t => t.name);
    console.log(`Found tables: ${tableNames.join(', ')}`);
    
    const criticalTables = [
      'commits', 
      'contributor_repository', 
      'contributors', 
      'repositories', 
      'pipeline_status'
    ];
    
    for (const table of criticalTables) {
      if (!tableNames.includes(table)) {
        logger.error(`CRITICAL: Table '${table}' is missing!`);
        process.exit(1);
      }
    }
    
    // Check for committed_at column in commits table
    const commitsCols = await db.all('PRAGMA table_info(commits)');
    const hasCommittedAt = commitsCols.some(col => col.name === 'committed_at');
    if (!hasCommittedAt) {
      logger.error("CRITICAL: 'committed_at' column is missing from commits table!");
      process.exit(1);
    }
    
    // Check pipeline_status entries
    const pipelineEntries = await db.get('SELECT COUNT(*) as count FROM pipeline_status');
    if (pipelineEntries.count === 0) {
      logger.error("CRITICAL: No entries in pipeline_status table!");
      process.exit(1);
    }
    
    console.log('Database validation successful!');
  } catch (error) {
    logger.error('Error validating database:', error);
    process.exit(1);
  }
  // Connection is managed by connection manager, no need to close
}

// Run validation
validateDatabase(); 