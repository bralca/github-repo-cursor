/**
 * Pipeline Scheduler Controller
 * 
 * Handles API requests for scheduling and controlling pipeline executions.
 */

import { BaseController } from './base-controller.js';
import schedulerService from '../services/scheduler/scheduler-service.js';
import { pipelineFactory } from '../pipeline/core/pipeline-factory.js';
import { logger } from '../utils/logger.js';

/**
 * Controller for pipeline scheduling operations
 * @extends BaseController
 */
export class PipelineSchedulerController extends BaseController {
  /**
   * Create a new pipeline scheduler controller
   */
  constructor() {
    super();
    
    // Initialize scheduler service when controller is created
    schedulerService.initializeFromDatabase().catch(error => {
      logger.error('Error initializing scheduler service', { error });
    });
  }
  
  /**
   * Get all pipeline schedules
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async getSchedules(req, res) {
    try {
      const { pipeline_type } = req.query;
      
      const schedules = schedulerService.getSchedules(pipeline_type);
      
      return this.sendSuccess(res, {
        schedules,
        count: schedules.length
      });
    } catch (error) {
      logger.error('Error getting schedules', { error });
      return this.sendError(res, 'Error getting schedules', error);
    }
  }
  
  /**
   * Get a specific schedule by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async getScheduleById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return this.sendBadRequest(res, 'Schedule ID is required');
      }
      
      const schedule = schedulerService.getScheduleById(id);
      
      if (!schedule) {
        return this.sendNotFound(res, `Schedule not found: ${id}`);
      }
      
      return this.sendSuccess(res, { schedule });
    } catch (error) {
      logger.error('Error getting schedule', { error });
      return this.sendError(res, 'Error getting schedule', error);
    }
  }
  
  /**
   * Create a new pipeline schedule
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async createSchedule(req, res) {
    try {
      const {
        name,
        pipeline_type,
        cron_expression,
        configuration_id,
        time_zone,
        is_active
      } = req.body;
      
      // Validate required fields
      if (!name) {
        return this.sendBadRequest(res, 'Schedule name is required');
      }
      
      if (!pipeline_type) {
        return this.sendBadRequest(res, 'Pipeline type is required');
      }
      
      if (!cron_expression) {
        return this.sendBadRequest(res, 'Cron expression is required');
      }
      
      // Create schedule
      const schedule = await schedulerService.scheduleJob({
        name,
        pipelineType: pipeline_type,
        cronExpression: cron_expression,
        configurationId: configuration_id,
        timeZone: time_zone,
        isActive: is_active !== undefined ? is_active : true
      });
      
      return this.sendCreated(res, { schedule });
    } catch (error) {
      logger.error('Error creating schedule', { error });
      
      if (error.message.includes('Invalid cron expression')) {
        return this.sendBadRequest(res, error.message);
      }
      
      if (error.message.includes('Pipeline type not found')) {
        return this.sendBadRequest(res, error.message);
      }
      
      return this.sendError(res, 'Error creating schedule', error);
    }
  }
  
  /**
   * Update an existing pipeline schedule
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async updateSchedule(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return this.sendBadRequest(res, 'Schedule ID is required');
      }
      
      const {
        name,
        cron_expression,
        configuration_id,
        time_zone,
        is_active
      } = req.body;
      
      // Map request fields to scheduler service fields
      const updates = {
        name,
        cronExpression: cron_expression,
        configurationId: configuration_id,
        timeZone: time_zone,
        isActive: is_active
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
      
      // Update schedule
      const schedule = await schedulerService.updateSchedule(id, updates);
      
      return this.sendSuccess(res, { schedule });
    } catch (error) {
      logger.error('Error updating schedule', { error });
      
      if (error.message.includes('Schedule not found')) {
        return this.sendNotFound(res, error.message);
      }
      
      if (error.message.includes('Invalid cron expression')) {
        return this.sendBadRequest(res, error.message);
      }
      
      return this.sendError(res, 'Error updating schedule', error);
    }
  }
  
  /**
   * Delete a pipeline schedule
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async deleteSchedule(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return this.sendBadRequest(res, 'Schedule ID is required');
      }
      
      const result = await schedulerService.deleteSchedule(id);
      
      if (!result) {
        return this.sendNotFound(res, `Schedule not found: ${id}`);
      }
      
      return this.sendSuccess(res, { 
        message: `Schedule deleted: ${id}`,
        success: true
      });
    } catch (error) {
      logger.error('Error deleting schedule', { error });
      return this.sendError(res, 'Error deleting schedule', error);
    }
  }
  
  /**
   * Trigger a pipeline schedule immediately
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async triggerSchedule(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return this.sendBadRequest(res, 'Schedule ID is required');
      }
      
      const result = await schedulerService.triggerJob(id);
      
      return this.sendSuccess(res, result);
    } catch (error) {
      logger.error('Error triggering schedule', { error });
      
      if (error.message.includes('Schedule not found')) {
        return this.sendNotFound(res, error.message);
      }
      
      return this.sendError(res, 'Error triggering schedule', error);
    }
  }
  
  /**
   * Get all available pipeline types
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async getPipelineTypes(req, res) {
    try {
      const pipelineDefinitions = pipelineFactory.getAllPipelineDefinitions();
      
      const pipelineTypes = Object.entries(pipelineDefinitions).map(([id, definition]) => ({
        id,
        name: definition.name,
        description: definition.description,
        stages: definition.stages
      }));
      
      return this.sendSuccess(res, {
        pipeline_types: pipelineTypes,
        count: pipelineTypes.length
      });
    } catch (error) {
      logger.error('Error getting pipeline types', { error });
      return this.sendError(res, 'Error getting pipeline types', error);
    }
  }
  
  /**
   * Get pipeline execution history
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async getPipelineHistory(req, res) {
    try {
      const { pipeline_type, limit = 10, offset = 0 } = req.query;
      
      // Load history from pipeline_runs table in database
      const query = this.supabase
        .from('pipeline_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      // Filter by pipeline type if specified
      if (pipeline_type) {
        query.eq('pipeline_type', pipeline_type);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      return this.sendSuccess(res, {
        runs: data || [],
        count: count || 0,
        offset: Number(offset),
        limit: Number(limit)
      });
    } catch (error) {
      logger.error('Error getting pipeline history', { error });
      return this.sendError(res, 'Error getting pipeline history', error);
    }
  }
  
  /**
   * Execute a pipeline directly (without scheduling)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async executePipeline(req, res) {
    try {
      const { pipeline_type, configuration } = req.body;
      
      if (!pipeline_type) {
        return this.sendBadRequest(res, 'Pipeline type is required');
      }
      
      // Validate that the pipeline type exists
      const pipelineDefinition = pipelineFactory.getPipelineDefinition(pipeline_type);
      if (!pipelineDefinition) {
        return this.sendBadRequest(res, `Pipeline type not found: ${pipeline_type}`);
      }
      
      // Send immediate response to avoid timeout
      this.sendAccepted(res, { 
        message: `Pipeline execution started: ${pipeline_type}`,
        pipeline_type,
        started_at: new Date().toISOString()
      });
      
      // Execute pipeline in background
      try {
        const pipeline = pipelineFactory.createPipeline(pipeline_type);
        await pipeline.run({}, configuration || {});
        
        logger.info(`Pipeline executed successfully: ${pipeline_type}`);
      } catch (error) {
        logger.error(`Error executing pipeline: ${pipeline_type}`, { error });
      }
    } catch (error) {
      logger.error('Error executing pipeline', { error });
      return this.sendError(res, 'Error executing pipeline', error);
    }
  }
}

// Create singleton instance
const pipelineSchedulerController = new PipelineSchedulerController();

export default pipelineSchedulerController; 