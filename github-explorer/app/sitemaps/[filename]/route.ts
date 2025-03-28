import { NextResponse } from 'next/server';

// Reuse the existing API base URL from the environment
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api';

/**
 * Individual sitemap file route handler
 * Proxies requests for individual sitemap files to the backend API
 */
export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;
  
  // Ensure the filename is sanitized (prevent directory traversal)
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_\-.]/g, '');
  
  try {
    // Fetch the sitemap file from the backend
    const response = await fetch(`${API_BASE_URL}/sitemaps/${sanitizedFilename}`);
    
    // Handle case where sitemap file doesn't exist
    if (!response.ok) {
      if (response.status === 404) {
        return new NextResponse(`Sitemap file "${sanitizedFilename}" not found`, { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' } 
        });
      }
      
      // Handle other error cases
      return new NextResponse('Error fetching sitemap file', { 
        status: response.status, 
        headers: { 'Content-Type': 'text/plain' } 
      });
    }
    
    // Get XML content from the backend response
    const xmlContent = await response.text();
    
    // Return the XML content with proper headers
    return new NextResponse(xmlContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error(`Error fetching sitemap file "${sanitizedFilename}":`, error);
    
    // Return a graceful error response
    return new NextResponse('Error generating sitemap file', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' } 
    });
  }
} 