/**
 * Sitemap Database Initialization
 * 
 * Sets up the database schema for tracking sitemap generation status.
 * Creates the sitemap_metadata table if it doesn't exist.
 */

import { openSQLiteConnection, closeSQLiteConnection } from './sqlite.js';
import { logger } from './logger.js';

/**
 * Initialize the sitemap_metadata table if it doesn't exist
 * @returns {Promise<void>}
 */
export async function initSitemapTable() {
  let db = null;
  
  try {
    logger.info('Initializing sitemap_metadata table...');
    db = await openSQLiteConnection();
    
    // Create the sitemap_metadata table if it doesn't exist
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS sitemap_metadata (
        entity_type TEXT PRIMARY KEY,
        current_page INTEGER NOT NULL DEFAULT 1,
        url_count INTEGER NOT NULL DEFAULT 0,
        last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await db.exec(createTableSql);
    
    // Check if we need to populate initial entity types
    const existingTypes = await db.all('SELECT entity_type FROM sitemap_metadata');
    const requiredTypes = ['repositories', 'contributors', 'merge_requests'];
    
    // Insert initial records for each entity type if they don't exist
    for (const type of requiredTypes) {
      if (!existingTypes.some(row => row.entity_type === type)) {
        await db.run(
          'INSERT INTO sitemap_metadata (entity_type, current_page, url_count) VALUES (?, ?, ?)',
          [type, 1, 0]
        );
        logger.info(`Initialized sitemap_metadata for entity type: ${type}`);
      }
    }
    
    logger.info('Sitemap database initialization completed successfully');
  } catch (error) {
    logger.error(`Error initializing sitemap database schema: ${error.message}`, { error });
    throw error;
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

/**
 * Reset sitemap tracking data (mainly for testing purposes)
 * @returns {Promise<void>}
 */
export async function resetSitemapMetadata() {
  let db = null;
  
  try {
    logger.info('Resetting sitemap metadata...');
    db = await openSQLiteConnection();
    
    await db.run(`
      UPDATE sitemap_metadata
      SET current_page = 1, url_count = 0, last_updated = CURRENT_TIMESTAMP
    `);
    
    logger.info('Sitemap metadata reset completed');
  } catch (error) {
    logger.error(`Error resetting sitemap metadata: ${error.message}`, { error });
    throw error;
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

export default { initSitemapTable, resetSitemapMetadata }; 