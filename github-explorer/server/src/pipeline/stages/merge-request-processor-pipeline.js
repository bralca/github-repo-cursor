import { pipelineFactory } from '../core/pipeline-factory.js';
import { MergeRequestProcessorStage } from '../processors/merge-request-processor.js';
import { githubClientFactory } from '../../services/github/github-client.js';
import { logger } from '../../utils/logger.js';

/**
 * Register the merge request processor pipeline stage
 * @param {Object} options - Options for pipeline registration
 * @returns {void}
 */
export function registerMergeRequestProcessorPipeline(options = {}) {
  logger.info('Registering merge request processor pipeline stage');
  
  // Create GitHub client for API access
  const githubClient = githubClientFactory.createClient();
  
  // Register the merge request processor stage
  pipelineFactory.registerStage('process-merge-request-statistics', () => {
    return new MergeRequestProcessorStage({
      githubClient,
      config: {
        computeCycleTime: true,
        computeReviewTime: true,
        computeComplexityScore: true,
        computeReviewerRelationships: true,
        computeActivityMetrics: true,
        timeframeInDays: options.timeframeInDays || 90,
      }
    });
  });
  
  // Register the merge request processor pipeline
  pipelineFactory.registerPipeline('merge-request-processor', {
    name: 'merge-request-processor',
    description: 'Process merge request data and compute statistics',
    concurrency: 1,
    retries: 2,
    stages: ['process-merge-request-statistics']
  });
  
  logger.info('Merge request processor pipeline registered successfully');
}

/**
 * Process a single merge request
 * @param {Object} mergeRequest - Merge request data to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing result
 */
export async function processMergeRequest(mergeRequest, options = {}) {
  logger.info(`Processing merge request: ${mergeRequest.title || mergeRequest.id}`);
  
  try {
    // Create pipeline context with the merge request
    const context = {
      mergeRequests: [mergeRequest],
      // If we have repository data, include it
      repositories: options.repositories || [],
      // If we have contributor data, include it
      contributors: options.contributors || [],
      // If we have commit data, include it
      commits: options.commits || [],
      // Cache original payload in case needed for reference
      originalPayload: mergeRequest
    };
    
    // Run the merge request processor pipeline
    const result = await pipelineFactory.execute('merge-request-processor', context);
    
    logger.info(`Merge request processing completed for: ${mergeRequest.title || mergeRequest.id}`);
    
    // Return the merge request statistics from the context
    return {
      statistics: result.mergeRequestStatistics?.[mergeRequest.id] || null,
      errors: result.errors || []
    };
  } catch (error) {
    logger.error(`Merge request processing failed for: ${mergeRequest.title || mergeRequest.id}`, { error });
    return {
      statistics: null, 
      errors: [{ 
        stage: 'merge-request-processor',
        message: error.message,
        stack: error.stack
      }]
    };
  }
}

/**
 * Process multiple merge requests in batch
 * @param {Array<Object>} mergeRequests - Merge requests to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing results
 */
export async function processMergeRequests(mergeRequests, options = {}) {
  logger.info(`Processing ${mergeRequests.length} merge requests`);
  
  // Process merge requests in a single batch for better efficiency
  try {
    // Create pipeline context with all merge requests
    const context = {
      mergeRequests,
      // If we have repository data, include it
      repositories: options.repositories || [],
      // If we have contributor data, include it
      contributors: options.contributors || [],
      // If we have commit data, include it  
      commits: options.commits || [],
      // Cache original payload in case needed for reference
      originalPayload: mergeRequests
    };
    
    // Run the merge request processor pipeline
    const result = await pipelineFactory.execute('merge-request-processor', context);
    
    // Collect statistics for all processed merge requests
    const statistics = {};
    for (const mrId in result.mergeRequestStatistics) {
      statistics[mrId] = result.mergeRequestStatistics[mrId];
    }
    
    logger.info(`Batch merge request processing completed for ${mergeRequests.length} merge requests`);
    
    return {
      statistics,
      errors: result.errors || []
    };
  } catch (error) {
    logger.error('Batch merge request processing failed', { error });
    return {
      statistics: {}, 
      errors: [{ 
        stage: 'merge-request-processor',
        message: error.message,
        stack: error.stack
      }]
    };
  }
} 