import { getConnection } from '../../db/connection-manager.js';
import { logger } from '../../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import generateAllSitemaps from '../../../scripts/generate-sitemap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const SITEMAP_INDEX_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

/**
 * Generate or retrieve sitemap for a specific entity type
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getSitemap(req, res) {
  const { type } = req.params;
  
  if (!type) {
    return res.status(400).json({ error: 'Sitemap type is required' });
  }
  
  try {
    const db = await getConnection();
    
    // Check if sitemap exists
    const sitemap = await db.get(
      'SELECT * FROM sitemaps WHERE entity_type = ?',
      [type]
    );
    
    if (!sitemap) {
      return res.status(404).json({
        error: `Sitemap for '${type}' not found. You may need to generate it first.`
      });
    }
    
    // Check if sitemap file exists
    const sitemapFilePath = path.join(__dirname, '../../../public/sitemaps', `${type}.xml`);
    if (!fs.existsSync(sitemapFilePath)) {
      return res.status(404).json({
        error: `Sitemap file for '${type}' not found. You may need to regenerate it.`
      });
    }
    
    // Read sitemap file
    const sitemapContent = fs.readFileSync(sitemapFilePath, 'utf8');
    
    // Set content type and send sitemap
    res.setHeader('Content-Type', 'application/xml');
    return res.send(sitemapContent);
  } catch (error) {
    logger.error(`Error retrieving sitemap for '${type}':`, error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Generate sitemap for a specific entity type
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function generateSitemap(req, res) {
  const { type } = req.params;
  
  if (!type) {
    return res.status(400).json({ error: 'Sitemap type is required' });
  }
  
  try {
    const db = await getConnection();
    
    // Check if sitemap generation is already in progress
    const sitemap = await db.get(
      'SELECT * FROM sitemaps WHERE entity_type = ? AND status = ?',
      [type, 'generating']
    );
    
    if (sitemap) {
      return res.status(409).json({
        error: `Sitemap generation for '${type}' is already in progress`
      });
    }
    
    // Update sitemap status to generating
    const result = await db.run(
      'UPDATE sitemaps SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE entity_type = ?',
      ['generating', type]
    );
    
    if (result.changes === 0) {
      // If no rows were affected, insert a new row
      await db.run(
        'INSERT INTO sitemaps (entity_type, status, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [type, 'generating']
      );
    }
    
    // Start sitemap generation process asynchronously
    // We'll immediately return success to the client
    generateSitemapAsync(type).catch(error => {
      logger.error(`Error generating sitemap for '${type}':`, error);
      
      // Update sitemap status to error in case of failure
      try {
        const errorDb = getConnection().then(db => {
          db.run(
            'UPDATE sitemaps SET status = ?, error = ?, updated_at = CURRENT_TIMESTAMP WHERE entity_type = ?',
            ['error', error.message, type]
          );
        }).catch(err => {
          logger.error(`Error updating sitemap status for '${type}':`, err);
        });
      } catch (err) {
        logger.error(`Error connecting to database to update sitemap status:`, err);
      }
    });
    
    return res.json({ 
      success: true, 
      message: `Sitemap generation for '${type}' started` 
    });
  } catch (error) {
    logger.error(`Error starting sitemap generation for '${type}':`, error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Generate sitemap asynchronously
 * @param {string} type - Entity type for sitemap generation
 * @returns {Promise<void>}
 */
async function generateSitemapAsync(type) {
  // TODO: Implement actual sitemap generation based on entity type
  
  // This is a placeholder for the actual implementation
  // In a real implementation, you would:
  // 1. Query the database for all entities of the specified type
  // 2. Generate sitemap XML
  // 3. Save sitemap XML to a file
  // 4. Update sitemap status in the database
  
  try {
    const db = await getConnection();
    
    // Simulate sitemap generation with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create sitemaps directory if it doesn't exist
    const sitemapsDir = path.join(__dirname, '../../../public/sitemaps');
    if (!fs.existsSync(sitemapsDir)) {
      fs.mkdirSync(sitemapsDir, { recursive: true });
    }
    
    // Generate dummy sitemap content
    let sitemapContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemapContent += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    sitemapContent += '  <url>\n';
    sitemapContent += '    <loc>https://example.com/sample</loc>\n';
    sitemapContent += '    <lastmod>2023-01-01</lastmod>\n';
    sitemapContent += '    <changefreq>weekly</changefreq>\n';
    sitemapContent += '    <priority>0.8</priority>\n';
    sitemapContent += '  </url>\n';
    sitemapContent += '</urlset>';
    
    // Save sitemap content to file
    const sitemapFilePath = path.join(sitemapsDir, `${type}.xml`);
    fs.writeFileSync(sitemapFilePath, sitemapContent);
    
    // Update sitemap status to completed
    await db.run(
      'UPDATE sitemaps SET status = ?, url_count = ?, file_path = ?, updated_at = CURRENT_TIMESTAMP WHERE entity_type = ?',
      ['completed', 1, sitemapFilePath, type]
    );
    
    logger.info(`Sitemap generation for '${type}' completed`);
  } catch (error) {
    logger.error(`Error in sitemap generation for '${type}':`, error);
    throw error;
  }
}

/**
 * Get the current status of sitemap generation
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getSitemapStatus(req, res) {
  let db = null;
  try {
    db = await getConnection();
    
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
      await fs.promises.access(SITEMAP_INDEX_PATH);
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
    db = await getConnection();
    
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
          const errorDb = await getConnection();
          await errorDb.run(`
            UPDATE sitemap_status 
            SET status = ?, is_generating = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
            WHERE 1=1
          `, ['error', false, error.message]);
        } catch (error) {
          logger.error(`Error updating sitemap status after failure`, { error: error.message });
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
      await fs.promises.access(SITEMAP_INDEX_PATH);
    } catch (error) {
      return res.status(404).json({ 
        error: 'Sitemap file not found',
        success: false
      });
    }
    
    // Read the sitemap file
    const content = await fs.promises.readFile(SITEMAP_INDEX_PATH, 'utf8');
    
    // Set content type header for XML
    res.setHeader('Content-Type', 'application/xml');
    
    // Return the sitemap content
    return res.send(content);
  } catch (error) {
    logger.error('Error getting sitemap content:', error);
    return res.status(500).json({ error: error.message, success: false });
  }
} 