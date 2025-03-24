import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';

/**
 * Get the status of a pipeline by type
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getPipelineStatus(req, res) {
  const pipelineType = req.query.pipeline_type;
  
  if (!pipelineType) {
    return res.status(400).json({ error: 'Pipeline type is required' });
  }
  
  let db = null;
  try {
    db = await openSQLiteConnection();
    
    const result = await db.get(
      'SELECT pipeline_type, status, is_running as isRunning, last_run as lastRun, updated_at as updatedAt FROM pipeline_status WHERE pipeline_type = ?',
      [pipelineType]
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Pipeline status not found' });
    }
    
    return res.json(result);
  } catch (error) {
    console.error(`Error getting pipeline status for ${pipelineType}:`, error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
} 