/**
 * Add enrichment_attempts column to all entity tables
 * 
 * This migration adds a new column to track the number of enrichment attempts
 * for repositories, contributors, merge_requests, and commits tables.
 */

import { openSQLiteConnection } from '../utils/sqlite.js';
import { setupLogger } from '../utils/logger.js';

const logger = setupLogger('migration-add-enrichment-attempts');

/**
 * Execute the migration
 */
export async function execute() {
  logger.info('Starting migration: Add enrichment_attempts column to entity tables');
  
  let db;
  try {
    // Open a database connection
    db = await openSQLiteConnection();
    
    // Add enrichment_attempts column to repositories table
    logger.info('Adding enrichment_attempts column to repositories table');
    await db.run(`
      ALTER TABLE repositories 
      ADD COLUMN enrichment_attempts INTEGER DEFAULT 0
    `);
    
    // Add enrichment_attempts column to contributors table
    logger.info('Adding enrichment_attempts column to contributors table');
    await db.run(`
      ALTER TABLE contributors 
      ADD COLUMN enrichment_attempts INTEGER DEFAULT 0
    `);
    
    // Add enrichment_attempts column to merge_requests table
    logger.info('Adding enrichment_attempts column to merge_requests table');
    await db.run(`
      ALTER TABLE merge_requests 
      ADD COLUMN enrichment_attempts INTEGER DEFAULT 0
    `);
    
    // Add enrichment_attempts column to commits table
    logger.info('Adding enrichment_attempts column to commits table');
    await db.run(`
      ALTER TABLE commits 
      ADD COLUMN enrichment_attempts INTEGER DEFAULT 0
    `);
    
    logger.info('Migration completed successfully');
  } catch (error) {
    logger.error('Error executing migration:', error);
    throw error;
  } finally {
    // Close the database connection
    if (db) {
      await db.close();
    }
  }
}

// If this script is run directly (not imported), execute the migration
if (process.argv[1].endsWith('add-enrichment-attempts.js')) {
  execute()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
} 