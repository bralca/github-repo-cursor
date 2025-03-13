/**
 * Pipeline Scheduler Routes
 * 
 * This module defines the API routes for pipeline scheduling and control operations.
 */

import express from 'express';
import pipelineSchedulerController from '../controllers/pipeline-scheduler-controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Create a router
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get pipeline types and configurations
router.get('/types', pipelineSchedulerController.getPipelineTypes.bind(pipelineSchedulerController));

// Schedule management routes
router.get('/schedules', pipelineSchedulerController.getSchedules.bind(pipelineSchedulerController));
router.post('/schedules', pipelineSchedulerController.createSchedule.bind(pipelineSchedulerController));
router.get('/schedules/:id', pipelineSchedulerController.getScheduleById.bind(pipelineSchedulerController));
router.put('/schedules/:id', pipelineSchedulerController.updateSchedule.bind(pipelineSchedulerController));
router.delete('/schedules/:id', pipelineSchedulerController.deleteSchedule.bind(pipelineSchedulerController));
router.post('/schedules/:id/trigger', pipelineSchedulerController.triggerSchedule.bind(pipelineSchedulerController));

// Pipeline execution history
router.get('/history', pipelineSchedulerController.getPipelineHistory.bind(pipelineSchedulerController));

// Direct pipeline execution
router.post('/execute', pipelineSchedulerController.executePipeline.bind(pipelineSchedulerController));

export default router; 