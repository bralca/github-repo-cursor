/**
 * Efficiency Score Updater Pipeline Stage
 * 
 * This pipeline stage calculates and updates efficiency scores for contributors
 * based on the ratio between pull request changes and commit changes.
 */

import { logger } from '../../utils/logger.js';
import { openSQLiteConnection } from '../../db/sqlite-connection.js';

/**
 * Pipeline stage for updating efficiency scores
 */
export class EfficiencyScoreUpdater {
  /**
   * Create a new efficiency score updater
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.name = 'efficiency-score-updater';
    this.config = config;
    logger.info('Efficiency score updater stage initialized');
  }
  
  /**
   * Execute the pipeline stage
   * @param {Object} context - Pipeline context
   * @returns {Promise<Object>} Updated context
   */
  async execute(context = {}) {
    logger.info('Running efficiency score update');
    
    if (!context.stats) {
      context.stats = {};
    }
    
    if (!context.errors) {
      context.errors = [];
    }
    
    try {
      // Open database connection
      const db = await openSQLiteConnection();
      
      // Start with calculating code efficiency
      logger.info('Calculating code efficiency scores...');
      
      // Execute the efficiency calculation query
      const results = await db.run(`
        -- First, calculate the raw efficiency metrics
        WITH code_efficiency AS (
          SELECT
            c.contributor_id,
            c.pull_request_id,
            SUM(c.additions + c.deletions) AS total_commit_changes,
            mr.additions + mr.deletions AS total_pr_changes
          FROM commits c
          JOIN merge_requests mr ON c.pull_request_id = mr.id
          JOIN repositories r ON mr.repository_id = r.id
          WHERE c.pull_request_id IS NOT NULL
          AND r.is_fork = 0 -- Exclude forked repositories
          GROUP BY c.contributor_id, c.pull_request_id
        ),
        -- Then calculate final efficiency scores
        code_efficiency_final AS (
          SELECT
            contributor_id,
            AVG(
              CASE 
                WHEN total_commit_changes = 0 THEN 0
                -- When PR changes match commit changes exactly, this is 100% efficient
                WHEN total_pr_changes = total_commit_changes THEN 100
                ELSE 
                  -- Calculate efficiency as a percentage, but never go below 0
                  MAX(0, 
                    (1 - ABS((total_pr_changes - total_commit_changes) / 
                      NULLIF(total_commit_changes, 0))
                    ) * 100
                  )
              END
            ) AS efficiency_score
          FROM code_efficiency
          GROUP BY contributor_id
        )
        
        -- Update contributors table with efficiency scores
        UPDATE contributors
        SET 
          code_efficiency_score = (
            SELECT efficiency_score 
            FROM code_efficiency_final 
            WHERE code_efficiency_final.contributor_id = contributors.id
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE id IN (SELECT contributor_id FROM code_efficiency_final);
      `);
      
      // Log success
      logger.info('Successfully updated efficiency scores', {
        changes: results?.changes || 0,
        timestamp: new Date().toISOString()
      });
      
      // Close the database connection
      await db.close();
      
      // Update context with stats
      context.stats.efficiencyScoreUpdates = results?.changes || 0;
      
      return context;
    } catch (error) {
      logger.error('Error updating efficiency scores', { error });
      
      // Record the error in context
      if (context.recordError) {
        context.recordError(this.name, error);
      } else {
        context.errors.push({
          stage: this.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      return context;
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