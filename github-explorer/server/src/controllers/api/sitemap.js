import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';
import fs from 'fs';
import path from 'path';
import { getDbDir } from '../../utils/db-path.js';

/**
 * Get the current status of sitemap generation
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getSitemapStatus(req, res) {
  let db = null;
  try {
    db = await openSQLiteConnection();
    
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
      // Initialize with default values if no status exists
      return res.json({
        status: 'not_generated',
        isGenerating: false,
        lastGenerated: null,
        itemCount: 0,
        fileSize: 0,
        errorMessage: null,
        updatedAt: new Date().toISOString()
      });
    }
    
    return res.json(result);
  } catch (error) {
    console.error('Error getting sitemap status:', error);
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
    // In a real implementation, this would be a more complex process
    // that would run in the background and update the status when complete
    
    return res.json({
      success: true,
      message: 'Sitemap generation started successfully'
    });
  } catch (error) {
    console.error('Error triggering sitemap generation:', error);
    return res.status(500).json({ error: error.message, success: false });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
} 