/**
 * Test Pipeline Scheduler
 * 
 * This script tests the pipeline scheduler functionality by creating a test schedule,
 * triggering it, updating it, and then deleting it.
 */

import 'dotenv/config';
import schedulerService from '../services/scheduler/scheduler-service.js';
import { pipelineFactory } from '../pipeline/core/pipeline-factory.js';
import { logger } from '../utils/logger.js';

/**
 * Test the pipeline scheduler
 */
async function testScheduler() {
  try {
    logger.info('====================================');
    logger.info('Starting Pipeline Scheduler test');
    logger.info('====================================');
    
    // Get available pipeline types
    const pipelineDefinitions = pipelineFactory.getAllPipelineDefinitions();
    const pipelineTypes = Object.keys(pipelineDefinitions);
    
    if (pipelineTypes.length === 0) {
      logger.error('No pipeline types available for testing');
      return;
    }
    
    const testPipelineType = pipelineTypes[0];
    logger.info(`Using pipeline type ${testPipelineType} for testing`);
    
    // Create a test schedule (runs every 5 minutes)
    const testSchedule = await schedulerService.scheduleJob({
      name: 'Test Schedule',
      pipelineType: testPipelineType,
      cronExpression: '*/5 * * * *', // Every 5 minutes
      timeZone: 'UTC',
      isActive: true
    });
    
    logger.info('Created test schedule', { schedule: testSchedule });
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get all schedules
    const schedules = schedulerService.getSchedules();
    logger.info(`Found ${schedules.length} schedules`);
    
    // Get the schedule by ID
    const retrievedSchedule = schedulerService.getScheduleById(testSchedule.id);
    if (retrievedSchedule) {
      logger.info('Retrieved schedule by ID', { schedule: retrievedSchedule });
    } else {
      logger.error('Failed to retrieve schedule by ID');
    }
    
    // Update the test schedule
    const updatedSchedule = await schedulerService.updateSchedule(testSchedule.id, {
      name: 'Updated Test Schedule',
      cronExpression: '*/10 * * * *', // Every 10 minutes
      isActive: true
    });
    
    logger.info('Updated test schedule', { schedule: updatedSchedule });
    
    // Trigger the test schedule
    logger.info('Triggering test schedule...');
    await schedulerService.triggerJob(testSchedule.id);
    
    // Wait a moment for the job to run
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Delete the test schedule
    const deleteResult = await schedulerService.deleteSchedule(testSchedule.id);
    
    if (deleteResult) {
      logger.info('Deleted test schedule successfully');
    } else {
      logger.error('Failed to delete test schedule');
    }
    
    logger.info('====================================');
    logger.info('Pipeline Scheduler test completed');
    logger.info('====================================');
  } catch (error) {
    logger.error('Test failed', { error });
  } finally {
    // Exit the process after a delay to allow logs to be written
    setTimeout(() => process.exit(0), 1000);
  }
}

// Run the test
testScheduler(); 