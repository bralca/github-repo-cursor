import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from './utils/logger.js';
import { registerWebhookProcessorPipeline } from './pipeline/stages/webhook-processor-pipeline.js';
import { registerRepositoryProcessorPipeline } from './pipeline/stages/repository-processor-pipeline.js';
import { registerContributorProcessorPipeline } from './pipeline/stages/contributor-processor-pipeline.js';
import { registerContributorRepositoryPipeline } from './pipeline/stages/contributor-repository-pipeline.js';
import { registerMergeRequestProcessorPipeline } from './pipeline/stages/merge-request-processor-pipeline.js';
import { registerCommitProcessorPipeline } from './pipeline/stages/commit-processor-pipeline.js';
import { registerDatabaseWriterPipeline } from './pipeline/stages/database-writer-pipeline.js';
import { processWebhookPayload } from './pipeline/stages/webhook-processor-pipeline.js';
import { processRepository } from './pipeline/stages/repository-processor-pipeline.js';
import { createSitemapPipeline } from './pipeline/index.js';
import { initializeRequiredPipelines } from './pipeline/initialize-pipelines.js';
import runCronJobs from './scripts/run-cron-jobs.js';
import pipelineOperationsController from './controllers/pipeline-operations-controller.js';
import { closeConnection, getConnection } from './db/connection-manager.js';

// Import routes
import healthRoutes from './routes/health.js';
import githubRoutes from './routes/github.js';
import webhookRoutes from './routes/webhook.js';
// Removed imports for deleted routes
// import repositoryRoutes from './routes/repository.routes.js';
// import contributorRoutes from './routes/contributor.routes.js';
// import mergeRequestRoutes from './routes/merge-request.routes.js';
import pipelineSchedulerRoutes from './routes/pipeline-scheduler-routes.js';
import pipelineNotificationRoutes from './routes/pipeline-notification-routes.js';
import pipelineOperationsRoutes from './routes/pipeline-operations-routes.js';
import apiRoutes from './routes/api-routes.js';

// Create Express app
const app = express();

// Initialize middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '5mb' })); // Parse JSON bodies with size limit

/**
 * Initialize all server components
 */
async function initializeServer() {
  try {
    // Initialize and validate database connection first
    logger.info('Initializing database connection...');
    const db = await getConnection();
    
    // Validate the connection with a test query
    try {
      const result = await db.get('SELECT sqlite_version() as version');
      logger.info('Database connection validated successfully', { 
        sqlite_version: result.version,
        journal_mode: await db.get('PRAGMA journal_mode').then(r => r.journal_mode)
      });
    } catch (dbError) {
      logger.error('Failed to validate database connection', { error: dbError });
      throw new Error(`Database validation failed: ${dbError.message}`);
    }
    
    // Reset any stale pipeline running statuses
    logger.info('Resetting stale pipeline running statuses');
    await pipelineOperationsController.resetAllPipelineStatuses().catch(error => {
      logger.error('Error resetting pipeline statuses', { error });
      // Don't throw here - allow server to continue
    });
    
    // Initialize pipelines
    initializePipelines();
    
    logger.info('Server initialization completed successfully');
  } catch (error) {
    logger.error('Server initialization failed', { error });
    throw error;
  }
}

/**
 * Initialize data processing pipelines
 */
function initializePipelines() {
  logger.info('Initializing data processing pipelines');
  
  // Initialize pipeline services (using null services since we're not using Supabase)
  const pipelineServices = {
    repositoryService: null,
    contributorService: null,
    mergeRequestService: null,
    commitService: null
  };
  
  // Register webhook processor pipeline
  registerWebhookProcessorPipeline(pipelineServices);
  
  // Register repository processor pipeline
  registerRepositoryProcessorPipeline({
    timeframeInDays: 30 // Process last 30 days of data by default
  });
  
  // Register contributor processor pipeline
  registerContributorProcessorPipeline({
    // Any contributor processor configuration
  });
  
  // Register contributor-repository processor pipeline
  registerContributorRepositoryPipeline({
    // Any contributor-repository processor configuration
  });
  
  // Register merge request processor pipeline
  registerMergeRequestProcessorPipeline({
    // Any merge request processor configuration
  });
  
  // Register commit processor pipeline
  registerCommitProcessorPipeline({
    // Any commit processor configuration
  });
  
  // Register database writer pipeline
  registerDatabaseWriterPipeline({
    // Any database writer configuration
  });
  
  // Register sitemap generation pipeline
  const sitemapPipeline = createSitemapPipeline();
  // Add the pipeline to the pipeline server's available pipelines
  global.pipelines = global.pipelines || {};
  global.pipelines['sitemap_generation'] = sitemapPipeline;
  
  // Initialize the required pipelines for cron jobs
  initializeRequiredPipelines({
    // Configure pipeline options if needed
    dataProcessingBatchSize: 50,
    entityExtractionBatchSize: 100,
    dataEnrichmentBatchSize: 20,
    sitemapOutputDir: './public/sitemaps',
    sitemapBaseUrl: process.env.BASE_URL || 'https://github-explorer.example.com',
    contributorRankingsBatchSize: 500
  });
  
  logger.info('Data processing pipelines initialized successfully');
}

// Register API routes
app.use('/api', apiRoutes); // API routes for frontend-backend separation

// Health and system routes - keep these
app.use('/api/health', healthRoutes);
app.use('/api/pipeline', pipelineOperationsRoutes);
app.use('/api/scheduler', pipelineSchedulerRoutes);
app.use('/api/notifications', pipelineNotificationRoutes);
app.use('/api/webhooks', webhookRoutes);

// Removed legacy entity routes - no longer needed as they've been deleted
// app.use('/api/github', githubRoutes);
// app.use('/api/repositories', repositoryRoutes);
// app.use('/api/contributors', contributorRoutes);
// app.use('/api/merge-requests', mergeRequestRoutes);

// API Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook endpoint for GitHub events
app.post('/api/webhooks/github', async (req, res) => {
  try {
    logger.info('Received GitHub webhook payload');
    
    // Process the webhook payload
    const result = await processWebhookPayload(req.body);
    
    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'Webhook processed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to process GitHub webhook', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to process webhook',
      error: error.message
    });
  }
});

// Repository processing endpoint
app.post('/api/repositories/:id/process', async (req, res) => {
  try {
    const repoId = req.params.id;
    logger.info(`Received request to process repository: ${repoId}`);
    
    // Get repository data from request body
    const repository = req.body.repository;
    
    if (!repository) {
      return res.status(400).json({
        status: 'error',
        message: 'Repository data is required in the request body'
      });
    }
    
    // Process the repository
    const result = await processRepository(repository, {
      // Optional: include commits if provided in request
      commits: req.body.commits,
      // Optional: include contributors if provided in request
      contributors: req.body.contributors
    });
    
    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'Repository processed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to process repository', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to process repository',
      error: error.message
    });
  }
});

/**
 * Start the server
 * @param {number} port - Port to listen on
 * @returns {Promise<Object>} Express server instance
 */
async function startServer(port) {
  try {
    logger.info(`Attempting to start server on port ${port}`);
    
    // Initialize server components
    await initializeServer();
    
    // Start listening on the specified port
    const server = app.listen(port);
    
    // Initialize and run cron jobs
    logger.info('Starting scheduled cron jobs...');
    // We don't await this as it keeps running forever
    runCronJobs().catch(error => {
      logger.error('Failed to start cron jobs', { error });
      // Don't exit process - allow server to continue running even if cron jobs fail
    });
    
    // Handle specific errors like port in use
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use. Check if another instance is running.`);
        
        // Try another port (port+1) as a fallback
        const alternativePort = port + 1;
        logger.info(`Attempting to start on alternative port ${alternativePort}`);
        
        try {
          const alternativeServer = app.listen(alternativePort, () => {
            logger.info(`Server started successfully on alternative port ${alternativePort}`);
          });
          
          // Handle graceful shutdown
          process.on('SIGTERM', shutdownServer(alternativeServer));
          process.on('SIGINT', shutdownServer(alternativeServer));
        } catch (alternativeError) {
          logger.error('Failed to start server on alternative port', { error: alternativeError });
          process.exit(1);
        }
      } else {
        // Handle other server errors
        logger.error('Server error occurred', { error });
        process.exit(1);
      }
    });
    
    // Log successful start when listening begins
    server.on('listening', () => {
      logger.info(`Server started successfully on port ${port}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', shutdownServer(server));
    process.on('SIGINT', shutdownServer(server));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      logger.error('Uncaught exception, initiating shutdown', { 
        error, 
        message: error.message,
        stack: error.stack
      });
      
      // Close database connection
      try {
        logger.info('Closing database connection due to uncaught exception...');
        await closeConnection();
        logger.info('Database connection closed successfully');
      } catch (dbError) {
        logger.error('Error closing database connection', { error: dbError });
      }
      
      // Exit with error code
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('Unhandled promise rejection, initiating shutdown', { 
        reason, 
        promise
      });
      
      // Close database connection
      try {
        logger.info('Closing database connection due to unhandled rejection...');
        await closeConnection();
        logger.info('Database connection closed successfully');
      } catch (dbError) {
        logger.error('Error closing database connection', { error: dbError });
      }
      
      // Exit with error code
      process.exit(1);
    });
    
    return server;
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown function
function shutdownServer(server) {
  return async () => {
    logger.info('Received shutdown signal, beginning graceful shutdown...');
    let shutdownComplete = false;
    
    // Close database connection first
    try {
      logger.info('Closing database connection...');
      await closeConnection();
      logger.info('Database connection closed successfully');
    } catch (dbError) {
      logger.error('Error closing database connection', { error: dbError });
      // Continue with shutdown even if database close fails
    }
    
    // Now close the HTTP server
    logger.info('Closing HTTP server...');
    server.close(() => {
      logger.info('HTTP server closed successfully');
      shutdownComplete = true;
      // Exit after all cleanup is done
      process.exit(0);
    });
    
    // Force shutdown after timeout
    setTimeout(() => {
      if (!shutdownComplete) {
        logger.error('Server shutdown timed out after 10 seconds, forcing exit');
        process.exit(1);
      }
    }, 10000);
  };
}

// Export the app and startup function for use in server.js
export { app, startServer }; 