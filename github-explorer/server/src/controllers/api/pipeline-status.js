import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';
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

/**
 * Get counts of items at each pipeline stage
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getPipelineStats(req, res) {
  let db = null;
  
  try {
    db = await openSQLiteConnection();
    
    // Get counts from each relevant table
    const [
      closedMergeRequestsRawResult,
      repositoriesResult,
      contributorsResult,
      mergeRequestsResult,
      commitsResult
    ] = await Promise.all([
      db.get('SELECT COUNT(*) as total, COUNT(CASE WHEN is_processed = 0 THEN 1 END) as pending FROM closed_merge_requests_raw'),
      db.get('SELECT COUNT(*) as total, COUNT(CASE WHEN is_enriched = 0 THEN 1 END) as pending FROM repositories'),
      db.get('SELECT COUNT(*) as total, COUNT(CASE WHEN is_enriched = 0 THEN 1 END) as pending FROM contributors'),
      db.get('SELECT COUNT(*) as total, COUNT(CASE WHEN is_enriched = 0 THEN 1 END) as pending FROM merge_requests'),
      db.get('SELECT COUNT(*) as total FROM commits')
    ]);
    
    // Get the pipeline status for each type
    const pipelineTables = await db.all('SELECT pipeline_type, status, is_running, updated_at FROM pipeline_status');
    
    // Calculate stats
    const closedMergeRequestsRaw = closedMergeRequestsRawResult?.total || 0;
    const unprocessedMergeRequests = closedMergeRequestsRawResult?.pending || 0;
    const repositories = repositoriesResult?.total || 0;
    const unenrichedRepositories = repositoriesResult?.pending || 0;
    const contributors = contributorsResult?.total || 0;
    const unenrichedContributors = contributorsResult?.pending || 0;
    const mergeRequests = mergeRequestsResult?.total || 0;
    const unenrichedMergeRequests = mergeRequestsResult?.pending || 0;
    const commits = commitsResult?.total || 0;
    
    // Calculate total unenriched
    const totalUnenriched = unenrichedRepositories + unenrichedContributors + unenrichedMergeRequests;
    
    // Format pipeline status in the expected format
    const pipelineStatus = {
      github_sync: { status: 'idle', isRunning: false, lastRun: null },
      data_processing: { status: 'idle', isRunning: false, lastRun: null },
      data_enrichment: { status: 'idle', isRunning: false, lastRun: null }
    };
    
    // Update with actual status
    for (const item of pipelineTables) {
      if (pipelineStatus[item.pipeline_type]) {
        pipelineStatus[item.pipeline_type] = {
          status: item.status,
          isRunning: item.is_running === 1,
          lastRun: item.updated_at
        };
      }
    }
    
    // Log stats to console for debugging
    console.log('Database query results:', {
      repositories,
      contributors,
      mergeRequests,
      commits,
      closedMergeRequestsRaw,
      unprocessedMergeRequests,
      unenrichedRepositories,
      unenrichedContributors,
      unenrichedMergeRequests,
      totalUnenriched
    });
    
    // Return stats in the format expected by the frontend
    return res.json({
      repositories,
      contributors,
      mergeRequests,
      commits,
      closedMergeRequestsRaw,
      unprocessedMergeRequests,
      unenrichedRepositories,
      unenrichedContributors,
      unenrichedMergeRequests,
      totalUnenriched,
      pipelineStatus
    });
  } catch (error) {
    logger.error('Error getting pipeline stats:', { error });
    return res.status(500).json({ error: error.message });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
} 