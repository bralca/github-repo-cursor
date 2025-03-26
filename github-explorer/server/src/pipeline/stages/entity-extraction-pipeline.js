/**
 * Entity Extraction Pipeline
 * 
 * Pipeline for extracting entities from raw data stored in the database.
 * This pipeline:
 * 1. Retrieves unprocessed data from the database
 * 2. Extracts relevant entities (repositories, contributors, organizations)
 * 3. Stores the extracted entities in the database
 */

import { pipelineFactory } from '../core/pipeline-factory.js';
import { BaseStage } from '../core/base-stage.js';
import { logger } from '../../utils/logger.js';
import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';

/**
 * Stage for extracting entities from raw data
 */
class EntityExtractionStage extends BaseStage {
  /**
   * Create a new entity extraction stage
   * @param {Object} options - Processor options
   */
  constructor(options = {}) {
    super({
      name: 'extract-entities',
      abortOnError: false,
      config: {
        batchSize: 100,
        entityTypes: ['repository', 'contributor', 'organization'],
        ...options.config
      }
    });
  }
  
  /**
   * Execute the stage processing
   * @param {Object} context - Pipeline context
   * @param {Object} pipelineConfig - Pipeline configuration
   * @returns {Promise<Object>} Updated pipeline context
   */
  async execute(context, pipelineConfig) {
    this.log('info', '======================================');
    this.log('info', '🔄 RUNNING PIPELINE: ENTITY EXTRACTION');
    this.log('info', '📑 STEP: Extracting Entities from Raw Data');
    this.log('info', '======================================');
    this.log('info', `Started at: ${new Date().toISOString()}`);
    
    // Initialize stats for reporting
    const stats = {
      totalProcessed: 0,
      entitiesExtracted: {
        repository: 0,
        contributor: 0,
        organization: 0
      },
      failed: 0,
      errors: []
    };
    
    try {
      // Open database connection
      const db = await openSQLiteConnection();
      
      try {
        // Process each entity type
        for (const entityType of this.config.entityTypes) {
          this.log('info', `📊 PROGRESS: Processing entity type: ${entityType}`);
          
          try {
            // Get unprocessed data for this entity type
            const unprocessedData = await this.getUnprocessedData(db, entityType, this.config.batchSize);
            
            if (unprocessedData && unprocessedData.length > 0) {
              this.log('info', `📊 PROGRESS: Found ${unprocessedData.length} unprocessed ${entityType} entities to extract`);
              
              stats.totalProcessed += unprocessedData.length;
              
              // Extract and store entities
              for (const item of unprocessedData) {
                try {
                  await this.extractAndStoreEntity(db, entityType, item);
                  stats.entitiesExtracted[entityType]++;
                } catch (error) {
                  this.log('error', `Failed to extract ${entityType} entity: ${error.message}`, { error });
                  stats.failed++;
                  stats.errors.push({
                    message: error.message,
                    stack: error.stack,
                    entityType,
                    itemId: item.id || 'unknown'
                  });
                }
              }
            } else {
              this.log('info', `📊 PROGRESS: No unprocessed ${entityType} entities found`);
            }
          } catch (error) {
            this.log('error', `Error processing ${entityType} entity type: ${error.message}`, { error });
            stats.errors.push({
              message: error.message,
              stack: error.stack,
              entityType
            });
          }
        }
      } catch (error) {
        this.log('error', `Error during entity extraction: ${error.message}`, { error });
        stats.errors.push({
          message: error.message,
          stack: error.stack
        });
      } finally {
        // Close database connection
        await closeSQLiteConnection(db);
      }
      
      // Update context with stats
      context.entityExtractionStats = stats;
      
      const totalExtracted = Object.values(stats.entitiesExtracted).reduce((sum, count) => sum + count, 0);
      this.log('info', `✅ COMPLETED: Entity Extraction Pipeline. Processed: ${stats.totalProcessed}, Extracted: ${totalExtracted}, Failed: ${stats.failed}`);
      this.log('info', `Finished at: ${new Date().toISOString()}`);
      this.log('info', '======================================');
      
      return context;
    } catch (error) {
      this.log('error', `❌ ERROR: Entity Extraction Pipeline failed: ${error.message}`, { error });
      this.log('info', '======================================');
      throw error;
    }
  }
  
  /**
   * Get unprocessed data for a specific entity type
   * @param {Object} db - Database connection
   * @param {string} entityType - Type of entity to process
   * @param {number} batchSize - Maximum number of items to retrieve
   * @returns {Promise<Array>} Array of unprocessed items
   */
  async getUnprocessedData(db, entityType, batchSize) {
    // In a real implementation, this would query the database for unprocessed items
    // This is a placeholder for the actual implementation
    this.log('info', `Would fetch up to ${batchSize} unprocessed ${entityType} entities`);
    
    // Return an empty array for now
    return [];
  }
  
  /**
   * Extract and store an entity
   * @param {Object} db - Database connection
   * @param {string} entityType - Type of entity
   * @param {Object} item - Raw data item
   * @returns {Promise<void>}
   */
  async extractAndStoreEntity(db, entityType, item) {
    // In a real implementation, this would extract entity data and store it in the database
    // This is a placeholder for the actual implementation
    this.log('info', `Would extract and store ${entityType} entity ${item.id || 'unknown'}`);
  }
}

/**
 * Register the entity extraction pipeline
 * @param {Object} options - Options for pipeline registration
 * @returns {void}
 */
export function registerEntityExtractionPipeline(options = {}) {
  logger.info('Registering entity extraction pipeline');
  
  // Register the entity extraction stage
  pipelineFactory.registerStage('extract-entities', () => {
    return new EntityExtractionStage({
      config: {
        batchSize: options.batchSize || 100,
        entityTypes: options.entityTypes || ['repository', 'contributor', 'organization']
      }
    });
  });
  
  // Register the entity extraction pipeline
  pipelineFactory.registerPipeline('entity_extraction', {
    name: 'entity_extraction',
    description: 'Extract entities from raw data',
    concurrency: 1,
    retries: 2,
    stages: ['extract-entities']
  });
  
  logger.info('Entity extraction pipeline registered successfully');
} 