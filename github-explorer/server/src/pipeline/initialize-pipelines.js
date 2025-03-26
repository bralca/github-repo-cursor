/**
 * Pipeline Initialization
 * 
 * This module initializes all pipeline types required by the application.
 * It registers each pipeline type with the pipeline factory, making them
 * available for scheduling and execution.
 */

import { logger } from '../utils/logger.js';
import { registerDataProcessingPipeline } from './stages/data-processing-pipeline.js';
import { registerEntityExtractionPipeline } from './stages/entity-extraction-pipeline.js';
import { registerDataEnrichmentPipeline } from './stages/data-enrichment-pipeline.js';
import { registerSitemapGenerationPipeline } from './stages/sitemap-generation-pipeline.js';
import { registerContributorRankingsPipeline } from './stages/contributor-rankings-pipeline.js';

/**
 * Initialize all required pipelines
 * @param {Object} options - Options for pipeline initialization
 * @returns {Promise<void>}
 */
export async function initializeRequiredPipelines(options = {}) {
  try {
    logger.info('Initializing required pipelines');
    
    // Register data processing pipeline (for closed merge requests)
    registerDataProcessingPipeline({
      batchSize: options.dataProcessingBatchSize || 50,
      maxRequests: options.dataProcessingMaxRequests || 1000
    });
    
    // Register entity extraction pipeline
    registerEntityExtractionPipeline({
      batchSize: options.entityExtractionBatchSize || 100,
      entityTypes: options.entityExtractionTypes || ['repository', 'contributor', 'organization']
    });
    
    // Register data enrichment pipeline
    registerDataEnrichmentPipeline({
      batchSize: options.dataEnrichmentBatchSize || 20,
      entityTypes: options.dataEnrichmentTypes || ['repository', 'contributor', 'organization']
    });
    
    // Register sitemap generation pipeline
    registerSitemapGenerationPipeline({
      outputDir: options.sitemapOutputDir || './public/sitemaps',
      baseUrl: options.sitemapBaseUrl || 'https://github-explorer.example.com',
      maxUrlsPerFile: options.sitemapMaxUrlsPerFile || 50000,
      entityTypes: options.sitemapEntityTypes || ['repository', 'contributor', 'organization']
    });
    
    // Register contributor rankings pipeline
    registerContributorRankingsPipeline({
      batchSize: options.contributorRankingsBatchSize || 500,
      metrics: options.contributorRankingsMetrics || ['activity', 'contributions', 'popularity', 'efficiency']
    });
    
    logger.info('All required pipelines initialized successfully');
  } catch (error) {
    logger.error(`Error initializing pipelines: ${error.message}`, { error });
    throw error;
  }
} 