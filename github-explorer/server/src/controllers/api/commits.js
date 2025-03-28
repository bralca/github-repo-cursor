import { pool } from '../../db/db-pool.js';
import { handleDbError } from '../../utils/db-utils.js';

/**
 * Get all commits with pagination and filtering
 */
export async function getCommits(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const repositoryId = req.query.repository_id;
  const contributorId = req.query.contributor_id;
  const since = req.query.since; // Date string
  const until = req.query.until; // Date string

  try {
    // Build query conditions
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (repositoryId) {
      conditions.push(`c.repository_id = $${paramIndex++}`);
      params.push(repositoryId);
    }

    if (contributorId) {
      conditions.push(`c.contributor_id = $${paramIndex++}`);
      params.push(contributorId);
    }

    if (since) {
      conditions.push(`c.committed_at >= $${paramIndex++}`);
      params.push(since);
    }

    if (until) {
      conditions.push(`c.committed_at <= $${paramIndex++}`);
      params.push(until);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM commits c
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Get commits with pagination
    const commitsQuery = `
      SELECT 
        c.*,
        r.full_name AS repository_name
      FROM 
        commits c
      JOIN 
        repositories r ON c.repository_id = r.id
      ${whereClause}
      ORDER BY 
        c.committed_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    params.push(limit, offset);
    const result = await pool.query(commitsQuery, params);
    
    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    handleDbError(error, res);
  }
}

/**
 * Get commit by ID
 */
export async function getCommitById(req, res) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Commit ID is required' });
  }
  
  try {
    console.log(`[Server] Looking up commit with ID: ${id}`);
    
    // Get commit details
    const commitQuery = `
      SELECT 
        c.*,
        r.full_name AS repository_name
      FROM 
        commits c
      JOIN 
        repositories r ON c.repository_id = r.id
      WHERE 
        c.github_id = $1 OR c.id = $1
    `;
    
    const commitResult = await pool.query(commitQuery, [id]);
    
    if (commitResult.rows.length === 0) {
      console.log(`[Server] Commit with ID ${id} not found`);
      return res.status(404).json({ error: 'Commit not found' });
    }
    
    const commit = commitResult.rows[0];
    console.log(`[Server] Found commit: ${commit.message && commit.message.substring(0, 30)}...`);
    
    // Return all data
    res.json({
      ...commit
    });
  } catch (error) {
    handleDbError(error, res);
  }
}

/**
 * Get commit by repository and SHA
 */
export async function getCommitBySha(req, res) {
  const { repository_id, sha } = req.params;
  
  if (!repository_id || !sha) {
    return res.status(400).json({ error: 'Repository ID and commit SHA are required' });
  }
  
  try {
    // Get commit details
    const commitQuery = `
      SELECT 
        c.*,
        r.full_name AS repository_name
      FROM 
        commits c
      JOIN 
        repositories r ON c.repository_id = r.id
      WHERE 
        (c.repository_id = $1 OR r.github_id = $1) AND c.github_id = $2
    `;
    
    const commitResult = await pool.query(commitQuery, [repository_id, sha]);
    
    if (commitResult.rows.length === 0) {
      return res.status(404).json({ error: 'Commit not found' });
    }
    
    const commit = commitResult.rows[0];
    
    // Return all data
    res.json({
      ...commit
    });
  } catch (error) {
    handleDbError(error, res);
  }
} 