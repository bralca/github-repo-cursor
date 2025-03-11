import { logger } from '../utils/logger.js';
import os from 'os';

/**
 * Detailed health status controller
 * This provides more detailed information about the server's health
 */
export const getHealthStatus = (req, res) => {
  try {
    const healthInfo = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform,
      memoryUsage: formatMemoryUsage(process.memoryUsage()),
      system: {
        totalmem: formatBytes(os.totalmem()),
        freemem: formatBytes(os.freemem()),
        loadavg: os.loadavg(),
        cpus: os.cpus().length
      },
      process: {
        pid: process.pid,
        env: process.env.NODE_ENV || 'development'
      },
      services: {
        github: process.env.GITHUB_TOKEN ? 'configured' : 'not configured',
        supabase: process.env.SUPABASE_URL ? 'configured' : 'not configured'
      }
    };

    // Log health check
    logger.debug('Health check requested', { ip: req.ip });
    
    return res.json(healthInfo);
  } catch (error) {
    logger.error('Health check failed', error);
    return res.status(500).json({
      status: 'error',
      error: 'Failed to retrieve health information'
    });
  }
};

/**
 * Helper function to format memory usage
 */
const formatMemoryUsage = (memoryUsage) => {
  return {
    rss: formatBytes(memoryUsage.rss),          // Resident Set Size - total memory allocated
    heapTotal: formatBytes(memoryUsage.heapTotal), // V8 heap allocated
    heapUsed: formatBytes(memoryUsage.heapUsed),  // V8 heap used
    external: formatBytes(memoryUsage.external)   // C++ objects bound to JS
  };
};

/**
 * Helper function to format bytes
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}; 