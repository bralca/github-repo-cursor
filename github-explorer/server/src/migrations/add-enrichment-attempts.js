/**
 * Add enrichment_attempts column to all entity tables
 * 
 * This migration adds a new column to track the number of enrichment attempts
 * for repositories, contributors, merge_requests, and commits tables.
 */

import { getConnection } from '../db/connection-manager.js';
import { logger } from '../utils/logger.js';

/**
 * Migration to add enrichment_attempts column to repositories and contributors tables
 */
export async function migrate() {
  try {
    logger.info('Running migration: add-enrichment-attempts');
    const db = await getConnection();
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Add enrichment_attempts column to repositories table if it doesn't exist
      await db.run(`
        ALTER TABLE repositories 
        ADD COLUMN enrichment_attempts INTEGER DEFAULT 0
      `).catch(err => {
        // Ignore error if column already exists
        if (!err.message.includes('duplicate column name')) {
          throw err;
        }
      });
      
      // Add enrichment_attempts column to contributors table if it doesn't exist
      await db.run(`
        ALTER TABLE contributors 
        ADD COLUMN enrichment_attempts INTEGER DEFAULT 0
      `).catch(err => {
        // Ignore error if column already exists
        if (!err.message.includes('duplicate column name')) {
          throw err;
        }
      });
      
      // Add enrichment_attempts column to merge_requests table if it doesn't exist
      await db.run(`
        ALTER TABLE merge_requests 
        ADD COLUMN enrichment_attempts INTEGER DEFAULT 0
      `).catch(err => {
        // Ignore error if column already exists
        if (!err.message.includes('duplicate column name')) {
          throw err;
        }
      });
      
      // Commit transaction
      await db.run('COMMIT');
      logger.info('Migration completed successfully: add-enrichment-attempts');
    } catch (error) {
      // Rollback transaction on error
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Migration failed: add-enrichment-attempts', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (process.argv[1].includes('add-enrichment-attempts.js')) {
  migrate().then(() => {
    logger.info('Migration finished');
    process.exit(0);
  }).catch(error => {
    logger.error('Migration failed', error);
    process.exit(1);
  });
} 