import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';

/**
 * Get all pipeline schedules
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getPipelineSchedules(req, res) {
  let db = null;
  try {
    db = await openSQLiteConnection();
    
    const query = `
      SELECT 
        id,
        pipeline_type as pipelineType,
        cron_expression as cronExpression,
        is_active as isActive,
        parameters,
        description,
        created_at as createdAt,
        updated_at as updatedAt
      FROM pipeline_schedules
      ORDER BY created_at DESC
    `;
    
    const results = await db.all(query);
    
    // Parse the parameters JSON string if it exists
    const schedulesWithParsedParams = results.map(schedule => {
      if (schedule.parameters && typeof schedule.parameters === 'string') {
        try {
          schedule.parameters = JSON.parse(schedule.parameters);
        } catch (e) {
          console.error(`Error parsing parameters for schedule ${schedule.id}:`, e);
          // Keep the string value if parsing fails
        }
      }
      return schedule;
    });
    
    return res.json(schedulesWithParsedParams);
  } catch (error) {
    console.error('Error getting pipeline schedules:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
} 