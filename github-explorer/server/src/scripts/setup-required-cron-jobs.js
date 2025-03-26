/**
 * Setup Required Cron Jobs
 * 
 * This script sets up all the required cron jobs for the GitHub Explorer application.
 * It creates jobs for:
 * 1. Pulling closed Merge Requests (every minute)
 * 2. Extracting Entities (every minute)
 * 3. Enriching Entities (every minute for testing, normally every 5 minutes)
 * 4. Generating Sitemap (every minute for testing, normally every hour)
 * 5. Generating Developer Rankings (every minute for testing, normally every 10 minutes)
 */

import 'dotenv/config';
import { SchedulerService } from '../services/scheduler/scheduler-service.js';
import { logger } from '../utils/logger.js';

// Create a new instance of the scheduler service
const schedulerService = new SchedulerService();

/**
 * Setup all required cron jobs
 * @returns {Promise<void>}
 */
export async function setupRequiredCronJobs() {
  logger.info('Setting up required cron jobs');
  
  try {
    // Initialize the scheduler service
    await schedulerService.initializeFromDatabase();
    
    // Define the cron jobs to set up - all set to every minute for testing
    const cronJobs = [
      {
        name: 'Pull Closed Merge Requests',
        pipelineType: 'data_processing',
        cronExpression: '* * * * *', // Every minute
        description: 'Pulls closed merge requests from GitHub API'
      },
      {
        name: 'Extract Entities',
        pipelineType: 'entity_extraction',
        cronExpression: '* * * * *', // Every minute
        description: 'Extracts entities from raw data'
      },
      {
        name: 'Enrich Entities',
        pipelineType: 'data_enrichment',
        cronExpression: '* * * * *', // Every minute (for testing, normally */5)
        description: 'Enriches entities with additional data from GitHub API'
      },
      {
        name: 'Generate Sitemap',
        pipelineType: 'sitemap_generation',
        cronExpression: '* * * * *', // Every minute (for testing, normally 0 * * * *)
        description: 'Generates XML sitemaps for SEO'
      },
      {
        name: 'Generate Developer Rankings',
        pipelineType: 'contributor_rankings',
        cronExpression: '* * * * *', // Every minute (for testing, normally */10)
        description: 'Generates and updates developer rankings'
      }
    ];
    
    // Set up each cron job
    for (const job of cronJobs) {
      logger.info(`Setting up cron job: ${job.name}`);
      
      try {
        // Check if a schedule already exists for this pipeline type
        const existingSchedules = schedulerService.getSchedules(job.pipelineType);
        
        if (existingSchedules.length > 0) {
          const existingSchedule = existingSchedules[0];
          logger.info(`Found existing schedule for ${job.pipelineType}, updating...`);
          
          // Update the existing schedule
          await schedulerService.updateSchedule(existingSchedule.id, {
            name: job.name,
            cronExpression: job.cronExpression,
            isActive: true
          });
          
          logger.info(`Updated schedule for ${job.name} to run every minute for testing`);
        } else {
          logger.info(`No existing schedule found for ${job.pipelineType}, creating new...`);
          
          // Create a new schedule
          await schedulerService.scheduleJob({
            name: job.name,
            pipelineType: job.pipelineType,
            cronExpression: job.cronExpression,
            timeZone: 'UTC',
            isActive: true
          });
          
          logger.info(`Created new schedule for ${job.name} to run every minute for testing`);
        }
      } catch (error) {
        logger.error(`Failed to set up cron job ${job.name}: ${error.message}`, { error });
      }
    }
    
    // Log current active schedules
    const activeSchedules = schedulerService.getSchedules().filter(s => s.isActive);
    logger.info(`Current active schedules: ${activeSchedules.length}`);
    for (const schedule of activeSchedules) {
      logger.info(`- ${schedule.name} (${schedule.pipelineType}): ${schedule.cronExpression}`);
    }
    
    logger.info('Required cron jobs setup completed successfully');
  } catch (error) {
    logger.error(`Failed to set up required cron jobs: ${error.message}`, { error });
    throw error;
  }
}

// Execute the setup function
setupRequiredCronJobs()
  .then(() => {
    logger.info('Cron jobs setup completed successfully');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Error setting up cron jobs:', error);
    process.exit(1);
  }); 