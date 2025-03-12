/**
 * Test Commit Processor
 * 
 * This script tests the commit processor pipeline implementation
 * by processing a sample commit and outputting the computed statistics.
 */

import 'dotenv/config';
import { pipelineFactory } from '../pipeline/core/pipeline-factory.js';
import { 
  registerCommitProcessorPipeline,
  processCommit
} from '../pipeline/stages/commit-processor-pipeline.js';
import { logger } from '../utils/logger.js';

// Sample commit data
const sampleCommit = {
  hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  title: 'feat: Add user dashboard with analytics visualizations',
  author: 'developer123',
  date: '2025-03-05T10:00:00Z',
  repository_id: 67890,
  files_changed: 15,
  stats_additions: 520,
  stats_deletions: 48,
  message_body: `This commit adds a new dashboard component with analytics visualizations.

Features included:
- User activity timeline
- Performance metrics
- Usage statistics
- Export functionality

Also refactors some related components for better reusability.`,
  author_name: 'Developer Name',
  author_email: 'developer@example.com',
  committer_name: 'Developer Name',
  committer_email: 'developer@example.com',
  parents: ['parent1hash', 'parent2hash'],
  stats_total: 568
};

// Sample repository data
const sampleRepository = {
  id: 67890,
  name: 'org/repo',
  description: 'Sample repository',
  url: 'https://github.com/org/repo',
  stars: 120,
  forks: 25
};

/**
 * Test the commit processor pipeline
 */
async function testCommitProcessor() {
  try {
    logger.info('====================================');
    logger.info('Starting Commit Processor test');
    logger.info('====================================');
    
    // Register the commit processor pipeline
    registerCommitProcessorPipeline();
    
    logger.info('Pipeline registered successfully');
    
    // Process a sample commit
    logger.info('Processing sample commit...');
    
    const result = await processCommit(sampleCommit, {
      repositories: [sampleRepository]
    });
    
    logger.info('Processing completed');
    
    // Output the computed statistics
    logger.info('Computed commit statistics:');
    console.log(JSON.stringify(result.statistics, null, 2));
    
    // Output specific metrics
    if (result.statistics) {
      const { code_impact, complexity, classification, file_changes } = result.statistics;
      
      logger.info(`Code Impact: ${code_impact?.score} (${code_impact?.level})`);
      logger.info(`Complexity: ${complexity?.score} (${complexity?.level})`);
      logger.info(`Classification: ${classification?.type}${classification?.subtype ? ` (${classification?.subtype})` : ''} with ${(classification?.confidence * 100).toFixed(0)}% confidence`);
      
      if (code_impact?.factors?.length > 0) {
        logger.info('Impact factors:');
        code_impact.factors.forEach(factor => logger.info(`- ${factor}`));
      }
      
      if (complexity?.factors?.length > 0) {
        logger.info('Complexity factors:');
        complexity.factors.forEach(factor => logger.info(`- ${factor}`));
      }
      
      if (file_changes) {
        logger.info(`File Changes: ${file_changes.files_changed} files, ${file_changes.additions} additions, ${file_changes.deletions} deletions`);
        logger.info(`Change Density: ${file_changes.change_density} changes per file`);
      }
    }
    
    logger.info('====================================');
    logger.info('Commit Processor test completed');
    logger.info('====================================');
  } catch (error) {
    logger.error('Test failed', { error });
  }
}

// Run the test
testCommitProcessor(); 