/**
 * Database Path Resolver
 * 
 * Standardizes database path resolution to ensure all components
 * use the same database file.
 */

/**
 * Get the absolute path to the main database file
 * Uses environment variable if set
 * @returns {string} Absolute path to database file
 */
export function getDbPath() {
  // Use DB_PATH from environment
  if (!process.env.DB_PATH) {
    throw new Error('DB_PATH environment variable is not set. Please configure it in your .env file.');
  }
  
  // Return the configured path
  return process.env.DB_PATH;
}

/**
 * Get the directory containing the database
 * @returns {string} Directory containing the database
 */
export function getDbDir() {
  // Simply get the directory from the DB_PATH without creating anything
  const path = require('path');
  return path.dirname(getDbPath());
}

export default getDbPath; 