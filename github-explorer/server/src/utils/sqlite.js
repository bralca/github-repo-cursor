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
import { getConnection } from '../db/connection-manager.js';

/**
 * Open a connection to the SQLite database
 * @returns {Promise<Object>} SQLite database connection
 * @deprecated Use getConnection() from connection-manager.js instead
 */
export async function openSQLiteConnection() {
  logger.warn('DEPRECATED: openSQLiteConnection() is deprecated. Use getConnection() from connection-manager.js instead');
  
  // Use the connection manager to get a connection
  return getConnection();
}

/**
 * Close a SQLite database connection
 * @param {Object} db - SQLite database connection to close
 * @returns {Promise<void>}
 * @deprecated Connections are now managed by connection-manager.js
 */
export async function closeSQLiteConnection(db) {
  if (!db) {
    logger.warn('Attempted to close null database connection');
    return;
  }
  
  logger.warn('DEPRECATED: closeSQLiteConnection() is deprecated. Connections are now managed by connection-manager.js');
  
  // No need to close the connection as it's managed by the connection manager
  // Just log a warning but don't actually close
} 