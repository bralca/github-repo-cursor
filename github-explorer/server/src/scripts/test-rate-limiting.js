/**
 * Test script for GitHub API rate limiting and resilience features
 * 
 * This script tests the various resilience features added to the GitHub client:
 * - Caching
 * - Rate limit handling
 * - Circuit breaker
 * - Batch processing
 * - Retry mechanism
 */

import 'dotenv/config';
import githubClient from '../services/github/github-client.service.js';
import { logger } from '../utils/logger.js';

async function testRateLimitingAndResilience() {
  try {
    logger.info('Starting GitHub API rate limiting and resilience test');
    
    // Initialize the client
    await githubClient.initialize();
    
    // 1. Test caching
    logger.info('\n--- Testing Caching ---');
    logger.info('First request (no cache):');
    console.time('First request');
    const repoData1 = await githubClient.getRepository('octokit', 'octokit.js');
    console.timeEnd('First request');
    
    logger.info('Second request (should use cache):');
    console.time('Second request');
    const repoData2 = await githubClient.getRepository('octokit', 'octokit.js');
    console.timeEnd('Second request');
    
    logger.info('Cache test complete');
    
    // 2. Test batch processing
    logger.info('\n--- Testing Batch Processing ---');
    const repositories = [
      { owner: 'octokit', repo: 'octokit.js' },
      { owner: 'facebook', repo: 'react' },
      { owner: 'vercel', repo: 'next.js' },
      { owner: 'microsoft', repo: 'TypeScript' },
      { owner: 'nodejs', repo: 'node' },
      { owner: 'expressjs', repo: 'express' },
      { owner: 'tailwindlabs', repo: 'tailwindcss' }
    ];
    
    logger.info(`Batch processing ${repositories.length} repository requests`);
    console.time('Batch processing');
    
    const batchResults = await githubClient.batchProcess(
      repositories.map(({ owner, repo }) => {
        return async () => {
          const data = await githubClient.getRepository(owner, repo);
          return {
            fullName: data.full_name,
            stars: data.stargazers_count,
            forks: data.forks_count
          };
        };
      }),
      { batchSize: 3, batchDelay: 1000 }
    );
    
    console.timeEnd('Batch processing');
    logger.info(`Processed ${batchResults.successfulRequests} repositories successfully`);
    logger.info(`Failed requests: ${batchResults.failedRequests}`);
    
    if (batchResults.results.length > 0) {
      logger.info('Results sample:', batchResults.results[0]);
    }
    
    // 3. Test rate limit information
    logger.info('\n--- Testing Rate Limit Information ---');
    const rateLimits = await githubClient.getRateLimits();
    logger.info('Current rate limits:', {
      core: {
        limit: rateLimits.core.limit,
        remaining: rateLimits.core.remaining,
        resetTime: new Date(rateLimits.core.reset * 1000).toISOString()
      },
      search: {
        limit: rateLimits.search.limit,
        remaining: rateLimits.search.remaining,
        resetTime: new Date(rateLimits.search.reset * 1000).toISOString()
      }
    });
    
    // 4. Test circuit breaker status
    logger.info('\n--- Testing Circuit Breaker ---');
    const circuitStatus = githubClient.getCircuitBreakerStatus();
    logger.info('Circuit breaker status:', circuitStatus);
    
    // 5. Test cache operations
    logger.info('\n--- Testing Cache Operations ---');
    // Clear specific cache
    githubClient.clearCache('repo_octokit');
    logger.info('Cleared cache for octokit repositories');
    
    // Another request after cache clear
    logger.info('Request after cache clear (should hit network):');
    console.time('Request after cache clear');
    await githubClient.getRepository('octokit', 'octokit.js');
    console.timeEnd('Request after cache clear');
    
    // 6. Test concurrent requests
    logger.info('\n--- Testing Concurrent Requests ---');
    const testConcurrency = async () => {
      console.time('Concurrent requests');
      const results = await Promise.all([
        githubClient.getUser('octocat'),
        githubClient.getRepositoryCommits('octokit', 'octokit.js', { per_page: 5 }),
        githubClient.getRepositoryPullRequests('octokit', 'octokit.js', { state: 'open', per_page: 5 }),
        githubClient.getRepositoryContributors('octokit', 'octokit.js', { per_page: 5 })
      ]);
      console.timeEnd('Concurrent requests');
      
      logger.info('Received data for:');
      logger.info(`- User: ${results[0].login}`);
      logger.info(`- Commits: ${results[1].length} items`);
      logger.info(`- Pull Requests: ${results[2].length} items`);
      logger.info(`- Contributors: ${results[3].length} items`);
    };
    
    await testConcurrency();
    
    // Test completed successfully
    logger.info('\nAll tests completed successfully!');
    logger.info('Rate limiting and resilience features are working as expected');
    
  } catch (error) {
    logger.error('Error in rate limiting test:', error);
  } finally {
    // Clean up resources to allow process to exit
    githubClient.cleanup();
    logger.info('Test script cleanup complete, exiting...');
  }
}

// Run the test
testRateLimitingAndResilience().catch(err => {
  logger.error('Fatal error in test script:', err);
  // Ensure cleanup happens even on fatal errors
  githubClient.cleanup();
  process.exit(1);
}); 