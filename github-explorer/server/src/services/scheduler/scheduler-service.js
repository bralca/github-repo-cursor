/**
 * Pipeline Scheduler Service
 * 
 * This service manages pipeline scheduling using node-schedule.
 * It provides functionality to schedule, update, and trigger pipeline jobs.
 * 
 * Note: This is currently a memory-only implementation that doesn't persist schedules to a database.
 */

import nodeSchedule from 'node-schedule';
import { v4 as uuidv4 } from 'uuid';
import { pipelineFactory } from '../../pipeline/core/pipeline-factory.js';
import { logger } from '../../utils/logger.js';
import EventEmitter from 'events';

/**
 * Pipeline scheduler service
 * @extends EventEmitter
 */
export class SchedulerService extends EventEmitter {
  /**
   * Create a new scheduler service
   */
  constructor() {
    super();
    this.schedules = new Map();
    this.jobs = new Map();
    
    logger.info('Pipeline scheduler service initialized (memory-only implementation)');
  }
  
  /**
   * Check if the database is available
   * @returns {Promise<boolean>} Whether the database is available
   */
  async checkDatabaseAvailability() {
    // For now, we're not using a database
    logger.info('Database availability check skipped (using memory-only implementation)');
    return true;
  }
  
  /**
   * Initialize schedules from database
   * @returns {Promise<void>}
   */
  async initializeFromDatabase() {
    logger.info('Database initialization skipped (using memory-only implementation)');
    // No database initialization needed in memory-only mode
    return;
  }
  
  /**
   * Create or update a schedule
   * @param {Object} options - Schedule options
   * @param {string} options.name - Schedule name
   * @param {string} options.pipelineType - Pipeline type to execute
   * @param {string} options.cronExpression - Cron expression for scheduling
   * @param {string} [options.configurationId] - Pipeline configuration ID
   * @param {string} [options.timeZone='UTC'] - Timezone for the schedule
   * @param {boolean} [options.isActive=true] - Whether the schedule is active
   * @returns {Promise<Object>} Created or updated schedule
   */
  async scheduleJob(options) {
    try {
      const {
        name,
        pipelineType,
        cronExpression,
        configurationId,
        timeZone = 'UTC',
        isActive = true
      } = options;
      
      // Validate pipeline type
      if (!pipelineFactory.getPipelineConfig(pipelineType)) {
        throw new Error(`Pipeline type not found: ${pipelineType}`);
      }
      
      // Validate cron expression
      if (!this.validateCronExpression(cronExpression)) {
        throw new Error(`Invalid cron expression: ${cronExpression}`);
      }
      
      // Calculate next run time
      const nextRunAt = this.calculateNextRunTime(cronExpression, timeZone);
      
      // Create schedule object
      const schedule = {
        id: uuidv4(),
        name,
        pipelineType,
        cronExpression,
        configurationId,
        timeZone,
        isActive,
        createdAt: new Date().toISOString(),
        nextRunAt: nextRunAt.toISOString()
      };
      
      // Add to schedules map
      this.schedules.set(schedule.id, schedule);
      
      // Log schedule persistence (would normally save to database)
      logger.info(`[MEMORY] Persisting schedule to memory: ${schedule.name}`, {
        schedule_id: schedule.id
      });
      
      // If active, create the schedule job
      if (isActive) {
        this._createScheduleJob(schedule);
      }
      
      // Emit schedule created event
      this.emit('schedule:created', schedule);
      
      logger.info(`Pipeline schedule created: ${schedule.name}`, {
        schedule_id: schedule.id,
        pipeline_type: schedule.pipelineType,
        cron_expression: schedule.cronExpression
      });
      
      return schedule;
    } catch (error) {
      logger.error('Failed to create pipeline schedule', { error });
      throw error;
    }
  }
  
  /**
   * Execute a scheduled job
   * @param {Object} schedule - Schedule to execute
   * @returns {Promise<Object>} Result of job execution
   */
  async executeJob(schedule) {
    try {
      logger.info(`Executing scheduled pipeline: ${schedule.name}`, {
        schedule_id: schedule.id,
        pipeline_type: schedule.pipelineType
      });
      
      // Update last run time
      const lastRunAt = new Date().toISOString();
      const updatedSchedule = this.schedules.get(schedule.id);
      if (updatedSchedule) {
        updatedSchedule.lastRunAt = lastRunAt;
      }
      
      // Emit schedule executing event
      this.emit('schedule:executing', { ...schedule, lastRunAt });
      
      // Log the update (would normally update database)
      logger.info(`[MEMORY] Updated last run time for schedule: ${schedule.id}`);
      
      // Get pipeline configuration if we have a configuration ID
      let pipelineConfig = {};
      
      if (schedule.configurationId) {
        logger.info(`Using configuration ID: ${schedule.configurationId} (would fetch from database)`);
      }
      
      // Create and execute the pipeline
      const pipeline = pipelineFactory.createPipeline(schedule.pipelineType, pipelineConfig);
      
      // Execute the pipeline
      const result = await pipeline.execute();
      
      // Update last result in memory
      if (updatedSchedule) {
        updatedSchedule.lastResult = {
          status: result.status,
          error: result.error,
          timestamp: new Date().toISOString()
        };
      }
      
      // Log the update (would normally update database)
      logger.info(`[MEMORY] Updated last result for schedule: ${schedule.id}`);
      
      // Emit completion event
      this.emit('schedule:executed', {
        schedule: { ...schedule, lastRunAt },
        result
      });
      
      logger.info(`Pipeline execution complete: ${schedule.name}`, {
        schedule_id: schedule.id,
        status: result.status
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to execute pipeline: ${schedule.name}`, { error });
      
      // Emit error event
      this.emit('schedule:error', {
        schedule,
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Update an existing schedule
   * @param {string} scheduleId - ID of schedule to update
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated schedule
   */
  async updateSchedule(scheduleId, updates) {
    try {
      // Check if schedule exists
      if (!this.schedules.has(scheduleId)) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }
      
      const schedule = this.schedules.get(scheduleId);
      const originalIsActive = schedule.isActive;
      
      // Apply updates
      Object.keys(updates).forEach(key => {
        // Special handling for specific fields
        if (key === 'cronExpression' && updates.cronExpression) {
          if (!this.validateCronExpression(updates.cronExpression)) {
            throw new Error(`Invalid cron expression: ${updates.cronExpression}`);
          }
          schedule.cronExpression = updates.cronExpression;
          
          // Recalculate next run time if cron expression changes
          schedule.nextRunAt = this.calculateNextRunTime(
            schedule.cronExpression, 
            schedule.timeZone
          ).toISOString();
        } 
        else if (key === 'timeZone' && updates.timeZone) {
          schedule.timeZone = updates.timeZone;
          
          // Recalculate next run time if timezone changes
          schedule.nextRunAt = this.calculateNextRunTime(
            schedule.cronExpression, 
            schedule.timeZone
          ).toISOString();
        }
        else if (key in schedule) {
          schedule[key] = updates[key];
        }
      });
      
      // Update the schedule in memory
      this.schedules.set(scheduleId, schedule);
      
      // Log the update (would normally update database)
      logger.info(`[MEMORY] Updated schedule in memory: ${schedule.name}`, {
        schedule_id: schedule.id
      });
      
      // Handle job scheduling based on active status
      if (schedule.isActive !== originalIsActive) {
        if (schedule.isActive) {
          // If newly activated, create job
          this._createScheduleJob(schedule);
        } else {
          // If newly deactivated, cancel job
          this._cancelJob(scheduleId);
        }
      } 
      // If still active but cron or timezone changed, recreate the job
      else if (schedule.isActive && 
              (updates.cronExpression || updates.timeZone)) {
        this._cancelJob(scheduleId);
        this._createScheduleJob(schedule);
      }
      
      // Emit schedule updated event
      this.emit('schedule:updated', schedule);
      
      logger.info(`Pipeline schedule updated: ${schedule.name}`, {
        schedule_id: schedule.id
      });
      
      return schedule;
    } catch (error) {
      logger.error(`Failed to update schedule: ${scheduleId}`, { error });
      throw error;
    }
  }
  
  /**
   * Delete a schedule
   * @param {string} scheduleId - ID of schedule to delete
   * @returns {Promise<boolean>} Whether delete was successful
   */
  async deleteSchedule(scheduleId) {
    try {
      // Check if schedule exists
      if (!this.schedules.has(scheduleId)) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }
      
      const schedule = this.schedules.get(scheduleId);
      
      // Cancel any active job
      this._cancelJob(scheduleId);
      
      // Remove from schedules map
      this.schedules.delete(scheduleId);
      
      // Log the delete (would normally delete from database)
      logger.info(`[MEMORY] Deleted schedule from memory: ${schedule.name}`, {
        schedule_id: schedule.id
      });
      
      // Emit schedule deleted event
      this.emit('schedule:deleted', { id: scheduleId });
      
      logger.info(`Pipeline schedule deleted: ${schedule.name}`, {
        schedule_id: schedule.id
      });
      
      return true;
    } catch (error) {
      logger.error(`Failed to delete schedule: ${scheduleId}`, { error });
      throw error;
    }
  }
  
  /**
   * Get all schedules, optionally filtered by pipeline type
   * @param {string} [pipelineType] - Pipeline type to filter by
   * @returns {Array<Object>} Array of schedules
   */
  getSchedules(pipelineType) {
    const schedules = Array.from(this.schedules.values());
    
    if (pipelineType) {
      return schedules.filter(s => s.pipelineType === pipelineType);
    }
    
    return schedules;
  }
  
  /**
   * Get a schedule by ID
   * @param {string} scheduleId - ID of schedule to get
   * @returns {Object|null} Schedule or null if not found
   */
  getScheduleById(scheduleId) {
    return this.schedules.get(scheduleId) || null;
  }
  
  /**
   * Trigger a job immediately
   * @param {string} scheduleId - ID of schedule to trigger
   * @returns {Promise<Object>} Result of job execution
   */
  async triggerJob(scheduleId) {
    try {
      // Check if schedule exists
      if (!this.schedules.has(scheduleId)) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }
      
      const schedule = this.schedules.get(scheduleId);
      
      logger.info(`Manually triggering schedule: ${schedule.name}`, {
        schedule_id: schedule.id
      });
      
      // Execute the job
      return await this.executeJob(schedule);
    } catch (error) {
      logger.error(`Failed to trigger job: ${scheduleId}`, { error });
      throw error;
    }
  }
  
  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener function
   * @returns {EventEmitter} This event emitter
   */
  on(event, listener) {
    super.on(event, listener);
    logger.debug(`Event listener registered for "${event}"`);
    return this;
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener function
   * @returns {EventEmitter} This event emitter
   */
  off(event, listener) {
    super.off(event, listener);
    logger.debug(`Event listener removed for "${event}"`);
    return this;
  }
  
  /**
   * Validate a cron expression
   * @param {string} expression - Cron expression to validate
   * @returns {boolean} Whether expression is valid
   */
  validateCronExpression(expression) {
    try {
      // node-schedule will throw an error if the expression is invalid
      nodeSchedule.scheduleJob(expression, function() {});
      return true;
    } catch (error) {
      logger.error(`Invalid cron expression: ${expression}`, { error });
      return false;
    }
  }
  
  /**
   * Parse a timezone string
   * @param {string} timeZone - Timezone to parse
   * @returns {string} Parsed timezone
   */
  parseTimezone(timeZone) {
    try {
      // Simple validation - if it throws, it's invalid
      new Date().toLocaleString('en-US', { timeZone });
      return timeZone;
    } catch (error) {
      logger.warn(`Invalid timezone: ${timeZone}, falling back to UTC`);
      return 'UTC';
    }
  }
  
  /**
   * Calculate the next run time for a cron expression
   * @param {string} cronExpression - Cron expression
   * @param {string} [timeZone='UTC'] - Timezone for calculation
   * @returns {Date} Next run time
   */
  calculateNextRunTime(cronExpression, timeZone = 'UTC') {
    try {
      // Parse timezone
      const parsedTimeZone = this.parseTimezone(timeZone);
      
      // Calculate next run time
      const currentDate = new Date();
      const nextDate = nodeSchedule.scheduleJob({
        rule: cronExpression,
        tz: parsedTimeZone
      }, function() {}).nextInvocation();
      
      return nextDate || currentDate;
    } catch (error) {
      logger.error('Failed to calculate next run time', { error });
      return new Date();
    }
  }
  
  /**
   * Persist a schedule to memory (stub implementation)
   * @param {Object} schedule - Schedule to persist
   * @returns {Promise<Object>} Persisted schedule
   */
  async persistSchedule(schedule) {
    try {
      logger.info(`[MEMORY] Persisting schedule to memory: ${schedule.name}`, {
        schedule_id: schedule.id
      });
      
      return schedule;
    } catch (error) {
      logger.error(`Failed to persist schedule: ${schedule.name}`, { error });
      throw error;
    }
  }
  
  /**
   * Create a scheduled job
   * @param {Object} schedule - Schedule to create job for
   * @private
   */
  _createScheduleJob(schedule) {
    try {
      // Cancel existing job if it exists
      this._cancelJob(schedule.id);
      
      logger.debug(`Creating scheduled job: ${schedule.name}`, {
        schedule_id: schedule.id,
        cron: schedule.cronExpression,
        timezone: schedule.timeZone
      });
      
      // Create job
      const job = nodeSchedule.scheduleJob({
        rule: schedule.cronExpression,
        tz: this.parseTimezone(schedule.timeZone)
      }, async () => {
        try {
          logger.info(`Scheduled job triggered: ${schedule.name}`, {
            schedule_id: schedule.id
          });
          
          // Execute the job
          await this.executeJob(schedule);
        } catch (error) {
          logger.error(`Error executing scheduled job: ${schedule.name}`, { error });
          // Don't throw - we want the schedule to continue
        }
      });
      
      // Store job reference
      this.jobs.set(schedule.id, job);
      
      // Update next run time in memory
      const nextRun = job.nextInvocation();
      if (nextRun) {
        this.schedules.get(schedule.id).nextRunAt = nextRun.toISOString();
        
        logger.debug(`Next run time: ${nextRun.toISOString()}`, {
          schedule_id: schedule.id
        });
      }
    } catch (error) {
      logger.error(`Failed to create scheduled job: ${schedule.name}`, { error });
      throw error;
    }
  }
  
  /**
   * Cancel a scheduled job
   * @param {string} scheduleId - ID of schedule to cancel job for
   * @private
   */
  _cancelJob(scheduleId) {
    try {
      // Check if job exists
      if (this.jobs.has(scheduleId)) {
        const job = this.jobs.get(scheduleId);
        
        // Cancel job
        job.cancel();
        
        // Remove job reference
        this.jobs.delete(scheduleId);
        
        logger.debug(`Cancelled scheduled job: ${scheduleId}`);
      }
    } catch (error) {
      logger.error(`Failed to cancel scheduled job: ${scheduleId}`, { error });
      // Don't throw - best effort cancellation
    }
  }
}

// Create singleton instance
const schedulerService = new SchedulerService();

export default schedulerService; 