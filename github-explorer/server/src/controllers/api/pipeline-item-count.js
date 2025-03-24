import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';

/**
 * Get the count of items for a specific pipeline type
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getPipelineItemCount(req, res) {
  const pipelineType = req.query.pipeline_type;
  
  if (!pipelineType) {
    return res.status(400).json({ error: 'Pipeline type is required' });
  }
  
  let db = null;
  let count = 0;
  
  try {
    db = await openSQLiteConnection();
    
    // Determine the target table based on pipeline type
    let table;
    switch (pipelineType) {
      case 'repository':
        table = 'repositories';
        break;
      case 'contributor':
        table = 'contributors';
        break;
      case 'merge_request':
        table = 'merge_requests';
        break;
      case 'commit':
        table = 'commits';
        break;
      default:
        return res.status(400).json({ error: `Unknown pipeline type: ${pipelineType}` });
    }
    
    // Get the count from the appropriate table
    const result = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
    count = result.count;
    
    return res.json({ count });
  } catch (error) {
    console.error(`Error getting item count for ${pipelineType} pipeline:`, error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
} 