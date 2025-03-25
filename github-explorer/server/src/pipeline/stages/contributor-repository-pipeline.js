import { pipelineFactory } from '../core/pipeline-factory.js';
import { ContributorRepositoryProcessor } from '../processors/contributor-repository-processor.js';
import { githubClientFactory } from '../../services/github/github-client.js';
import { logger } from '../../utils/logger.js';

/**
 * Register the contributor-repository relationship processor pipeline stage
 * @param {Object} options - Options for pipeline registration
 * @returns {void}
 */
export function registerContributorRepositoryPipeline(options = {}) {
  logger.info('Registering contributor-repository relationship pipeline stage');
  
  // Create required services
  const githubClient = githubClientFactory.createClient();
  
  // Initialize as null, we're not using Supabase anymore
  let contributorService = null;
  let repositoryService = null;
  
  if (options.supabaseServices) {
    contributorService = options.supabaseServices.contributorService;
    repositoryService = options.supabaseServices.repositoryService;
  } else {
    // No longer try to create Supabase services
    logger.info('Using null services for contributor-repository pipeline');
  }
  
  // Register the contributor-repository processor stage
  pipelineFactory.registerStage('process-contributor-repository-relationships', () => {
    return new ContributorRepositoryProcessor({
      githubClient,
      contributorService,
      repositoryService,
      config: {
        updateExistingRelationships: true,
        calculateCommitStats: true,
        calculateMergeRequestStats: true,
        calculateCodeStats: true,
        ...options.processorConfig
      }
    });
  });
  
  // Register the contributor-repository pipeline
  pipelineFactory.registerPipeline('contributor-repository-processor', {
    name: 'contributor-repository-processor',
    description: 'Process and update contributor-repository relationships',
    concurrency: 1,
    retries: 2,
    stages: ['process-contributor-repository-relationships']
  });
  
  logger.info('Contributor-repository relationship pipeline registered successfully');
}

/**
 * Process contributor-repository relationships from existing data
 * @param {Object} data - Data containing contributors, repositories, commits, and/or merge requests
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing result
 */
export async function processContributorRepositoryRelationships(data, options = {}) {
  logger.info('Processing contributor-repository relationships');
  
  try {
    // Create pipeline context with provided data
    const context = {
      contributors: data.contributors || [],
      repositories: data.repositories || [],
      commits: data.commits || [],
      mergeRequests: data.mergeRequests || [],
      repoContributors: data.repoContributors || [], // Existing relationships
      // Cache original data in case needed for reference
      originalData: data
    };
    
    // Run the contributor-repository processor pipeline
    const result = await pipelineFactory.execute('contributor-repository-processor', context);
    
    logger.info(`Contributor-repository relationship processing completed. Processed ${context.relationships?.contributorRepository?.length || 0} relationships`);
    
    // Return the relationship data from the context
    return {
      relationships: result.relationships?.contributorRepository || [],
      errors: result.errors || []
    };
  } catch (error) {
    logger.error('Contributor-repository relationship processing failed', { error });
    return {
      relationships: [],
      errors: [{ 
        stage: 'contributor-repository-processor',
        message: error.message,
        stack: error.stack
      }]
    };
  }
} 