import { openSQLiteConnection, closeSQLiteConnection } from './sqlite.js';

/**
 * Helper function to manage database connections
 * @param {Function} operation - Async function that takes a db connection and performs operations
 * @returns {Promise<any>} - Result of the operation
 */
export async function withDb(operation) {
  const db = await openSQLiteConnection();
  try {
    return await operation(db);
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
} 