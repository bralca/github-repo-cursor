import { PipelineContext } from './pipeline-context.js';
import { logger } from '../../utils/logger.js';

/**
 * Pipeline - Core pipeline execution engine
 * 
 * This class manages the execution of pipeline stages and handles
 * the overall workflow of data processing.
 */
export class Pipeline {
  /**
   * Create a new pipeline
   * @param {Object} options - Pipeline options
   * @param {string} options.name - Pipeline name
   * @param {Array} options.stages - Ordered array of pipeline stages to execute
   * @param {Object} options.config - Pipeline configuration
   */
  constructor({ name, stages = [], config = {} }) {
    this.name = name || 'unnamed-pipeline';
    this.stages = stages;
    this.config = {
      maxConcurrency: 1,
      retryCount: 3,
      retryDelay: 1000,
      timeout: 300000, // 5 minutes
      batchSize: 100,
      ...config
    };

    logger.info(`Initialized pipeline: ${this.name} with ${stages.length} stages`);
  }

  /**
   * Add a stage to the pipeline
   * @param {Object} stage - Pipeline stage object
   * @returns {Pipeline} this instance for chaining
   */
  addStage(stage) {
    if (!stage.execute || typeof stage.execute !== 'function') {
      throw new Error('Pipeline stage must have an execute method');
    }
    
    if (!stage.name) {
      throw new Error('Pipeline stage must have a name property');
    }
    
    this.stages.push(stage);
    logger.info(`Added stage '${stage.name}' to pipeline '${this.name}'`);
    
    return this;
  }

  /**
   * Run the pipeline with initial data
   * @param {Object} initialData - Initial data to start the pipeline with
   * @param {string} runId - Optional unique identifier for this pipeline run
   * @returns {Promise<PipelineContext>} The pipeline context after execution
   */
  async run(initialData = {}, runId) {
    // Create a new context for this pipeline run
    const context = new PipelineContext(initialData, runId);
    
    try {
      // Set the pipeline state to running
      context.start();
      
      // Execute each stage in sequence
      for (const stage of this.stages) {
        logger.info(`Running pipeline stage: ${stage.name}`);
        
        try {
          // Set a checkpoint before executing the stage
          context.setCheckpoint(stage.name, { status: 'started' });
          
          // Execute the stage
          await stage.execute(context, this.config);
          
          // Set a checkpoint after successful execution
          context.setCheckpoint(stage.name, { 
            status: 'completed',
            stats: context.getStats()
          });
          
          logger.info(`Completed pipeline stage: ${stage.name}`);
        } catch (error) {
          // Record the error
          context.recordError(stage.name, error);
          
          // Set a checkpoint for the failed stage
          context.setCheckpoint(stage.name, { 
            status: 'failed',
            error: error.message 
          });
          
          // Determine if we should continue or abort based on stage settings
          if (stage.abortOnError === true) {
            logger.error(`Pipeline aborted due to error in stage ${stage.name}: ${error.message}`);
            throw error;
          } else {
            logger.warn(`Error in stage ${stage.name}, but continuing: ${error.message}`);
          }
        }
      }
      
      // Set the pipeline state to completed
      context.complete();
      
      // Log the final stats
      logger.info('Pipeline stats:', context.getStats());
      
      return context;
    } catch (error) {
      // Set the pipeline state to failed
      context.fail(error);
      
      throw error;
    }
  }

  /**
   * Run the pipeline with batched data processing
   * @param {Array} dataItems - Array of data items to process in batches
   * @param {number} batchSize - Size of each batch (defaults to config.batchSize)
   * @param {string} runId - Optional unique identifier for this pipeline run
   * @returns {Promise<PipelineContext>} The final pipeline context after processing all batches
   */
  async runBatched(dataItems, batchSize, runId) {
    if (!Array.isArray(dataItems)) {
      throw new Error('dataItems must be an array for batched processing');
    }
    
    const actualBatchSize = batchSize || this.config.batchSize;
    const batches = [];
    
    // Split the data into batches
    for (let i = 0; i < dataItems.length; i += actualBatchSize) {
      batches.push(dataItems.slice(i, i + actualBatchSize));
    }
    
    logger.info(`Running batched pipeline '${this.name}' with ${batches.length} batches of size ${actualBatchSize}`);
    
    // Create a master context for the entire batched run
    const masterContext = new PipelineContext({
      runId,
      initialData: { rawData: [] }
    });
    
    masterContext.start();
    
    // Process each batch sequentially
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.info(`Processing batch ${i + 1}/${batches.length} with ${batch.length} items`);
      
      // Run the pipeline for this batch
      const batchContext = await this.run({ rawData: batch }, `${masterContext.runId}-batch-${i + 1}`);
      
      // Merge batch context data into master context
      masterContext.addRepositories(batchContext.repositories);
      masterContext.addContributors(batchContext.contributors);
      masterContext.addMergeRequests(batchContext.mergeRequests);
      masterContext.addCommits(batchContext.commits);
      
      // Merge errors
      batchContext.errors.forEach(error => {
        masterContext.errors.push({
          ...error,
          batch: i + 1
        });
      });
      
      // Update stats
      masterContext.stats.rawDataProcessed += batch.length;
      masterContext.stats.errors += batchContext.stats.errors;
      
      logger.info(`Completed batch ${i + 1}/${batches.length}`);
    }
    
    masterContext.complete();
    logger.info(`Completed batched pipeline execution: ${masterContext.runId}`);
    
    return masterContext;
  }
} 