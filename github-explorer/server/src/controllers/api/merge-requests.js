import { pool } from '../../db/db-pool.js';
import { handleDbError } from '../../utils/db-utils.js';

/**
 * Get all merge requests with pagination and filtering
 */
export async function getMergeRequests(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const repositoryId = req.query.repository_id;
  const authorId = req.query.author_id;
  const state = req.query.state; // open, closed, merged

  try {
    // Build query conditions
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (repositoryId) {
      conditions.push(`mr.repository_id = $${paramIndex++}`);
      params.push(repositoryId);
    }

    if (authorId) {
      conditions.push(`mr.author_id = $${paramIndex++}`);
      params.push(authorId);
    }

    if (state) {
      conditions.push(`mr.state = $${paramIndex++}`);
      params.push(state);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) 
      FROM merge_requests mr
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Get merge requests with pagination
    const mrQuery = `
      SELECT 
        mr.*,
        r.full_name AS repository_name,
        c.username AS author_username,
        c.avatar AS author_avatar
      FROM 
        merge_requests mr
      JOIN 
        repositories r ON mr.repository_id = r.id
      JOIN 
        contributors c ON mr.author_id = c.id
      ${whereClause}
      ORDER BY 
        mr.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    params.push(limit, offset);
    const result = await pool.query(mrQuery, params);
    
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
 * Get merge request by ID
 */
export async function getMergeRequestById(req, res) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Merge request ID is required' });
  }
  
  try {
    // Get merge request details
    const mrQuery = `
      SELECT 
        mr.*,
        r.full_name AS repository_name,
        c.username AS author_username,
        c.avatar AS author_avatar
      FROM 
        merge_requests mr
      JOIN 
        repositories r ON mr.repository_id = r.id
      JOIN 
        contributors c ON mr.author_id = c.id
      WHERE 
        mr.id = $1 OR mr.github_id = $1
    `;
    
    const mrResult = await pool.query(mrQuery, [id]);
    
    if (mrResult.rows.length === 0) {
      return res.status(404).json({ error: 'Merge request not found' });
    }
    
    const mergeRequest = mrResult.rows[0];
    
    // Return all data
    res.json({
      ...mergeRequest
    });
  } catch (error) {
    handleDbError(error, res);
  }
}

/**
 * Get merge request by repository and number
 */
export async function getMergeRequestByNumber(req, res) {
  const { repository_id, number } = req.params;
  
  if (!repository_id || !number) {
    return res.status(400).json({ error: 'Repository ID and merge request number are required' });
  }
  
  try {
    // Get merge request details
    const mrQuery = `
      SELECT 
        mr.*,
        r.full_name AS repository_name,
        c.username AS author_username,
        c.avatar AS author_avatar
      FROM 
        merge_requests mr
      JOIN 
        repositories r ON mr.repository_id = r.id
      JOIN 
        contributors c ON mr.author_id = c.id
      WHERE 
        (mr.repository_id = $1 OR r.github_id = $1) AND mr.github_id = $2
    `;
    
    const mrResult = await pool.query(mrQuery, [repository_id, number]);
    
    if (mrResult.rows.length === 0) {
      return res.status(404).json({ error: 'Merge request not found' });
    }
    
    const mergeRequest = mrResult.rows[0];
    
    // Return all data
    res.json({
      ...mergeRequest
    });
  } catch (error) {
    handleDbError(error, res);
  }
} 