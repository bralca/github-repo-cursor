/**
 * Sitemap Database Initialization
 * 
 * Sets up the database schema for tracking sitemap generation status.
 * Creates the sitemap_metadata table if it doesn't exist.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logger } from './logger.js';
import { getConnection } from '../db/connection-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initialize the sitemap_metadata table if it doesn't exist
 * @returns {Promise<void>}
 */
export async function initSitemapTable() {
  try {
    const db = await getConnection();
    
    // Check if table exists
    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='sitemap_metadata'"
    );
    
    if (!tableExists) {
      logger.info('Creating sitemap_metadata table');
      
      // Create the table
      await db.run(`
        CREATE TABLE IF NOT EXISTS sitemap_metadata (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entity_type TEXT NOT NULL UNIQUE,
          file_path TEXT,
          url_count INTEGER DEFAULT 0,
          last_build_date TEXT,
          current_page INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Initialize with default entity types
      await db.run(`
        INSERT INTO sitemap_metadata (entity_type) VALUES 
        ('repositories'),
        ('contributors'),
        ('merge_requests'),
        ('commits')
      `);
      
      logger.info('Sitemap_metadata table created and initialized');
    }
  } catch (error) {
    logger.error(`Error initializing sitemap table: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Ensure the sitemap directory exists
 * @returns {Promise<string>} Path to the sitemap directory
 */
export async function ensureSitemapDirectory() {
  try {
    const db = await getConnection();
    
    // Get the sitemap directory path
    const sitemapDir = path.join(__dirname, '../../public/sitemap');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(sitemapDir)) {
      fs.mkdirSync(sitemapDir, { recursive: true });
      logger.info(`Created sitemap directory: ${sitemapDir}`);
    }
    
    return sitemapDir;
  } catch (error) {
    logger.error(`Error ensuring sitemap directory: ${error.message}`, { error });
    throw error;
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
    db = await getConnection();
    
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
      // Connection is managed by connection manager, no need to close
    }
  }
}

export default { initSitemapTable, resetSitemapMetadata, ensureSitemapDirectory }; 