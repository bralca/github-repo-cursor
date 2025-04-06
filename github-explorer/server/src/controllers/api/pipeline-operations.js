import { getConnection } from '../../db/connection-manager.js';
import { logger } from '../../utils/logger.js';

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
    db = await getConnection();
    
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
      await db.close();
    }
  }
}

/**
 * Start a pipeline operation
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function startPipeline(req, res) {
  const { type } = req.body;
  
  if (!type) {
    return res.status(400).json({ error: 'Pipeline type is required' });
  }
  
  try {
    const db = await getConnection();
    
    // Check if the pipeline is already running
    const pipeline = await db.get(
      'SELECT * FROM pipeline_status WHERE pipeline_type = ?',
      [type]
    );
    
    if (pipeline && pipeline.is_running) {
      return res.status(409).json({
        error: `Pipeline of type '${type}' is already running`
      });
    }
    
    // Update pipeline status to running
    if (pipeline) {
      await db.run(
        'UPDATE pipeline_status SET status = ?, is_running = 1, updated_at = CURRENT_TIMESTAMP WHERE pipeline_type = ?',
        ['running', type]
      );
    } else {
      await db.run(
        'INSERT INTO pipeline_status (pipeline_type, status, is_running, updated_at) VALUES (?, ?, 1, CURRENT_TIMESTAMP)',
        [type, 'running']
      );
    }
    
    // TODO: Actually start the pipeline in a separate process
    
    logger.info(`Started pipeline of type '${type}'`);
    return res.json({ success: true, message: `Pipeline of type '${type}' started` });
  } catch (error) {
    logger.error(`Error starting pipeline of type '${type}':`, error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Stop a running pipeline
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function stopPipeline(req, res) {
  const { type } = req.body;
  
  if (!type) {
    return res.status(400).json({ error: 'Pipeline type is required' });
  }
  
  try {
    const db = await getConnection();
    
    // Check if the pipeline exists and is running
    const pipeline = await db.get(
      'SELECT * FROM pipeline_status WHERE pipeline_type = ?',
      [type]
    );
    
    if (!pipeline) {
      return res.status(404).json({
        error: `Pipeline of type '${type}' not found`
      });
    }
    
    if (!pipeline.is_running) {
      return res.status(409).json({
        error: `Pipeline of type '${type}' is not running`
      });
    }
    
    // Update pipeline status to stopped
    await db.run(
      'UPDATE pipeline_status SET status = ?, is_running = 0, updated_at = CURRENT_TIMESTAMP WHERE pipeline_type = ?',
      ['stopped', type]
    );
    
    // TODO: Actually stop the pipeline process
    
    logger.info(`Stopped pipeline of type '${type}'`);
    return res.json({ success: true, message: `Pipeline of type '${type}' stopped` });
  } catch (error) {
    logger.error(`Error stopping pipeline of type '${type}':`, error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Reset pipeline status
 * @param {object} req - Express request object
 * @param {object} res - Express response object 
 */
export async function resetPipeline(req, res) {
  const { type } = req.body;
  
  if (!type) {
    return res.status(400).json({ error: 'Pipeline type is required' });
  }
  
  try {
    const db = await getConnection();
    
    // Update pipeline status to idle
    const result = await db.run(
      'UPDATE pipeline_status SET status = ?, is_running = 0, updated_at = CURRENT_TIMESTAMP WHERE pipeline_type = ?',
      ['idle', type]
    );
    
    if (result.changes === 0) {
      // If no rows were affected, insert a new row
      await db.run(
        'INSERT INTO pipeline_status (pipeline_type, status, is_running, updated_at) VALUES (?, ?, 0, CURRENT_TIMESTAMP)',
        [type, 'idle']
      );
    }
    
    logger.info(`Reset pipeline of type '${type}'`);
    return res.json({ success: true, message: `Pipeline of type '${type}' reset` });
  } catch (error) {
    logger.error(`Error resetting pipeline of type '${type}':`, error);
    return res.status(500).json({ error: error.message });
  }
} 