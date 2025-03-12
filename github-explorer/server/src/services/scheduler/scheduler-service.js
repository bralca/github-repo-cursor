/**
 * Pipeline Scheduler Service
 * 
 * This service manages pipeline scheduling using node-schedule.
 * It provides functionality to schedule, update, and trigger pipeline jobs.
 */

import nodeSchedule from 'node-schedule';
import { v4 as uuidv4 } from 'uuid';
import { pipelineFactory } from '../../pipeline/core/pipeline-factory.js';
import { logger } from '../../utils/logger.js';
import { supabaseClientFactory } from '../supabase/supabase-client.js';
import { SupabaseSchemaManager } from '../supabase/supabase-schema-manager.js';
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
    this.supabase = null;
    this.schemaManager = null;
    this.isDbAvailable = false;
    
    // Try to initialize Supabase client
    try {
      this.supabase = supabaseClientFactory.getClient();
      this.schemaManager = new SupabaseSchemaManager();
      this.checkDatabaseAvailability();
    } catch (error) {
      logger.error('Failed to initialize Supabase client for scheduler service', { error });
      // Continue without database access - will be initialized later
    }
    
    logger.info('Pipeline scheduler service initialized');
  }
  
  /**
   * Check if the database is available and tables exist
   * @returns {Promise<boolean>} Whether the database is available
   */
  async checkDatabaseAvailability() {
    try {
      // Initialize schema manager if needed
      if (!this.schemaManager) {
        this.schemaManager = new SupabaseSchemaManager();
        await this.schemaManager.initialize();
      }
      
      logger.info('Checking database availability for scheduler service');
      
      // Check if schedules table exists, create if it doesn't
      const pipelineScheduleSchema = `
        CREATE TABLE pipeline_schedules (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          pipeline_type TEXT NOT NULL,
          cron_expression TEXT NOT NULL,
          timezone TEXT DEFAULT 'UTC',
          parameters JSONB,
          is_active BOOLEAN DEFAULT TRUE,
          last_run_at TIMESTAMP WITH TIME ZONE,
          next_run_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_pipeline_type 
          ON pipeline_schedules(pipeline_type);
        CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_is_active 
          ON pipeline_schedules(is_active);
        CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_next_run_at 
          ON pipeline_schedules(next_run_at);
      `;
      
      const schedulesExist = await this.schemaManager.tableExists('pipeline_schedules');
      
      if (!schedulesExist) {
        logger.info('Creating pipeline_schedules table');
        const created = await this.schemaManager.createTableIfNotExists(
          'pipeline_schedules', 
          pipelineScheduleSchema
        );
        
        if (created) {
          logger.info('Successfully created pipeline_schedules table');
          this.isDbAvailable = true;
        } else {
          logger.error('Failed to create pipeline_schedules table');
          this.isDbAvailable = false;
          return false;
        }
      } else {
        logger.info('pipeline_schedules table already exists');
        this.isDbAvailable = true;
      }
      
      // Check if configurations table exists, create if it doesn't
      const pipelineConfigSchema = `
        CREATE TABLE pipeline_configurations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          pipeline_type TEXT NOT NULL,
          configuration JSONB NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_pipeline_configurations_pipeline_type 
          ON pipeline_configurations(pipeline_type);
        CREATE INDEX IF NOT EXISTS idx_pipeline_configurations_is_active 
          ON pipeline_configurations(is_active);
      `;
      
      const configsExist = await this.schemaManager.tableExists('pipeline_configurations');
      
      if (!configsExist) {
        logger.info('Creating pipeline_configurations table');
        const created = await this.schemaManager.createTableIfNotExists(
          'pipeline_configurations', 
          pipelineConfigSchema
        );
        
        if (created) {
          logger.info('Successfully created pipeline_configurations table');
        } else {
          logger.warn('Failed to create pipeline_configurations table');
        }
      } else {
        logger.info('pipeline_configurations table already exists');
      }
      
      return this.isDbAvailable;
    } catch (error) {
      logger.error('Error checking database availability', { error });
      this.isDbAvailable = false;
      return false;
    }
  }
  
  /**
   * Initialize schedules from database
   * @returns {Promise<void>}
   */
  async initializeFromDatabase() {
    try {
      logger.info('Initializing pipeline schedules from database');
      
      if (!this.supabase) {
        this.supabase = supabaseClientFactory.getClient();
      }
      
      // Check database availability
      if (!this.isDbAvailable) {
        const available = await this.checkDatabaseAvailability();
        
        if (!available) {
          logger.warn('Database not available, skipping initialization from database');
          return;
        }
      }
      
      // Get all active schedules from database
      const { data, error } = await this.supabase
        .from('pipeline_schedules')
        .select('*')
        .eq('is_active', true);
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        logger.info('No active schedules found in database');
        return;
      }
      
      logger.info(`Found ${data.length} active schedules in database`);
      
      // Initialize each schedule
      for (const dbSchedule of data) {
        try {
          const schedule = {
            id: dbSchedule.id,
            name: dbSchedule.name,
            pipelineType: dbSchedule.pipeline_type,
            cronExpression: dbSchedule.cron_expression,
            parameters: dbSchedule.parameters,
            isActive: dbSchedule.is_active,
            lastRunAt: dbSchedule.last_run_at,
            nextRunAt: dbSchedule.next_run_at,
            timeZone: dbSchedule.timezone || 'UTC',
            createdAt: dbSchedule.created_at
          };
          
          // Add to schedules map
          this.schedules.set(schedule.id, schedule);
          
          // If active, create the schedule job
          if (schedule.isActive) {
            this._createScheduleJob(schedule);
          }
        } catch (error) {
          logger.error(`Failed to initialize schedule ${dbSchedule.id}`, { error });
          // Continue with next schedule
        }
      }
      
      logger.info('Pipeline schedules initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize pipeline schedules from database', { error });
      // Don't throw error - continue operation without database schedules
    }
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
      
      // Persist to database
      await this.persistSchedule(schedule);
      
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
      this.schedules.get(schedule.id).lastRunAt = lastRunAt;
      
      // Emit schedule executing event
      this.emit('schedule:executing', { ...schedule, lastRunAt });
      
      // Update last run time in database
      try {
        if (this.isDbAvailable) {
          await this.supabase
            .from('pipeline_schedules')
            .update({ last_run_at: lastRunAt })
            .eq('id', schedule.id);
        }
      } catch (error) {
        logger.error(`Failed to update last run time for schedule ${schedule.id}`, { error });
        // Continue with execution anyway
      }
      
      // Get configuration if set
      let configuration = {};
      if (schedule.configurationId && this.isDbAvailable) {
        try {
          const { data, error } = await this.supabase
            .from('pipeline_configurations')
            .select('configuration')
            .eq('id', schedule.configurationId)
            .single();
          
          if (error) {
            throw error;
          }
          
          if (data && data.configuration) {
            configuration = data.configuration;
          }
        } catch (error) {
          logger.error(`Failed to get configuration for schedule ${schedule.id}`, { error });
          // Continue with default configuration
        }
      }
      
      // Execute the pipeline
      // Check which method is available on the pipeline factory
      let pipeline;
      if (typeof pipelineFactory.createPipelineInstance === 'function') {
        pipeline = pipelineFactory.createPipelineInstance(schedule.pipelineType);
      } else if (typeof pipelineFactory.getPipeline === 'function') {
        pipeline = pipelineFactory.getPipeline(schedule.pipelineType);
      } else {
        // Fallback to attempting to get a pipeline function that might return a pipeline
        const pipelineFunction = pipelineFactory.getPipelineConfig(schedule.pipelineType);
        if (typeof pipelineFunction === 'function') {
          pipeline = pipelineFunction();
        } else {
          throw new Error(`Could not create pipeline for type: ${schedule.pipelineType}`);
        }
      }
      
      if (!pipeline) {
        throw new Error(`Pipeline not found for type: ${schedule.pipelineType}`);
      }
      
      const result = await pipeline.run({}, configuration);
      
      // Update last result
      this.schedules.get(schedule.id).lastResult = result;
      
      // Update result in database
      try {
        if (this.isDbAvailable) {
          await this.supabase
            .from('pipeline_schedules')
            .update({ 
              last_result: result
            })
            .eq('id', schedule.id);
        }
      } catch (error) {
        logger.error(`Failed to update result for schedule ${schedule.id}`, { error });
      }
      
      // Emit schedule completed event
      this.emit('schedule:completed', { ...this.schedules.get(schedule.id) });
      
      logger.info(`Schedule executed successfully: ${schedule.name}`, {
        schedule_id: schedule.id,
        pipeline_type: schedule.pipelineType
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to execute schedule ${schedule.id}`, { error });
      
      // Update last result
      const errorResult = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      if (this.schedules.has(schedule.id)) {
        this.schedules.get(schedule.id).lastResult = errorResult;
      }
      
      // Update result in database
      try {
        if (this.isDbAvailable) {
          await this.supabase
            .from('pipeline_schedules')
            .update({ 
              last_result: errorResult
            })
            .eq('id', schedule.id);
        }
      } catch (dbError) {
        logger.error(`Failed to update error result for schedule ${schedule.id}`, { error: dbError });
      }
      
      // Emit schedule failed event
      this.emit('schedule:failed', { ...schedule, lastResult: errorResult });
      
      throw error;
    }
  }
  
  /**
   * Update an existing schedule
   * @param {string} scheduleId - ID of the schedule to update
   * @param {Object} updates - Properties to update
   * @returns {Promise<Object>} Updated schedule
   */
  async updateSchedule(scheduleId, updates) {
    try {
      // Get existing schedule
      const schedule = this.schedules.get(scheduleId);
      
      if (!schedule) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }
      
      logger.info(`Updating schedule: ${schedule.name}`, {
        schedule_id: scheduleId,
        updates
      });
      
      // Create updates object
      const validUpdateFields = {
        name: updates.name,
        cronExpression: updates.cronExpression,
        configurationId: updates.configurationId,
        timeZone: updates.timeZone,
        isActive: updates.isActive
      };
      
      // Remove undefined fields
      Object.keys(validUpdateFields).forEach(key => {
        if (validUpdateFields[key] === undefined) {
          delete validUpdateFields[key];
        }
      });
      
      if (Object.keys(validUpdateFields).length === 0) {
        logger.info(`No updates provided for schedule ${scheduleId}`);
        return schedule;
      }
      
      // Validate updates
      if (validUpdateFields.cronExpression && !this.validateCronExpression(validUpdateFields.cronExpression)) {
        throw new Error(`Invalid cron expression: ${validUpdateFields.cronExpression}`);
      }
      
      // Determine if need to update schedule job
      const needsReschedule = 
        validUpdateFields.cronExpression !== undefined || 
        validUpdateFields.timeZone !== undefined || 
        validUpdateFields.isActive !== undefined;
      
      // Calculate new next run time if cron expression is updated
      if (validUpdateFields.cronExpression || validUpdateFields.timeZone) {
        const cronExpression = validUpdateFields.cronExpression || schedule.cronExpression;
        const timeZone = validUpdateFields.timeZone || schedule.timeZone;
        validUpdateFields.nextRunAt = this.calculateNextRunTime(cronExpression, timeZone).toISOString();
      }
      
      // Cancel existing job if rescheduling
      if (needsReschedule && this.jobs.has(scheduleId)) {
        this._cancelJob(scheduleId);
      }
      
      // Update schedule in memory
      const updatedSchedule = {
        ...schedule,
        ...validUpdateFields
      };
      
      this.schedules.set(scheduleId, updatedSchedule);
      
      // Update in database
      await this.updateScheduleInDatabase(scheduleId, validUpdateFields);
      
      // Create new job if active and needs rescheduling
      if (needsReschedule && updatedSchedule.isActive) {
        this._createScheduleJob(updatedSchedule);
      }
      
      // Emit schedule updated event
      this.emit('schedule:updated', updatedSchedule);
      
      logger.info(`Schedule updated: ${updatedSchedule.name}`, {
        schedule_id: scheduleId
      });
      
      return updatedSchedule;
    } catch (error) {
      logger.error(`Failed to update schedule ${scheduleId}`, { error });
      throw error;
    }
  }
  
  /**
   * Delete a schedule
   * @param {string} scheduleId - ID of the schedule to delete
   * @returns {Promise<boolean>} Whether the deletion was successful
   */
  async deleteSchedule(scheduleId) {
    try {
      // Get existing schedule
      const schedule = this.schedules.get(scheduleId);
      
      if (!schedule) {
        logger.warn(`Schedule not found for deletion: ${scheduleId}`);
        return false;
      }
      
      logger.info(`Deleting schedule: ${schedule.name}`, {
        schedule_id: scheduleId
      });
      
      // Cancel job if exists
      if (this.jobs.has(scheduleId)) {
        this._cancelJob(scheduleId);
      }
      
      // Remove from memory
      this.schedules.delete(scheduleId);
      
      // Delete from database
      await this.deleteScheduleFromDatabase(scheduleId);
      
      // Emit schedule deleted event
      this.emit('schedule:deleted', { id: scheduleId });
      
      logger.info(`Schedule deleted: ${scheduleId}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to delete schedule ${scheduleId}`, { error });
      throw error;
    }
  }
  
  /**
   * Get all schedules
   * @param {string} [pipelineType] - Optional filter by pipeline type
   * @returns {Array<Object>} List of schedules
   */
  getSchedules(pipelineType) {
    // Convert map to array
    const schedules = Array.from(this.schedules.values());
    
    // Filter by pipeline type if specified
    if (pipelineType) {
      return schedules.filter(s => s.pipelineType === pipelineType);
    }
    
    return schedules;
  }
  
  /**
   * Get a schedule by ID
   * @param {string} scheduleId - ID of the schedule to get
   * @returns {Object|null} The schedule or null if not found
   */
  getScheduleById(scheduleId) {
    return this.schedules.get(scheduleId) || null;
  }
  
  /**
   * Trigger a scheduled job immediately
   * @param {string} scheduleId - ID of the schedule to trigger
   * @returns {Promise<Object>} Result of job execution
   */
  async triggerJob(scheduleId) {
    try {
      // Get existing schedule
      const schedule = this.schedules.get(scheduleId);
      
      if (!schedule) {
        throw new Error(`Schedule not found: ${scheduleId}`);
      }
      
      logger.info(`Manually triggering schedule: ${schedule.name}`, {
        schedule_id: scheduleId
      });
      
      // Execute the job
      return await this.executeJob(schedule);
    } catch (error) {
      logger.error(`Failed to trigger schedule ${scheduleId}`, { error });
      throw error;
    }
  }
  
  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   * @returns {SchedulerService} this
   */
  on(event, listener) {
    super.on(event, listener);
    return this;
  }
  
  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   * @returns {SchedulerService} this
   */
  off(event, listener) {
    super.off(event, listener);
    return this;
  }
  
  /**
   * Validate a cron expression
   * @param {string} expression - Cron expression to validate
   * @returns {boolean} Whether the expression is valid
   */
  validateCronExpression(expression) {
    try {
      // This will throw an error if the cron expression is invalid
      const job = nodeSchedule.scheduleJob(expression, () => {});
      
      if (job) {
        job.cancel();
        return true;
      }
      
      return false;
    } catch (error) {
      logger.warn(`Invalid cron expression: ${expression}`, { error: error.message });
      return false;
    }
  }
  
  /**
   * Parse timezone
   * @param {string} timeZone - Timezone to parse
   * @returns {string} Validated timezone
   */
  parseTimezone(timeZone) {
    // List of valid timezones: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
    const validTimezones = Intl.supportedValuesOf('timeZone');
    
    if (!timeZone || !validTimezones.includes(timeZone)) {
      logger.warn(`Invalid timezone: ${timeZone}, using UTC instead`);
      return 'UTC';
    }
    
    return timeZone;
  }
  
  /**
   * Calculate next run time based on cron expression
   * @param {string} cronExpression - Cron expression to parse
   * @param {string} [timeZone='UTC'] - Timezone for calculation
   * @returns {Date} Next run time
   */
  calculateNextRunTime(cronExpression, timeZone = 'UTC') {
    try {
      // Create a new job (but don't schedule it)
      const job = nodeSchedule.scheduleJob({
        rule: cronExpression,
        tz: this.parseTimezone(timeZone)
      }, () => {});
      
      // Get next invocation time
      const nextRunTime = job.nextInvocation();
      
      // Cancel the job
      job.cancel();
      
      return nextRunTime || new Date();
    } catch (error) {
      logger.error(`Failed to calculate next run time: ${cronExpression}`, { error });
      return new Date();
    }
  }
  
  /**
   * Persist a schedule to the database
   * @param {Object} schedule - Schedule to persist
   * @returns {Promise<boolean>} Whether the persistence was successful
   */
  async persistSchedule(schedule) {
    try {
      if (!this.isDbAvailable) {
        const available = await this.checkDatabaseAvailability();
        
        if (!available) {
          logger.warn('Database not available for persisting schedule', { schedule_id: schedule.id });
          return false;
        }
      }
      
      if (!this.supabase) {
        this.supabase = supabaseClientFactory.getClient();
      }
      
      const scheduleData = {
        name: schedule.name,
        description: schedule.description || `Schedule for ${schedule.pipelineType} pipeline`,
        pipeline_type: schedule.pipelineType,
        cron_expression: schedule.cronExpression,
        timezone: schedule.timeZone || 'UTC',
        parameters: schedule.parameters || {},
        is_active: schedule.isActive,
        last_run_at: schedule.lastRunAt,
        next_run_at: schedule.nextRunAt,
        updated_at: new Date().toISOString()
      };
      
      // If ID is numeric, use it, otherwise let Supabase generate one
      if (schedule.id && !isNaN(parseInt(schedule.id))) {
        scheduleData.id = parseInt(schedule.id);
      }
      
      // Upsert the schedule
      const { data, error } = await this.supabase
        .from('pipeline_schedules')
        .upsert(scheduleData, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update schedule with database ID if it was newly generated
      if (data && data.id && schedule.id !== data.id) {
        schedule.id = data.id;
        
        // Update in maps
        this.schedules.delete(schedule.id);
        this.schedules.set(data.id, schedule);
        
        if (this.jobs.has(schedule.id)) {
          const job = this.jobs.get(schedule.id);
          this.jobs.delete(schedule.id);
          this.jobs.set(data.id, job);
        }
      }
      
      logger.info(`Pipeline schedule persisted: ${schedule.name}`, { schedule_id: schedule.id });
      return true;
    } catch (error) {
      logger.error('Failed to persist pipeline schedule', { error, schedule_id: schedule.id });
      return false;
    }
  }
  
  /**
   * Update a schedule in the database
   * @param {string} scheduleId - ID of schedule to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateScheduleInDatabase(scheduleId, updates) {
    // Skip database operations if database is not available
    if (!this.isDbAvailable) {
      logger.warn('Database not available, skipping update of schedule');
      return;
    }
    
    try {
      // Make sure supabase client is initialized
      if (!this.supabase) {
        this.supabase = supabaseClientFactory.getClient();
      }
      
      // Check if table exists
      const exists = await this.schemaManager.tableExists('pipeline_schedules');
      
      if (!exists) {
        logger.warn('pipeline_schedules table does not exist, skipping database update');
        return;
      }
      
      // Map updates to database format
      const dbUpdates = {
        name: updates.name,
        description: updates.description,
        pipeline_type: updates.pipelineType,
        cron_expression: updates.cronExpression,
        timezone: updates.timeZone,
        parameters: updates.parameters,
        is_active: updates.isActive,
        last_run_at: updates.lastRunAt,
        next_run_at: updates.nextRunAt,
        updated_at: new Date().toISOString()
      };
      
      // Remove undefined fields
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key] === undefined) {
          delete dbUpdates[key];
        }
      });
      
      // Update in database
      const { error } = await this.supabase
        .from('pipeline_schedules')
        .update(dbUpdates)
        .eq('id', scheduleId);
      
      if (error) {
        throw error;
      }
      
      logger.debug(`Updated schedule ${scheduleId} in database`);
    } catch (error) {
      logger.error(`Failed to update schedule ${scheduleId} in database`, { error });
      // Don't throw error - continue with in-memory operation
    }
  }
  
  /**
   * Delete a schedule from the database
   * @param {string} scheduleId - ID of schedule to delete
   * @returns {Promise<void>}
   */
  async deleteScheduleFromDatabase(scheduleId) {
    // Skip database operations if database is not available
    if (!this.isDbAvailable) {
      logger.warn('Database not available, skipping deletion of schedule');
      return;
    }
    
    try {
      // Make sure supabase client is initialized
      if (!this.supabase) {
        this.supabase = supabaseClientFactory.getClient();
      }
      
      // Check if table exists
      const exists = await this.schemaManager.tableExists('pipeline_schedules');
      
      if (!exists) {
        logger.warn('pipeline_schedules table does not exist, skipping database deletion');
        return;
      }
      
      // Delete from database
      const { error } = await this.supabase
        .from('pipeline_schedules')
        .delete()
        .eq('id', scheduleId);
      
      if (error) {
        throw error;
      }
      
      logger.debug(`Deleted schedule ${scheduleId} from database`);
    } catch (error) {
      logger.error(`Failed to delete schedule ${scheduleId} from database`, { error });
      // Don't throw error - continue with in-memory operation
    }
  }
  
  /**
   * Create a scheduled job for a schedule
   * @param {Object} schedule - Schedule to create job for
   * @private
   */
  _createScheduleJob(schedule) {
    try {
      if (this.jobs.has(schedule.id)) {
        // Cancel existing job
        this._cancelJob(schedule.id);
      }
      
      logger.info(`Creating schedule job: ${schedule.name}`, {
        schedule_id: schedule.id,
        cron_expression: schedule.cronExpression,
        time_zone: schedule.timeZone
      });
      
      // Create job
      const job = nodeSchedule.scheduleJob(
        {
          rule: schedule.cronExpression,
          tz: schedule.timeZone
        },
        async () => {
          // Job execution handler
          try {
            await this._handleJobExecution(schedule);
          } catch (error) {
            logger.error(`Error executing scheduled job: ${schedule.name}`, { error, schedule_id: schedule.id });
          }
        }
      );
      
      if (!job) {
        throw new Error(`Failed to create schedule job: ${schedule.name}`);
      }
      
      // Add to jobs map
      this.jobs.set(schedule.id, job);
      
      // Update next run time
      const nextRunAt = job.nextInvocation();
      
      if (nextRunAt) {
        schedule.nextRunAt = nextRunAt.toISOString();
        this.schedules.set(schedule.id, schedule);
      }
      
      logger.info(`Schedule job created: ${schedule.name}`, { 
        schedule_id: schedule.id,
        next_run_at: schedule.nextRunAt
      });
    } catch (error) {
      logger.error(`Failed to create schedule job: ${schedule.name}`, { error, schedule_id: schedule.id });
      throw error;
    }
  }
  
  /**
   * Cancel a scheduled job
   * @param {string} scheduleId - ID of schedule to cancel
   * @private
   */
  _cancelJob(scheduleId) {
    try {
      const job = this.jobs.get(scheduleId);
      
      if (job) {
        job.cancel();
        this.jobs.delete(scheduleId);
        logger.debug(`Cancelled job for schedule ${scheduleId}`);
      }
    } catch (error) {
      logger.error(`Failed to cancel job for schedule ${scheduleId}`, { error });
    }
  }
}

// Create singleton instance
const schedulerService = new SchedulerService();

export default schedulerService; 