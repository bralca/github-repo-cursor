/**
 * Server-side API client for fetching data from the backend
 * This should only be used in server components and server-side functions
 */

/**
 * Base function to make server-side API requests to the backend server
 * @param endpoint The API endpoint to call
 * @param method The HTTP method to use
 * @param params Optional query parameters
 * @param body Optional request body
 * @returns The response from the API
 */
export async function fetchFromServerApi<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  params?: Record<string, string>,
  body?: any
): Promise<T> {
  // Base URL for the backend server - in server components, we use the direct URL
  const baseUrl = process.env.BACKEND_API_URL || 'http://localhost:3001/api';
  
  console.log(`[Server Debug] fetchFromServerApi called for endpoint: ${endpoint}`);
  console.log(`[Server Debug] Environment check: NODE_ENV=${process.env.NODE_ENV}`);
  console.log(`[Server Debug] Using API base URL: ${baseUrl}`);
  
  // Build URL with query parameters
  let url = `${baseUrl}/${endpoint}`;
  if (params) {
    console.log(`[Server Debug] Request params:`, params);
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
        console.log(`[Server Debug] Added param: ${key}=${value}`);
      }
    });
    
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  console.log(`[Server Debug] Final request URL: ${url}`);
  
  // Configure request options
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 60 }, // Cache for 60 seconds
  };
  
  console.log(`[Server Debug] Request method: ${method}`);
  console.log(`[Server Debug] Request headers:`, options.headers);
  
  // Add body if provided
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
    console.log(`[Server Debug] Request body:`, body);
  }
  
  // Make the request
  console.log(`[Server Debug] Making API request to: ${url}`);
  
  try {
    const response = await fetch(url, options);
    console.log(`[Server Debug] Response status: ${response.status} ${response.statusText}`);
    
    // Handle errors
    if (!response.ok) {
      const statusCode = response.status;
      let errorText = `API request failed with status ${statusCode}`;
      
      try {
        const errorData = await response.json();
        console.error(`[Server Debug] API Error ${statusCode} response:`, errorData);
        errorText = errorData.error || errorText;
      } catch (parseError) {
        console.error(`[Server Debug] Failed to parse error response: ${response.statusText}`);
      }
      
      throw new Error(errorText);
    }
    
    // Parse and return the response
    const data = await response.json();
    console.log(`[Server Debug] API response received for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`[Server Debug] Request to ${url} failed:`, error);
    throw error;
  }
} 