import { BaseStage } from '../core/base-stage.js';
import { logger } from '../../utils/logger.js';
import { extractEntitiesFromWebhook } from '../utils/data-transformer.js';

/**
 * EntityExtractorProcessor - Extracts entities from raw GitHub data
 * 
 * This processor extracts repositories, contributors, merge requests,
 * and commits from raw GitHub webhook/API data.
 */
export class EntityExtractorProcessor extends BaseStage {
  /**
   * Create a new entity extractor processor
   * @param {Object} options - Processor options
   */
  constructor(options = {}) {
    super({
      name: 'entity-extractor',
      abortOnError: false,
      config: {
        extractRepositories: true,
        extractContributors: true,
        extractMergeRequests: true,
        extractCommits: true,
        ...options
      }
    });
  }
  
  /**
   * Execute the entity extraction process
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} pipelineConfig - Pipeline configuration
   * @returns {Promise<PipelineContext>} Updated pipeline context
   */
  async execute(context, pipelineConfig) {
    this.log('info', 'Starting entity extraction');
    
    // Validate that we have raw data to process
    this.validateContext(context, ['rawData']);
    
    const rawData = context.rawData;
    
    const config = { ...this.config, ...pipelineConfig };
    
    try {
      // Initialize stats if they don't exist
      if (!context.stats) {
        context.stats = {};
      }
      
      // Initialize stats counters if they don't exist
      context.stats.rawDataProcessed = context.stats.rawDataProcessed || 0;
      context.stats.repositoriesExtracted = context.stats.repositoriesExtracted || 0;
      context.stats.contributorsExtracted = context.stats.contributorsExtracted || 0;
      context.stats.mergeRequestsExtracted = context.stats.mergeRequestsExtracted || 0;
      context.stats.commitsExtracted = context.stats.commitsExtracted || 0;
      
      // Extract entities from raw data
      const extractedEntities = {
        repositories: [],
        contributors: [],
        mergeRequests: [],
        commits: []
      };
      
      // Process the raw data
      // If it's an array, process each item, otherwise process as a single item
      const dataToProcess = Array.isArray(rawData) ? rawData : [rawData];
      this.log('info', `Processing ${dataToProcess.length} raw data items`);
      
      // Increment the raw data processed counter for the entire batch
      context.stats.rawDataProcessed += dataToProcess.length;
      
      for (const item of dataToProcess) {
        try {
          const entities = extractEntitiesFromWebhook(item);
          
          // Add entities to their respective collections if not null
          if (entities.repository && config.extractRepositories) {
            extractedEntities.repositories.push(entities.repository);
            context.stats.repositoriesExtracted++;
          }
          
          if (entities.contributor && config.extractContributors) {
            extractedEntities.contributors.push(entities.contributor);
            context.stats.contributorsExtracted++;
          }
          
          if (entities.mergeRequest && config.extractMergeRequests) {
            extractedEntities.mergeRequests.push(entities.mergeRequest);
            context.stats.mergeRequestsExtracted++;
          }
          
          if (entities.commits && config.extractCommits) {
            extractedEntities.commits.push(...entities.commits);
            context.stats.commitsExtracted += entities.commits.length;
          }
          
          // We've moved the increment of rawDataProcessed to before the loop
          // to ensure it counts the total number of items processed
        } catch (itemError) {
          this.log('warn', `Error processing data item: ${itemError.message}`, { error: itemError });
          context.recordError('entity-extractor-item', itemError);
        }
      }
      
      // Add extracted entities to the context
      context.repositories = extractedEntities.repositories;
      context.contributors = extractedEntities.contributors;
      context.mergeRequests = extractedEntities.mergeRequests;
      context.commits = extractedEntities.commits;
      
      this.log('info', 'Entity extraction completed', {
        repositoriesCount: extractedEntities.repositories.length,
        contributorsCount: extractedEntities.contributors.length,
        mergeRequestsCount: extractedEntities.mergeRequests.length,
        commitsCount: extractedEntities.commits.length
      });
      
      return context;
    } catch (error) {
      this.log('error', 'Entity extraction failed', { error });
      context.recordError('entity-extractor', error);
      if (this.config.abortOnError) {
        throw error;
      }
      return context;
    }
  }
} 