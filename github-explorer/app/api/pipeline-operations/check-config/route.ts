import { NextResponse } from 'next/server';

/**
 * GET handler for checking pipeline server configuration
 * Returns whether the server is configured
 */
export async function GET() {
  const serverUrl = process.env.PIPELINE_SERVER_URL;
  const apiKey = process.env.PIPELINE_SERVER_API_KEY;
  
  const configured = Boolean(serverUrl && apiKey);
  
  return NextResponse.json({
    configured,
    message: configured 
      ? 'Pipeline server is configured' 
      : 'Pipeline server configuration missing'
  });
} 