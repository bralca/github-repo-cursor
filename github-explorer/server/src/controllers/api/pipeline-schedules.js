import { getConnection } from '../../db/connection-manager.js';
import { logger } from '../../utils/logger.js';

/**
 * Get pipeline schedules
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getPipelineSchedules(req, res) {
  try {
    const db = await getConnection();
    
    const schedules = await db.all(`
      SELECT 
        id, 
        pipeline_type, 
        schedule_expression, 
        last_run, 
        next_run, 
        enabled, 
        created_at, 
        updated_at
      FROM pipeline_schedules
      ORDER BY pipeline_type ASC
    `);
    
    // Format dates for better readability
    schedules.forEach(schedule => {
      if (schedule.last_run) {
        schedule.last_run_formatted = new Date(schedule.last_run).toISOString();
      }
      
      if (schedule.next_run) {
        schedule.next_run_formatted = new Date(schedule.next_run).toISOString();
      }
      
      // Calculate time until next run
      if (schedule.next_run) {
        const nextRunDate = new Date(schedule.next_run);
        const now = new Date();
        const timeUntilNextRun = nextRunDate - now;
        
        schedule.time_until_next_run_seconds = Math.max(0, Math.floor(timeUntilNextRun / 1000));
      }
    });
    
    return res.json(schedules);
  } catch (error) {
    logger.error('Error getting pipeline schedules:', error);
    return res.status(500).json({ error: error.message });
  }
} 