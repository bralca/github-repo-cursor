import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import { logger } from './utils/logger.js';
import healthRoutes from './routes/health.js';
import githubRoutes from './routes/github.js';
import repositoryRoutes from './routes/repository.routes.js';
import contributorRoutes from './routes/contributor.routes.js';
import mergeRequestRoutes from './routes/merge-request.routes.js';
import webhookRoutes from './routes/webhook.js';
import apiRoutes from './routes/api-routes.js';

// Import pipeline components
import { registerWebhookProcessorPipeline } from './pipeline/stages/webhook-processor-pipeline.js';

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Initialize pipeline services with SQLite instead of Supabase
const pipelineServices = {
  // Providing null services or mock implementations
  // These will be available if needed, but won't cause errors
  repositoryService: null,
  contributorService: null,
  mergeRequestService: null,
  commitService: null
};

// Register pipeline
try {
  registerWebhookProcessorPipeline(pipelineServices);
  logger.info('Pipeline registered successfully');
} catch (error) {
  logger.error('Failed to register pipeline', { error });
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve sitemap directly from the root path
app.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemapPath = path.join(process.cwd(), 'public/sitemap.xml');
    
    if (fs.existsSync(sitemapPath)) {
      const sitemapContent = await fs.promises.readFile(sitemapPath, 'utf8');
      res.setHeader('Content-Type', 'application/xml');
      res.send(sitemapContent);
    } else {
      logger.warn(`Sitemap file not found at ${sitemapPath}`);
      res.status(404).send('Sitemap not found');
    }
  } catch (error) {
    logger.error(`Error serving sitemap: ${error.message}`, { error });
    res.status(500).send('Error serving sitemap');
  }
});

// Serve static files from the public directory if it exists
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.xml')) {
      res.setHeader('Content-Type', 'application/xml');
    }
  }
}));

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
app.use('/webhooks', webhookRoutes);
app.use('/api', apiRoutes); // New API routes for frontend-backend separation

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
      mergeRequests: '/api/merge-requests',
      webhooks: '/webhooks',
      api: '/api' // Add the new API endpoints
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
  logger.error('Unhandled error', { error: err });
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? null : err.message
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