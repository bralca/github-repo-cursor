/**
 * Sitemap Generation Pipeline
 * 
 * Handles the generation of sitemaps for all entity types in the GitHub Explorer application.
 * This pipeline:
 * 1. Fetches entities from the database in batches
 * 2. Generates sitemap XML files for each entity type
 * 3. Creates a sitemap index file referencing all sitemaps
 * 4. Updates sitemap metadata in the database
 */

import path from 'path';
import { Pipeline } from './core/pipeline.js';
import { BaseStage } from './core/base-stage.js';
import { logger } from '../utils/logger.js';
import sitemapController from '../controllers/sitemap-controller.js';
import { 
  generateSitemapXML, 
  writeSitemapFile, 
  writeSitemapIndex,
  formatEntityUrl,
  SITEMAP_MAX_URLS,
  ENTITY_TYPES,
  BASE_URL
} from '../sitemap/generator.js';
import { 
  ensureSitemapDirExists, 
  deleteSitemapFiles,
  listAllSitemapFiles 
} from '../utils/sitemap-storage.js';
import { initSitemapTable } from '../utils/db-init-sitemap.js';

/**
 * Fetches entities from the database and prepares them for sitemap generation
 */
class EntityFetchStage extends BaseStage {
  constructor() {
    super({ name: 'entity-fetch' });
  }
  
  // Implement the execute method that BaseStage requires
  async execute(context, config) {
    return this.process(context);
  }
  
  async process(context) {
    try {
      // Initialize sitemap table if not exists
      await initSitemapTable();
      
      // Ensure sitemap directory exists
      await ensureSitemapDirExists();
      
      // Process each entity type sequentially
      for (const entityType of ENTITY_TYPES) {
        context.logger.info(`Processing ${entityType} for sitemap generation`);
        
        // Get metadata for this entity type
        const metadata = await sitemapController.getSitemapMetadataForType(entityType);
        
        // Count total entities of this type
        const totalCount = await sitemapController.countEntitiesForSitemap(entityType);
        
        if (totalCount === 0) {
          context.logger.info(`No ${entityType} found for sitemap generation, skipping`);
          continue;
        }
        
        context.logger.info(`Found ${totalCount} ${entityType} to process for sitemap`);
        
        // Add to context for next stage
        if (!context.sitemap) {
          context.sitemap = {};
        }
        
        context.sitemap[entityType] = {
          totalCount,
          metadata,
          processedCount: 0,
          urls: []
        };
      }
      
      return context;
    } catch (error) {
      context.logger.error(`Error in entity fetch stage: ${error.message}`, { error });
      throw error;
    }
  }
}

/**
 * Generates sitemap XML files for each entity type
 */
class SitemapGenerationStage extends BaseStage {
  constructor() {
    super({ name: 'sitemap-generation' });
  }
  
  // Implement the execute method that BaseStage requires
  async execute(context, config) {
    return this.process(context);
  }
  
  async process(context) {
    try {
      const generatedSitemaps = [];
      
      // Process each entity type
      for (const entityType of ENTITY_TYPES) {
        if (!context.sitemap || !context.sitemap[entityType]) {
          context.logger.warn(`No data for ${entityType}, skipping sitemap generation`);
          continue;
        }
        
        const entityData = context.sitemap[entityType];
        const { totalCount, metadata } = entityData;
        
        if (totalCount === 0) {
          context.logger.info(`No ${entityType} to process, skipping`);
          continue;
        }
        
        // Delete existing sitemap files for this entity type
        await deleteSitemapFiles(entityType);
        
        // Initialize counters
        let processedCount = 0;
        let currentPage = metadata.current_page;
        let urlCount = 0;
        let currentPageUrls = [];
        
        // Process in batches of 1000
        const batchSize = 1000;
        
        while (processedCount < totalCount) {
          // Fetch a batch of entities
          const entities = await sitemapController.fetchEntitiesForSitemap(
            entityType, 
            batchSize, 
            processedCount
          );
          
          if (entities.length === 0) {
            break;
          }
          
          // Format URLs for each entity
          for (const entity of entities) {
            const url = formatEntityUrl(entityType, entity);
            
            currentPageUrls.push(url);
            urlCount++;
            
            // If we've reached the max URLs per sitemap, write the file
            if (currentPageUrls.length >= SITEMAP_MAX_URLS) {
              // Generate and write sitemap XML
              const sitemapXML = generateSitemapXML(currentPageUrls);
              const filename = `${entityType}-${currentPage}.xml`;
              await writeSitemapFile(filename, sitemapXML);
              
              // Add to list of generated sitemaps
              generatedSitemaps.push({
                entityType,
                filename,
                count: currentPageUrls.length,
                page: currentPage
              });
              
              // Reset for next page
              currentPageUrls = [];
              currentPage++;
              
              context.logger.info(`Generated sitemap ${filename} with ${SITEMAP_MAX_URLS} URLs`);
            }
          }
          
          // Update processed count
          processedCount += entities.length;
          
          // Update progress in context
          entityData.processedCount = processedCount;
          
          // Log progress
          context.logger.info(`Processed ${processedCount}/${totalCount} ${entityType} for sitemap`);
          
          // Update the pipeline status
          context.updateStatus({
            message: `Generating ${entityType} sitemaps: ${processedCount}/${totalCount}`,
            progress: Math.floor((processedCount / totalCount) * 100)
          });
        }
        
        // Write any remaining URLs to a sitemap file
        if (currentPageUrls.length > 0) {
          const sitemapXML = generateSitemapXML(currentPageUrls);
          const filename = `${entityType}-${currentPage}.xml`;
          await writeSitemapFile(filename, sitemapXML);
          
          // Add to list of generated sitemaps
          generatedSitemaps.push({
            entityType,
            filename,
            count: currentPageUrls.length,
            page: currentPage
          });
          
          context.logger.info(`Generated sitemap ${filename} with ${currentPageUrls.length} URLs`);
        }
        
        // Update metadata in the database
        await sitemapController.updateSitemapMetadata(entityType, {
          current_page: currentPage,
          url_count: urlCount
        });
        
        // Add to context
        entityData.currentPage = currentPage;
        entityData.urlCount = urlCount;
        
        context.logger.info(`Completed sitemap generation for ${entityType}: ${urlCount} URLs in ${currentPage} files`);
      }
      
      // Store generated sitemaps in context
      context.generatedSitemaps = generatedSitemaps;
      
      return context;
    } catch (error) {
      context.logger.error(`Error in sitemap generation stage: ${error.message}`, { error });
      throw error;
    }
  }
}

/**
 * Creates the sitemap index file that references all sitemaps
 */
class SitemapIndexStage extends BaseStage {
  constructor() {
    super({ name: 'sitemap-index' });
  }
  
  // Implement the execute method that BaseStage requires
  async execute(context, config) {
    return this.process(context);
  }
  
  async process(context) {
    try {
      // Get all sitemap files
      const sitemapFiles = await listAllSitemapFiles();
      
      if (sitemapFiles.length === 0) {
        context.logger.warn('No sitemap files found, skipping index generation');
        return context;
      }
      
      // Create sitemap entries for the index
      const sitemaps = sitemapFiles.map(filename => ({
        loc: `${BASE_URL}/sitemaps/${filename}`,
        lastmod: new Date().toISOString().split('T')[0]
      }));
      
      // Add static pages to the sitemap
      sitemaps.push({
        loc: `${BASE_URL}/`,
        lastmod: new Date().toISOString().split('T')[0],
        priority: '1.0'
      });
      
      // Write the sitemap index
      await writeSitemapIndex(sitemaps);
      
      context.logger.info(`Generated sitemap index with ${sitemaps.length} sitemaps`);
      
      return context;
    } catch (error) {
      context.logger.error(`Error in sitemap index stage: ${error.message}`, { error });
      throw error;
    }
  }
}

/**
 * Create and configure the sitemap generation pipeline
 * @returns {Pipeline} Configured pipeline instance
 */
export function createSitemapPipeline() {
  const pipeline = new Pipeline({
    name: 'sitemap-generation', 
    stages: [], 
    config: {}
  });
  
  // Add stages
  pipeline.addStage(new EntityFetchStage());
  pipeline.addStage(new SitemapGenerationStage());
  pipeline.addStage(new SitemapIndexStage());
  
  return pipeline;
}

export default createSitemapPipeline; 