import { getConnection } from '../../db/connection-manager.js';
import { logger } from '../../utils/logger.js';

/**
 * Get pipeline execution history, optionally filtered by pipeline type
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getPipelineHistory(req, res) {
  const pipelineType = req.query.pipeline_type;
  
  try {
    const db = await getConnection();
    
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
  }
}

/**
 * Get detailed pipeline history entry by ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getPipelineHistoryById(req, res) {
  const historyId = req.params.id;
  
  if (!historyId) {
    return res.status(400).json({ error: 'History ID is required' });
  }
  
  try {
    const db = await getConnection();
    
    // Get the history entry
    const historyEntry = await db.get(`
      SELECT id, pipeline_type, status, trigger_type, items_processed, started_at, completed_at, error_message
      FROM pipeline_history
      WHERE id = ?
    `, [historyId]);
    
    if (!historyEntry) {
      return res.status(404).json({ error: 'History entry not found' });
    }
    
    // Calculate duration
    if (historyEntry.started_at && historyEntry.completed_at) {
      const startDate = new Date(historyEntry.started_at);
      const endDate = new Date(historyEntry.completed_at);
      historyEntry.duration_seconds = Math.floor((endDate - startDate) / 1000);
    } else {
      historyEntry.duration_seconds = null;
    }
    
    return res.json(historyEntry);
  } catch (error) {
    logger.error(`Error getting pipeline history entry ${historyId}:`, error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Clear pipeline history
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function clearPipelineHistory(req, res) {
  try {
    const db = await getConnection();
    
    await db.run('DELETE FROM pipeline_history');
    
    return res.json({ success: true, message: 'Pipeline history cleared' });
  } catch (error) {
    logger.error('Error clearing pipeline history:', error);
    return res.status(500).json({ error: error.message });
  }
} 