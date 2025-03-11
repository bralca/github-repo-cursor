import { logger } from '../../utils/logger.js';

/**
 * BaseStage - Abstract base class for pipeline stages
 * 
 * This class provides common functionality for all pipeline stages,
 * including logging, validation, and retry logic.
 */
export class BaseStage {
  /**
   * Create a new pipeline stage
   * @param {Object} options - Stage options
   * @param {string} options.name - Stage name
   * @param {boolean} options.abortOnError - Whether to abort the pipeline on error
   * @param {Object} options.config - Stage configuration
   */
  constructor(options) {
    if (!options || !options.name) {
      throw new Error('Stage name is required');
    }
    
    this.name = options.name;
    this.abortOnError = options.abortOnError || false;
    this.config = options.config || {};
  }
  
  /**
   * Execute the stage
   * @param {Object} context - Pipeline context
   * @param {Object} pipelineConfig - Pipeline configuration
   * @returns {Promise<Object>} Updated pipeline context
   */
  async execute(context, pipelineConfig) {
    throw new Error('execute() method must be implemented by subclass');
  }
  
  /**
   * Log a message with stage name prefix
   * @param {string} level - Log level (debug, info, warn, error)
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  log(level, message, meta = {}) {
    if (!logger[level]) {
      level = 'info';
    }
    
    logger[level](`[${this.name}] ${message}`, meta);
  }
  
  /**
   * Validate that the context contains required data
   * @param {Object} context - Pipeline context
   * @param {Array<string>} requiredKeys - Required keys in context
   * @throws {Error} If any required key is missing
   */
  validateContext(context, requiredKeys = []) {
    for (const key of requiredKeys) {
      if (context[key] === undefined) {
        throw new Error(`Missing required context key: ${key}`);
      }
    }
  }
  
  /**
   * Process items with retry logic
   * @param {Array} items - Items to process
   * @param {Function} processFn - Processing function
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} Processing results
   */
  async processWithRetry(items, processFn, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const results = [];
    const errors = [];
    
    for (const item of items) {
      let retries = 0;
      let success = false;
      
      while (!success && retries <= maxRetries) {
        try {
          if (retries > 0) {
            this.log('info', `Retry ${retries}/${maxRetries} for item`, { item });
          }
          
          const result = await processFn(item);
          results.push(result);
          success = true;
        } catch (error) {
          retries++;
          
          if (retries > maxRetries) {
            this.log('error', `Failed to process item after ${maxRetries} retries`, { item, error });
            errors.push({ item, error });
          } else {
            this.log('warn', `Error processing item, will retry (${retries}/${maxRetries})`, { item, error });
            
            // Wait before retrying (exponential backoff)
            const delay = Math.pow(2, retries) * 100;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    }
    
    return { results, errors };
  }
  
  /**
   * Process items in batches with configurable concurrency
   * @param {Array} items - Items to process
   * @param {Function} processFn - Processing function
   * @param {Object} options - Processing options
   * @returns {Promise<Array>} Processing results
   */
  async batchProcess(items, processFn, options = {}) {
    const concurrency = options.concurrency || 1;
    const batchSize = options.batchSize || 10;
    const results = [];
    
    // Process in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      this.log('debug', `Processing batch ${i / batchSize + 1}/${Math.ceil(items.length / batchSize)}`);
      
      // Process batch with concurrency
      const batchPromises = [];
      for (let j = 0; j < batch.length; j += concurrency) {
        const concurrent = batch.slice(j, j + concurrency);
        const concurrentPromises = concurrent.map(item => processFn(item));
        
        const batchResults = await Promise.allSettled(concurrentPromises);
        batchPromises.push(...batchResults);
      }
      
      // Collect results
      for (const result of batchPromises) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.log('error', 'Error processing item in batch', { error: result.reason });
          
          if (options.throwOnError) {
            throw result.reason;
          }
        }
      }
    }
    
    return results;
  }
} 