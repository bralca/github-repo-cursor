/**
 * Pipeline Notification Routes
 * 
 * This module defines the API routes for pipeline notifications.
 */

import express from 'express';
import pipelineNotificationController from '../controllers/pipeline-notification-controller.js';
import { authenticate } from '../middleware/auth-middleware.js';

// Create a router
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Notification routes
router.get('/notifications', pipelineNotificationController.getNotifications.bind(pipelineNotificationController));
router.post('/notifications/mark-read', pipelineNotificationController.markNotificationsAsRead.bind(pipelineNotificationController));

// Notification settings routes
router.get('/settings', pipelineNotificationController.getNotificationSettings.bind(pipelineNotificationController));
router.post('/settings', pipelineNotificationController.createNotificationSettings.bind(pipelineNotificationController));
router.put('/settings/:setting_id', pipelineNotificationController.updateNotificationSettings.bind(pipelineNotificationController));
router.delete('/settings/:setting_id', pipelineNotificationController.deleteNotificationSettings.bind(pipelineNotificationController));

export default router; 