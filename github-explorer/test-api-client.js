// Test script for API client implementation
// Run with: node test-api-client.js

const fetch = require('node-fetch');

// Simple implementation of the API client fetch function for testing
async function fetchFromApi(endpoint, method = 'GET', params, body) {
  // Build URL with query parameters
  const baseUrl = 'http://localhost:30011/api';
  let url = `${baseUrl}/${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  // Configure request options
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  // Add body if provided
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`Making ${method} request to: ${url}`);
  
  // Make the request
  const response = await fetch(url, options);
  
  // Log response status
  console.log(`Response status: ${response.status}`);
  
  // Handle errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }
  
  // Parse and return the response
  return await response.json();
}

// Test functions for each API endpoint
async function testEntityCounts() {
  console.log('\n----- Testing Entity Counts API -----');
  try {
    const data = await fetchFromApi('entity-counts');
    console.log('Entity counts:', data);
    console.log('✅ Entity counts API test successful');
    return data;
  } catch (error) {
    console.error('❌ Entity counts API test failed:', error.message);
  }
}

async function testPipelineStatus(pipelineType = 'repository') {
  console.log(`\n----- Testing Pipeline Status API for ${pipelineType} -----`);
  try {
    const data = await fetchFromApi('pipeline-status', 'GET', { pipeline_type: pipelineType });
    console.log('Pipeline status:', data);
    console.log('✅ Pipeline status API test successful');
    return data;
  } catch (error) {
    console.error('❌ Pipeline status API test failed:', error.message);
    console.log('This failure is expected if no pipeline status exists yet');
  }
}

async function testPipelineHistory() {
  console.log('\n----- Testing Pipeline History API -----');
  try {
    const data = await fetchFromApi('pipeline-history');
    console.log('Pipeline history:', data);
    console.log('✅ Pipeline history API test successful');
    return data;
  } catch (error) {
    console.error('❌ Pipeline history API test failed:', error.message);
  }
}

async function testSitemapStatus() {
  console.log('\n----- Testing Sitemap Status API -----');
  try {
    const data = await fetchFromApi('sitemap-status');
    console.log('Sitemap status:', data);
    console.log('✅ Sitemap status API test successful');
    return data;
  } catch (error) {
    console.error('❌ Sitemap status API test failed:', error.message);
    console.log('This failure is expected if sitemap_status table doesn\'t exist yet');
  }
}

// Run all tests
async function runAllTests() {
  console.log('=== Starting API Client Tests ===');
  console.log('Testing backend API endpoints to verify they work with our new API client');
  
  await testEntityCounts();
  await testPipelineStatus();
  await testPipelineHistory();
  await testSitemapStatus();
  
  console.log('\n=== API Client Tests Completed ===');
}

// Execute tests
runAllTests().catch(error => {
  console.error('Test execution error:', error);
}); 