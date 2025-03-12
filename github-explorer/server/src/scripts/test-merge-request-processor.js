/**
 * Test Merge Request Processor
 * 
 * This script tests the merge request processor pipeline implementation
 * by processing a sample merge request and outputting the computed statistics.
 */

import 'dotenv/config';
import { pipelineFactory } from '../pipeline/core/pipeline-factory.js';
import { 
  registerMergeRequestProcessorPipeline,
  processMergeRequest
} from '../pipeline/stages/merge-request-processor-pipeline.js';
import { logger } from '../utils/logger.js';

// Sample merge request data
const sampleMergeRequest = {
  id: 12345,
  title: 'Add new feature for user dashboard',
  description: 'This PR adds a new dashboard component with analytics visualizations',
  status: 'merged',
  author: 'user123',
  author_avatar: 'https://github.com/avatars/user123.jpg',
  created_at: '2025-03-05T10:00:00Z',
  updated_at: '2025-03-10T15:30:00Z',
  closed_at: '2025-03-10T15:30:00Z',
  merged_at: '2025-03-10T15:30:00Z',
  base_branch: 'main',
  head_branch: 'feature/user-dashboard',
  repository_id: 67890,
  commits: 15,
  files_changed: 23,
  review_comments: 18,
  lines_added: 456,
  lines_removed: 32,
  github_link: 'https://github.com/org/repo/pull/42',
  labels: ['feature', 'dashboard', 'analytics']
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
 * Test the merge request processor pipeline
 */
async function testMergeRequestProcessor() {
  try {
    logger.info('====================================');
    logger.info('Starting Merge Request Processor test');
    logger.info('====================================');
    
    // Register the merge request processor pipeline
    registerMergeRequestProcessorPipeline();
    
    logger.info('Pipeline registered successfully');
    
    // Process a sample merge request
    logger.info('Processing sample merge request...');
    
    const result = await processMergeRequest(sampleMergeRequest, {
      repositories: [sampleRepository]
    });
    
    logger.info('Processing completed');
    
    // Output the computed statistics
    logger.info('Computed merge request statistics:');
    console.log(JSON.stringify(result.statistics, null, 2));
    
    // Output specific metrics
    if (result.statistics) {
      const { cycle_time, review_time, complexity_score, activity_metrics } = result.statistics;
      
      logger.info(`Cycle Time: ${cycle_time?.hours.toFixed(2)} hours (${cycle_time?.days.toFixed(2)} days)`);
      logger.info(`Review Time: ${review_time?.hours.toFixed(2)} hours (${review_time?.days.toFixed(2)} days)`);
      logger.info(`Complexity Score: ${complexity_score?.value} (${complexity_score?.level})`);
      
      if (complexity_score?.factors?.length > 0) {
        logger.info('Complexity factors:');
        complexity_score.factors.forEach(factor => logger.info(`- ${factor}`));
      }
      
      if (activity_metrics?.timeline?.length > 0) {
        logger.info('Timeline events:');
        activity_metrics.timeline.forEach(event => {
          logger.info(`- ${event.event} at ${new Date(event.timestamp).toLocaleString()} by ${event.actor}`);
        });
      }
      
      logger.info(`Activity rate: ${activity_metrics?.activity_rate?.events_per_day} events/day (${activity_metrics?.activity_rate?.intensity} intensity)`);
    }
    
    logger.info('====================================');
    logger.info('Merge Request Processor test completed');
    logger.info('====================================');
  } catch (error) {
    logger.error('Test failed', { error });
  }
}

// Run the test
testMergeRequestProcessor(); 