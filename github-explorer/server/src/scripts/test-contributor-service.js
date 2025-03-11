/**
 * Test Contributor Service
 * 
 * A utility script to test the contributor service functionality.
 */

import 'dotenv/config';
import { githubClient } from '../services/github-client.js';
import { transformContributorData, enrichContributorData, processContributorData } from '../services/github/contributor.service.js';
import { logger } from '../utils/logger.js';

async function testContributorService() {
  try {
    logger.info('Testing Contributor Service');
    
    // Use the GitHub client
    logger.info(`GitHub client initialized in "${process.env.NODE_ENV}" environment`);
    
    // Test with a well-known GitHub user
    const username = 'octocat';
    
    logger.info(`Fetching contributor data for ${username}`);
    
    // Fetch user data from GitHub
    const userData = await githubClient.octokit.rest.users.getByUsername({
      username
    }).then(response => response.data);
    
    logger.info(`Successfully fetched user data for ${username}`);
    logger.info(`User details:
      Username: ${userData.login}
      Name: ${userData.name || 'N/A'}
      Company: ${userData.company || 'N/A'}
      Location: ${userData.location || 'N/A'}
      Blog: ${userData.blog || 'N/A'}
      Followers: ${userData.followers}
      Public Repos: ${userData.public_repos}
      Created: ${userData.created_at}
      Updated: ${userData.updated_at}
    `);
    
    // Transform the data
    logger.info('Transforming contributor data...');
    const transformedData = transformContributorData(userData);
    logger.info('Data transformation successful');
    logger.info(`Transformed data structure has ${Object.keys(transformedData).length} fields`);
    
    // Enrich the data
    logger.info('Enriching contributor data...');
    const enrichedData = await enrichContributorData(transformedData, githubClient.octokit);
    logger.info('Data enrichment successful');
    
    // Output the enriched data
    logger.info(`Enriched data includes:
      Username: ${enrichedData.username}
      Name: ${enrichedData.name || 'N/A'}
      Impact Score: ${enrichedData.impact_score}
      Role Classification: ${enrichedData.role_classification || 'N/A'}
      Is Enriched: ${enrichedData.is_enriched ? 'Yes' : 'No'}
      Organizations: ${enrichedData.organizations.length ? enrichedData.organizations.join(', ') : 'None'}
    `);
    
    if (enrichedData.top_languages && enrichedData.top_languages.length > 0) {
      logger.info('Top languages:');
      enrichedData.top_languages.forEach(language => {
        logger.info(`  - ${language}`);
      });
    }
    
    // Test the combined process function
    logger.info('\nTesting processContributorData function...');
    const processedData = await processContributorData(userData, githubClient.octokit);
    logger.info('Combined processing successful');
    logger.info(`Processed data has same fields: ${Object.keys(processedData).length === Object.keys(enrichedData).length ? 'Yes' : 'No'}`);
    
    logger.info('Contributor Service test completed successfully');
  } catch (error) {
    logger.error(`Error testing contributor service: ${error.message}`, { error });
  }
}

// Run the test
testContributorService(); 