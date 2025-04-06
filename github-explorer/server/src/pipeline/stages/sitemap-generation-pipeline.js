/**
 * Sitemap Generation Pipeline
 * 
 * Pipeline for generating XML sitemaps for SEO.
 * This pipeline:
 * 1. Retrieves all relevant entities from the database
 * 2. Generates sitemap files for each entity type
 * 3. Creates a sitemap index file
 * 4. Saves the sitemap files to the configured location
 */

import { pipelineFactory } from '../core/pipeline-factory.js';
import { BaseStage } from '../core/base-stage.js';
import { getConnection } from '../../db/connection-manager.js';
import { logger } from '../../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Pipeline stage for generating XML sitemaps
 */
export default class SitemapGenerationPipeline extends BaseStage {
  constructor() {
    super('sitemap-generation');
    this.logger = logger;
  }
  
  /**
   * Process and generate sitemaps
   * @returns {Promise<Object>} Result of processing
   */
  async process() {
    this.logger.info('Starting sitemap generation');
    
    try {
      const db = await getConnection();
      
      // Ensure sitemap directory exists
      const sitemapDir = path.join(__dirname, '../../../../public/sitemaps');
      if (!fs.existsSync(sitemapDir)) {
        fs.mkdirSync(sitemapDir, { recursive: true });
        this.logger.info(`Created sitemap directory: ${sitemapDir}`);
      }
      
      // Start transaction for database operations
      await db.run('BEGIN TRANSACTION');
      
      try {
        // Generate sitemaps for each entity type
        const entityTypes = ['repositories', 'contributors', 'merge_requests'];
        const results = {};
        
        for (const entityType of entityTypes) {
          this.logger.info(`Generating sitemap for ${entityType}`);
          
          // Get entity data from database
          let entities = [];
          switch (entityType) {
            case 'repositories':
              entities = await db.all(`
                SELECT id, name, full_name, slug
                FROM repositories
                WHERE is_enriched = 1
                LIMIT 50000
              `);
              break;
              
            case 'contributors':
              entities = await db.all(`
                SELECT id, username, name
                FROM contributors
                WHERE is_enriched = 1
                LIMIT 50000
              `);
              break;
              
            case 'merge_requests':
              entities = await db.all(`
                SELECT mr.id, mr.number, r.full_name
                FROM merge_requests mr
                JOIN repositories r ON mr.repository_id = r.id
                WHERE mr.is_enriched = 1
                LIMIT 50000
              `);
              break;
          }
          
          if (entities.length === 0) {
            this.logger.warn(`No entities found for ${entityType}`);
            continue;
          }
          
          // Generate sitemap XML
          const sitemapXml = this.generateSitemapXml(entities, entityType);
          
          // Write sitemap to file
          const filePath = path.join(sitemapDir, `${entityType}.xml`);
          fs.writeFileSync(filePath, sitemapXml);
          
          // Update sitemap metadata in database
          await db.run(`
            INSERT INTO sitemap_metadata 
            (entity_type, file_path, url_count, last_build_date, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(entity_type) DO UPDATE SET
            file_path = excluded.file_path,
            url_count = excluded.url_count,
            last_build_date = excluded.last_build_date,
            updated_at = excluded.updated_at
          `, [entityType, filePath, entities.length]);
          
          results[entityType] = entities.length;
          this.logger.info(`Sitemap for ${entityType} generated with ${entities.length} URLs`);
        }
        
        // Generate sitemap index
        const sitemapIndex = this.generateSitemapIndex(entityTypes);
        fs.writeFileSync(path.join(sitemapDir, 'sitemap.xml'), sitemapIndex);
        
        // Commit all database changes
        await db.run('COMMIT');
        
        return {
          success: true,
          results
        };
      } catch (error) {
        // Rollback transaction on error
        await db.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      this.logger.error('Error generating sitemaps:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Generate sitemap XML for entities
   * @param {Array} entities - Array of entities
   * @param {string} entityType - Type of entities
   * @returns {string} XML sitemap
   */
  generateSitemapXml(entities, entityType) {
    const baseUrl = process.env.BASE_URL || 'https://github-explorer.example.com';
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const entity of entities) {
      xml += '  <url>\n';
      
      switch (entityType) {
        case 'repositories':
          xml += `    <loc>${baseUrl}/repositories/${entity.slug || entity.full_name}</loc>\n`;
          break;
          
        case 'contributors':
          xml += `    <loc>${baseUrl}/contributors/${entity.username}</loc>\n`;
          break;
          
        case 'merge_requests':
          xml += `    <loc>${baseUrl}/repositories/${entity.full_name}/pulls/${entity.number}</loc>\n`;
          break;
      }
      
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }
    
    xml += '</urlset>';
    return xml;
  }
  
  /**
   * Generate sitemap index XML
   * @param {Array} entityTypes - Entity types
   * @returns {string} XML sitemap index
   */
  generateSitemapIndex(entityTypes) {
    const baseUrl = process.env.BASE_URL || 'https://github-explorer.example.com';
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const entityType of entityTypes) {
      xml += '  <sitemap>\n';
      xml += `    <loc>${baseUrl}/sitemaps/${entityType}.xml</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += '  </sitemap>\n';
    }
    
    xml += '</sitemapindex>';
    return xml;
  }
}

/**
 * Register the sitemap generation pipeline
 * @param {Object} options - Options for pipeline registration
 * @returns {void}
 */
export function registerSitemapGenerationPipeline(options = {}) {
  logger.info('Registering sitemap generation pipeline');
  
  // Register the sitemap generator stage
  pipelineFactory.registerStage('generate-sitemap', () => {
    return new SitemapGenerationPipeline();
  });
  
  // Register the sitemap generation pipeline
  pipelineFactory.registerPipeline('sitemap_generation', {
    name: 'sitemap_generation',
    description: 'Generate XML sitemaps for SEO',
    concurrency: 1,
    retries: 2,
    stages: ['generate-sitemap']
  });
  
  logger.info('Sitemap generation pipeline registered successfully');
} 