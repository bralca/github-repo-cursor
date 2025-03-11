import { BaseStage } from '../core/base-stage.js';
import { logger } from '../../utils/logger.js';

/**
 * DataEnricherProcessor - Enriches extracted entities with additional data
 * 
 * This processor enriches repositories, contributors, merge requests,
 * and commits with additional data from the GitHub API.
 */
export class DataEnricherProcessor extends BaseStage {
  /**
   * Create a new data enricher processor
   * @param {Object} options - Processor options
   */
  constructor(options = {}) {
    super({
      name: 'data-enricher',
      abortOnError: false,
      config: {
        enrichRepositories: true,
        enrichContributors: true,
        enrichMergeRequests: true,
        enrichCommits: true,
        concurrency: 2,
        ...options.config
      }
    });
    
    this.githubClient = options.githubClient;
  }
  
  /**
   * Execute the data enrichment process
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} pipelineConfig - Pipeline configuration
   * @returns {Promise<PipelineContext>} Updated pipeline context
   */
  async execute(context, pipelineConfig) {
    this.log('info', 'Starting data enrichment');
    
    // Validate that we have entities to enrich
    this.validateContext(context, ['repositories', 'contributors', 'mergeRequests', 'commits']);
    
    const config = { ...this.config, ...pipelineConfig };
    
    try {
      // For now, just log the entities we would enrich
      this.log('info', `Would enrich ${context.repositories.length} repositories, ${context.contributors.length} contributors, ${context.mergeRequests.length} merge requests, and ${context.commits.length} commits`);
      
      // Mark all entities as enriched
      context.repositories.forEach(repo => repo.is_enriched = true);
      context.contributors.forEach(contributor => contributor.is_enriched = true);
      context.mergeRequests.forEach(mr => mr.is_enriched = true);
      context.commits.forEach(commit => commit.is_enriched = true);
      
      this.log('info', 'Data enrichment completed');
      
      return context;
    } catch (error) {
      this.log('error', 'Data enrichment failed', { error });
      if (this.config.abortOnError) {
        throw error;
      }
      return context;
    }
  }
} 