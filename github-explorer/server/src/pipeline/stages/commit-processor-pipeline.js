import { pipelineFactory } from '../core/pipeline-factory.js';
import { CommitProcessorStage } from '../processors/commit-processor.js';
import { githubClientFactory } from '../../services/github/github-client.js';
import { logger } from '../../utils/logger.js';

/**
 * Register the commit processor pipeline stage
 * @param {Object} options - Options for pipeline registration
 * @returns {void}
 */
export function registerCommitProcessorPipeline(options = {}) {
  logger.info('Registering commit processor pipeline stage');
  
  // Create GitHub client for API access
  const githubClient = githubClientFactory.createClient();
  
  // Register the commit processor stage
  pipelineFactory.registerStage('process-commit-statistics', () => {
    return new CommitProcessorStage({
      githubClient,
      config: {
        computeCodeImpact: true,
        computeComplexity: true,
        computeCommitClassification: true,
        computeLanguageDistribution: true,
        computeFileChanges: true,
        timeframeInDays: options.timeframeInDays || 90,
      }
    });
  });
  
  // Register the commit processor pipeline
  pipelineFactory.registerPipeline('commit-processor', {
    name: 'commit-processor',
    description: 'Process commit data and compute statistics',
    concurrency: 1,
    retries: 2,
    stages: ['process-commit-statistics']
  });
  
  logger.info('Commit processor pipeline registered successfully');
}

/**
 * Process a single commit
 * @param {Object} commit - Commit data to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing result
 */
export async function processCommit(commit, options = {}) {
  logger.info(`Processing commit: ${commit.title || commit.hash}`);
  
  try {
    // Create pipeline context with the commit
    const context = {
      commits: [commit],
      // If we have repository data, include it
      repositories: options.repositories || [],
      // If we have contributor data, include it
      contributors: options.contributors || [],
      // Cache original payload in case needed for reference
      originalPayload: commit
    };
    
    // Run the commit processor pipeline
    const result = await pipelineFactory.execute('commit-processor', context);
    
    logger.info(`Commit processing completed for: ${commit.title || commit.hash}`);
    
    // Return the commit statistics from the context
    return {
      statistics: result.commitStatistics?.[commit.hash] || null,
      errors: result.errors || []
    };
  } catch (error) {
    logger.error(`Commit processing failed for: ${commit.title || commit.hash}`, { error });
    return {
      statistics: null, 
      errors: [{ 
        stage: 'commit-processor',
        message: error.message,
        stack: error.stack
      }]
    };
  }
}

/**
 * Process multiple commits in batch
 * @param {Array<Object>} commits - Commits to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing results
 */
export async function processCommits(commits, options = {}) {
  logger.info(`Processing ${commits.length} commits`);
  
  // Process commits in a single batch for better efficiency
  try {
    // Create pipeline context with all commits
    const context = {
      commits,
      // If we have repository data, include it
      repositories: options.repositories || [],
      // If we have contributor data, include it
      contributors: options.contributors || [],
      // Cache original payload in case needed for reference
      originalPayload: commits
    };
    
    // Run the commit processor pipeline
    const result = await pipelineFactory.execute('commit-processor', context);
    
    // Collect statistics for all processed commits
    const statistics = {};
    for (const hash in result.commitStatistics) {
      statistics[hash] = result.commitStatistics[hash];
    }
    
    logger.info(`Batch commit processing completed for ${commits.length} commits`);
    
    return {
      statistics,
      errors: result.errors || []
    };
  } catch (error) {
    logger.error('Batch commit processing failed', { error });
    return {
      statistics: {}, 
      errors: [{ 
        stage: 'commit-processor',
        message: error.message,
        stack: error.stack
      }]
    };
  }
} 