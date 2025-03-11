import { pipelineFactory } from '../core/pipeline-factory.js';
import { RepositoryProcessorStage } from '../processors/repository-processor.js';
import { githubClientFactory } from '../../services/github/github-client.js';
import { logger } from '../../utils/logger.js';

/**
 * Register the repository processor pipeline stage
 * @param {Object} options - Options for pipeline registration
 * @returns {void}
 */
export function registerRepositoryProcessorPipeline(options = {}) {
  logger.info('Registering repository processor pipeline stage');
  
  // Create GitHub client for API access
  const githubClient = githubClientFactory.createClient();
  
  // Register the repository processor stage
  pipelineFactory.registerStage('process-repository-statistics', () => {
    return new RepositoryProcessorStage({
      githubClient,
      config: {
        computeCommitFrequency: true,
        computeStarHistory: true,
        computeForkStatistics: true,
        computeContributorCounts: true,
        computeLanguageBreakdown: true,
        timeframeInDays: options.timeframeInDays || 30,
      }
    });
  });
  
  // Register the repository processor pipeline
  pipelineFactory.registerPipeline('repository-processor', {
    name: 'repository-processor',
    description: 'Process repository data and compute statistics',
    concurrency: 1,
    retries: 2,
    stages: ['process-repository-statistics']
  });
  
  logger.info('Repository processor pipeline registered successfully');
}

/**
 * Process a single repository
 * @param {Object} repository - Repository data to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing result
 */
export async function processRepository(repository, options = {}) {
  logger.info(`Processing repository: ${repository.full_name || repository.id}`);
  
  try {
    // Create pipeline context with the repository
    const context = {
      repositories: [repository],
      // If we have commit data, include it
      commits: options.commits || [],
      // If we have contributor data, include it
      contributors: options.contributors || [],
      // Cache original payload in case needed for reference
      originalPayload: repository
    };
    
    // Run the repository processor pipeline
    const result = await pipelineFactory.execute('repository-processor', context);
    
    logger.info(`Repository processing completed for: ${repository.full_name || repository.id}`);
    
    // Return the repository statistics from the context
    return {
      statistics: result.repositoryStatistics?.[repository.id] || null,
      errors: result.errors || []
    };
  } catch (error) {
    logger.error(`Repository processing failed for: ${repository.full_name || repository.id}`, { error });
    return {
      statistics: null, 
      errors: [{ 
        stage: 'repository-processor',
        message: error.message,
        stack: error.stack
      }]
    };
  }
}

/**
 * Process multiple repositories in batch
 * @param {Array<Object>} repositories - Repositories to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing results
 */
export async function processRepositories(repositories, options = {}) {
  logger.info(`Processing ${repositories.length} repositories`);
  
  // Process repositories in a single batch for better efficiency
  try {
    // Create pipeline context with all repositories
    const context = {
      repositories,
      // If we have commit data, include it
      commits: options.commits || [],
      // If we have contributor data, include it
      contributors: options.contributors || [],
      // Cache original payload in case needed for reference
      originalPayload: repositories
    };
    
    // Run the repository processor pipeline
    const result = await pipelineFactory.execute('repository-processor', context);
    
    // Collect statistics for all processed repositories
    const statistics = {};
    for (const repoId in result.repositoryStatistics) {
      statistics[repoId] = result.repositoryStatistics[repoId];
    }
    
    logger.info(`Batch repository processing completed for ${repositories.length} repositories`);
    
    return {
      statistics,
      errors: result.errors || []
    };
  } catch (error) {
    logger.error('Batch repository processing failed', { error });
    return {
      statistics: {}, 
      errors: [{ 
        stage: 'repository-processor',
        message: error.message,
        stack: error.stack
      }]
    };
  }
} 