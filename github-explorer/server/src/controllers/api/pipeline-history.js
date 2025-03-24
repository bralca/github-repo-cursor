import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';

/**
 * Get pipeline execution history, optionally filtered by pipeline type
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getPipelineHistory(req, res) {
  const pipelineType = req.query.pipeline_type;
  
  let db = null;
  try {
    db = await openSQLiteConnection();
    
    let query = `
      SELECT 
        id, 
        pipeline_type as pipelineType, 
        status, 
        started_at as startedAt, 
        completed_at as completedAt, 
        items_processed as itemsProcessed, 
        error_message as errorMessage 
      FROM pipeline_history 
    `;
    
    const params = [];
    
    if (pipelineType) {
      query += 'WHERE pipeline_type = ? ';
      params.push(pipelineType);
    }
    
    query += 'ORDER BY started_at DESC LIMIT 100';
    
    const results = await db.all(query, params);
    
    return res.json(results);
  } catch (error) {
    console.error('Error getting pipeline history:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

/**
 * Clear pipeline execution history
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function clearPipelineHistory(req, res) {
  let db = null;
  try {
    db = await openSQLiteConnection();
    
    await db.run('DELETE FROM pipeline_history');
    
    return res.json({
      success: true,
      message: 'Pipeline history cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing pipeline history:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
} 