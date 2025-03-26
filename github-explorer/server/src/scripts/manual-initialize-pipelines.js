/**
 * Manual Pipeline Initialization
 * 
 * This script manually initializes all the required pipelines for the GitHub Explorer application.
 * It should be run before setting up cron jobs to ensure the pipeline types are registered.
 */

import 'dotenv/config';
import { logger } from '../utils/logger.js';
import { initializeRequiredPipelines } from '../pipeline/initialize-pipelines.js';

/**
 * Manually initialize all required pipelines
 */
async function manualInitializePipelines() {
  try {
    logger.info('Manually initializing required pipelines');
    
    // Initialize all required pipelines
    await initializeRequiredPipelines({
      // Configure pipeline options if needed
      dataProcessingBatchSize: 50,
      entityExtractionBatchSize: 100,
      dataEnrichmentBatchSize: 20,
      sitemapOutputDir: './public/sitemaps',
      sitemapBaseUrl: process.env.BASE_URL || 'https://github-explorer.example.com',
      contributorRankingsBatchSize: 500
    });
    
    logger.info('Pipeline initialization completed successfully');
  } catch (error) {
    logger.error(`Failed to initialize pipelines: ${error.message}`, { error });
    process.exit(1);
  }
}

// Run the initialization
manualInitializePipelines(); 