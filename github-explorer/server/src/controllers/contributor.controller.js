/**
 * Contributor Controller
 * 
 * Handles API endpoints for contributor operations
 */

import { processContributorData } from '../services/github/contributor.service.js';
import { 
  storeContributorData, 
  getContributorByUsername, 
  getAllContributors,
  getTopContributors,
  updateContributor,
  linkContributorToRepository,
  getContributorsForRepository
} from '../services/supabase/contributor.service.js';
import { githubClient } from '../services/github-client.js';
import { logger } from '../utils/logger.js';

/**
 * Add or update a contributor from GitHub
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function addContributor(req, res) {
  const { username } = req.params;
  
  if (!username) {
    return res.status(400).json({
      error: 'Missing required parameter',
      message: 'Username parameter is required'
    });
  }
  
  try {
    logger.info(`Adding/updating contributor: ${username}`);
    
    // Fetch contributor data from GitHub
    const userData = await githubClient.octokit.rest.users.getByUsername({
      username
    }).then(response => response.data);
    
    // Process and enrich contributor data
    const processedData = await processContributorData(userData, githubClient.octokit);
    
    // Store in Supabase
    const result = await storeContributorData(processedData);
    
    return res.status(result.operation === 'insert' ? 201 : 200).json({
      message: `Contributor ${username} successfully ${result.operation === 'insert' ? 'added' : 'updated'}`,
      data: result.data[0]
    });
  } catch (error) {
    logger.error(`Error adding contributor ${username}: ${error.message}`, { error });
    
    return res.status(500).json({
      error: 'Failed to add contributor',
      message: error.message
    });
  }
}

/**
 * Get contributor information by username
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getContributor(req, res) {
  const { username } = req.params;
  
  try {
    const contributor = await getContributorByUsername(username);
    
    if (!contributor) {
      return res.status(404).json({
        error: 'Contributor not found',
        message: `Contributor ${username} not found in the database`
      });
    }
    
    return res.status(200).json({
      data: contributor
    });
  } catch (error) {
    logger.error(`Error retrieving contributor ${username}: ${error.message}`, { error });
    
    return res.status(500).json({
      error: 'Failed to retrieve contributor',
      message: error.message
    });
  }
}

/**
 * Get all contributors with pagination and filtering
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function listContributors(req, res) {
  const {
    enriched,
    limit = 10,
    offset = 0,
    orderBy = 'impact_score',
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
    
    const results = await getAllContributors(options);
    
    return res.status(200).json({
      data: results.data,
      meta: {
        count: results.count,
        ...results.pagination
      }
    });
  } catch (error) {
    logger.error(`Error listing contributors: ${error.message}`, { error });
    
    return res.status(500).json({
      error: 'Failed to list contributors',
      message: error.message
    });
  }
}

/**
 * Get top contributors by impact score
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getTop(req, res) {
  const { limit = 10 } = req.query;
  
  try {
    const parsedLimit = parseInt(limit, 10);
    const contributors = await getTopContributors(parsedLimit);
    
    return res.status(200).json({
      data: contributors,
      meta: {
        count: contributors.length
      }
    });
  } catch (error) {
    logger.error(`Error retrieving top contributors: ${error.message}`, { error });
    
    return res.status(500).json({
      error: 'Failed to retrieve top contributors',
      message: error.message
    });
  }
}

/**
 * Get contributors for a specific repository
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getByRepository(req, res) {
  const { repositoryId } = req.params;
  const { limit = 10 } = req.query;
  
  if (!repositoryId || isNaN(parseInt(repositoryId, 10))) {
    return res.status(400).json({
      error: 'Invalid repository ID',
      message: 'A valid numeric repository ID is required'
    });
  }
  
  try {
    const parsedLimit = parseInt(limit, 10);
    const repoId = parseInt(repositoryId, 10);
    
    const contributors = await getContributorsForRepository(repoId, parsedLimit);
    
    return res.status(200).json({
      data: contributors,
      meta: {
        count: contributors.length,
        repositoryId: repoId
      }
    });
  } catch (error) {
    logger.error(`Error retrieving contributors for repository ${repositoryId}: ${error.message}`, { error });
    
    return res.status(500).json({
      error: 'Failed to retrieve contributors for repository',
      message: error.message
    });
  }
}

/**
 * Link a contributor to a repository with contribution count
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function linkToRepository(req, res) {
  const { contributorId, repositoryId } = req.params;
  const { contributionCount = 1 } = req.body;
  
  if (!contributorId || !repositoryId || isNaN(parseInt(repositoryId, 10))) {
    return res.status(400).json({
      error: 'Missing or invalid parameters',
      message: 'Valid contributor ID and repository ID are required'
    });
  }
  
  try {
    const repoId = parseInt(repositoryId, 10);
    const count = parseInt(contributionCount, 10);
    
    const result = await linkContributorToRepository(contributorId, repoId, count);
    
    return res.status(result.operation === 'insert' ? 201 : 200).json({
      message: `Contributor ${contributorId} successfully ${result.operation === 'insert' ? 'linked to' : 'updated for'} repository ${repositoryId}`,
      data: result.data[0]
    });
  } catch (error) {
    logger.error(`Error linking contributor ${contributorId} to repository ${repositoryId}: ${error.message}`, { error });
    
    return res.status(500).json({
      error: 'Failed to link contributor to repository',
      message: error.message
    });
  }
}

/**
 * Refresh contributor data from GitHub
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function refreshContributor(req, res) {
  const { username } = req.params;
  
  try {
    // First check if contributor exists in database
    const existingContributor = await getContributorByUsername(username);
    
    if (!existingContributor) {
      return res.status(404).json({
        error: 'Contributor not found',
        message: `Contributor ${username} not found in the database`
      });
    }
    
    // Fetch fresh data from GitHub
    const userData = await githubClient.octokit.rest.users.getByUsername({
      username
    }).then(response => response.data);
    
    // Process and enrich data
    const processedData = await processContributorData(userData, githubClient.octokit);
    
    // Update in database
    const updatedData = await updateContributor(existingContributor.id, processedData);
    
    return res.status(200).json({
      message: `Contributor ${username} successfully refreshed`,
      data: updatedData[0]
    });
  } catch (error) {
    logger.error(`Error refreshing contributor ${username}: ${error.message}`, { error });
    
    return res.status(500).json({
      error: 'Failed to refresh contributor',
      message: error.message
    });
  }
}

export default {
  addContributor,
  getContributor,
  listContributors,
  getTop,
  getByRepository,
  linkToRepository,
  refreshContributor
}; 