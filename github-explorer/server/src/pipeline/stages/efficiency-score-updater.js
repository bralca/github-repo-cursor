/**
 * Efficiency Score Updater Pipeline Stage
 * 
 * This pipeline stage calculates and updates efficiency scores for contributors
 * based on the ratio between pull request changes and commit changes.
 */

import BaseStage from '../core/base-stage.js';
import { getConnection } from '../../db/connection-manager.js';
import { logger } from '../../utils/logger.js';

/**
 * Pipeline stage to update efficiency scores for contributors
 */
export default class EfficiencyScoreUpdater extends BaseStage {
  constructor() {
    super('efficiency-score-updater');
    this.logger = logger;
  }
  
  /**
   * Process and update efficiency scores for contributors
   * @returns {Promise<Object>} Result of processing
   */
  async process() {
    this.logger.info('Starting efficiency score update');
    
    try {
      const db = await getConnection();
      
      // Start transaction
      await db.run('BEGIN TRANSACTION');
      
      try {
        // Update efficiency scores for all contributors with commit data
        const updateResult = await db.run(`
          UPDATE contributors
          SET 
            efficiency_score = (
              CASE 
                WHEN total_commits > 0 THEN 
                  (total_accepted_merge_requests * 1.0 / total_commits) * 100
                ELSE 0 
              END
            )
          WHERE total_commits > 0
        `);
        
        // Commit transaction
        await db.run('COMMIT');
        
        this.logger.info(`Efficiency scores updated for ${updateResult.changes} contributors`);
        
        return {
          success: true,
          processed: updateResult.changes
        };
      } catch (error) {
        // Rollback transaction on error
        await db.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      this.logger.error('Error updating efficiency scores:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Factory function to create an efficiency score updater
 * @param {Object} config - Configuration options
 * @returns {EfficiencyScoreUpdater} The stage instance
 */
export function createEfficiencyScoreUpdater(config = {}) {
  return new EfficiencyScoreUpdater(config);
} 