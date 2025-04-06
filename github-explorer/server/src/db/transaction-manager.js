/**
 * Transaction Manager
 * 
 * Provides utilities for managing database transactions,
 * including support for nested transactions via savepoints.
 */

import { getConnection } from './connection-manager.js';
import { logger } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';

// Symbol used to store transaction state on connection object
const TX_STATE_SYMBOL = Symbol('transactionState');

/**
 * Initialize transaction state on a connection if not already present
 * @param {Object} db - Database connection
 * @returns {Object} Transaction state object
 */
function initTxState(db) {
  if (!db[TX_STATE_SYMBOL]) {
    db[TX_STATE_SYMBOL] = {
      transactionLevel: 0,
      savepoints: []
    };
  }
  return db[TX_STATE_SYMBOL];
}

/**
 * Begin a new transaction or savepoint
 * @param {Object} db - Database connection
 * @returns {Promise<void>}
 */
async function beginTransaction(db) {
  const txState = initTxState(db);
  
  if (txState.transactionLevel === 0) {
    // Start a new transaction
    logger.debug('Beginning new database transaction');
    await db.exec('BEGIN TRANSACTION');
  } else {
    // Create a savepoint for nested transaction
    const savepointName = `sp_${txState.transactionLevel}`;
    logger.debug(`Creating savepoint: ${savepointName} (level: ${txState.transactionLevel})`);
    await db.exec(`SAVEPOINT ${savepointName}`);
    txState.savepoints.push(savepointName);
  }
  
  txState.transactionLevel++;
}

/**
 * Commit a transaction or savepoint
 * @param {Object} db - Database connection
 * @returns {Promise<void>}
 */
async function commitTransaction(db) {
  const txState = initTxState(db);
  
  if (txState.transactionLevel === 0) {
    logger.warn('Attempted to commit a transaction that was not started');
    return;
  }
  
  txState.transactionLevel--;
  
  if (txState.transactionLevel === 0) {
    // Commit the top-level transaction
    logger.debug('Committing database transaction');
    await db.exec('COMMIT');
  } else {
    // Release the savepoint for nested transaction
    const savepointName = txState.savepoints.pop();
    logger.debug(`Releasing savepoint: ${savepointName} (level: ${txState.transactionLevel})`);
    await db.exec(`RELEASE ${savepointName}`);
  }
}

/**
 * Rollback a transaction or savepoint
 * @param {Object} db - Database connection
 * @returns {Promise<void>}
 */
async function rollbackTransaction(db) {
  const txState = initTxState(db);
  
  if (txState.transactionLevel === 0) {
    logger.warn('Attempted to rollback a transaction that was not started');
    return;
  }
  
  if (txState.transactionLevel === 1) {
    // Rollback the top-level transaction
    logger.debug('Rolling back database transaction');
    await db.exec('ROLLBACK');
  } else {
    // Rollback to the savepoint for nested transaction
    const savepointName = txState.savepoints.pop();
    logger.debug(`Rolling back to savepoint: ${savepointName} (level: ${txState.transactionLevel - 1})`);
    await db.exec(`ROLLBACK TO ${savepointName}`);
  }
  
  txState.transactionLevel--;
}

/**
 * Execute a function within a transaction
 * Automatically handles commit/rollback and supports nested transactions
 * 
 * @param {Function} fn - Function to execute within the transaction 
 *                       (receives the db connection as its argument)
 * @param {Object} options - Transaction options
 * @returns {Promise<any>} Result of the function execution
 */
async function withTransaction(fn, options = {}) {
  const db = await getConnection();
  
  await beginTransaction(db);
  
  try {
    // Execute the function with the database connection
    const result = await fn(db);
    
    // Commit the transaction if everything succeeded
    await commitTransaction(db);
    
    return result;
  } catch (error) {
    // Log the error
    logger.error('Error in transaction, rolling back', { 
      error,
      transactionLevel: db[TX_STATE_SYMBOL]?.transactionLevel || 0
    });
    
    // Rollback the transaction
    try {
      await rollbackTransaction(db);
    } catch (rollbackError) {
      logger.error('Failed to rollback transaction', { error: rollbackError });
      // Don't throw rollback error - throw the original error below
    }
    
    // Re-throw the original error
    throw error;
  }
}

/**
 * Execute a function within a transaction with retry capability
 * Combines transaction management with retry logic for transient errors
 * 
 * @param {Function} fn - Function to execute within transaction
 * @param {Object} options - Options including retry configuration
 * @returns {Promise<any>} Result of the function execution
 */
async function withTransactionRetry(fn, options = {}) {
  return withRetry(() => withTransaction(fn, options), options);
}

export {
  withTransaction,
  withTransactionRetry,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
}; 