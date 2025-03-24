import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';

/**
 * Handle contributor rankings operations
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function handleContributorRankings(req, res) {
  try {
    // Extract operation from request body
    const { operation, timeframe } = req.body;
    
    if (!operation) {
      return res.status(400).json({ error: 'Operation is required' });
    }
    
    // Handle different operations
    switch (operation) {
      case 'get_latest':
        return await getLatestRankings(req, res);
        
      case 'get_by_timeframe':
        return await getRankingsByTimeframe(req, res, timeframe);
        
      case 'calculate':
        return await calculateRankings(req, res);
        
      default:
        return res.status(400).json({ error: `Unknown operation: ${operation}` });
    }
  } catch (error) {
    console.error('Error in contributor rankings API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Get the latest contributor rankings
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getLatestRankings(req, res) {
  let db = null;
  try {
    db = await openSQLiteConnection();
    
    // Step 1: Get the most recent timestamp
    const latestTimestamp = await db.get(
      `SELECT MAX(calculation_timestamp) as latest_timestamp FROM contributor_rankings`
    );
    
    if (!latestTimestamp.latest_timestamp) {
      return res.json({ rankings: [], timestamp: null });
    }
    
    // Step 2: Get rankings with contributor details
    const rankings = await db.all(`
      SELECT 
        cr.*,
        c.username,
        c.name,
        c.avatar,
        c.location,
        c.twitter_username,
        c.top_languages
      FROM contributor_rankings cr
      JOIN contributors c ON cr.contributor_id = c.id
      WHERE cr.calculation_timestamp = ?
      AND COALESCE(c.is_bot, 0) = 0
      ORDER BY cr.rank_position ASC
      LIMIT 100
    `, [latestTimestamp.latest_timestamp]);
    
    // Step 3: Get the most popular repository for each contributor
    for (const ranking of rankings) {
      const popularRepo = await db.get(`
        SELECT 
          r.name, 
          r.full_name, 
          r.url, 
          r.stars,
          r.github_id
        FROM repositories r
        JOIN contributor_repository cr ON r.id = cr.repository_id
        WHERE cr.contributor_id = ?
        ORDER BY r.stars DESC
        LIMIT 1
      `, [ranking.contributor_id]);
      
      if (popularRepo) {
        ranking.most_popular_repository = popularRepo;
      }
      
      // Step 4: Get the most collaborative merge request for each contributor
      const mostCollaborativeMR = await getMostCollaborativeMergeRequest(db, ranking.contributor_id);
      if (mostCollaborativeMR) {
        ranking.most_collaborative_merge_request = mostCollaborativeMR;
      }
    }
    
    return res.json({
      rankings,
      timestamp: latestTimestamp.latest_timestamp
    });
  } catch (error) {
    console.error('Error fetching latest rankings:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch latest rankings' });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

/**
 * Get contributor rankings for a specific timeframe
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {string} timeframe - Timeframe to get rankings for ('24h', '7d', '30d', 'all')
 */
async function getRankingsByTimeframe(req, res, timeframe) {
  let db = null;
  try {
    if (!timeframe || !['24h', '7d', '30d', 'all'].includes(timeframe)) {
      return res.status(400).json({ error: 'Invalid timeframe. Must be one of: 24h, 7d, 30d, all' });
    }
    
    db = await openSQLiteConnection();
    
    // For now, we just return the latest rankings regardless of timeframe
    // In the future, we can implement filtering by date if needed
    const latestTimestamp = await db.get(
      `SELECT MAX(calculation_timestamp) as latest_timestamp FROM contributor_rankings`
    );
    
    if (!latestTimestamp.latest_timestamp) {
      return res.json({ rankings: [], timestamp: null });
    }
    
    // Get rankings with contributor details
    const rankings = await db.all(`
      SELECT 
        cr.*,
        c.username,
        c.name,
        c.avatar,
        c.location,
        c.twitter_username,
        c.top_languages
      FROM contributor_rankings cr
      JOIN contributors c ON cr.contributor_id = c.id
      WHERE cr.calculation_timestamp = ?
      AND COALESCE(c.is_bot, 0) = 0
      ORDER BY cr.rank_position ASC
      LIMIT 100
    `, [latestTimestamp.latest_timestamp]);
    
    // Get the most popular repository for each contributor
    for (const ranking of rankings) {
      const popularRepo = await db.get(`
        SELECT 
          r.name, 
          r.full_name, 
          r.url, 
          r.stars,
          r.github_id
        FROM repositories r
        JOIN contributor_repository cr ON r.id = cr.repository_id
        WHERE cr.contributor_id = ?
        ORDER BY r.stars DESC
        LIMIT 1
      `, [ranking.contributor_id]);
      
      if (popularRepo) {
        ranking.most_popular_repository = popularRepo;
      }
      
      // Get the most collaborative merge request for each contributor
      const mostCollaborativeMR = await getMostCollaborativeMergeRequest(db, ranking.contributor_id);
      if (mostCollaborativeMR) {
        ranking.most_collaborative_merge_request = mostCollaborativeMR;
      }
    }
    
    return res.json({
      rankings,
      timestamp: latestTimestamp.latest_timestamp,
      timeframe
    });
  } catch (error) {
    console.error(`Error fetching rankings for timeframe ${timeframe}:`, error);
    return res.status(500).json({ error: error.message || `Failed to fetch rankings for timeframe ${timeframe}` });
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

/**
 * Get the most collaborative merge request for a contributor
 * @param {object} db - Database connection
 * @param {string} contributorId - Contributor ID
 * @returns {object|null} Most collaborative merge request or null if none found
 */
async function getMostCollaborativeMergeRequest(db, contributorId) {
  try {
    // Find merge requests where this contributor participated
    const mergeRequests = await db.all(`
      SELECT DISTINCT 
        c.pull_request_id
      FROM commits c
      JOIN merge_requests mr ON c.pull_request_id = mr.id
      JOIN repositories r ON mr.repository_id = r.id
      WHERE c.contributor_id = ?
      AND r.is_fork = 0
    `, [contributorId]);
    
    if (!mergeRequests || mergeRequests.length === 0) {
      return null;
    }
    
    // For each merge request, count distinct contributors and get details
    let mostCollaborative = null;
    let maxCollaborators = 0;
    
    for (const mr of mergeRequests) {
      const collaboratorInfo = await db.get(`
        SELECT 
          mr.id,
          mr.github_id as merge_request_github_id,
          mr.title,
          mr.state,
          r.name as repository_name,
          r.url as repository_url,
          r.github_id as repository_github_id,
          COUNT(DISTINCT CASE WHEN COALESCE(cont.is_bot, 0) = 0 THEN c.contributor_id END) as collaborator_count
        FROM merge_requests mr
        JOIN commits c ON c.pull_request_id = mr.id
        JOIN contributors cont ON c.contributor_id = cont.id
        JOIN repositories r ON mr.repository_id = r.id
        WHERE mr.id = ?
        GROUP BY mr.id
      `, [mr.pull_request_id]);
      
      if (collaboratorInfo && collaboratorInfo.collaborator_count > maxCollaborators) {
        maxCollaborators = collaboratorInfo.collaborator_count;
        mostCollaborative = collaboratorInfo;
      }
    }
    
    if (!mostCollaborative) {
      return null;
    }
    
    // Get collaborator details for the most collaborative merge request
    const collaborators = await db.all(`
      SELECT DISTINCT
        cont.id,
        cont.github_id,
        cont.username,
        cont.name,
        cont.avatar
      FROM commits c
      JOIN contributors cont ON c.contributor_id = cont.id
      WHERE c.pull_request_id = ?
      AND COALESCE(cont.is_bot, 0) = 0
      LIMIT 8
    `, [mostCollaborative.id]);
    
    return {
      id: mostCollaborative.id,
      github_id: mostCollaborative.merge_request_github_id,
      title: mostCollaborative.title,
      repository_name: mostCollaborative.repository_name,
      repository_url: mostCollaborative.repository_url,
      repository_github_id: mostCollaborative.repository_github_id,
      state: mostCollaborative.state,
      collaborator_count: maxCollaborators,
      collaborators: collaborators
    };
  } catch (error) {
    console.error('Error fetching most collaborative merge request:', error);
    return null;
  }
}

/**
 * Calculate contributor rankings and store in database
 * This is a stub for the calculation API endpoint that would be implemented in the future
 * Currently just returns a success message
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function calculateRankings(req, res) {
  return res.json({
    success: true,
    message: 'Calculation endpoint initialized. Full implementation will be added in a future update.'
  });
} 