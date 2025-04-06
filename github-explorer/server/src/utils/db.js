import { getConnection } from '../db/connection-manager.js';

/**
 * Helper function to manage database connections
 * @param {Function} operation - Async function that takes a db connection and performs operations
 * @returns {Promise<any>} - Result of the operation
 */
export async function withDb(operation) {
  const db = await getConnection();
  try {
    return await operation(db);
  } catch (error) {
    throw error;
  }
} 