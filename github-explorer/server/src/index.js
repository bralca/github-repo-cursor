import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from './utils/logger.js';
import healthRoutes from './routes/health.js';
import githubRoutes from './routes/github.js';
import repositoryRoutes from './routes/repository.routes.js';
import contributorRoutes from './routes/contributor.routes.js';
import mergeRequestRoutes from './routes/merge-request.routes.js';

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/github', githubRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/contributors', contributorRoutes);
app.use('/api/merge-requests', mergeRequestRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'GitHub Explorer API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      github: '/github',
      repositories: '/api/repositories',
      contributors: '/api/contributors',
      mergeRequests: '/api/merge-requests'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(err.status || 500).json({
    error: err.name || 'ServerError',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app; 