import { NextRequest, NextResponse } from 'next/server';
import { withDb } from '@/lib/database/connection';

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
 * Check database connection
 */
async function checkDatabaseConnection() {
  try {
    // Check if we can query the database
    const result = await withDb(async (db) => {
      // Get SQLite version
      const version = await db.get('SELECT sqlite_version() as version');
      
      // Get all tables
      const tables = await db.all(`
        SELECT name FROM sqlite_master
        WHERE type='table'
        ORDER BY name
      `);
      
      // Count rows in key tables
      const counts = await Promise.all([
        db.get('SELECT COUNT(*) as count FROM repositories').catch(() => ({ count: 0 })),
        db.get('SELECT COUNT(*) as count FROM contributors').catch(() => ({ count: 0 })),
        db.get('SELECT COUNT(*) as count FROM merge_requests').catch(() => ({ count: 0 })),
        db.get('SELECT COUNT(*) as count FROM commits').catch(() => ({ count: 0 })),
        db.get('SELECT COUNT(*) as count FROM contributor_rankings').catch(() => ({ count: 0 })),
      ]);
      
      return {
        connected: true,
        version: version?.version,
        tables: tables.map(t => t.name),
        counts: {
          repositories: counts[0]?.count || 0,
          contributors: counts[1]?.count || 0,
          mergeRequests: counts[2]?.count || 0,
          commits: counts[3]?.count || 0,
          contributorRankings: counts[4]?.count || 0,
        }
      };
    });
    
    return result;
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