import { pool } from '../../db/db-pool.js';
import { handleDbError } from '../../utils/db-utils.js';
import { cacheOrCompute, generateCacheKey } from '../../utils/cache.js';
import { setupLogger } from '../../utils/logger.js';

// Setup component logger
const logger = setupLogger('repositories-controller');

// Cache prefix for repositories
const CACHE_PREFIX = 'repositories';

// Default TTL for repositories (1 hour)
const REPOSITORIES_TTL = 3600; // seconds

/**
 * Get all repositories with pagination
 */
export async function getRepositories(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Generate cache key based on pagination parameters
    const cacheKey = generateCacheKey(CACHE_PREFIX, { page, limit });
    
    // Use cache-or-compute pattern
    const result = await cacheOrCompute(
      cacheKey,
      async () => {
        logger.info('Cache miss - fetching repositories from database');
        
        // Get total count for pagination
        const countResult = await pool.query('SELECT COUNT(*) FROM repositories');
        const totalCount = parseInt(countResult.rows[0].count);
        
        // Get repositories with pagination
        const repositoriesQuery = `
          SELECT 
            *
          FROM 
            repositories
          ORDER BY 
            stars DESC, forks DESC
          LIMIT $1 OFFSET $2
        `;
        
        const result = await pool.query(repositoriesQuery, [limit, offset]);
        
        return {
          data: result.rows,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        };
      },
      REPOSITORIES_TTL
    );
    
    res.json(result);
  } catch (error) {
    logger.error('Error fetching repositories:', error);
    handleDbError(error, res);
  }
}

/**
 * Get repository by ID
 */
export async function getRepositoryById(req, res) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Repository ID is required' });
  }
  
  try {
    logger.info(`Looking up repository with GitHub ID: ${id}`);
    
    // Get repository details - modified to search by github_id instead of id
    const repoQuery = `
      SELECT 
        *
      FROM 
        repositories
      WHERE 
        github_id = $1
    `;
    
    const repoResult = await pool.query(repoQuery, [id]);
    
    if (repoResult.rows.length === 0) {
      logger.info(`Repository with GitHub ID ${id} not found`);
      return res.status(404).json({ error: 'Repository not found' });
    }
    
    const repository = repoResult.rows[0];
    logger.info(`Found repository: ${repository.full_name}`);
    
    // Get top contributors for this repository
    const contributorsQuery = `
      SELECT 
        c.*,
        COUNT(cm.id) AS commit_count
      FROM 
        contributors c
      JOIN 
        commits cm ON c.id = cm.contributor_id
      WHERE 
        cm.repository_id = $1
      GROUP BY 
        c.id
      ORDER BY 
        commit_count DESC
      LIMIT 10
    `;
    
    const contributorsResult = await pool.query(contributorsQuery, [repository.id]);
    
    // Get merge requests for this repository
    const mergeRequestsQuery = `
      SELECT 
        *
      FROM 
        merge_requests
      WHERE 
        repository_id = $1
      ORDER BY 
        created_at DESC
      LIMIT 10
    `;
    
    const mergeRequestsResult = await pool.query(mergeRequestsQuery, [repository.id]);
    
    // Get commits for this repository
    const commitsQuery = `
      SELECT 
        *
      FROM 
        commits
      WHERE 
        repository_id = $1
      ORDER BY 
        committed_at DESC
      LIMIT 10
    `;
    
    const commitsResult = await pool.query(commitsQuery, [repository.id]);
    
    // Return all data
    res.json({
      ...repository,
      contributors: contributorsResult.rows,
      merge_requests: mergeRequestsResult.rows,
      commits: commitsResult.rows
    });
  } catch (error) {
    handleDbError(error, res);
  }
}

/**
 * Get repository by slug (full_name)
 */
export async function getRepositoryBySlug(req, res) {
  const { slug } = req.params;
  
  if (!slug) {
    return res.status(400).json({ error: 'Repository slug is required' });
  }
  
  try {
    // Get repository details
    const repoQuery = `
      SELECT 
        *
      FROM 
        repositories
      WHERE 
        full_name = $1
    `;
    
    const repoResult = await pool.query(repoQuery, [slug]);
    
    if (repoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Repository not found' });
    }
    
    const repository = repoResult.rows[0];
    
    // Get top contributors for this repository
    const contributorsQuery = `
      SELECT 
        c.*,
        COUNT(cm.id) AS commit_count
      FROM 
        contributors c
      JOIN 
        commits cm ON c.id = cm.contributor_id
      WHERE 
        cm.repository_id = $1
      GROUP BY 
        c.id
      ORDER BY 
        commit_count DESC
      LIMIT 10
    `;
    
    const contributorsResult = await pool.query(contributorsQuery, [repository.id]);
    
    // Get merge requests for this repository
    const mergeRequestsQuery = `
      SELECT 
        *
      FROM 
        merge_requests
      WHERE 
        repository_id = $1
      ORDER BY 
        created_at DESC
      LIMIT 10
    `;
    
    const mergeRequestsResult = await pool.query(mergeRequestsQuery, [repository.id]);
    
    // Get commits for this repository
    const commitsQuery = `
      SELECT 
        *
      FROM 
        commits
      WHERE 
        repository_id = $1
      ORDER BY 
        committed_at DESC
      LIMIT 10
    `;
    
    const commitsResult = await pool.query(commitsQuery, [repository.id]);
    
    // Return all data
    res.json({
      ...repository,
      contributors: contributorsResult.rows,
      merge_requests: mergeRequestsResult.rows,
      commits: commitsResult.rows
    });
  } catch (error) {
    handleDbError(error, res);
  }
} 