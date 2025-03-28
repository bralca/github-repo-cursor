import { NextResponse } from 'next/server';

// Reuse the existing API base URL from the environment
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api';

/**
 * Sitemap.xml route handler
 * Proxies requests to the backend API endpoint and returns the XML content
 */
export async function GET() {
  try {
    // Fetch the sitemap XML from the backend using the documented endpoint
    const response = await fetch(`${API_BASE_URL}/sitemap.xml`);
    
    // Handle case where sitemap doesn't exist
    if (!response.ok) {
      if (response.status === 404) {
        return new NextResponse('Sitemap not found', { 
          status: 404,
          headers: { 'Content-Type': 'text/plain' } 
        });
      }
      
      // Handle other error cases
      return new NextResponse('Error fetching sitemap', { 
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
    console.error('Error fetching sitemap:', error);
    
    // Return a graceful error response
    return new NextResponse('Error generating sitemap', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' } 
    });
  }
} 