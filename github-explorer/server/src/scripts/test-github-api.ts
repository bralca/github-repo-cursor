import dotenv from 'dotenv';
import path from 'path';
import githubClient from '../services/github/github-client.service';

// Load environment variables from the correct path
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

/**
 * Test GitHub API client
 */
async function testGitHubAPI() {
  try {
    console.log('Testing GitHub API client...');
    
    // Check rate limit
    console.log('Checking rate limit...');
    const rateLimit = await githubClient.checkRateLimit();
    console.log(`Rate limit: ${rateLimit.rate.remaining}/${rateLimit.rate.limit}`);
    
    // Test repository endpoint
    const owner = 'facebook';
    const repo = 'react';
    
    console.log(`Getting repository details for ${owner}/${repo}...`);
    const repository = await githubClient.getRepository(owner, repo);
    console.log(`Repository: ${repository.name}, Stars: ${repository.stargazers_count}, Forks: ${repository.forks_count}`);
    
    // Test pull requests endpoint
    console.log(`Getting pull requests for ${owner}/${repo}...`);
    const pullRequests = await githubClient.getPullRequests(owner, repo, { perPage: 5 });
    console.log(`Retrieved ${pullRequests.length} pull requests`);
    pullRequests.forEach((pr, index) => {
      console.log(`PR #${index + 1}: ${pr.title} (${pr.state})`);
    });
    
    // Test commits endpoint
    console.log(`Getting commits for ${owner}/${repo}...`);
    const commits = await githubClient.getCommits(owner, repo, { perPage: 5 });
    console.log(`Retrieved ${commits.length} commits`);
    commits.forEach((commit, index) => {
      console.log(`Commit #${index + 1}: ${commit.sha.substring(0, 7)} - ${commit.commit.message.split('\n')[0]}`);
    });
    
    // Test contributors endpoint
    console.log(`Getting contributors for ${owner}/${repo}...`);
    const contributors = await githubClient.getRepositoryContributors(owner, repo, { perPage: 5 });
    console.log(`Retrieved ${contributors.length} contributors`);
    contributors.forEach((contributor, index) => {
      console.log(`Contributor #${index + 1}: ${contributor.login} (${contributor.contributions} contributions)`);
    });
    
    console.log('GitHub API client test completed successfully!');
  } catch (error) {
    console.error('GitHub API client test failed:', error);
  }
}

// Run the test
testGitHubAPI(); 