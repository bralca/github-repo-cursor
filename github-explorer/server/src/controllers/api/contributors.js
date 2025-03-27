import { pool } from '../../db/db-pool.js';
import { handleDbError } from '../../utils/db-utils.js';

/**
 * Get all contributors with pagination
 */
export async function getContributors(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Get total count for pagination
    const countResult = await pool.query('SELECT COUNT(*) FROM contributors');
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Get contributors with pagination
    const contributorsQuery = `
      SELECT 
        c.*,
        COUNT(DISTINCT cm.id) AS commit_count,
        COUNT(DISTINCT mr.id) AS merge_request_count
      FROM 
        contributors c
      LEFT JOIN 
        commits cm ON c.id = cm.contributor_id
      LEFT JOIN 
        merge_requests mr ON c.id = mr.author_id
      GROUP BY 
        c.id
      ORDER BY 
        c.followers DESC, c.repositories DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(contributorsQuery, [limit, offset]);
    
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
 * Get contributor by ID
 */
export async function getContributorById(req, res) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Contributor ID is required' });
  }
  
  try {
    // Get contributor details
    const contributorQuery = `
      SELECT 
        c.*,
        COUNT(DISTINCT cm.id) AS commit_count,
        COUNT(DISTINCT mr.id) AS merge_request_count
      FROM 
        contributors c
      LEFT JOIN 
        commits cm ON c.id = cm.contributor_id
      LEFT JOIN 
        merge_requests mr ON c.id = mr.author_id
      WHERE 
        c.id = ? OR c.github_id = ?
      GROUP BY 
        c.id
    `;
    
    const contributorResult = await pool.query(contributorQuery, [id, id]);
    
    if (contributorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contributor not found' });
    }
    
    const contributor = contributorResult.rows[0];
    
    // Get repositories the contributor has contributed to
    const reposQuery = `
      SELECT DISTINCT 
        r.*,
        COUNT(DISTINCT cm.id) AS commit_count
      FROM 
        repositories r
      JOIN 
        commits cm ON r.id = cm.repository_id
      WHERE 
        cm.contributor_id = ?
      GROUP BY 
        r.id
      ORDER BY 
        commit_count DESC
      LIMIT 5
    `;
    
    const reposResult = await pool.query(reposQuery, [contributor.id]);
    
    // Get recent commits by contributor
    const commitsQuery = `
      SELECT 
        cm.*,
        r.full_name AS repository_name
      FROM 
        commits cm
      JOIN 
        repositories r ON cm.repository_id = r.id
      WHERE 
        cm.contributor_id = ?
      ORDER BY 
        cm.committed_at DESC
      LIMIT 10
    `;
    
    const commitsResult = await pool.query(commitsQuery, [contributor.id]);
    
    // Get merge requests by contributor
    const mergeRequestsQuery = `
      SELECT 
        mr.*,
        r.full_name AS repository_name
      FROM 
        merge_requests mr
      JOIN 
        repositories r ON mr.repository_id = r.id
      WHERE 
        mr.author_id = ?
      ORDER BY 
        mr.created_at DESC
      LIMIT 10
    `;
    
    const mergeRequestsResult = await pool.query(mergeRequestsQuery, [contributor.id]);
    
    // Return all data
    res.json({
      ...contributor,
      repositories: reposResult.rows,
      recent_commits: commitsResult.rows,
      merge_requests: mergeRequestsResult.rows
    });
  } catch (error) {
    handleDbError(error, res);
  }
}

/**
 * Get contributor by GitHub ID or username
 */
export async function getContributorByLogin(req, res) {
  // Get parameter from either login or id parameter
  const login = req.params.login || req.params.id;
  
  if (!login) {
    return res.status(400).json({ error: 'Contributor identifier is required' });
  }
  
  try {
    console.log(`[Server] Looking up contributor with identifier: ${login}`);
    
    // Get contributor details - use proper SQLite syntax for type conversion
    const contributorQuery = `
      SELECT 
        c.*,
        COUNT(DISTINCT cm.id) AS commit_count,
        COUNT(DISTINCT mr.id) AS merge_request_count
      FROM 
        contributors c
      LEFT JOIN 
        commits cm ON c.id = cm.contributor_id
      LEFT JOIN 
        merge_requests mr ON c.id = mr.author_id
      WHERE 
        c.github_id = ? OR c.username = ?
      GROUP BY 
        c.id
    `;
    
    const contributorResult = await pool.query(contributorQuery, [login, login]);
    
    if (contributorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contributor not found' });
    }
    
    const contributor = contributorResult.rows[0];
    
    // Get repositories the contributor has contributed to
    const reposQuery = `
      SELECT DISTINCT 
        r.*,
        COUNT(DISTINCT cm.id) AS commit_count
      FROM 
        repositories r
      JOIN 
        commits cm ON r.id = cm.repository_id
      WHERE 
        cm.contributor_id = ?
      GROUP BY 
        r.id
      ORDER BY 
        commit_count DESC
      LIMIT 5
    `;
    
    const reposResult = await pool.query(reposQuery, [contributor.id]);
    
    // Get recent commits by contributor
    const commitsQuery = `
      SELECT 
        cm.*,
        r.full_name AS repository_name
      FROM 
        commits cm
      JOIN 
        repositories r ON cm.repository_id = r.id
      WHERE 
        cm.contributor_id = ?
      ORDER BY 
        cm.committed_at DESC
      LIMIT 10
    `;
    
    const commitsResult = await pool.query(commitsQuery, [contributor.id]);
    
    // Get merge requests by contributor
    const mergeRequestsQuery = `
      SELECT 
        mr.*,
        r.full_name AS repository_name
      FROM 
        merge_requests mr
      JOIN 
        repositories r ON mr.repository_id = r.id
      WHERE 
        mr.author_id = ?
      ORDER BY 
        mr.created_at DESC
      LIMIT 10
    `;
    
    const mergeRequestsResult = await pool.query(mergeRequestsQuery, [contributor.id]);
    
    // Return all data
    res.json({
      ...contributor,
      repositories: reposResult.rows,
      recent_commits: commitsResult.rows,
      merge_requests: mergeRequestsResult.rows
    });
  } catch (error) {
    handleDbError(error, res);
  }
} 