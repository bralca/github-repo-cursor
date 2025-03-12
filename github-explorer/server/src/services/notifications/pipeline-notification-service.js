/**
 * Pipeline Notification Service
 * 
 * This service handles notifications for pipeline events such as
 * schedule creations, pipeline runs, errors, and completions.
 */

import { logger } from '../../utils/logger.js';
import { supabaseClientFactory } from '../supabase/supabase-client.js';
import schedulerService from '../scheduler/scheduler-service.js';

/**
 * Pipeline notification service class
 */
export class PipelineNotificationService {
  /**
   * Create a new notification service
   */
  constructor() {
    this.supabase = supabaseClientFactory.getClient();
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
      // Get notification settings
      const { data: settings, error } = await this.supabase
        .from('notification_settings')
        .select('*')
        .eq('is_active', true)
        .eq('level', 'error')
        .single();
      
      if (error || !settings) {
        logger.debug('No notification settings found for critical errors');
        return;
      }
      
      // Send email notifications if configured
      if (settings.email_enabled && settings.email_recipients) {
        const recipients = Array.isArray(settings.email_recipients) 
          ? settings.email_recipients 
          : settings.email_recipients.split(',');
        
        for (const recipient of recipients) {
          await this.sendEmail({
            to: recipient.trim(),
            subject: notification.title,
            message: `${notification.message}\n\nError: ${notification.details.error}`,
            details: notification.details
          });
        }
      }
      
      // Send webhook notifications if configured
      if (settings.webhook_enabled && settings.webhook_url) {
        await this.sendWebhook({
          url: settings.webhook_url,
          payload: {
            type: notification.type,
            title: notification.title,
            message: notification.message,
            details: notification.details,
            level: notification.level,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      logger.error('Error sending critical error notifications', { error });
    }
  }
  
  /**
   * Store a notification in the database
   * @param {Object} notification - Notification to store
   * @returns {Promise<Object>} Created notification
   */
  async storeNotification(notification) {
    try {
      const { type, title, message, details, level = 'info' } = notification;
      
      // Ensure details is converted to JSON string
      const detailsJson = typeof details === 'string' ? details : JSON.stringify(details);
      
      // Insert notification into database
      const { data, error } = await this.supabase
        .from('pipeline_notifications')
        .insert({
          type,
          title,
          message,
          details: detailsJson,
          level,
          created_at: new Date().toISOString(),
          is_read: false
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      logger.debug(`Stored notification: ${title}`);
      
      return data;
    } catch (error) {
      logger.error('Error storing notification', { error });
      throw error;
    }
  }
  
  /**
   * Get notifications with pagination
   * @param {Object} options - Query options
   * @param {number} [options.limit=20] - Number of notifications to return
   * @param {number} [options.offset=0] - Offset for pagination
   * @param {string} [options.type] - Filter by notification type
   * @param {string} [options.level] - Filter by notification level
   * @param {boolean} [options.unreadOnly] - Filter to unread notifications only
   * @returns {Promise<Object>} Notifications and count
   */
  async getNotifications(options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        type,
        level,
        unreadOnly
      } = options;
      
      // Build query
      let query = this.supabase
        .from('pipeline_notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      // Apply filters
      if (type) {
        query = query.eq('type', type);
      }
      
      if (level) {
        query = query.eq('level', level);
      }
      
      if (unreadOnly) {
        query = query.eq('is_read', false);
      }
      
      // Execute query
      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      return {
        notifications: data || [],
        count: count || 0,
        limit,
        offset
      };
    } catch (error) {
      logger.error('Error getting notifications', { error });
      throw error;
    }
  }
  
  /**
   * Send an email notification
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.message - Email message
   * @param {Object} options.details - Additional details
   * @returns {Promise<void>}
   */
  async sendEmail(options) {
    try {
      const { to, subject, message, details } = options;
      
      logger.info(`Sending email notification to ${to}: ${subject}`);
      
      // In a real implementation, this would send an actual email
      // For now, we'll just log it
      logger.debug('Email notification content', {
        to,
        subject,
        message,
        details
      });
      
      // TODO: Implement actual email sending (using nodemailer or similar)
    } catch (error) {
      logger.error('Error sending email notification', { error });
    }
  }
  
  /**
   * Send a webhook notification
   * @param {Object} options - Webhook options
   * @param {string} options.url - Webhook URL
   * @param {Object} options.payload - Webhook payload
   * @returns {Promise<void>}
   */
  async sendWebhook(options) {
    try {
      const { url, payload } = options;
      
      logger.info(`Sending webhook notification to ${url}`);
      
      // In a real implementation, this would send an actual HTTP request
      // For now, we'll just log it
      logger.debug('Webhook notification content', {
        url,
        payload
      });
      
      // TODO: Implement actual webhook sending (using fetch or similar)
    } catch (error) {
      logger.error('Error sending webhook notification', { error });
    }
  }
}

// Create singleton instance
const pipelineNotificationService = new PipelineNotificationService();

export default pipelineNotificationService; 