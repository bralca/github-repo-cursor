/**
 * Test Pipeline Script
 * 
 * This script tests the GitHub data pipeline by processing a sample webhook payload.
 * It can be run with: node src/scripts/test-pipeline.js
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { registerWebhookProcessorPipeline, processWebhookPayload } from '../pipeline/stages/webhook-processor-pipeline.js';
import { githubClientFactory } from '../services/github/github-client.js';
import { supabaseClientFactory } from '../services/supabase/supabase-client.js';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to sample data
const sampleDataPath = path.resolve(__dirname, '../../../DOCS/data-samples/rawData.json');

async function runTest() {
  try {
    logger.info('Starting pipeline test');
    
    // Load sample data
    logger.info(`Loading sample data from ${sampleDataPath}`);
    let rawData;
    
    try {
      rawData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'));
      logger.info('Sample data loaded successfully');
    } catch (error) {
      logger.warn(`Failed to load sample data from ${sampleDataPath}. Using mock data instead.`, { error });
      
      // Create mock data if file doesn't exist
      rawData = {
        repository: {
          id: 'mock-repo-123',
          full_name: 'octocat/mock-repo',
          description: 'A mock repository for testing',
          owner: {
            id: 'user-456',
            login: 'octocat',
            avatar_url: 'https://github.com/octocat.png'
          }
        },
        pull_request: {
          id: 'pr-789',
          title: 'Mock PR Title',
          body: 'Mock PR Description',
          user: {
            id: 'user-987',
            login: 'contributor',
            avatar_url: 'https://github.com/contributor.png'
          },
          base: {
            ref: 'main',
            sha: 'base-sha-123',
            repo: {
              id: 'mock-repo-123',
              full_name: 'octocat/mock-repo'
            }
          },
          head: {
            ref: 'feature-branch',
            sha: 'head-sha-456',
            repo: {
              id: 'mock-repo-123',
              full_name: 'octocat/mock-repo'
            }
          },
          commits: [],
          commits_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          merged_at: new Date().toISOString(),
          state: 'closed',
          merged: true
        }
      };
    }
    
    console.log('Raw data type:', typeof rawData);
    console.log('Raw data keys:', Object.keys(rawData));
    
    // Create mock clients for testing
    const supabaseClient = supabaseClientFactory.createMockClient();
    
    // Register webhook processor pipeline
    registerWebhookProcessorPipeline();
    logger.info('Pipeline registered successfully');
    
    // Process the sample data
    logger.info('Processing sample data through pipeline');
    const result = await processWebhookPayload(rawData);
    
    // Log the result
    logger.info('Pipeline execution completed');
    
    // Print summary
    console.log('\n=== Pipeline Execution Summary ===');
    console.log(`Run ID: ${result.runId}`);
    console.log(`State: ${result.state}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log('\nStatistics:');
    console.log(`- Raw Data Processed: ${result.stats?.rawDataProcessed || 0}`);
    console.log(`- Repositories Extracted: ${result.stats?.repositoriesExtracted || 0}`);
    console.log(`- Contributors Extracted: ${result.stats?.contributorsExtracted || 0}`);
    console.log(`- Merge Requests Extracted: ${result.stats?.mergeRequestsExtracted || 0}`);
    console.log(`- Commits Extracted: ${result.stats?.commitsExtracted || 0}`);
    console.log(`- Errors: ${result.stats?.errors || 0}`);
    console.log('\nEntity Counts:');
    console.log(`- Repositories: ${result.entityCounts?.repositories || 0}`);
    console.log(`- Contributors: ${result.entityCounts?.contributors || 0}`);
    console.log(`- Merge Requests: ${result.entityCounts?.mergeRequests || 0}`);
    console.log(`- Commits: ${result.entityCounts?.commits || 0}`);
    
    if (result.stats?.errors > 0) {
      console.log('\nErrors occurred during pipeline execution. Check the logs for details.');
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    logger.error('Pipeline test failed', { error });
    console.error('Test failed:', error.message);
  }
}

// Run the test
runTest(); 