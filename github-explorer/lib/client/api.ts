/**
 * Core API client for making requests to the backend server
 */

/**
 * Base function to make API requests to the backend server
 * @param endpoint The API endpoint to call
 * @param method The HTTP method to use
 * @param params Optional query parameters
 * @param body Optional request body
 * @returns The response from the API
 */
export async function fetchFromApi<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  params?: Record<string, string>,
  body?: any
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
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  // Add body if provided
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  // Make the request
  console.log(`Making API request to: ${url}`);
  const response = await fetch(url, options);
  
  // Handle errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }
  
  // Parse and return the response
  return await response.json();
} 