/**
 * Pipeline Operations Routes
 * 
 * This module defines the API routes for direct pipeline operations (start/stop).
 */

import express from 'express';
import pipelineOperationsController from '../controllers/pipeline-operations-controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Create a router
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Pipeline operation routes
router.post('/start', pipelineOperationsController.startPipeline.bind(pipelineOperationsController));
router.post('/stop', pipelineOperationsController.stopPipeline.bind(pipelineOperationsController));

export default router; 