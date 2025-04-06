/**
 * SQLite Connection Manager
 * 
 * A singleton module that maintains a persistent database connection
 * to prevent "database is locked" errors during concurrent operations.
 * Provides centralized connection management with proper configuration
 * and error handling.
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { getDbPath } from '../utils/db-path.js';
import { logger } from '../utils/logger.js';

// Private module-level variables
let _dbConnection = null;
let _connectionPromise = null;
let _isClosing = false;

// Connection configuration
const CONNECTION_CONFIG = {
  busyTimeout: 5000,    // 5 seconds
  maxRetryCount: 3,
  journalMode: 'WAL'    // Write-Ahead Logging
};

/**
 * Check if connection is valid and working
 * @param {Object} db - Database connection to test
 * @returns {Promise<boolean>} True if connection is valid
 */
async function isConnectionValid(db) {
  if (!db) return false;
  
  try {
    // Simple test query to check connection 
    await db.get('SELECT 1 as test');
    return true;
  } catch (error) {
    logger.error('Connection validation failed', { 
      error,
      message: error.message 
    });
    return false;
  }
}

/**
 * Initialize and get the shared database connection
 * @returns {Promise<object>} Database connection
 */
async function getConnection() {
  // If we're in the process of closing, wait before opening a new connection
  if (_isClosing) {
    logger.warn('Attempting to get connection while previous one is closing. Waiting...');
    await new Promise(resolve => setTimeout(resolve, 100));
    return getConnection();
  }

  // If we already have a connection, verify it's still valid
  if (_dbConnection) {
    // Check if connection is valid before returning it
    try {
      const isValid = await isConnectionValid(_dbConnection);
      if (isValid) {
        return _dbConnection;
      } else {
        logger.warn('Existing connection is invalid, creating a new one');
        _dbConnection = null; // Clear invalid connection
      }
    } catch (error) {
      logger.warn('Error checking connection validity, will create new connection', { error });
      _dbConnection = null; // Clear potentially problematic connection
    }
  }

  // If we're already connecting, return the promise
  if (_connectionPromise) {
    return _connectionPromise;
  }

  // Create a new connection promise
  _connectionPromise = (async () => {
    try {
      const dbPath = getDbPath();
      logger.info(`Opening persistent SQLite connection at: ${dbPath}`);

      // Open the database connection
      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      // Configure connection settings
      await db.exec(`PRAGMA busy_timeout = ${CONNECTION_CONFIG.busyTimeout};`);
      await db.exec(`PRAGMA journal_mode = ${CONNECTION_CONFIG.journalMode};`);
      await db.exec('PRAGMA synchronous = NORMAL;');
      await db.exec('PRAGMA foreign_keys = ON;');

      // Test the connection
      const result = await db.get('SELECT sqlite_version() as version');
      logger.info(`SQLite connection established successfully (version: ${result.version})`);

      _dbConnection = db;
      return db;
    } catch (error) {
      logger.error('Failed to establish SQLite connection', { error });
      _connectionPromise = null;
      throw error;
    }
  })();

  try {
    return await _connectionPromise;
  } finally {
    _connectionPromise = null;
  }
}

/**
 * Close the shared database connection
 * @returns {Promise<void>}
 */
async function closeConnection() {
  if (!_dbConnection) {
    logger.debug('No active connection to close');
    return;
  }

  // Set flag to prevent new connections during close
  _isClosing = true;

  try {
    logger.info('Closing SQLite connection');
    await _dbConnection.close();
    logger.info('SQLite connection closed successfully');
  } catch (error) {
    logger.error('Error closing SQLite connection', { error });
    throw error;
  } finally {
    _dbConnection = null;
    _isClosing = false;
  }
}

/**
 * Reset the database connection
 * Can be called when encountering a "database is closed" error
 * @returns {Promise<Object>} New database connection
 */
async function resetConnection() {
  logger.info('Resetting database connection');
  
  // Force close any existing connection without throwing errors
  if (_dbConnection) {
    try {
      await _dbConnection.close().catch(err => {
        logger.debug('Error during connection reset close (expected)', { error: err });
      });
    } catch (error) {
      logger.debug('Error during connection reset (expected)', { error });
    } finally {
      _dbConnection = null;
    }
  }
  
  // Clear any pending connection promises
  _connectionPromise = null;
  _isClosing = false;
  
  // Create a fresh connection
  return getConnection();
}

/**
 * Check if the connection is active
 * @returns {boolean} True if connection exists
 */
function hasActiveConnection() {
  return _dbConnection !== null;
}

/**
 * Reset database connection (for testing)
 * Warning: Only use this in tests!
 */
function _resetConnectionForTesting() {
  _dbConnection = null;
  _connectionPromise = null;
  _isClosing = false;
}

// Export public methods
export {
  getConnection,
  closeConnection,
  resetConnection,
  hasActiveConnection,
  _resetConnectionForTesting // Only export for testing
}; 