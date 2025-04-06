/**
 * Core API client for making requests to the backend server
 */

// Cache tags for selective revalidation
export const CACHE_TAGS = {
  ENTITY_COUNTS: 'entity-counts',
  REPOSITORIES: 'repositories',
  CONTRIBUTORS: 'contributors',
  MERGE_REQUESTS: 'merge-requests',
  COMMITS: 'commits',
  PIPELINE: 'pipeline'
};

/**
 * Options for API requests
 */
export interface ApiRequestOptions {
  /**
   * Time in seconds to revalidate the cache
   * Set to 0 to disable caching
   * Default: undefined (no revalidation)
   */
  revalidate?: number;
  
  /**
   * Force a fresh request bypassing the cache
   * Default: false
   */
  forceRefresh?: boolean;
  
  /**
   * Cache tags for selective revalidation
   * Default: undefined
   */
  tags?: string[];
}

/**
 * Base function to make API requests to the backend server
 * @param endpoint The API endpoint to call
 * @param method The HTTP method to use
 * @param params Optional query parameters
 * @param body Optional request body
 * @param options Optional request options including caching settings
 * @returns The response from the API
 */
export async function fetchFromApi<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  params?: Record<string, string>,
  body?: any,
  options?: ApiRequestOptions
): Promise<T> {
  // Base URL for the backend server
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api';
  
  // Build URL with query parameters
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
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  // Add Next.js caching options if provided and method is GET
  if (method === 'GET' && typeof options?.revalidate !== 'undefined') {
    // Configure Next.js fetch cache behavior
    fetchOptions.next = {
      // Set revalidation time in seconds
      revalidate: options.revalidate,
      // Add tags for selective revalidation if provided
      ...(options.tags && options.tags.length > 0 ? { tags: options.tags } : {})
    };
  }
  
  // Force cache bypass if specified
  if (method === 'GET' && options?.forceRefresh) {
    fetchOptions.cache = 'no-store';
  }
  
  // Add body if provided
  if (body && (method === 'POST' || method === 'PUT')) {
    // Debug: Log the exact body before stringifying
    console.log(`API ${method} request body:`, body);
    fetchOptions.body = JSON.stringify(body);
  }
  
  // Make the request
  console.log(`Making API request to: ${url}${fetchOptions.next ? ' with caching' : ''}`);
  const response = await fetch(url, fetchOptions);
  
  // Handle errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }
  
  // Parse and return the response
  return await response.json();
} 