#!/usr/bin/env node

/**
 * Script to test the GitHub API client
 */
const { execSync } = require('child_process');
const path = require('path');

// Get the path to the TypeScript file
const scriptPath = path.join(__dirname, '..', 'src', 'scripts', 'test-github-api.ts');

// Run the script with ts-node
try {
  console.log('Running GitHub API test...');
  execSync(`npx ts-node ${scriptPath}`, { stdio: 'inherit' });
  console.log('Test completed successfully!');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
} 