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
import { logger } from '../../utils/logger.js';
import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Stage for generating XML sitemaps
 */
class SitemapGeneratorStage extends BaseStage {
  /**
   * Create a new sitemap generator stage
   * @param {Object} options - Processor options
   */
  constructor(options = {}) {
    super({
      name: 'generate-sitemap',
      abortOnError: true,
      config: {
        maxUrlsPerFile: 50000,
        outputDir: options.outputDir || './public/sitemaps',
        baseUrl: options.baseUrl || 'https://github-explorer.example.com',
        entityTypes: ['repository', 'contributor', 'organization'],
        ...options.config
      }
    });
  }
  
  /**
   * Execute the stage processing
   * @param {Object} context - Pipeline context
   * @param {Object} pipelineConfig - Pipeline configuration
   * @returns {Promise<Object>} Updated pipeline context
   */
  async execute(context, pipelineConfig) {
    this.log('info', '======================================');
    this.log('info', '🔄 RUNNING PIPELINE: SITEMAP GENERATION');
    this.log('info', '🌐 STEP: Generating XML Sitemaps');
    this.log('info', '======================================');
    this.log('info', `Started at: ${new Date().toISOString()}`);
    
    // Initialize stats for reporting
    const stats = {
      totalEntities: 0,
      entitiesByType: {},
      sitemapFiles: [],
      errors: []
    };
    
    try {
      // Create output directory if it doesn't exist
      await this.ensureDirectoryExists(this.config.outputDir);
      this.log('info', `📊 PROGRESS: Output directory ensured: ${this.config.outputDir}`);
      
      // Open database connection
      const db = await openSQLiteConnection();
      
      try {
        // Generate sitemap for each entity type
        for (const entityType of this.config.entityTypes) {
          this.log('info', `📊 PROGRESS: Generating sitemap for entity type: ${entityType}`);
          
          try {
            // Get all entities of this type
            const entities = await this.getEntities(db, entityType);
            
            if (entities && entities.length > 0) {
              stats.totalEntities += entities.length;
              stats.entitiesByType[entityType] = entities.length;
              
              this.log('info', `📊 PROGRESS: Found ${entities.length} ${entityType} entities for sitemap`);
              
              // Create sitemap files for this entity type
              const sitemapFiles = await this.generateSitemapFiles(entityType, entities);
              stats.sitemapFiles.push(...sitemapFiles);
              
              this.log('info', `📊 PROGRESS: Generated ${sitemapFiles.length} sitemap files for ${entityType}`);
            } else {
              this.log('info', `📊 PROGRESS: No ${entityType} entities found for sitemap`);
              stats.entitiesByType[entityType] = 0;
            }
          } catch (error) {
            this.log('error', `Error generating sitemap for ${entityType}: ${error.message}`, { error });
            stats.errors.push({
              message: error.message,
              stack: error.stack,
              entityType
            });
          }
        }
        
        // Generate sitemap index file
        if (stats.sitemapFiles.length > 0) {
          const indexFile = await this.generateSitemapIndex(stats.sitemapFiles);
          this.log('info', `📊 PROGRESS: Generated sitemap index file: ${indexFile}`);
        } else {
          this.log('warning', '📊 PROGRESS: No sitemap files generated, skipping index file');
        }
      } catch (error) {
        this.log('error', `Error during sitemap generation: ${error.message}`, { error });
        stats.errors.push({
          message: error.message,
          stack: error.stack
        });
      } finally {
        // Close database connection
        await closeSQLiteConnection(db);
      }
      
      // Update context with stats
      context.sitemapGenerationStats = stats;
      
      this.log('info', `✅ COMPLETED: Sitemap Generation Pipeline. Total entities: ${stats.totalEntities}, Sitemap files: ${stats.sitemapFiles.length}`);
      this.log('info', `Finished at: ${new Date().toISOString()}`);
      this.log('info', '======================================');
      
      return context;
    } catch (error) {
      this.log('error', `❌ ERROR: Sitemap Generation Pipeline failed: ${error.message}`, { error });
      this.log('info', '======================================');
      throw error;
    }
  }
  
  /**
   * Ensure the output directory exists
   * @param {string} dirPath - Directory path
   * @returns {Promise<void>}
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      this.log('error', `Failed to create directory ${dirPath}: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Get all entities of a specific type
   * @param {Object} db - Database connection
   * @param {string} entityType - Type of entity to retrieve
   * @returns {Promise<Array>} Array of entities
   */
  async getEntities(db, entityType) {
    // In a real implementation, this would query the database for all entities of the given type
    // This is a placeholder for the actual implementation
    this.log('info', `Would fetch all ${entityType} entities for sitemap`);
    
    // Return an empty array for now
    return [];
  }
  
  /**
   * Generate sitemap files for a specific entity type
   * @param {string} entityType - Entity type
   * @param {Array} entities - Array of entities
   * @returns {Promise<Array>} Array of generated sitemap file paths
   */
  async generateSitemapFiles(entityType, entities) {
    // In a real implementation, this would generate XML sitemap files
    // This is a placeholder for the actual implementation
    this.log('info', `Would generate sitemap files for ${entities.length} ${entityType} entities`);
    
    // Return an empty array for now
    return [];
  }
  
  /**
   * Generate sitemap index file
   * @param {Array} sitemapFiles - Array of sitemap file paths
   * @returns {Promise<string>} Path to the generated index file
   */
  async generateSitemapIndex(sitemapFiles) {
    // In a real implementation, this would generate an XML sitemap index file
    // This is a placeholder for the actual implementation
    this.log('info', `Would generate sitemap index file for ${sitemapFiles.length} sitemap files`);
    
    // Return an empty string for now
    return '';
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
    return new SitemapGeneratorStage({
      outputDir: options.outputDir,
      baseUrl: options.baseUrl,
      config: {
        maxUrlsPerFile: options.maxUrlsPerFile || 50000,
        entityTypes: options.entityTypes || ['repository', 'contributor', 'organization']
      }
    });
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