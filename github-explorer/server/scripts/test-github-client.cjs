// GitHub API Client Test (CommonJS version)
const dotenv = require('dotenv');
const { Octokit } = require('@octokit/rest');
const { throttling } = require('@octokit/plugin-throttling');
const { retry } = require('@octokit/plugin-retry');
const path = require('path');

// Configure environment
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Test GitHub Token
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

// Create custom Octokit
const CustomOctokit = Octokit.plugin(throttling, retry);

// Create GitHub client
const octokit = new CustomOctokit({
  auth: GITHUB_TOKEN,
  throttle: {
    onRateLimit: (retryAfter, options) => {
      console.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
      
      // Retry twice after hitting a rate limit
      if (options.request.retryCount < 2) {
        console.info(`Retrying after ${retryAfter} seconds!`);
        return true;
      }
      
      console.error(`Rate limit exceeded, not retrying further`);
      return false;
    },
    onSecondaryRateLimit: (retryAfter, options) => {
      console.warn(`Secondary rate limit hit for ${options.method} ${options.url}`);
      
      // Retry once for secondary rate limits
      if (options.request.retryCount < 1) {
        console.info(`Retrying after ${retryAfter} seconds!`);
        return true;
      }
      
      console.error(`Secondary rate limit exceeded, not retrying further`);
      return false;
    },
  },
});

/**
 * Test GitHub API
 */
async function testGitHubAPI() {
  try {
    console.log('Testing GitHub API with Octokit...');
    
    // Check if GitHub token is configured
    if (!GITHUB_TOKEN) {
      console.error('Error: GitHub token is not configured. Please set GITHUB_TOKEN in your .env file.');
      return;
    }
    
    // Check rate limit
    console.log('Checking rate limit...');
    const rateLimit = await octokit.rateLimit.get();
    console.log(`Rate limit: ${rateLimit.data.rate.remaining}/${rateLimit.data.rate.limit}`);
    
    // Test repository endpoint
    const owner = 'facebook';
    const repo = 'react';
    
    console.log(`Getting repository details for ${owner}/${repo}...`);
    const repository = await octokit.repos.get({ owner, repo });
    console.log(`Repository: ${repository.data.name}, Stars: ${repository.data.stargazers_count}, Forks: ${repository.data.forks_count}`);
    
    // Test pull requests endpoint
    console.log(`Getting pull requests for ${owner}/${repo}...`);
    const pullRequests = await octokit.pulls.list({ owner, repo, per_page: 5 });
    console.log(`Retrieved ${pullRequests.data.length} pull requests`);
    pullRequests.data.forEach((pr, index) => {
      console.log(`PR #${index + 1}: ${pr.title} (${pr.state})`);
    });
    
    console.log('GitHub API test completed successfully!');
  } catch (error) {
    console.error('GitHub API test failed:', error);
  }
}

// Run the test
testGitHubAPI(); 