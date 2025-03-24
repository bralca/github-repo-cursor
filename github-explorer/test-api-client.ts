// Test script for API client implementation
// Run with: npm run test-api-ts

import fetch from 'node-fetch';

// Types for API responses
interface EntityCountsResponse {
  repositories: number;
  contributors: number;
  mergeRequests: number;
  commits: number;
  files?: number;
  comments?: number;
}

interface PipelineStatusResponse {
  pipelineType: string;
  status: string;
  isRunning: boolean;
  updatedAt: string | null;
}

interface PipelineHistoryEntry {
  id: string;
  pipelineType: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  itemsProcessed: number | null;
  errorMessage: string | null;
  duration: number | null;
}

interface SitemapStatusResponse {
  status: string;
  lastGenerated: string | null;
  urlCount: number | null;
  error: string | null;
}

interface ErrorResponse {
  error: string;
}

/**
 * Simple implementation of the API client fetch function for testing
 * This simulates our lib/client/api.ts fetchFromApi function
 */
async function fetchFromApi<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  params?: Record<string, string>,
  body?: any
): Promise<T> {
  // Build URL with query parameters
  const baseUrl = 'http://localhost:3001/api';
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
  const options: any = {
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
    try {
      const errorData = await response.json() as ErrorResponse;
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    } catch (jsonError) {
      // If JSON parsing fails, throw a generic error
      throw new Error(`API request failed with status ${response.status}`);
    }
  }
  
  // Parse and return the response
  return await response.json() as T;
}

/**
 * Validates that a response contains expected fields
 * @param data Response data to validate
 * @param requiredFields Array of field names that should exist in the response
 * @returns True if all fields exist, false otherwise
 */
function validateResponseFields(data: any, requiredFields: string[]): boolean {
  if (!data) return false;
  
  for (const field of requiredFields) {
    if (!(field in data)) {
      console.error(`❌ Missing required field: ${field}`);
      return false;
    }
  }
  
  return true;
}

// Test functions for each API endpoint
async function testEntityCounts(): Promise<EntityCountsResponse | undefined> {
  console.log('\n----- Testing Entity Counts API -----');
  try {
    const data = await fetchFromApi<EntityCountsResponse>('entity-counts');
    console.log('Entity counts:', data);
    
    // Validate response format
    const requiredFields = ['repositories', 'contributors', 'mergeRequests', 'commits'];
    const isValid = validateResponseFields(data, requiredFields);
    
    if (isValid) {
      console.log('✅ Entity counts API test successful');
      return data;
    } else {
      console.error('❌ Entity counts API response missing required fields');
      return undefined;
    }
  } catch (error) {
    console.error('❌ Entity counts API test failed:', error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

async function testPipelineStatus(pipelineType = 'repository'): Promise<PipelineStatusResponse | undefined> {
  console.log(`\n----- Testing Pipeline Status API for ${pipelineType} -----`);
  try {
    const data = await fetchFromApi<PipelineStatusResponse>('pipeline-status', 'GET', { pipeline_type: pipelineType });
    console.log('Pipeline status:', data);
    
    // Validate response format
    const requiredFields = ['pipelineType', 'status', 'isRunning'];
    const isValid = validateResponseFields(data, requiredFields);
    
    if (isValid) {
      console.log('✅ Pipeline status API test successful');
      return data;
    } else {
      console.error('❌ Pipeline status API response missing required fields');
      return undefined;
    }
  } catch (error) {
    console.error('❌ Pipeline status API test failed:', error instanceof Error ? error.message : String(error));
    console.log('This failure is expected if no pipeline status exists yet');
    return undefined;
  }
}

async function testPipelineHistory(): Promise<PipelineHistoryEntry[] | undefined> {
  console.log('\n----- Testing Pipeline History API -----');
  try {
    const data = await fetchFromApi<PipelineHistoryEntry[]>('pipeline-history');
    console.log('Pipeline history:', data);
    
    // For arrays, we just check that it's an array
    if (Array.isArray(data)) {
      console.log('✅ Pipeline history API test successful');
      return data;
    } else {
      console.error('❌ Pipeline history API response is not an array');
      return undefined;
    }
  } catch (error) {
    console.error('❌ Pipeline history API test failed:', error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

async function testSitemapStatus(): Promise<SitemapStatusResponse | undefined> {
  console.log('\n----- Testing Sitemap Status API -----');
  try {
    const data = await fetchFromApi<SitemapStatusResponse>('sitemap-status');
    console.log('Sitemap status:', data);
    
    // Validate response format
    const requiredFields = ['status'];
    const isValid = validateResponseFields(data, requiredFields);
    
    if (isValid) {
      console.log('✅ Sitemap status API test successful');
      return data;
    } else {
      console.error('❌ Sitemap status API response missing required fields');
      return undefined;
    }
  } catch (error) {
    console.error('❌ Sitemap status API test failed:', error instanceof Error ? error.message : String(error));
    console.log('This failure is expected if sitemap_status table doesn\'t exist yet');
    return undefined;
  }
}

/**
 * Test making a POST request to simulate pipeline operations
 */
async function testPipelineOperations(): Promise<boolean> {
  console.log('\n----- Testing Pipeline Operations API -----');
  try {
    // We'll make a request but not actually start/stop a pipeline
    // Just testing that the API endpoint handles POST requests correctly
    const data = await fetchFromApi('pipeline-operations', 'POST', undefined, {
      operation: 'test',
      pipelineType: 'test'
    });
    
    console.log('Pipeline operations response:', data);
    console.log('✅ Pipeline operations API test successful');
    return true;
  } catch (error) {
    console.error('❌ Pipeline operations API test failed:', error instanceof Error ? error.message : String(error));
    console.log('This is expected as we sent an invalid operation type');
    return false;
  }
}

// Run all tests
async function runAllTests(): Promise<void> {
  console.log('=== Starting API Client Tests ===');
  console.log('Testing backend API endpoints to verify they work with our new API client');
  
  const entityCounts = await testEntityCounts();
  const pipelineStatus = await testPipelineStatus();
  const pipelineHistory = await testPipelineHistory();
  const sitemapStatus = await testSitemapStatus();
  const pipelineOperations = await testPipelineOperations();
  
  console.log('\n=== API Client Tests Summary ===');
  console.log('Entity Counts API:', entityCounts ? 'SUCCESS' : 'FAILED');
  console.log('Pipeline Status API:', pipelineStatus ? 'SUCCESS' : 'FAILED (expected if table not initialized)');
  console.log('Pipeline History API:', pipelineHistory ? 'SUCCESS' : 'FAILED');
  console.log('Sitemap Status API:', sitemapStatus ? 'SUCCESS' : 'FAILED (expected if table not initialized)');
  console.log('Pipeline Operations API:', pipelineOperations ? 'SUCCESS' : 'FAILED (expected with test operation)');
  
  // Overall success?
  const criticalTests = [entityCounts, pipelineHistory];
  const isSuccess = criticalTests.every(Boolean);
  
  console.log('\n=== Overall Test Status ===');
  console.log(isSuccess ? '✅ PASS - Critical endpoints are working' : '❌ FAIL - Some critical endpoints are not working');
  console.log('\n=== API Client Tests Completed ===');
}

// Execute tests
runAllTests().catch(error => {
  console.error('Test execution error:', error instanceof Error ? error.message : String(error));
}); 