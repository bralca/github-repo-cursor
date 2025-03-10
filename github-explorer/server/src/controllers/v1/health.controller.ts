import { Request, Response } from 'express';
import { BaseController } from '../base.controller';
import { createLogger } from '../../utils/logger';

const logger = createLogger('HealthController');

/**
 * Controller for health check endpoints
 */
export class HealthController extends BaseController {
  /**
   * Basic health check endpoint
   */
  public getHealth = this.asyncWrapper(async (_req: Request, res: Response): Promise<void> => {
    logger.info('Health check requested');
    
    // Collect health metrics
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node: process.version,
      services: {
        // In the future, we'll add database and other service status checks here
        database: 'Not configured',
        github: 'Not configured',
      },
    };
    
    this.sendSuccess(res, health);
  });

  /**
   * Detailed health check with component status
   */
  public getDetailedHealth = this.asyncWrapper(async (_req: Request, res: Response): Promise<void> => {
    logger.info('Detailed health check requested');
    
    // Simulate checking various components
    // In a real implementation, these would be actual checks
    const services = {
      database: {
        status: 'OK',
        latency: Math.random() * 10,
        connections: 5,
      },
      github: {
        status: 'OK',
        apiRateLimit: {
          remaining: 4990,
          limit: 5000,
          resetAt: new Date(Date.now() + 3600000).toISOString(),
        },
      },
      cache: {
        status: 'OK',
        size: '24MB',
        items: 156,
      },
    };
    
    // Detailed health data
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: {
        server: process.uptime(),
        system: Math.floor(process.uptime()),
      },
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      },
      services,
    };
    
    this.sendSuccess(res, health);
  });
} 