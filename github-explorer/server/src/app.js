import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from './utils/logger.js';
import { registerWebhookProcessorPipeline } from './pipeline/stages/webhook-processor-pipeline.js';
import { registerRepositoryProcessorPipeline } from './pipeline/stages/repository-processor-pipeline.js';
import { processWebhookPayload } from './pipeline/stages/webhook-processor-pipeline.js';
import { processRepository } from './pipeline/stages/repository-processor-pipeline.js';
import { supabaseClientFactory } from './services/supabase/supabase-client.js';

// Create Express app
const app = express();

// Initialize middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '5mb' })); // Parse JSON bodies with size limit

// Initialize server components
function initializeServer() {
  logger.info('Initializing server components');
  
  // Initialize Supabase client
  try {
    supabaseClientFactory.createClient();
    logger.info('Supabase client initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Supabase client', { error });
    throw error;
  }
  
  // Initialize pipelines
  initializePipelines();
  
  logger.info('Server components initialized successfully');
}

/**
 * Initialize data processing pipelines
 */
function initializePipelines() {
  logger.info('Initializing data processing pipelines');
  
  // Register webhook processor pipeline
  registerWebhookProcessorPipeline({
    // Any webhook processor configuration
  });
  
  // Register repository processor pipeline
  registerRepositoryProcessorPipeline({
    timeframeInDays: 30 // Process last 30 days of data by default
  });
  
  logger.info('Data processing pipelines initialized successfully');
}

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
    
    // Get repository data from request body or fetch from database
    const repository = req.body.repository || await fetchRepositoryFromDatabase(repoId);
    
    if (!repository) {
      return res.status(404).json({
        status: 'error',
        message: `Repository with ID ${repoId} not found`
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

// Helper function to fetch repository from database
async function fetchRepositoryFromDatabase(repoId) {
  try {
    const supabase = supabaseClientFactory.getClient();
    const { data, error } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repoId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Failed to fetch repository ${repoId} from database`, { error });
    return null;
  }
}

// Start the server
function startServer(port) {
  try {
    // Initialize server components
    initializeServer();
    
    // Start listening on the specified port
    const server = app.listen(port, () => {
      logger.info(`Server started successfully on port ${port}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', shutdownServer(server));
    process.on('SIGINT', shutdownServer(server));
    
    return server;
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown function
function shutdownServer(server) {
  return () => {
    logger.info('Received shutdown signal, closing server...');
    server.close(() => {
      logger.info('Server closed successfully');
      process.exit(0);
    });
    
    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Server shutdown timed out, forcing exit');
      process.exit(1);
    }, 10000);
  };
}

// Export the app and startup function for use in server.js
export { app, startServer }; 