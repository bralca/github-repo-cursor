// Simple test script for GitHub API
const { execSync } = require('child_process');

console.log('Testing GitHub API client...');

// Run a simple curl command to test the GitHub API
try {
  // Get GitHub rate limit (doesn't require authentication)
  console.log('Checking GitHub API rate limit...');
  const result = execSync('curl -s https://api.github.com/rate_limit', { encoding: 'utf-8' });
  
  console.log('GitHub API is accessible!');
  console.log('Rate limit info:');
  
  // Parse and display the rate limit info
  const rateLimit = JSON.parse(result);
  console.log(`Core: ${rateLimit.resources.core.remaining}/${rateLimit.resources.core.limit}`);
  console.log(`Search: ${rateLimit.resources.search.remaining}/${rateLimit.resources.search.limit}`);
  console.log(`Graphql: ${rateLimit.resources.graphql.remaining}/${rateLimit.resources.graphql.limit}`);
  
  console.log('\nTest completed successfully!');
} catch (error) {
  console.error('Error testing GitHub API:', error.message);
  process.exit(1);
} 