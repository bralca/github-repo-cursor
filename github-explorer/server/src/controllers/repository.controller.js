/**
 * Repository Controller
 * 
 * Handles API endpoints for repository operations
 */

import { transformRepositoryData, enrichRepositoryData } from '../services/github/repository.service.js';
import { 
  storeRepositoryData, 
  getRepositoryByName, 
  getAllRepositories,
  updateRepository,
  deleteRepository
} from '../services/supabase/repository.service.js';
import { githubClient } from '../services/github-client.js';
import { logger } from '../utils/logger.js';

/**
 * Get a repository from GitHub and store it in Supabase
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function addRepository(req, res) {
  const { owner, repo } = req.params;
  
  if (!owner || !repo) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: 'Both owner and repo parameters are required'
    });
  }
  
  try {
    logger.info(`Adding repository ${owner}/${repo}`);
    
    // Fetch repository from GitHub
    const repoData = await githubClient.getRepository(owner, repo);
    
    // Transform GitHub data to match our schema
    const transformedData = transformRepositoryData(repoData);
    
    // Enrich with additional data
    const enrichedData = await enrichRepositoryData(transformedData, githubClient.octokit);
    
    // Store in Supabase
    const result = await storeRepositoryData(enrichedData);
    
    return res.status(result.operation === 'insert' ? 201 : 200).json({
      message: `Repository ${owner}/${repo} successfully ${result.operation === 'insert' ? 'added' : 'updated'}`,
      data: result.data[0]
    });
  } catch (error) {
    logger.error(`Error adding repository ${owner}/${repo}: ${error.message}`, { error });
    
    return res.status(500).json({
      error: 'Failed to add repository',
      message: error.message
    });
  }
}

/**
 * Get repository information from the database
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getRepository(req, res) {
  const { owner, repo } = req.params;
  const fullName = `${owner}/${repo}`;
  
  try {
    const repository = await getRepositoryByName(fullName);
    
    if (!repository) {
      return res.status(404).json({
        error: 'Repository not found',
        message: `Repository ${fullName} not found in the database`
      });
    }
    
    return res.status(200).json({
      data: repository
    });
  } catch (error) {
    logger.error(`Error retrieving repository ${fullName}: ${error.message}`, { error });
    
    return res.status(500).json({
      error: 'Failed to retrieve repository',
      message: error.message
    });
  }
}

/**
 * Get all repositories with optional filtering
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function listRepositories(req, res) {
  const {
    enriched,
    limit = 10,
    offset = 0,
    orderBy = 'stars',
    orderDirection = 'desc'
  } = req.query;
  
  try {
    // Parse query parameters
    const options = {
      isEnriched: enriched !== undefined ? enriched === 'true' : null,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      orderBy,
      orderDirection
    };
    
    const results = await getAllRepositories(options);
    
    return res.status(200).json({
      data: results.data,
      meta: {
        count: results.count,
        ...results.pagination
      }
    });
  } catch (error) {
    logger.error(`Error listing repositories: ${error.message}`, { error });
    
    return res.status(500).json({
      error: 'Failed to list repositories',
      message: error.message
    });
  }
}

/**
 * Update repository data by refreshing from GitHub
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function refreshRepository(req, res) {
  const { owner, repo } = req.params;
  
  try {
    // First check if repository exists in our database
    const fullName = `${owner}/${repo}`;
    const existingRepo = await getRepositoryByName(fullName);
    
    if (!existingRepo) {
      return res.status(404).json({
        error: 'Repository not found',
        message: `Repository ${fullName} not found in the database`
      });
    }
    
    // Fetch fresh data from GitHub
    const repoData = await githubClient.getRepository(owner, repo);
    
    // Transform and enrich data
    const transformedData = transformRepositoryData(repoData);
    const enrichedData = await enrichRepositoryData(transformedData, githubClient.octokit);
    
    // Update in database
    const updatedData = await updateRepository(existingRepo.id, enrichedData);
    
    return res.status(200).json({
      message: `Repository ${fullName} successfully refreshed`,
      data: updatedData[0]
    });
  } catch (error) {
    logger.error(`Error refreshing repository ${owner}/${repo}: ${error.message}`, { error });
    
    return res.status(500).json({
      error: 'Failed to refresh repository',
      message: error.message
    });
  }
}

/**
 * Remove a repository from the database
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function removeRepository(req, res) {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id, 10))) {
    return res.status(400).json({
      error: 'Invalid repository ID',
      message: 'A valid numeric repository ID is required'
    });
  }
  
  try {
    const repositoryId = parseInt(id, 10);
    const success = await deleteRepository(repositoryId);
    
    if (success) {
      return res.status(200).json({
        message: `Repository with ID ${repositoryId} successfully removed`
      });
    } else {
      return res.status(404).json({
        error: 'Repository not found',
        message: `Repository with ID ${repositoryId} not found or could not be deleted`
      });
    }
  } catch (error) {
    logger.error(`Error removing repository with ID ${id}: ${error.message}`, { error });
    
    return res.status(500).json({
      error: 'Failed to remove repository',
      message: error.message
    });
  }
}

export default {
  addRepository,
  getRepository,
  listRepositories,
  refreshRepository,
  removeRepository
}; 