#!/usr/bin/env node

/**
 * A simple utility to test the GitHub API client from the command line
 * Run with: node src/utils/test-github-api.js
 */

import 'dotenv/config';
import { githubClient } from '../services/github-client.js';

async function testGitHubAPI() {
  try {
    console.log('Testing GitHub API client...');
    
    // Test rate limit
    console.log('\n📊 Checking rate limit:');
    const rateLimit = await githubClient.getRateLimit();
    console.log(JSON.stringify(rateLimit, null, 2));
    
    // Test with a specific repository (default: octokit/octokit.js)
    const owner = process.argv[2] || 'octokit';
    const repo = process.argv[3] || 'octokit.js';
    
    console.log(`\n📁 Fetching repository information for ${owner}/${repo}:`);
    const repository = await githubClient.getRepository(owner, repo);
    console.log(`Name: ${repository.name}`);
    console.log(`Description: ${repository.description}`);
    console.log(`Stars: ${repository.stargazers_count}`);
    console.log(`Forks: ${repository.forks_count}`);
    console.log(`Open Issues: ${repository.open_issues_count}`);
    console.log(`Language: ${repository.language}`);
    
    console.log(`\n👥 Fetching contributors for ${owner}/${repo}:`);
    const contributors = await githubClient.getContributors(owner, repo);
    console.log(`Found ${contributors.length} contributors:`);
    contributors.slice(0, 5).forEach((contributor, index) => {
      console.log(`${index + 1}. ${contributor.login} (${contributor.contributions} contributions)`);
    });
    if (contributors.length > 5) {
      console.log(`...and ${contributors.length - 5} more`);
    }
    
    console.log(`\n🔄 Fetching pull requests for ${owner}/${repo}:`);
    const pullRequests = await githubClient.getPullRequests(owner, repo, { state: 'all', per_page: 10 });
    console.log(`Found ${pullRequests.length} pull requests:`);
    pullRequests.slice(0, 5).forEach((pr, index) => {
      console.log(`${index + 1}. #${pr.number}: ${pr.title} (${pr.state})`);
    });
    if (pullRequests.length > 5) {
      console.log(`...and ${pullRequests.length - 5} more`);
    }
    
    console.log(`\n💻 Fetching commits for ${owner}/${repo}:`);
    const commits = await githubClient.getCommits(owner, repo, { per_page: 10 });
    console.log(`Found ${commits.length} commits:`);
    commits.slice(0, 5).forEach((commit, index) => {
      console.log(`${index + 1}. ${commit.sha.substring(0, 7)}: ${commit.commit.message.split('\n')[0]}`);
    });
    if (commits.length > 5) {
      console.log(`...and ${commits.length - 5} more`);
    }
    
    console.log('\n✅ GitHub API client test completed successfully!');
  } catch (error) {
    console.error('❌ GitHub API client test failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testGitHubAPI(); 