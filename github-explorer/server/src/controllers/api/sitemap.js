import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../utils/logger.js';
import generateAllSitemaps from '../../../scripts/generate-sitemap.js';

// Constants
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const SITEMAP_INDEX_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

/**
 * Get the current status of sitemap generation
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getSitemapStatus(req, res) {
  let db = null;
  try {
    db = await openSQLiteConnection();
    
    // Check if sitemap_status table exists
    const tableExists = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='sitemap_status'
    `);
    
    if (!tableExists) {
      // Create the sitemap_status table if it doesn't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS sitemap_status (
          status TEXT NOT NULL,
          is_generating BOOLEAN DEFAULT 0,
          last_generated TIMESTAMP,
          item_count INTEGER DEFAULT 0,
          file_size INTEGER DEFAULT 0,
          error_message TEXT,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default record
      await db.run(`
        INSERT INTO sitemap_status 
        (status, is_generating, error_message, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, ['not_generated', false, null]);
    }
    
    // Check if sitemap index file exists
    let sitemapExists = false;
    try {
      await fs.access(SITEMAP_INDEX_PATH);
      sitemapExists = true;
    } catch (error) {
      sitemapExists = false;
    }
    
    // Get current status
    const result = await db.get(`
      SELECT 
        status,
        is_generating as isGenerating,
        last_generated as lastGenerated,
        item_count as itemCount,
        file_size as fileSize,
        error_message as errorMessage,
        updated_at as updatedAt
      FROM sitemap_status
      LIMIT 1
    `);
    
    if (!result) {
      // Initialize with default values if no status record exists
      return res.json({
        status: 'not_generated',
        isGenerating: false,
        lastGenerated: null,
        itemCount: 0,
        fileSize: 0,
        errorMessage: null,
        updatedAt: new Date().toISOString(),
        fileExists: sitemapExists
      });
    }
    
    // Add file exists check to the response
    return res.json({
      ...result,
      fileExists: sitemapExists
    });
  } catch (error) {
    logger.error('Error getting sitemap status:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

/**
 * Trigger sitemap generation
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function triggerSitemapGeneration(req, res) {
  let db = null;
  try {
    db = await openSQLiteConnection();
    
    // Check if sitemap generation is already in progress
    const status = await db.get('SELECT is_generating FROM sitemap_status LIMIT 1');
    
    if (status && status.is_generating) {
      return res.status(409).json({ 
        error: 'Sitemap generation already in progress',
        success: false
      });
    }
    
    // Update status to indicate generation has started
    await db.run(`
      INSERT OR REPLACE INTO sitemap_status 
      (status, is_generating, error_message, updated_at) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, ['generating', true, null]);
    
    // Start asynchronous sitemap generation
    setTimeout(async () => {
      try {
        await generateAllSitemaps();
        logger.info('Sitemap generation completed via API trigger');
      } catch (error) {
        logger.error('Error in asynchronous sitemap generation:', error);
        try {
          // Update status to indicate generation failed
          const errorDb = await openSQLiteConnection();
          await errorDb.run(`
            UPDATE sitemap_status 
            SET status = ?, is_generating = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
            WHERE 1=1
          `, ['error', false, error.message]);
          await closeSQLiteConnection(errorDb);
        } catch (dbError) {
          logger.error('Error updating sitemap status after failure:', dbError);
        }
      }
    }, 0);
    
    return res.json({
      success: true,
      message: 'Sitemap generation started successfully'
    });
  } catch (error) {
    logger.error('Error triggering sitemap generation:', error);
    return res.status(500).json({ error: error.message, success: false });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

/**
 * Get the sitemap content
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getSitemapContent(req, res) {
  try {
    // Check if sitemap index file exists
    try {
      await fs.access(SITEMAP_INDEX_PATH);
    } catch (error) {
      return res.status(404).json({ 
        error: 'Sitemap file not found',
        success: false
      });
    }
    
    // Read the sitemap file
    const content = await fs.readFile(SITEMAP_INDEX_PATH, 'utf8');
    
    // Set content type header for XML
    res.setHeader('Content-Type', 'application/xml');
    
    // Return the sitemap content
    return res.send(content);
  } catch (error) {
    logger.error('Error getting sitemap content:', error);
    return res.status(500).json({ error: error.message, success: false });
  }
} 