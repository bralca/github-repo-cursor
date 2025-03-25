import { NextRequest, NextResponse } from 'next/server';
import { fetchFromServerApi } from '@/lib/server-api/server-fetch';

// Track when the server was started
const SERVER_START_TIME = new Date();

/**
 * Health check API route
 * This provides detailed information about the application status
 */
export async function GET(request: NextRequest) {
  console.log('Health check requested');
  
  try {
    // Check database connection
    const dbStatus = await checkDatabaseConnection();
    
    // Get system info
    const systemInfo = {
      uptime: getUptime(),
      environment: process.env.NODE_ENV || 'development',
      nextVersion: process.env.NEXT_RUNTIME || 'unknown',
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };
    
    // Get detailed status info
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      startTime: SERVER_START_TIME.toISOString(),
      database: dbStatus,
      system: systemInfo,
      // Add render.com specific info if available
      render: {
        serviceId: process.env.RENDER_SERVICE_ID || 'unknown',
        serviceSlug: process.env.RENDER_SERVICE_SLUG || 'unknown',
        gitBranch: process.env.RENDER_GIT_BRANCH || 'unknown',
        gitCommit: process.env.RENDER_GIT_COMMIT || 'unknown',
      }
    };
    
    console.log('Health check: OK');
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * Check database connection via API
 */
async function checkDatabaseConnection() {
  try {
    // Fetch database status from the API
    const result = await fetchFromServerApi<{
      connected: boolean;
      version: string;
      tables: string[];
      counts: {
        repositories: number;
        contributors: number;
        mergeRequests: number;
        commits: number;
        contributorRankings: number;
      }
    }>('health/database');
    
    return result || { connected: false, error: 'No data returned from API' };
  } catch (error: any) {
    console.error('Database connection check failed:', error);
    return {
      connected: false,
      error: error.message
    };
  }
}

/**
 * Get server uptime in human-readable format
 */
function getUptime() {
  const uptimeMs = Date.now() - SERVER_START_TIME.getTime();
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  return {
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
    totalSeconds: seconds,
    ms: uptimeMs
  };
} 