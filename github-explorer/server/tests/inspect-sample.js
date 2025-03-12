/**
 * Inspect the sample data file structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../src/utils/logger.js';

// Get current directory and resolve path to sample file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const samplePath = path.resolve(__dirname, '../../..', 'DOCS/data-samples/rawData.json');

async function inspectSample() {
  try {
    logger.info(`Reading sample data from: ${samplePath}`);
    
    // Read and parse the sample file
    const sampleData = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
    
    // Log the top-level structure
    logger.info('Sample data top-level keys:', Object.keys(sampleData).sort());
    
    // Log nested structure for repository
    if (sampleData.repository) {
      logger.info('Repository keys:', Object.keys(sampleData.repository).sort());
    }
    
    // Log nested structure for pull_request
    if (sampleData.pull_request) {
      logger.info('Pull request keys:', Object.keys(sampleData.pull_request).sort());
    } else if (sampleData.pullRequest) {
      logger.info('Pull request keys:', Object.keys(sampleData.pullRequest).sort());
    }
    
    // Log nested structure for commits if available
    if (sampleData.commits) {
      logger.info('Commits array length:', sampleData.commits.length);
      if (sampleData.commits.length > 0) {
        logger.info('First commit keys:', Object.keys(sampleData.commits[0]).sort());
      }
    }
    
    // Compare with our current implementation data structure
    logger.info('Suggested mappings for fetchGitHubData:');
    logger.info(`
    async function fetchGitHubData(repository = TEST_REPOSITORY) {
      // Implementation logic...
      
      // Format the response to match the expected structure in rawData.json
      return {
        repository: repoData,               // Already matches
        pullRequest: pr,                    // Already matches (capitalization differs in sample)
        commits: commits                    // Already matches
        // Add any missing fields from sample data
      };
    }
    `);
    
  } catch (error) {
    logger.error('Error inspecting sample data:', error);
  }
}

// Run the inspection
inspectSample()
  .then(() => {
    logger.info('Sample inspection complete');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Error during sample inspection:', error);
    process.exit(1);
  });