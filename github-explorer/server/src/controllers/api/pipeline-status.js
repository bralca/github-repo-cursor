import { getConnection } from '../../db/connection-manager.js';
import { logger } from '../../utils/logger.js';

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
   
  try {
    const db = await getConnection();
     
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
  }
}

/**
 * Get all pipeline processing counts
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getPipelineCounts(req, res) {
  try {
    const db = await getConnection();
    
    // Get counts from each relevant table
    const counts = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM closed_merge_requests_raw WHERE is_processed = 0'),
      db.get('SELECT COUNT(*) as count FROM repositories WHERE is_enriched = 0'),
      db.get('SELECT COUNT(*) as count FROM contributors WHERE is_enriched = 0'),
      db.get('SELECT COUNT(*) as count FROM merge_requests WHERE is_enriched = 0')
    ]);
    
    return res.json({
      unprocessed_merge_requests: counts[0].count,
      unenriched_repositories: counts[1].count,
      unenriched_contributors: counts[2].count,
      unenriched_merge_requests: counts[3].count
    });
  } catch (error) {
    logger.error('Error getting pipeline counts:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get detailed history for pipeline operations
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getPipelineHistory(req, res) {
  try {
    const db = await getConnection();
    
    // Get pipeline history with pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await db.get('SELECT COUNT(*) as count FROM pipeline_history');
    const totalItems = countResult.count;
    
    // Get paginated history entries
    const history = await db.all(`
      SELECT id, pipeline_type, status, trigger_type, items_processed, started_at, completed_at, error_message
      FROM pipeline_history
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    // Format the dates and calculate duration
    for (const entry of history) {
      // Format timestamps
      entry.started_at_formatted = entry.started_at ? new Date(entry.started_at).toISOString() : null;
      entry.completed_at_formatted = entry.completed_at ? new Date(entry.completed_at).toISOString() : null;
      
      // Calculate duration
      if (entry.started_at && entry.completed_at) {
        const startDate = new Date(entry.started_at);
        const endDate = new Date(entry.completed_at);
        entry.duration_seconds = Math.floor((endDate - startDate) / 1000);
      } else {
        entry.duration_seconds = null;
      }
    }
    
    // Return paginated result
    return res.json({
      history,
      pagination: {
        total: totalItems,
        page,
        limit,
        pages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching pipeline history:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get pipeline statistics
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export async function getPipelineStats(req, res) {
  try {
    const db = await getConnection();
    
    // Get counts from each relevant table
    const counts = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM closed_merge_requests_raw WHERE is_processed = 0'),
      db.get('SELECT COUNT(*) as count FROM repositories WHERE is_enriched = 0'),
      db.get('SELECT COUNT(*) as count FROM contributors WHERE is_enriched = 0'),
      db.get('SELECT COUNT(*) as count FROM merge_requests WHERE is_enriched = 0')
    ]);
    
    return res.json({
      unprocessed_merge_requests: counts[0].count,
      unenriched_repositories: counts[1].count,
      unenriched_contributors: counts[2].count,
      unenriched_merge_requests: counts[3].count
    });
  } catch (error) {
    logger.error('Error getting pipeline stats:', error);
    return res.status(500).json({ error: error.message });
  }
} 