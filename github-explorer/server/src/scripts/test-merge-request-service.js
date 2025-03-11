/**
 * Test Merge Request Service
 * 
 * This script tests the functionality of the merge request service implementation,
 * including data fetching, transformation, enrichment, and processing.
 */

import 'dotenv/config';
import githubClient from '../services/github/client.js';
import { 
  transformMergeRequestData, 
  enrichMergeRequestData, 
  processMergeRequestData 
} from '../services/github/merge-request.service.js';
import { logger } from '../utils/logger.js';

async function testMergeRequestService() {
  try {
    logger.info('=====================================');
    logger.info('Starting Merge Request Service test...');
    logger.info('=====================================');

    // Initialize GitHub client
    await githubClient.initialize();
    logger.info(`GitHub client initialized in ${process.env.NODE_ENV} environment`);

    // Select a known repository for testing
    const owner = 'octokit';
    const repo = 'octokit.js';
    const repositoryId = 123456; // Fake ID for testing purposes

    logger.info(`Fetching pull requests for ${owner}/${repo}...`);
    
    // Fetch pull requests
    const octokit = await githubClient.getOctokit();
    const { data: pullRequests } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'all',
      per_page: 5,
      sort: 'updated',
      direction: 'desc'
    });

    logger.info(`Fetched ${pullRequests.length} pull requests from GitHub`);
    
    if (pullRequests.length === 0) {
      logger.error('No pull requests found, cannot proceed with test');
      return;
    }

    // Get the first pull request for testing
    const pullRequest = pullRequests[0];
    logger.info(`Selected PR #${pullRequest.number}: ${pullRequest.title}`);
    logger.info(`PR Status: ${pullRequest.state}`);
    logger.info(`PR Author: ${pullRequest.user.login}`);
    logger.info(`PR Created: ${pullRequest.created_at}`);
    logger.info(`PR Updated: ${pullRequest.updated_at}`);

    // Test transformMergeRequestData
    logger.info('\nTesting transformMergeRequestData function...');
    const transformedData = transformMergeRequestData(pullRequest, repositoryId);
    
    logger.info(`Transformation successful: ${transformedData !== null}`);
    logger.info(`Transformed data has ${Object.keys(transformedData).length} fields`);
    logger.info('Key fields after transformation:');
    logger.info(`- ID: ${transformedData.id}`);
    logger.info(`- Title: ${transformedData.title}`);
    logger.info(`- Repository ID: ${transformedData.repository_id}`);
    logger.info(`- Status: ${transformedData.status}`);
    logger.info(`- Author: ${transformedData.author}`);

    // Test enrichMergeRequestData
    logger.info('\nTesting enrichMergeRequestData function...');
    const enrichedData = await enrichMergeRequestData(transformedData, pullRequest);
    
    logger.info(`Enrichment successful: ${enrichedData !== null}`);
    logger.info(`Enriched data has ${Object.keys(enrichedData).length} fields`);
    logger.info('Key enriched fields:');
    logger.info(`- Complexity Score: ${enrichedData.complexity_score}`);
    logger.info(`- Cycle Time: ${enrichedData.cycle_time} days`);
    logger.info(`- Review Time: ${enrichedData.review_time} days`);
    logger.info(`- Is Enriched: ${enrichedData.is_enriched}`);

    // Test processMergeRequestData
    logger.info('\nTesting processMergeRequestData function...');
    const processedData = await processMergeRequestData(pullRequest, repositoryId);
    
    // Check if processed data has all the fields from enrichedData
    const processedDataKeys = Object.keys(processedData);
    const enrichedDataKeys = Object.keys(enrichedData);
    const hasAllKeys = enrichedDataKeys.every(key => processedDataKeys.includes(key));
    
    logger.info(`Processing successful: ${processedData !== null}`);
    logger.info(`Processed data has ${processedDataKeys.length} fields`);
    logger.info(`Processed data has all enriched data fields: ${hasAllKeys}`);
    
    logger.info('\n=====================================');
    logger.info('Merge Request Service test completed successfully!');
    logger.info('=====================================');
  } catch (error) {
    logger.error('Error in Merge Request Service test:', error);
  }
}

// Run the test
testMergeRequestService(); 