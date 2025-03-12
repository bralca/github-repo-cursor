import { pipelineFactory } from '../core/pipeline-factory.js';
import { ContributorProcessorStage } from '../processors/contributor-processor.js';
import { githubClientFactory } from '../../services/github/github-client.js';
import { logger } from '../../utils/logger.js';

/**
 * Register the contributor processor pipeline stage
 * @param {Object} options - Options for pipeline registration
 * @returns {void}
 */
export function registerContributorProcessorPipeline(options = {}) {
  logger.info('Registering contributor processor pipeline stage');
  
  // Create GitHub client for API access
  const githubClient = githubClientFactory.createClient();
  
  // Get services from options
  const contributorService = options.contributorService;
  
  // Register the contributor processor stage
  pipelineFactory.registerStage('process-contributor-statistics', () => {
    return new ContributorProcessorStage({
      githubClient,
      contributorService,
      config: {
        computeImpactScore: true,
        computeRoleClassification: true,
        computeLanguagePreferences: true,
        computeActivityMetrics: true,
        computeRepositoryRelationships: true,
        timeframeInDays: options.timeframeInDays || 90,
      }
    });
  });
  
  // Register the contributor processor pipeline
  pipelineFactory.registerPipeline('contributor-processor', {
    name: 'contributor-processor',
    description: 'Process contributor data and compute statistics',
    concurrency: 1,
    retries: 2,
    stages: ['process-contributor-statistics']
  });
  
  logger.info('Contributor processor pipeline registered successfully');
}

/**
 * Process a single contributor
 * @param {Object} contributor - Contributor data to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing result
 */
export async function processContributor(contributor, options = {}) {
  logger.info(`Processing contributor: ${contributor.username || contributor.login || contributor.id}`);
  
  try {
    // Create pipeline context with the contributor
    const context = {
      contributors: [contributor],
      // Include related data if provided
      commits: options.commits || [],
      repositories: options.repositories || [],
      mergeRequests: options.mergeRequests || [],
      repoContributors: options.repoContributors || [],
      // Cache original payload in case needed for reference
      originalPayload: contributor
    };
    
    // Run the contributor processor pipeline
    const result = await pipelineFactory.execute('contributor-processor', context);
    
    logger.info(`Contributor processing completed for: ${contributor.username || contributor.login || contributor.id}`);
    
    // Return the contributor statistics from the context
    return {
      statistics: result.contributorStatistics?.[contributor.id] || null,
      errors: result.errors || []
    };
  } catch (error) {
    logger.error(`Contributor processing failed for: ${contributor.username || contributor.login || contributor.id}`, { error });
    return {
      statistics: null, 
      errors: [{ 
        stage: 'contributor-processor',
        message: error.message,
        stack: error.stack
      }]
    };
  }
}

/**
 * Process multiple contributors in batch
 * @param {Array<Object>} contributors - Contributors to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing results
 */
export async function processContributors(contributors, options = {}) {
  logger.info(`Processing ${contributors.length} contributors`);
  
  // Process contributors in a single batch for better efficiency
  try {
    // Create pipeline context with all contributors
    const context = {
      contributors,
      // Include related data if provided
      commits: options.commits || [],
      repositories: options.repositories || [],
      mergeRequests: options.mergeRequests || [],
      repoContributors: options.repoContributors || [],
      // Cache original payload in case needed for reference
      originalPayload: contributors
    };
    
    // Run the contributor processor pipeline
    const result = await pipelineFactory.execute('contributor-processor', context);
    
    // Collect statistics for all processed contributors
    const statistics = {};
    for (const contributorId in result.contributorStatistics) {
      statistics[contributorId] = result.contributorStatistics[contributorId];
    }
    
    logger.info(`Batch contributor processing completed for ${contributors.length} contributors`);
    
    return {
      statistics,
      errors: result.errors || []
    };
  } catch (error) {
    logger.error('Batch contributor processing failed', { error });
    return {
      statistics: {}, 
      errors: [{ 
        stage: 'contributor-processor',
        message: error.message,
        stack: error.stack
      }]
    };
  }
} 