/**
 * Database Path Resolver
 * 
 * Standardizes database path resolution to ensure all components
 * use the same database file at the workspace root.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Get the absolute path to the main database file
 * Uses environment variable if set, otherwise defaults to workspace root
 * @returns {string} Absolute path to database file
 */
export function getDbPath() {
  // If DB_PATH is set in environment, use that
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  
  // Otherwise, resolve to workspace root
  const modulePath = fileURLToPath(import.meta.url);
  const moduleDir = dirname(modulePath);
  
  // Navigate up to workspace root (4 levels up from utils folder)
  // server/src/utils → server/src → server → github-explorer → workspace-root
  return path.resolve(moduleDir, '../../../../github_explorer.db');
}

/**
 * Get the directory containing the database
 * @returns {string} Directory containing the database
 */
export function getDbDir() {
  return path.dirname(getDbPath());
}

export default getDbPath; 