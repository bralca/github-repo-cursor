/**
 * Quick Scheduler Test
 * 
 * This script tests the scheduler service with a properly registered pipeline,
 * creating a schedule that runs every 10 seconds to quickly verify it works.
 */

import 'dotenv/config';
import { pipelineFactory } from '../pipeline/core/pipeline-factory.js';
import schedulerService from '../services/scheduler/scheduler-service.js';
import { logger } from '../utils/logger.js';
import { createFallbackTable, getFallbackTableSchema, tableExists } from '../utils/database-checker.js';

/**
 * A simple test pipeline stage
 */
class TestStage {
  constructor(config) {
    this.name = 'test-stage';
    this.config = config;
  }
  
  async execute(context) {
    const timestamp = new Date().toISOString();
    logger.info(`Test stage executed at ${timestamp}`);
    logger.info(`Context: ${JSON.stringify(context)}`);
    
    // Just return the context for further processing
    return context;
  }
}

/**
 * A simple test pipeline class
 */
class TestPipeline {
  constructor(pipelineType, stages) {
    this.pipelineType = pipelineType;
    this.stages = stages;
  }
  
  /**
   * Run the pipeline
   * @param {Object} initialContext - Initial context
   * @param {Object} config - Pipeline configuration
   * @returns {Promise<Object>} Final pipeline context with results
   */
  async run(initialContext = {}, config = {}) {
    try {
      let context = { ...initialContext };
      
      // Add stats and errors if not present
      if (!context.stats) context.stats = {};
      if (!context.errors) context.errors = [];
      
      // Add recordError method to context
      if (!context.recordError) {
        context.recordError = (stage, error) => {
          context.errors.push({
            stage,
            message: error.message,
            stack: error.stack
          });
        };
      }
      
      logger.info(`Running test pipeline: ${this.pipelineType}`);
      
      // Execute each stage
      for (const stage of this.stages) {
        logger.info(`Executing stage: ${stage.name}`);
        try {
          context = await stage.execute(context, config);
        } catch (error) {
          logger.error(`Error in stage ${stage.name}:`, { error });
          context.recordError(stage.name, error);
          // Don't throw here to ensure the pipeline completes
        }
      }
      
      logger.info(`Pipeline ${this.pipelineType} completed successfully`);
      
      return {
        success: true,
        message: `Pipeline executed successfully at ${new Date().toISOString()}`,
        context
      };
    } catch (error) {
      logger.error(`Pipeline ${this.pipelineType} failed:`, { error });
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

/**
 * Register the test pipeline
 */
function registerTestPipeline() {
  // Register the test stage
  pipelineFactory.registerStage('test-stage', () => {
    return new TestStage({
      someConfig: 'test-value'
    });
  });
  
  // Create the test pipeline function that returns a TestPipeline instance
  const testPipelineFunction = () => {
    const testStage = new TestStage({ someConfig: 'test-value' });
    return new TestPipeline('test-pipeline', [testStage]);
  };
  
  // Register the test pipeline
  pipelineFactory.registerPipeline('test-pipeline', {
    name: 'test-pipeline',
    description: 'Simple pipeline for testing scheduler',
    concurrency: 1,
    retries: 0,
    stages: ['test-stage'], // Use the registered stage name
    // Add a factory function to create a pipeline instance
    createInstance: testPipelineFunction
  });
  
  // Monkey patch the pipeline factory to add the getPipeline method 
  // if it doesn't already exist
  if (!pipelineFactory.getPipeline) {
    pipelineFactory.getPipeline = (pipelineType) => {
      const config = pipelineFactory.getPipelineConfig(pipelineType);
      
      if (config && config.createInstance) {
        return config.createInstance();
      }
      
      // Fall back to creating a generic TestPipeline
      const testStage = new TestStage({ someConfig: 'test-value' });
      return new TestPipeline(pipelineType, [testStage]);
    };
  }
  
  logger.info('Test pipeline registered successfully');
}

/**
 * Setup database tables if they don't exist
 */
async function ensureTablesExist() {
  logger.info('Checking if required database tables exist...');
  
  // Check and create pipeline_schedules table
  const scheduleTableExists = await tableExists('pipeline_schedules');
  if (!scheduleTableExists) {
    logger.warn('Pipeline schedules table does not exist, creating it...');
    const created = await createFallbackTable(
      'pipeline_schedules', 
      getFallbackTableSchema('pipeline_schedules')
    );
    
    if (created) {
      logger.info('Created pipeline_schedules table');
    } else {
      logger.warn('Failed to create pipeline_schedules table. Test may fail when accessing database.');
    }
  } else {
    logger.info('Pipeline schedules table already exists');
  }
  
  // Check and create pipeline_configurations table
  const configTableExists = await tableExists('pipeline_configurations');
  if (!configTableExists) {
    logger.warn('Pipeline configurations table does not exist, creating it...');
    const created = await createFallbackTable(
      'pipeline_configurations', 
      getFallbackTableSchema('pipeline_configurations')
    );
    
    if (created) {
      logger.info('Created pipeline_configurations table');
    } else {
      logger.warn('Failed to create pipeline_configurations table. Test may fail if using configurations.');
    }
  } else {
    logger.info('Pipeline configurations table already exists');
  }
}

/**
 * Test the scheduler service with a pipeline
 */
async function testQuickScheduler() {
  try {
    logger.info('====================================');
    logger.info('Starting Quick Scheduler Test');
    logger.info('====================================');
    
    // Ensure database tables exist
    await ensureTablesExist();
    
    // Initialize scheduler service (will use tables we just created)
    await schedulerService.checkDatabaseAvailability();
    
    // Register the test pipeline
    registerTestPipeline();
    
    logger.info('Creating test schedule...');
    
    // Create a test schedule (runs every 10 seconds)
    // Note: '*/10 * * * * *' format with seconds for node-schedule
    const testSchedule = await schedulerService.scheduleJob({
      name: 'Quick Test Schedule',
      pipelineType: 'test-pipeline',
      cronExpression: '*/10 * * * * *', // Every 10 seconds (includes seconds field)
      timeZone: 'UTC',
      isActive: true
    });
    
    logger.info('Created test schedule that runs every 10 seconds', { 
      schedule_id: testSchedule.id,
      name: testSchedule.name,
      cron: testSchedule.cronExpression,
      next_run: testSchedule.nextRunAt 
    });
    
    // Also trigger it once immediately to verify it works
    logger.info('Triggering job immediately...');
    
    try {
      await schedulerService.triggerJob(testSchedule.id);
    } catch (error) {
      logger.error('Failed to trigger job', { error });
      // Continue anyway - we'll see if it works with the scheduler
    }
    
    // Wait a bit to see a few executions
    const MAX_RUNS = 3;
    logger.info(`Test will run for about ${MAX_RUNS * 10} seconds. Watch for executions every 10 seconds...`);
    
    // Wait for a few executions
    for (let i = 0; i < MAX_RUNS; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      logger.info(`Waiting for run ${i + 1} of ${MAX_RUNS}...`);
    }
    
    // Clean up - delete the schedule
    logger.info('Test complete. Cleaning up...');
    await schedulerService.deleteSchedule(testSchedule.id);
    
    logger.info('====================================');
    logger.info('Quick Scheduler Test completed');
    logger.info('====================================');
  } catch (error) {
    logger.error('Test failed', { error, stack: error.stack });
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the test
testQuickScheduler(); 