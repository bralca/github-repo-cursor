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
import { logger } from '../utils/logger.js';
import { resolve } from 'path';

// Connection state
let db = null;
let isConnecting = false;
let connectionQueue = [];
let lastConnectAttempt = 0;
const RECONNECT_DELAY = 1000; // 1 second minimum between connection attempts

// Database configuration
const DB_PATH = process.env.DB_PATH || resolve('./db/github_explorer.db');

/**
 * Get a database connection
 * @returns {Promise<Object>} Database connection
 */
export async function getConnection() {
  // If we already have a valid connection, return it
  if (db) {
    try {
      // Test the connection with a simple query
      await db.get('SELECT 1');
      return db;
    } catch (error) {
      logger.warn('Existing connection is invalid, creating a new one', { error: error.message });
      // Continue to create a new connection
      db = null;
    }
  }

  // If a connection is in progress, wait for it
  if (isConnecting) {
    return new Promise((resolve, reject) => {
      connectionQueue.push({ resolve, reject });
    });
  }

  // Rate limit connection attempts
  const now = Date.now();
  if (now - lastConnectAttempt < RECONNECT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
  }
  
  // Set connecting flag and update timestamp
  isConnecting = true;
  lastConnectAttempt = Date.now();

  try {
    logger.info(`Opening persistent SQLite connection at: ${DB_PATH}`);
    
    // Open SQLite database connection
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    // Configure connection
    await db.exec('PRAGMA journal_mode = WAL');
    await db.exec('PRAGMA synchronous = NORMAL');
    await db.exec('PRAGMA temp_store = MEMORY');
    await db.exec('PRAGMA cache_size = -20000'); // 20MB cache
    
    // Add event handler for process termination
    setupConnectionCleanup();
    
    // Resolve all waiting promises with the new connection
    connectionQueue.forEach(({ resolve }) => resolve(db));
    connectionQueue = [];
    
    return db;
  } catch (error) {
    logger.error(`Failed to open database connection: ${error.message}`, { error });
    
    // Reject all waiting promises
    connectionQueue.forEach(({ reject }) => reject(error));
    connectionQueue = [];
    
    throw error;
  } finally {
    isConnecting = false;
  }
}

/**
 * Close the database connection
 * This should only be called during application shutdown
 */
async function closeConnection() {
  if (db) {
    try {
      logger.info('Closing database connection...');
      await db.close();
      logger.info('Database connection closed successfully');
      db = null;
    } catch (error) {
      logger.error(`Error closing database connection: ${error.message}`, { error });
      throw error;
    }
  }
}

/**
 * Set up cleanup handlers to close the database connection on process exit
 */
function setupConnectionCleanup() {
  // Only set up listeners once
  if (process.listenerCount('SIGINT') === 0) {
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT signal, shutting down...');
      await closeConnection();
      process.exit(0);
    });
  }
  
  if (process.listenerCount('SIGTERM') === 0) {
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM signal, shutting down...');
      await closeConnection();
      process.exit(0);
    });
  }
  
  if (process.listenerCount('unhandledRejection') === 0) {
    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled promise rejection, initiating shutdown', { 
        reason: reason?.message || reason, 
        stack: reason?.stack
      });
      await closeConnection();
    });
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
  if (db) {
    try {
      await db.close().catch(err => {
        logger.debug('Error during connection reset close (expected)', { error: err });
      });
    } catch (error) {
      logger.debug('Error during connection reset (expected)', { error });
    } finally {
      db = null;
    }
  }
  
  // Clear any pending connection promises
  connectionQueue = [];
  
  // Create a fresh connection
  return getConnection();
}

/**
 * Check if the connection is active
 * @returns {boolean} True if connection exists
 */
function hasActiveConnection() {
  return db !== null;
}

/**
 * Reset database connection (for testing)
 * Warning: Only use this in tests!
 */
function _resetConnectionForTesting() {
  db = null;
  isConnecting = false;
  connectionQueue = [];
  lastConnectAttempt = 0;
}

// Export public methods
export {
  resetConnection,
  hasActiveConnection,
  closeConnection,
  _resetConnectionForTesting
}; 