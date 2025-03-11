/**
 * Test Repository Service
 * 
 * A utility script to test the repository service functionality.
 */

import 'dotenv/config';
import { githubClient } from '../services/github-client.js';
import { transformRepositoryData, enrichRepositoryData } from '../services/github/repository.service.js';
import { logger } from '../utils/logger.js';

async function testRepositoryService() {
  try {
    logger.info('Testing Repository Service');
    
    // Use the GitHub client
    logger.info(`GitHub client initialized in "${process.env.NODE_ENV}" environment`);
    
    // Test with a well-known repository
    const owner = 'vercel';
    const repo = 'next.js';
    
    logger.info(`Fetching repository data for ${owner}/${repo}`);
    
    // Fetch repository data from GitHub
    const repoData = await githubClient.getRepository(owner, repo);
    
    logger.info(`Successfully fetched repository data for ${owner}/${repo}`);
    logger.info(`Repository details:
      Name: ${repoData.name}
      Description: ${repoData.description?.substring(0, 100)}...
      Stars: ${repoData.stargazers_count}
      Forks: ${repoData.forks_count}
      Open Issues: ${repoData.open_issues_count}
      Language: ${repoData.language}
      Created: ${repoData.created_at}
      Last Updated: ${repoData.updated_at}
    `);
    
    // Transform the data
    logger.info('Transforming repository data...');
    const transformedData = transformRepositoryData(repoData);
    logger.info('Data transformation successful');
    logger.info(`Transformed data structure has ${Object.keys(transformedData).length} fields`);
    
    // Enrich the data
    logger.info('Enriching repository data...');
    const enrichedData = await enrichRepositoryData(transformedData, githubClient.octokit);
    logger.info('Data enrichment successful');
    
    // Output the enriched data
    logger.info(`Enriched data includes:
      Name: ${enrichedData.name}
      URL: ${enrichedData.url}
      Has README: ${enrichedData.has_readme ? 'Yes' : 'No'}
      Health Score: ${enrichedData.health_percentage}
      Is Enriched: ${enrichedData.is_enriched ? 'Yes' : 'No'}
      Primary Language: ${enrichedData.primary_language}
    `);
    
    if (enrichedData.languages) {
      logger.info('Language breakdown:');
      Object.entries(enrichedData.languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([language, percentage]) => {
          logger.info(`  - ${language}: ${percentage}%`);
        });
    }
    
    logger.info('Repository Service test completed successfully');
  } catch (error) {
    logger.error(`Error testing repository service: ${error.message}`, { error });
  }
}

// Run the test
testRepositoryService(); 