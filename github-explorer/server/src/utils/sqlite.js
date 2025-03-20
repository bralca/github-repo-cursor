/**
 * SQLite Database Connection Utilities
 * 
 * Provides standardized functions for opening and closing SQLite database connections.
 * This adapter uses the same connection logic as verify-db-connection.js but provides
 * the specific function names expected by the pipeline controller.
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { getDbPath } from './db-path.js';
import { logger } from './logger.js';

/**
 * Open a connection to the SQLite database
 * @returns {Promise<Object>} SQLite database connection
 */
export async function openSQLiteConnection() {
  const dbPath = getDbPath();
  
  logger.debug(`Opening SQLite database connection at: ${dbPath}`);
  
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Set pragmas for better performance
    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec('PRAGMA synchronous = NORMAL;');
    await db.exec('PRAGMA foreign_keys = ON;');
    
    logger.debug('Successfully opened SQLite database connection');
    return db;
  } catch (error) {
    logger.error(`Failed to open SQLite database: ${error.message}`, {
      error,
      dbPath
    });
    throw error;
  }
}

/**
 * Close a SQLite database connection
 * @param {Object} db - SQLite database connection to close
 * @returns {Promise<void>}
 */
export async function closeSQLiteConnection(db) {
  if (!db) {
    logger.warn('Attempted to close null database connection');
    return;
  }
  
  try {
    logger.debug('Closing SQLite database connection');
    await db.close();
    logger.debug('SQLite database connection closed successfully');
  } catch (error) {
    logger.error(`Error closing SQLite database connection: ${error.message}`, { error });
    throw error;
  }
} 