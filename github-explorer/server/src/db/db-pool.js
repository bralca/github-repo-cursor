import { getConnection, resetConnection } from './connection-manager.js';
import { logger } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';

// Create database connection pool
const pool = {
  async query(sql, params = [], retryAttempt = 0) {
    try {
      // Get the persistent connection from the connection manager
      let db = await getConnection();
      
      // Wrap in retry to handle potential database lock issues
      return await withRetry(async () => {
        // For SELECT queries
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          const result = await db.all(sql, params);
          return { rows: result };
        } 
        // For other queries (INSERT, UPDATE, DELETE, etc.)
        else {
          const result = await db.run(sql, params);
          return { 
            rowCount: result.changes,
            lastID: result.lastID
          };
        }
      }, {
        retryableErrors: [
          'SQLITE_BUSY',
          'SQLITE_LOCKED',
          'database is locked'
        ],
        // Fewer retries for database locked errors since we have a separate
        // retry mechanism for connection closed errors
        retries: 3
      });
    } catch (error) {
      logger.error('Error executing database query', { 
        error, 
        errorMessage: error.message,
        errorStack: error.stack,
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
        params,
        retryAttempt
      });
      
      // If the database is closed, reset the connection and retry once
      if ((error.code === 'SQLITE_MISUSE' || error.message.includes('database is closed')) && retryAttempt === 0) {
        logger.warn('Database connection appears to be closed, resetting connection and retrying query');
        try {
          await resetConnection();
          logger.info('Successfully reset database connection, retrying query');
          // Retry the query once with the new connection
          return this.query(sql, params, retryAttempt + 1);
        } catch (resetError) {
          logger.error('Failed to reset database connection', { error: resetError });
          // Continue with throwing the original error
        }
      }
      
      throw error;
    }
  }
};

export { pool }; 