/**
 * Database Path Resolver
 * 
 * Standardizes database path resolution to ensure all components
 * use the same database file.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Determine server root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverRoot = path.resolve(__dirname, '../../');

/**
 * Get the absolute path to the main database file
 * Uses environment variable if set or falls back to standard location
 * @returns {string} Absolute path to database file
 */
export function getDbPath() {
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
export function getDbDir() {
  // Simply get the directory from the DB_PATH without creating anything
  return path.dirname(getDbPath());
}

export default getDbPath; 