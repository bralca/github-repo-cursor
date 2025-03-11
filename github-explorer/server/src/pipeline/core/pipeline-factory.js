import { logger } from '../../utils/logger.js';

/**
 * Pipeline Factory
 * 
 * Factory for creating and managing data processing pipelines.
 * Handles registration of pipeline stages and execution of pipelines.
 */
class PipelineFactory {
  constructor() {
    this.stages = new Map();
    this.pipelines = new Map();
    
    logger.info('Pipeline factory initialized');
  }
  
  /**
   * Register a pipeline stage
   * @param {string} stageName - Unique name for the stage
   * @param {Function} stageFactory - Factory function that creates a stage instance
   * @returns {void}
   */
  registerStage(stageName, stageFactory) {
    if (this.stages.has(stageName)) {
      logger.warn(`Stage ${stageName} already registered, overwriting`);
    }
    
    this.stages.set(stageName, stageFactory);
    logger.info(`Registered pipeline stage: ${stageName}`);
  }
  
  /**
   * Register a pipeline
   * @param {string} pipelineName - Unique name for the pipeline
   * @param {Object} pipelineConfig - Pipeline configuration
   * @returns {void}
   */
  registerPipeline(pipelineName, pipelineConfig) {
    if (this.pipelines.has(pipelineName)) {
      logger.warn(`Pipeline ${pipelineName} already registered, overwriting`);
    }
    
    // Validate pipeline configuration
    if (!pipelineConfig.stages || !Array.isArray(pipelineConfig.stages) || pipelineConfig.stages.length === 0) {
      throw new Error(`Invalid pipeline configuration for ${pipelineName}: missing or empty stages array`);
    }
    
    // Validate that all stages exist
    for (const stageName of pipelineConfig.stages) {
      if (!this.stages.has(stageName)) {
        throw new Error(`Invalid pipeline configuration for ${pipelineName}: stage ${stageName} not registered`);
      }
    }
    
    this.pipelines.set(pipelineName, pipelineConfig);
    logger.info(`Registered pipeline: ${pipelineName} with ${pipelineConfig.stages.length} stages`);
  }
  
  /**
   * Execute a pipeline
   * @param {string} pipelineName - Name of the pipeline to execute
   * @param {Object} context - Initial pipeline context
   * @param {Object} options - Pipeline execution options
   * @returns {Promise<Object>} Final pipeline context
   */
  async execute(pipelineName, context = {}, options = {}) {
    // Validate pipeline exists
    if (!this.pipelines.has(pipelineName)) {
      throw new Error(`Pipeline ${pipelineName} not registered`);
    }
    
    const pipelineConfig = this.pipelines.get(pipelineName);
    const startTime = Date.now();
    
    // Initialize pipeline context if needed
    if (!context.stats) {
      context.stats = {};
    }
    
    if (!context.errors) {
      context.errors = [];
    }
    
    // Add recordError method to context if not exists
    if (!context.recordError) {
      context.recordError = (stage, error) => {
        context.errors.push({
          stage,
          message: error.message,
          stack: error.stack
        });
      };
    }
    
    logger.info(`Executing pipeline: ${pipelineName}`);
    
    try {
      // Execute each stage in sequence
      for (const stageName of pipelineConfig.stages) {
        const stageFactory = this.stages.get(stageName);
        const stage = stageFactory();
        
        logger.info(`Executing pipeline stage: ${stageName}`);
        
        try {
          // Execute the stage
          context = await stage.execute(context, pipelineConfig);
          
          logger.info(`Completed pipeline stage: ${stageName}`);
        } catch (error) {
          logger.error(`Error in pipeline stage ${stageName}:`, { error });
          
          // Record error in context
          context.recordError(stageName, error);
          
          // If stage is configured to abort on error, rethrow
          if (stage.config && stage.config.abortOnError) {
            throw error;
          }
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info(`Pipeline ${pipelineName} completed in ${duration}ms`);
      
      return context;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Pipeline ${pipelineName} failed after ${duration}ms:`, { error });
      
      // Record error in context
      context.recordError(pipelineName, error);
      
      // Rethrow if configured to abort on error
      if (options.abortOnError) {
        throw error;
      }
      
      return context;
    }
  }
  
  /**
   * Get a list of registered stages
   * @returns {Array<string>} List of stage names
   */
  getRegisteredStages() {
    return Array.from(this.stages.keys());
  }
  
  /**
   * Get a list of registered pipelines
   * @returns {Array<string>} List of pipeline names
   */
  getRegisteredPipelines() {
    return Array.from(this.pipelines.keys());
  }
  
  /**
   * Get pipeline configuration
   * @param {string} pipelineName - Name of the pipeline
   * @returns {Object} Pipeline configuration
   */
  getPipelineConfig(pipelineName) {
    if (!this.pipelines.has(pipelineName)) {
      throw new Error(`Pipeline ${pipelineName} not registered`);
    }
    
    return this.pipelines.get(pipelineName);
  }
}

// Create singleton instance
export const pipelineFactory = new PipelineFactory(); 