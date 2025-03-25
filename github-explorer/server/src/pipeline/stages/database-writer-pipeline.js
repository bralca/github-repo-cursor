/**
 * Database Writer Pipeline
 * 
 * This pipeline stage handles the storage of processed data in the database.
 * It integrates with all other pipeline stages to provide data persistence.
 * Note: This is now a stub implementation since we've removed Supabase.
 */

import { pipelineFactory } from '../core/pipeline-factory.js';
import { DatabaseWriterProcessor } from '../processors/database-writer-processor.js';
// Removed Supabase client import
// import { supabaseClientFactory } from '../../services/supabase/supabase-client.js';
import { logger } from '../../utils/logger.js';

/**
 * Register the database writer pipeline stage
 * @param {Object} options - Options for pipeline registration
 * @returns {void}
 */
export function registerDatabaseWriterPipeline(options = {}) {
  logger.info('Registering database writer pipeline stage');
  
  // Use a null client or one provided in options
  const dbClient = options.dbClient || null;
  
  // Register the database writer stage
  pipelineFactory.registerStage('store-data', () => {
    return new DatabaseWriterProcessor({
      dbClient,
      config: {
        batchSize: options.batchSize || 50,
        maxRetries: options.maxRetries || 3,
        retryDelay: options.retryDelay || 1000,
        abortOnError: options.abortOnError || false
      }
    });
  });
  
  // Register the database writer pipeline
  pipelineFactory.registerPipeline('database-writer', {
    name: 'database-writer',
    description: 'Store processed data in the database',
    concurrency: 1,
    retries: 2,
    stages: ['store-data']
  });
  
  logger.info('Database writer pipeline registered successfully');
}

/**
 * Store data in the database
 * @param {Object} data - Data to store
 * @param {Object} options - Storage options
 * @returns {Promise<Object>} Storage result
 */
export async function storeData(data, options = {}) {
  logger.info('Starting data storage operation');
  
  try {
    // Create pipeline context with the data to store
    const context = {
      // Extract repositories if available
      repositories: data.repositories || [],
      // Extract contributors if available
      contributors: data.contributors || [],
      // Extract merge requests if available
      mergeRequests: data.mergeRequests || [],
      // Extract commits if available
      commits: data.commits || [],
      // Extract relationships if available
      contributorRepositoryRelationships: data.contributorRepositoryRelationships || [],
      // Extract statistics if available
      commitStatistics: data.commitStatistics || {},
      mergeRequestStatistics: data.mergeRequestStatistics || {},
      // Cache original payload in case needed for reference
      originalPayload: data
    };
    
    // Run the database writer pipeline
    const result = await pipelineFactory.execute('database-writer', context);
    
    logger.info('Data storage operation completed');
    
    return {
      success: result.errors?.length === 0,
      errors: result.errors || []
    };
  } catch (error) {
    logger.error('Data storage operation failed', { error });
    return {
      success: false,
      errors: [{ 
        stage: 'database-writer',
        message: error.message,
        stack: error.stack
      }]
    };
  }
}

/**
 * Store repository data in the database
 * @param {Array<Object>} repositories - Repositories to store
 * @param {Object} options - Storage options
 * @returns {Promise<Object>} Storage result
 */
export async function storeRepositories(repositories, options = {}) {
  return storeData({ repositories }, options);
}

/**
 * Store contributor data in the database
 * @param {Array<Object>} contributors - Contributors to store
 * @param {Object} options - Storage options
 * @returns {Promise<Object>} Storage result
 */
export async function storeContributors(contributors, options = {}) {
  return storeData({ contributors }, options);
}

/**
 * Store merge request data in the database
 * @param {Array<Object>} mergeRequests - Merge requests to store
 * @param {Object} options - Storage options
 * @returns {Promise<Object>} Storage result
 */
export async function storeMergeRequests(mergeRequests, options = {}) {
  return storeData({ mergeRequests }, options);
}

/**
 * Store commit data in the database
 * @param {Array<Object>} commits - Commits to store
 * @param {Object} options - Storage options
 * @returns {Promise<Object>} Storage result
 */
export async function storeCommits(commits, options = {}) {
  return storeData({ commits }, options);
}

/**
 * Store commit statistics in the database
 * @param {Object} commitStatistics - Commit statistics to store
 * @param {Object} options - Storage options
 * @returns {Promise<Object>} Storage result
 */
export async function storeCommitStatistics(commitStatistics, options = {}) {
  return storeData({ commitStatistics }, options);
}

/**
 * Store contributor-repository relationships in the database
 * @param {Array<Object>} relationships - Relationships to store
 * @param {Object} options - Storage options
 * @returns {Promise<Object>} Storage result
 */
export async function storeContributorRepositoryRelationships(relationships, options = {}) {
  return storeData({ contributorRepositoryRelationships: relationships }, options);
} 