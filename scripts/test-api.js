/**
 * Test script for API endpoints
 * 
 * This script tests all the API endpoints in the GitHub Explorer backend.
 * It will make requests to each endpoint and display the results.
 * 
 * Prerequisites:
 * - The server must be running (npm run dev:server)
 * - If using Node.js < 18, install node-fetch: npm install node-fetch
 * 
 * Usage:
 * node scripts/test-api.js
 * 
 * To test a specific endpoint only, pass it as an argument:
 * node scripts/test-api.js contributors
 * 
 * Available endpoint groups:
 * - entity-counts
 * - pipeline
 * - rankings
 * - repositories
 * - contributors
 * - merge-requests
 * - commits
 * - all (default)
 */

// Use CommonJS require for compatibility
let fetch;
if (typeof globalThis.fetch === 'function') {
  // Node.js >= 18 has global fetch
  fetch = globalThis.fetch;
} else {
  // Node.js < 18 needs node-fetch
  try {
    fetch = require('node-fetch');
  } catch (e) {
    console.error('Please install node-fetch: npm install node-fetch');
    process.exit(1);
  }
}

const API_BASE_URL = 'http://localhost:3001/api';

async function testEndpoint(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Testing endpoint: ${url}`);
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error (${response.status}): ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

async function testEntityCounts() {
  console.log('\n--- Testing Entity Counts ---');
  return await testEndpoint('/entity-counts');
}

async function testPipelineEndpoints() {
  console.log('\n--- Testing Pipeline Status ---');
  await testEndpoint('/pipeline-status?pipeline_type=github_sync');
  
  console.log('\n--- Testing Pipeline History ---');
  await testEndpoint('/pipeline-history');
  
  console.log('\n--- Testing Pipeline Schedules ---');
  await testEndpoint('/pipeline-schedules');
}

async function testContributorRankings() {
  console.log('\n--- Testing Contributor Rankings ---');
  return await testEndpoint('/contributor-rankings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operation: 'get_latest'
    }),
  });
}

async function testRepositories() {
  console.log('\n--- Testing Repositories Listing ---');
  const reposResult = await testEndpoint('/repositories?page=1&limit=5');
  
  // If we have repositories, test getting one by ID
  if (reposResult && reposResult.data && reposResult.data.length > 0) {
    const firstRepo = reposResult.data[0];
    
    console.log('\n--- Testing Repository by ID ---');
    await testEndpoint(`/repositories/id/${firstRepo.id}`);
    
    console.log('\n--- Testing Repository by Slug ---');
    await testEndpoint(`/repositories/${encodeURIComponent(firstRepo.full_name)}`);
  }
  
  return reposResult;
}

async function testContributors() {
  console.log('\n--- Testing Contributors Listing ---');
  const contributorsResult = await testEndpoint('/contributors?page=1&limit=5');
  
  // If we have contributors, test getting one by ID
  if (contributorsResult && contributorsResult.data && contributorsResult.data.length > 0) {
    const firstContributor = contributorsResult.data[0];
    
    console.log('\n--- Testing Contributor by ID ---');
    await testEndpoint(`/contributors/id/${firstContributor.id}`);
    
    console.log('\n--- Testing Contributor by Login ---');
    await testEndpoint(`/contributors/${encodeURIComponent(firstContributor.login)}`);
  }
  
  return contributorsResult;
}

async function testMergeRequests() {
  console.log('\n--- Testing Merge Requests Listing ---');
  const mrResult = await testEndpoint('/merge-requests?page=1&limit=5');
  
  // If we have merge requests, test getting one by ID
  if (mrResult && mrResult.data && mrResult.data.length > 0) {
    const firstMr = mrResult.data[0];
    
    console.log('\n--- Testing Merge Request by ID ---');
    await testEndpoint(`/merge-requests/id/${firstMr.id}`);
    
    console.log('\n--- Testing Merge Request by Repository ID and Number ---');
    await testEndpoint(`/merge-requests/repository/${firstMr.repository_id}/number/${firstMr.number}`);
  }
  
  return mrResult;
}

async function testCommits() {
  console.log('\n--- Testing Commits Listing ---');
  const commitsResult = await testEndpoint('/commits?page=1&limit=5');
  
  // If we have commits, test getting one by ID
  if (commitsResult && commitsResult.data && commitsResult.data.length > 0) {
    const firstCommit = commitsResult.data[0];
    
    console.log('\n--- Testing Commit by ID ---');
    await testEndpoint(`/commits/id/${firstCommit.id}`);
    
    console.log('\n--- Testing Commit by Repository ID and SHA ---');
    await testEndpoint(`/commits/repository/${firstCommit.repository_id}/sha/${encodeURIComponent(firstCommit.sha)}`);
  }
  
  return commitsResult;
}

async function runTests() {
  console.log('=== Testing API Endpoints ===\n');
  
  // Get the endpoint to test from command line args
  const testTarget = process.argv[2] || 'all';
  
  try {
    switch (testTarget.toLowerCase()) {
      case 'entity-counts':
        await testEntityCounts();
        break;
      case 'pipeline':
        await testPipelineEndpoints();
        break;
      case 'rankings':
        await testContributorRankings();
        break;
      case 'repositories':
        await testRepositories();
        break;
      case 'contributors':
        await testContributors();
        break;
      case 'merge-requests':
        await testMergeRequests();
        break;
      case 'commits':
        await testCommits();
        break;
      case 'all':
      default:
        // Test all endpoints
        await testEntityCounts();
        await testPipelineEndpoints();
        await testContributorRankings();
        await testRepositories();
        await testContributors();
        await testMergeRequests();
        await testCommits();
        break;
    }
    
    console.log('\n=== API Testing Complete ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Start the tests
runTests().catch(console.error); 