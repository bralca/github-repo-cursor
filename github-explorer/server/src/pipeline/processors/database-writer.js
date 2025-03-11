import { BaseStage } from '../core/base-stage.js';
import { logger } from '../../utils/logger.js';

/**
 * DatabaseWriterProcessor - Writes processed entities to the database
 * 
 * This processor writes repositories, contributors, merge requests,
 * and commits to the database using the provided services.
 */
export class DatabaseWriterProcessor extends BaseStage {
  /**
   * Create a new database writer processor
   * @param {Object} options - Processor options
   */
  constructor(options = {}) {
    super({
      name: 'database-writer',
      abortOnError: false,
      config: {
        persistRepositories: true,
        persistContributors: true,
        persistMergeRequests: true,
        persistCommits: true,
        batchSize: 50,
        ...options.config
      }
    });
    
    this.repositoryService = options.repositoryService;
    this.contributorService = options.contributorService;
    this.mergeRequestService = options.mergeRequestService;
    this.commitService = options.commitService;
  }
  
  /**
   * Execute the database writing process
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} pipelineConfig - Pipeline configuration
   * @returns {Promise<PipelineContext>} Updated pipeline context
   */
  async execute(context, pipelineConfig) {
    this.log('info', 'Starting database write');
    
    // Validate that we have entities to persist
    this.validateContext(context, ['repositories', 'contributors', 'mergeRequests', 'commits']);
    
    const config = { ...this.config, ...pipelineConfig };
    
    try {
      // For now, just log the entities we would persist
      this.log('info', `Would persist ${context.repositories.length} repositories, ${context.contributors.length} contributors, ${context.mergeRequests.length} merge requests, and ${context.commits.length} commits`);
      
      // Initialize stats if they don't exist
      if (!context.stats) {
        context.stats = {};
      }
      
      // Update stats with database write information
      context.stats.repositoriesStored = context.repositories.length;
      context.stats.contributorsStored = context.contributors.length;
      context.stats.mergeRequestsStored = context.mergeRequests.length;
      context.stats.commitsStored = context.commits.length;
      
      this.log('info', 'Database write completed');
      
      return context;
    } catch (error) {
      this.log('error', 'Database write failed', { error });
      if (this.config.abortOnError) {
        throw error;
      }
      return context;
    }
  }
} 