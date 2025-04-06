/**
 * Database Writer Processor
 * 
 * This processor handles storing processed data from pipeline stages in the database.
 * It supports batch operations, error handling, and retry logic for robust database persistence.
 * NOTE: This is currently a stub implementation that logs operations without actual database interaction.
 */

import { BaseStage } from '../core/base-stage.js';
import { logger } from '../../utils/logger.js';
// Import cache invalidation utilities
import { 
  invalidateContributorCache, 
  invalidateRepositoryCache, 
  invalidateEntityCountsCache,
  invalidateOnDataUpdate
} from '../../utils/cache-invalidation.js';

/**
 * DatabaseWriterProcessor - Processor for writing processed data to the database
 */
export class DatabaseWriterProcessor extends BaseStage {
  /**
   * Create a new database writer processor
   * @param {Object} options - Processor options
   */
  constructor(options = {}) {
    super({
      name: 'database-writer',
      abortOnError: options.abortOnError ?? false,
      config: {
        batchSize: 50, // Default batch size for database operations
        maxRetries: 3, // Maximum number of retries for failed operations
        retryDelay: 1000, // Delay between retries in milliseconds
        enableCacheInvalidation: true, // Whether to invalidate caches on write
        ...options.config
      }
    });

    // Use provided database client or set to null (stub implementation)
    this.supabase = options.supabase || null;
    this.log('info', 'Database writer processor initialized with stub implementation');
  }

  /**
   * Execute the database writer processor
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} pipelineConfig - Pipeline configuration
   * @returns {Promise<PipelineContext>} Updated pipeline context
   */
  async execute(context, pipelineConfig) {
    this.log('info', 'Starting database writer processor (stub implementation)');

    // Merge configuration from pipeline and processor
    const config = { ...this.config, ...pipelineConfig };

    try {
      // Track entities that have been modified for cache invalidation
      const modifiedEntities = {
        repositories: new Set(),
        contributors: new Set(),
        entityCountsChanged: false
      };

      // Process different types of entities if they exist in the context
      if (context.repositories?.length > 0) {
        await this.storeRepositories(context.repositories, context, config);
        
        // Track modified repositories for cache invalidation
        context.repositories.forEach(repo => {
          modifiedEntities.repositories.add(repo.id);
        });
        
        modifiedEntities.entityCountsChanged = true;
      }

      if (context.contributors?.length > 0) {
        await this.storeContributors(context.contributors, context, config);
        
        // Track modified contributors for cache invalidation
        context.contributors.forEach(contributor => {
          modifiedEntities.contributors.add(contributor.id);
        });
        
        modifiedEntities.entityCountsChanged = true;
      }

      if (context.mergeRequests?.length > 0) {
        await this.storeMergeRequests(context.mergeRequests, context, config);
        modifiedEntities.entityCountsChanged = true;
      }

      if (context.commits?.length > 0) {
        await this.storeCommits(context.commits, context, config);
        modifiedEntities.entityCountsChanged = true;
      }

      // Process entity relationships if they exist
      if (context.contributorRepositoryRelationships?.length > 0) {
        await this.storeContributorRepositoryRelationships(
          context.contributorRepositoryRelationships, 
          context, 
          config
        );
        
        // Track modified contributors and repositories from relationships
        context.contributorRepositoryRelationships.forEach(rel => {
          if (rel.contributorId) modifiedEntities.contributors.add(rel.contributorId);
          if (rel.repositoryId) modifiedEntities.repositories.add(rel.repositoryId);
        });
      }

      // Store statistics if they exist
      if (context.commitStatistics && Object.keys(context.commitStatistics).length > 0) {
        await this.storeCommitStatistics(context.commitStatistics, context, config);
      }

      if (context.mergeRequestStatistics && Object.keys(context.mergeRequestStatistics).length > 0) {
        await this.storeMergeRequestStatistics(context.mergeRequestStatistics, context, config);
      }

      // Invalidate caches if enabled
      if (config.enableCacheInvalidation) {
        await this.invalidateCaches(modifiedEntities, context);
      }

      this.log('info', 'Database writer processor completed successfully (stub implementation)');
      return context;
    } catch (error) {
      this.log('error', 'Database writer processor failed', { error });
      context.recordError('database-writer', error);
      
      if (this.config.abortOnError) {
        throw error;
      }
      
      return context;
    }
  }

  /**
   * Invalidate caches for modified entities
   * @param {Object} modifiedEntities - Tracking of modified entities
   * @param {PipelineContext} context - Pipeline context
   * @returns {Promise<void>}
   */
  async invalidateCaches(modifiedEntities, context) {
    this.log('info', 'Invalidating caches for modified entities');
    
    try {
      // Invalidate repository caches
      const repositoryCount = modifiedEntities.repositories.size;
      if (repositoryCount > 0) {
        this.log('info', `Invalidating caches for ${repositoryCount} repositories`);
        
        for (const repoId of modifiedEntities.repositories) {
          invalidateRepositoryCache(repoId);
        }
      }
      
      // Invalidate contributor caches
      const contributorCount = modifiedEntities.contributors.size;
      if (contributorCount > 0) {
        this.log('info', `Invalidating caches for ${contributorCount} contributors`);
        
        for (const contributorId of modifiedEntities.contributors) {
          invalidateContributorCache(contributorId);
        }
      }
      
      // Invalidate entity counts if they changed
      if (modifiedEntities.entityCountsChanged) {
        this.log('info', 'Invalidating entity counts cache');
        invalidateEntityCountsCache();
      }
      
      // Trigger a pipeline_completed event if this was a full pipeline run
      if (
        repositoryCount > 0 &&
        contributorCount > 0 &&
        modifiedEntities.entityCountsChanged
      ) {
        this.log('info', 'Triggering pipeline_completed cache invalidation event');
        invalidateOnDataUpdate('pipeline_completed');
      }
      
      this.log('info', 'Cache invalidation completed');
    } catch (error) {
      this.log('error', 'Error invalidating caches', { error });
      // Don't throw the error, just log it to prevent pipeline failure
    }
  }

  /**
   * Store repositories in batches using upsert
   * @param {Array<Object>} repositories - Repositories to store
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async storeRepositories(repositories, context, config) {
    this.log('info', `[STUB] Storing ${repositories.length} repositories`);
    
    // Process in batches for better efficiency
    const batches = this.createBatches(repositories, config.batchSize);
    let processedCount = 0;
    
    for (const batch of batches) {
      try {
        // In stub implementation, just log the operation
        processedCount += batch.length;
        this.log('debug', `[STUB] Would have upserted ${batch.length} repositories`);
      } catch (error) {
        this.log('error', 'Error processing repository batch', { error });
        context.recordError('database-writer-repository-batch', error);
      }
    }
    
    this.log('info', `[STUB] Processed ${processedCount} repositories with upsert operations`);
  }

  /**
   * Store contributors in batches using upsert
   * @param {Array<Object>} contributors - Contributors to store
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async storeContributors(contributors, context, config) {
    this.log('info', `[STUB] Storing ${contributors.length} contributors`);
    
    // Process in batches for better efficiency
    const batches = this.createBatches(contributors, config.batchSize);
    let processedCount = 0;
    
    for (const batch of batches) {
      try {
        // In stub implementation, just log the operation
        processedCount += batch.length;
        this.log('debug', `[STUB] Would have upserted ${batch.length} contributors`);
      } catch (error) {
        this.log('error', 'Error processing contributor batch', { error });
        context.recordError('database-writer-contributor-batch', error);
      }
    }
    
    this.log('info', `[STUB] Processed ${processedCount} contributors with upsert operations`);
  }

  /**
   * Store merge requests in batches using upsert
   * @param {Array<Object>} mergeRequests - Merge requests to store
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async storeMergeRequests(mergeRequests, context, config) {
    this.log('info', `[STUB] Storing ${mergeRequests.length} merge requests`);
    
    // Process in batches for better efficiency
    const batches = this.createBatches(mergeRequests, config.batchSize);
    let processedCount = 0;
    
    for (const batch of batches) {
      try {
        // In stub implementation, just log the operation
        processedCount += batch.length;
        this.log('debug', `[STUB] Would have upserted ${batch.length} merge requests`);
      } catch (error) {
        this.log('error', 'Error processing merge request batch', { error });
        context.recordError('database-writer-merge-request-batch', error);
      }
    }
    
    this.log('info', `[STUB] Processed ${processedCount} merge requests with upsert operations`);
  }

  /**
   * Store commits in batches using upsert
   * @param {Array<Object>} commits - Commits to store
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async storeCommits(commits, context, config) {
    this.log('info', `[STUB] Storing ${commits.length} commits`);
    
    // Process in batches for better efficiency
    const batches = this.createBatches(commits, config.batchSize);
    let processedCount = 0;
    let hashes = []; // Keep track of processed commit hashes for statistics
    
    for (const batch of batches) {
      try {
        // In stub implementation, just log the operation
        processedCount += batch.length;
        this.log('debug', `[STUB] Would have upserted ${batch.length} commits`);
        
        // Store the hashes for statistics processing
        batch.forEach(commit => {
          hashes.push(commit.hash);
        });
      } catch (error) {
        this.log('error', 'Error processing commit batch', { error });
        context.recordError('database-writer-commit-batch', error);
      }
    }
    
    this.log('info', `[STUB] Processed ${processedCount} commits with upsert operations`);
    
    // Store the processed commit hashes in the context for statistics lookup
    context.processedCommitHashes = hashes;
  }

  /**
   * Store contributor-repository relationships in batches using upsert
   * @param {Array<Object>} relationships - Contributor-repository relationships to store
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async storeContributorRepositoryRelationships(relationships, context, config) {
    this.log('info', `[STUB] Storing ${relationships.length} contributor-repository relationships`);
    
    // Process in batches for better efficiency
    const batches = this.createBatches(relationships, config.batchSize);
    let processedCount = 0;
    
    for (const batch of batches) {
      try {
        // In stub implementation, just log the operation
        processedCount += batch.length;
        this.log('debug', `[STUB] Would have upserted ${batch.length} contributor-repository relationships`);
      } catch (error) {
        this.log('error', 'Error processing relationship batch', { error });
        context.recordError('database-writer-relationship-batch', error);
      }
    }
    
    this.log('info', `[STUB] Processed ${processedCount} contributor-repository relationships with upsert operations`);
  }

  /**
   * Store commit statistics
   * @param {Object} commitStatistics - Commit statistics to store
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async storeCommitStatistics(commitStatistics, context, config) {
    this.log('info', `[STUB] Storing commit statistics for ${Object.keys(commitStatistics).length} commits`);
    
    // In stub implementation, just log the operation
    const commitHashes = Object.keys(commitStatistics);
    this.log('debug', `[STUB] Would have processed statistics for ${commitHashes.length} commits`);
    
    this.log('info', `[STUB] Processed commit statistics successfully`);
  }

  /**
   * Store merge request statistics
   * @param {Object} mergeRequestStatistics - Merge request statistics to store
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async storeMergeRequestStatistics(mergeRequestStatistics, context, config) {
    this.log('info', `[STUB] Storing merge request statistics for ${Object.keys(mergeRequestStatistics).length} merge requests`);
    
    // In stub implementation, just log the operation
    const mergeRequestIds = Object.keys(mergeRequestStatistics);
    this.log('debug', `[STUB] Would have processed statistics for ${mergeRequestIds.length} merge requests`);
    
    this.log('info', `[STUB] Processed merge request statistics successfully`);
  }

  /**
   * Create batch arrays from a larger array for efficient processing
   * @param {Array<any>} items - Items to batch
   * @param {number} batchSize - Size of each batch
   * @returns {Array<Array<any>>} Array of batches
   */
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Helper method for logging with context
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  log(level, message, meta = {}) {
    logger[level](message, {
      stage: this.name,
      ...meta
    });
  }
} 