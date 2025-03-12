/**
 * Pipeline Notification Controller
 * 
 * Handles API requests for pipeline notifications.
 */

import { BaseController } from './base-controller.js';
import pipelineNotificationService from '../services/notifications/pipeline-notification-service.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for pipeline notification operations
 * @extends BaseController
 */
export class PipelineNotificationController extends BaseController {
  /**
   * Get notifications with pagination and filtering
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async getNotifications(req, res) {
    try {
      const {
        limit = 20,
        offset = 0,
        type,
        level,
        unread_only
      } = req.query;
      
      const options = {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        type,
        level,
        unreadOnly: unread_only === 'true'
      };
      
      const result = await pipelineNotificationService.getNotifications(options);
      
      return this.sendSuccess(res, result);
    } catch (error) {
      logger.error('Error getting notifications', { error });
      return this.sendError(res, 'Error getting notifications', error);
    }
  }
  
  /**
   * Mark notifications as read
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async markNotificationsAsRead(req, res) {
    try {
      const { notification_ids } = req.body;
      
      if (!notification_ids || !Array.isArray(notification_ids) || notification_ids.length === 0) {
        return this.sendBadRequest(res, 'Notification IDs are required');
      }
      
      // Update notification read status in database
      const { error } = await this.supabase
        .from('pipeline_notifications')
        .update({ is_read: true })
        .in('id', notification_ids);
      
      if (error) {
        throw error;
      }
      
      return this.sendSuccess(res, {
        message: `Marked ${notification_ids.length} notifications as read`,
        notification_ids
      });
    } catch (error) {
      logger.error('Error marking notifications as read', { error });
      return this.sendError(res, 'Error marking notifications as read', error);
    }
  }
  
  /**
   * Get notification settings
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async getNotificationSettings(req, res) {
    try {
      // Get notification settings from database
      const { data, error } = await this.supabase
        .from('notification_settings')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      return this.sendSuccess(res, {
        settings: data || [],
        count: data?.length || 0
      });
    } catch (error) {
      logger.error('Error getting notification settings', { error });
      return this.sendError(res, 'Error getting notification settings', error);
    }
  }
  
  /**
   * Update notification settings
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async updateNotificationSettings(req, res) {
    try {
      const { setting_id } = req.params;
      
      if (!setting_id) {
        return this.sendBadRequest(res, 'Setting ID is required');
      }
      
      const {
        level,
        email_enabled,
        email_recipients,
        webhook_enabled,
        webhook_url,
        is_active
      } = req.body;
      
      // Create updates object
      const updates = {
        level,
        email_enabled,
        email_recipients,
        webhook_enabled,
        webhook_url,
        is_active,
        updated_at: new Date().toISOString()
      };
      
      // Remove undefined fields
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });
      
      // Ensure at least one field is being updated
      if (Object.keys(updates).length === 0) {
        return this.sendBadRequest(res, 'No updates provided');
      }
      
      // Update settings in database
      const { data, error } = await this.supabase
        .from('notification_settings')
        .update(updates)
        .eq('id', setting_id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return this.sendSuccess(res, {
        setting: data,
        message: 'Notification settings updated successfully'
      });
    } catch (error) {
      logger.error('Error updating notification settings', { error });
      return this.sendError(res, 'Error updating notification settings', error);
    }
  }
  
  /**
   * Create notification settings
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async createNotificationSettings(req, res) {
    try {
      const {
        level,
        email_enabled,
        email_recipients,
        webhook_enabled,
        webhook_url,
        is_active = true
      } = req.body;
      
      // Validate required fields
      if (!level) {
        return this.sendBadRequest(res, 'Notification level is required');
      }
      
      // Create settings object
      const settings = {
        level,
        email_enabled: email_enabled || false,
        email_recipients: email_recipients || null,
        webhook_enabled: webhook_enabled || false,
        webhook_url: webhook_url || null,
        is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Create settings in database
      const { data, error } = await this.supabase
        .from('notification_settings')
        .insert(settings)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return this.sendCreated(res, {
        setting: data,
        message: 'Notification settings created successfully'
      });
    } catch (error) {
      logger.error('Error creating notification settings', { error });
      return this.sendError(res, 'Error creating notification settings', error);
    }
  }
  
  /**
   * Delete notification settings
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async deleteNotificationSettings(req, res) {
    try {
      const { setting_id } = req.params;
      
      if (!setting_id) {
        return this.sendBadRequest(res, 'Setting ID is required');
      }
      
      // Delete settings from database
      const { error } = await this.supabase
        .from('notification_settings')
        .delete()
        .eq('id', setting_id);
      
      if (error) {
        throw error;
      }
      
      return this.sendSuccess(res, {
        message: 'Notification settings deleted successfully',
        id: setting_id
      });
    } catch (error) {
      logger.error('Error deleting notification settings', { error });
      return this.sendError(res, 'Error deleting notification settings', error);
    }
  }
}

// Create singleton instance
const pipelineNotificationController = new PipelineNotificationController();

export default pipelineNotificationController; 