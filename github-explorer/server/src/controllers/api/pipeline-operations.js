import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';

/**
 * Handle pipeline operations (start/stop)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function handlePipelineOperations(req, res) {
  const { pipelineType, operation } = req.body;
  
  if (!pipelineType) {
    return res.status(400).json({ error: 'Pipeline type is required' });
  }
  
  if (!operation || !['start', 'stop'].includes(operation)) {
    return res.status(400).json({ error: 'Valid operation (start or stop) is required' });
  }
  
  let db = null;
  try {
    db = await openSQLiteConnection();
    
    // Check if pipeline exists
    const exists = await db.get(
      'SELECT 1 FROM pipeline_status WHERE pipeline_type = ?',
      [pipelineType]
    );
    
    if (!exists) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    // Update pipeline status based on operation
    if (operation === 'start') {
      await db.run(
        'UPDATE pipeline_status SET status = ?, is_running = 1, updated_at = CURRENT_TIMESTAMP WHERE pipeline_type = ?',
        ['running', pipelineType]
      );
      
      return res.json({
        success: true,
        message: `${pipelineType} pipeline started successfully`
      });
    } else {
      await db.run(
        'UPDATE pipeline_status SET status = ?, is_running = 0, updated_at = CURRENT_TIMESTAMP WHERE pipeline_type = ?',
        ['stopped', pipelineType]
      );
      
      return res.json({
        success: true,
        message: `${pipelineType} pipeline stopped successfully`
      });
    }
  } catch (error) {
    console.error(`Error performing ${operation} operation on ${pipelineType} pipeline:`, error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
} 