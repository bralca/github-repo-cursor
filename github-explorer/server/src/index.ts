import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { logger, setShutdownStatus } from './utils/logger';
import { env } from './utils/env-validator';
import { requestIdMiddleware, requestIdLoggerMiddleware } from './middleware/request-id.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { defaultRateLimit } from './middleware/rate-limit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';
import apiRoutes from './routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = env.PORT;

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
})); // CORS support
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(requestIdMiddleware); // Add request ID to each request
app.use(requestIdLoggerMiddleware); // Add request ID to logger context
app.use(requestLoggerMiddleware); // Log all requests and responses
app.use(defaultRateLimit); // Apply rate limiting

// Legacy health check endpoint (for backward compatibility)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'github-explorer-pipeline-server',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(port, () => {
  logger.info(`Server running on port ${port} in ${env.NODE_ENV} mode`);
  logger.info(`Health check available at http://localhost:${port}/api/v1/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Shutting down gracefully.');
  setShutdownStatus(true);
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
  
  // Force close after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received. Shutting down gracefully.');
  setShutdownStatus(true);
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
  
  // Force close after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
});

export default app; 