/**
 * Pipeline Notification Service
 * 
 * This service handles notifications for pipeline events such as
 * schedule creations, pipeline runs, errors, and completions.
 */

import { logger } from '../../utils/logger.js';
import schedulerService from '../scheduler/scheduler-service.js';

/**
 * Pipeline notification service class
 */
export class PipelineNotificationService {
  /**
   * Create a new notification service
   */
  constructor() {
    // Use in-memory storage instead of Supabase
    this.notifications = [];
    this.initializeEventListeners();
    
    // Bind methods
    this.handleScheduleCreated = this.handleScheduleCreated.bind(this);
    this.handleScheduleUpdated = this.handleScheduleUpdated.bind(this);
    this.handleScheduleDeleted = this.handleScheduleDeleted.bind(this);
    this.handleScheduleExecuting = this.handleScheduleExecuting.bind(this);
    this.handleScheduleCompleted = this.handleScheduleCompleted.bind(this);
    this.handleScheduleFailed = this.handleScheduleFailed.bind(this);
    this.storeNotification = this.storeNotification.bind(this);
    this.getNotifications = this.getNotifications.bind(this);
    this.sendEmail = this.sendEmail.bind(this);
    this.sendWebhook = this.sendWebhook.bind(this);
  }
  
  /**
   * Initialize event listeners for scheduler events
   * @returns {void}
   */
  initializeEventListeners() {
    // Register event listeners
    schedulerService.on('schedule:created', this.handleScheduleCreated);
    schedulerService.on('schedule:updated', this.handleScheduleUpdated);
    schedulerService.on('schedule:deleted', this.handleScheduleDeleted);
    schedulerService.on('schedule:executing', this.handleScheduleExecuting);
    schedulerService.on('schedule:completed', this.handleScheduleCompleted);
    schedulerService.on('schedule:failed', this.handleScheduleFailed);
    
    logger.info('Pipeline notification service initialized');
  }
  
  /**
   * Handle schedule created event
   * @param {Object} schedule - Schedule that was created
   * @returns {Promise<void>}
   */
  async handleScheduleCreated(schedule) {
    try {
      const notification = {
        type: 'schedule.created',
        title: 'Pipeline Schedule Created',
        message: `Schedule "${schedule.name}" for pipeline "${schedule.pipelineType}" has been created`,
        details: {
          schedule_id: schedule.id,
          pipeline_type: schedule.pipelineType,
          cron_expression: schedule.cronExpression,
          next_run_at: schedule.nextRunAt
        },
        level: 'info'
      };
      
      await this.storeNotification(notification);
    } catch (error) {
      logger.error('Error handling schedule created event', { error });
    }
  }
  
  /**
   * Handle schedule updated event
   * @param {Object} schedule - Schedule that was updated
   * @returns {Promise<void>}
   */
  async handleScheduleUpdated(schedule) {
    try {
      const notification = {
        type: 'schedule.updated',
        title: 'Pipeline Schedule Updated',
        message: `Schedule "${schedule.name}" for pipeline "${schedule.pipelineType}" has been updated`,
        details: {
          schedule_id: schedule.id,
          pipeline_type: schedule.pipelineType,
          cron_expression: schedule.cronExpression,
          next_run_at: schedule.nextRunAt,
          is_active: schedule.isActive
        },
        level: 'info'
      };
      
      await this.storeNotification(notification);
    } catch (error) {
      logger.error('Error handling schedule updated event', { error });
    }
  }
  
  /**
   * Handle schedule deleted event
   * @param {Object} data - Schedule ID that was deleted
   * @returns {Promise<void>}
   */
  async handleScheduleDeleted(data) {
    try {
      const notification = {
        type: 'schedule.deleted',
        title: 'Pipeline Schedule Deleted',
        message: `Schedule with ID "${data.id}" has been deleted`,
        details: {
          schedule_id: data.id
        },
        level: 'info'
      };
      
      await this.storeNotification(notification);
    } catch (error) {
      logger.error('Error handling schedule deleted event', { error });
    }
  }
  
  /**
   * Handle schedule executing event
   * @param {Object} schedule - Schedule that is executing
   * @returns {Promise<void>}
   */
  async handleScheduleExecuting(schedule) {
    try {
      const notification = {
        type: 'pipeline.executing',
        title: 'Pipeline Execution Started',
        message: `Pipeline "${schedule.pipelineType}" execution started from schedule "${schedule.name}"`,
        details: {
          schedule_id: schedule.id,
          pipeline_type: schedule.pipelineType,
          triggered_at: schedule.lastRunAt
        },
        level: 'info'
      };
      
      await this.storeNotification(notification);
    } catch (error) {
      logger.error('Error handling schedule executing event', { error });
    }
  }
  
  /**
   * Handle schedule completed event
   * @param {Object} schedule - Schedule that completed
   * @returns {Promise<void>}
   */
  async handleScheduleCompleted(schedule) {
    try {
      const notification = {
        type: 'pipeline.completed',
        title: 'Pipeline Execution Completed',
        message: `Pipeline "${schedule.pipelineType}" execution completed successfully from schedule "${schedule.name}"`,
        details: {
          schedule_id: schedule.id,
          pipeline_type: schedule.pipelineType,
          completed_at: new Date().toISOString(),
          result: schedule.lastResult
        },
        level: 'success'
      };
      
      await this.storeNotification(notification);
    } catch (error) {
      logger.error('Error handling schedule completed event', { error });
    }
  }
  
  /**
   * Handle schedule failed event
   * @param {Object} schedule - Schedule that failed
   * @returns {Promise<void>}
   */
  async handleScheduleFailed(schedule) {
    try {
      const notification = {
        type: 'pipeline.failed',
        title: 'Pipeline Execution Failed',
        message: `Pipeline "${schedule.pipelineType}" execution failed from schedule "${schedule.name}"`,
        details: {
          schedule_id: schedule.id,
          pipeline_type: schedule.pipelineType,
          failed_at: new Date().toISOString(),
          error: schedule.lastResult?.error
        },
        level: 'error'
      };
      
      await this.storeNotification(notification);
      
      // For critical errors, send additional notifications
      await this.sendCriticalErrorNotifications(notification);
    } catch (error) {
      logger.error('Error handling schedule failed event', { error });
    }
  }
  
  /**
   * Send notifications for critical errors
   * @param {Object} notification - Notification object
   * @returns {Promise<void>}
   */
  async sendCriticalErrorNotifications(notification) {
    try {
      // Log the error but don't attempt to send notifications
      // since we no longer have access to notification settings
      logger.error('Critical pipeline error', { 
        title: notification.title,
        message: notification.message, 
        details: notification.details 
      });
      
      // In a production app, you might implement email/webhook sending here
      // based on environment variables instead of database settings
    } catch (error) {
      logger.error('Error sending critical error notifications', { error });
    }
  }
  
  /**
   * Store notification in memory
   * @param {Object} notification - Notification to store
   * @returns {Promise<Object>} Stored notification
   */
  async storeNotification(notification) {
    try {
      // Generate an ID for the notification
      const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Add metadata
      const notificationWithMetadata = {
        id,
        ...notification,
        created_at: new Date().toISOString(),
        is_read: false
      };
      
      // Store in memory
      this.notifications.unshift(notificationWithMetadata);
      
      // Only keep the most recent 100 notifications
      if (this.notifications.length > 100) {
        this.notifications = this.notifications.slice(0, 100);
      }
      
      logger.debug('Notification stored', { id, type: notification.type });
      
      return notificationWithMetadata;
    } catch (error) {
      logger.error('Error storing notification', { error });
      throw error;
    }
  }
  
  /**
   * Get notifications with filtering and pagination
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Array>} Notifications
   */
  async getNotifications(options = {}) {
    try {
      const { limit = 20, offset = 0, type, level, is_read } = options;
      
      // Filter notifications
      let filteredNotifications = [...this.notifications];
      
      if (type) {
        filteredNotifications = filteredNotifications.filter(n => n.type === type);
      }
      
      if (level) {
        filteredNotifications = filteredNotifications.filter(n => n.level === level);
      }
      
      if (is_read !== undefined) {
        filteredNotifications = filteredNotifications.filter(n => n.is_read === is_read);
      }
      
      // Apply pagination
      const paginatedNotifications = filteredNotifications.slice(offset, offset + limit);
      
      return {
        data: paginatedNotifications,
        count: filteredNotifications.length,
        limit,
        offset
      };
    } catch (error) {
      logger.error('Error getting notifications', { error });
      throw error;
    }
  }
  
  /**
   * Mark notification as read
   * @param {string} id - Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  async markNotificationAsRead(id) {
    try {
      const notification = this.notifications.find(n => n.id === id);
      
      if (!notification) {
        throw new Error(`Notification with ID ${id} not found`);
      }
      
      notification.is_read = true;
      
      return notification;
    } catch (error) {
      logger.error('Error marking notification as read', { error });
      throw error;
    }
  }
  
  /**
   * Send email notification (mock implementation)
   * @param {Object} options - Email options
   * @returns {Promise<void>}
   */
  async sendEmail(options) {
    logger.info(`[MOCK] Email notification would be sent to ${options.to}`, { 
      subject: options.subject,
      message: options.message
    });
    
    // In a real implementation, you would integrate with an email service here
  }
  
  /**
   * Send webhook notification (mock implementation)
   * @param {Object} options - Webhook options
   * @returns {Promise<void>}
   */
  async sendWebhook(options) {
    logger.info(`[MOCK] Webhook notification would be sent to ${options.url}`, { 
      payload: options.payload
    });
    
    // In a real implementation, you would make an HTTP request to the webhook URL
  }
}

// Singleton instance
const pipelineNotificationService = new PipelineNotificationService();

export default pipelineNotificationService; 