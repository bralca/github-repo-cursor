/**
 * Cron Jobs Runner
 * 
 * This script initializes all pipelines and actively runs cron jobs on a schedule.
 * It will make API calls to the same endpoints used by the frontend to trigger
 * pipeline operations on the specified schedule.
 */

import 'dotenv/config';
import { logger } from '../utils/logger.js';
import nodeSchedule from 'node-schedule';
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';

// Add a configurable API URL instead of hardcoded localhost:3001
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Pipeline types to run with their correct names from server logs and admin UI code
const PIPELINE_TYPES = [
  'github_sync',              // For closed merge requests (Pull new raw data)
  'data_processing',          // For entity extraction
  'data_enrichment',          // For entity enrichment
  'sitemap_generation',       // For sitemap generation
  'contributor-ranking'       // For developer rankings (note: hyphenated singular form)
];

// Cache of successful pipeline name mappings
const PIPELINE_NAME_CACHE = {};

/**
 * Map of pipeline types to their descriptions
 */
const PIPELINE_DESCRIPTIONS = {
  'github_sync': 'GitHub data sync',
  'data_processing': 'Data processing',
  'data_enrichment': 'Data enrichment',
  'sitemap_generation': 'Sitemap generation',
  'contributor-ranking': 'Contributor ranking calculation'
};

/**
 * Map of pipeline types to their cron schedules
 */
const PIPELINE_SCHEDULES = {
  'github_sync': '* * * * *',           // Every minute
  'data_processing': '* * * * *',       // Every minute
  'data_enrichment': '*/5 * * * *',     // Every 5 minutes
  'sitemap_generation': '0 * * * *',    // Every hour (60 minutes)
  'contributor-ranking': '*/10 * * * *' // Every 10 minutes
};

/**
 * Map of pipeline types to their specific API endpoints
 */
const PIPELINE_ENDPOINTS = {
  'github_sync': '/api/pipeline-operations',
  'data_processing': '/api/pipeline/start',
  'data_enrichment': '/api/pipeline-operations',
  'sitemap_generation': '/api/generate-sitemap',
  'contributor-ranking': '/api/contributor-rankings'
};

/**
 * Execute a pipeline by making an API call to the appropriate endpoint
 * @param {string} pipelineType - Type of pipeline to execute
 * @returns {Promise<void>}
 */
async function executePipelineViaApi(pipelineType) {
  try {
    logger.info('===========================================================');
    logger.info(`🚀 EXECUTING PIPELINE VIA API: ${pipelineType.toUpperCase()}`);
    logger.info(`Triggered at: ${new Date().toISOString()}`);
    logger.info('===========================================================');
    
    // Get the endpoint for this pipeline type
    const endpoint = PIPELINE_ENDPOINTS[pipelineType];
    const description = PIPELINE_DESCRIPTIONS[pipelineType];
    
    if (!endpoint) {
      logger.error(`Unknown pipeline type: ${pipelineType}`);
      return;
    }
    
    // Construct the API URL with the configurable base
    const apiUrl = `${API_BASE_URL}${endpoint}`;
    logger.info(`Making API call to: ${apiUrl}`);
    
    // Prepare request body based on pipeline type
    let requestBody = {};
    
    if (endpoint === '/api/pipeline/start') {
      requestBody = {
        operation: 'start',
        pipeline_type: pipelineType,
        direct_execution: true
      };
    } else if (pipelineType === 'sitemap_generation') {
      // No specific body needed for sitemap generation
      requestBody = {};
    } else if (pipelineType === 'contributor-ranking') {
      requestBody = {
        operation: 'calculate'
      };
    } else {
      // Default request body for other pipelines
      requestBody = {
        operation: 'start',
        pipelineType: pipelineType
      };
    }
    
    logger.info(`Request body: ${JSON.stringify(requestBody)}`);
    
    // Make the API call
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API returned ${response.status}: ${errorData}`);
    }
    
    const data = await response.json();
    logger.info(`API call successful. Response: ${JSON.stringify(data)}`);
    logger.info(`Pipeline ${pipelineType} execution triggered successfully via API`);
    
  } catch (error) {
    logger.error(`Server connection failed. Is the server running at ${API_BASE_URL}?`, {
      errorMessage: error.message,
      errorStack: error.stack
    });
  }
}

/**
 * Run all cron jobs
 */
async function runCronJobs() {
  try {
    logger.info('Starting cron jobs runner using API endpoints');
    
    logger.info('Scheduling jobs according to configured schedules...');
    
    // Schedule each pipeline with its specified schedule
    PIPELINE_TYPES.forEach(pipelineType => {
      const schedule = PIPELINE_SCHEDULES[pipelineType];
      logger.info(`Scheduling ${pipelineType} to run with schedule: ${schedule}`);
      
      // Schedule the job with node-schedule directly
      nodeSchedule.scheduleJob(schedule, async () => {
        logger.info(`Cron triggered for ${pipelineType}`);
        await executePipelineViaApi(pipelineType);
      });
    });
    
    // Run each pipeline immediately for initial testing
    logger.info('Running each pipeline immediately for initial testing...');
    for (const pipelineType of PIPELINE_TYPES) {
      logger.info(`Initial run of ${pipelineType}`);
      await executePipelineViaApi(pipelineType);
    }
    
    logger.info('All cron jobs scheduled. Process will stay alive to run scheduled jobs.');
    logger.info('Press Ctrl+C to stop.');
    
    // Keep the process alive and return the interval so it can be cleared if needed
    return setInterval(() => {
      // This just keeps the process running
    }, 1000);
  } catch (error) {
    logger.error(`Failed to run cron jobs: ${error.message}`, { error });
    throw error; // Propagate error to caller instead of exiting process
  }
}

// Export the function to be used by the main application
export default runCronJobs;

// Check if this file is being run directly
const currentFilePath = fileURLToPath(import.meta.url);
const isRunDirectly = process.argv[1] === currentFilePath;

// If this script is run directly (not imported), execute the function
if (isRunDirectly) {
  runCronJobs().catch(error => {
    console.error('Failed to run cron jobs:', error);
    process.exit(1);
  });
} 