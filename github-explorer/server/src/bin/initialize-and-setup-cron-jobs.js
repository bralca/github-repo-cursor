#!/usr/bin/env node

/**
 * Initialize Pipelines and Setup Cron Jobs
 * 
 * This script:
 * 1. Initializes all required pipeline types
 * 2. Sets up cron jobs for those pipeline types
 * 
 * Pipeline types initialized:
 * - data_processing: For processing closed merge requests
 * - entity_extraction: For extracting entities from raw data
 * - data_enrichment: For enriching entities with additional data
 * - sitemap_generation: For generating sitemaps for SEO
 * - contributor_rankings: For generating developer rankings
 * 
 * Cron jobs set up:
 * - Pull Closed Merge Requests (every minute)
 * - Extract Entities (every minute)
 * - Enrich Entities (every 5 minutes)
 * - Generate Sitemap (every hour)
 * - Generate Developer Rankings (every 10 minutes)
 */

import 'dotenv/config';
import { logger } from '../utils/logger.js';
import { initializeRequiredPipelines } from '../pipeline/initialize-pipelines.js';
import { setupRequiredCronJobs } from '../scripts/setup-required-cron-jobs.js';

/**
 * Initialize pipelines and set up cron jobs
 */
async function initializeAndSetupCronJobs() {
  try {
    logger.info('Starting pipeline initialization and cron job setup');
    
    // 1. Initialize all required pipelines
    logger.info('1. Initializing required pipelines');
    await initializeRequiredPipelines({
      // Configure pipeline options if needed
      dataProcessingBatchSize: 50,
      entityExtractionBatchSize: 100,
      dataEnrichmentBatchSize: 20,
      sitemapOutputDir: './public/sitemaps',
      sitemapBaseUrl: process.env.BASE_URL || 'https://github-explorer.example.com',
      contributorRankingsBatchSize: 500
    });
    
    // 2. Set up cron jobs for the initialized pipelines
    logger.info('2. Setting up cron jobs for the initialized pipelines');
    await setupRequiredCronJobs();
    
    logger.info('Pipeline initialization and cron job setup completed successfully');
  } catch (error) {
    logger.error(`Failed to initialize pipelines and set up cron jobs: ${error.message}`, { error });
    process.exit(1);
  }
}

// Run the initialization and setup
initializeAndSetupCronJobs(); 