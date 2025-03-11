/**
 * Merge Request Controller
 * 
 * This controller handles API endpoints related to GitHub merge requests (pull requests).
 * It provides endpoints for accessing, searching, and managing merge request data.
 */

import { logger } from '../utils/logger.js';
import { processResponse } from '../utils/response-handler.js';
import githubClient from '../services/github/client.js';
import { processMergeRequestData } from '../services/github/merge-request.service.js';
import * as mergeRequestService from '../services/supabase/merge-request.service.js';
import * as repositoryService from '../services/supabase/repository.service.js';

/**
 * Get all merge requests with optional filtering
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getAllMergeRequests(req, res) {
  try {
    const {
      repo_id: repositoryId,
      status,
      author,
      is_enriched: isEnriched,
      limit = 10,
      offset = 0,
      order_by: orderBy = 'updated_at',
      order_direction: orderDirection = 'desc'
    } = req.query;

    const options = {
      repositoryId: repositoryId ? parseInt(repositoryId, 10) : null,
      status,
      author,
      isEnriched: isEnriched === 'true',
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      orderBy,
      orderDirection
    };

    const result = await mergeRequestService.getAllMergeRequests(options);
    
    return processResponse(res, 200, {
      data: result.data,
      meta: {
        count: result.count,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Error retrieving merge requests: ${error.message}`, { error });
    return processResponse(res, 500, {
      error: 'Failed to retrieve merge requests',
      details: error.message
    });
  }
}

/**
 * Get a specific merge request by ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getMergeRequestById(req, res) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return processResponse(res, 400, {
        error: 'Missing merge request ID',
      });
    }
    
    const mergeRequest = await mergeRequestService.getMergeRequestById(parseInt(id, 10));
    
    if (!mergeRequest) {
      return processResponse(res, 404, {
        error: 'Merge request not found',
      });
    }
    
    return processResponse(res, 200, {
      data: mergeRequest,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Error retrieving merge request: ${error.message}`, {
      error,
      mergeRequestId: req.params.id
    });
    return processResponse(res, 500, {
      error: 'Failed to retrieve merge request',
      details: error.message
    });
  }
}

/**
 * Get merge requests for a specific repository
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getMergeRequestsByRepository(req, res) {
  try {
    const { repoId } = req.params;
    const {
      status,
      limit = 10,
      offset = 0,
      order_by: orderBy = 'updated_at',
      order_direction: orderDirection = 'desc'
    } = req.query;
    
    if (!repoId) {
      return processResponse(res, 400, {
        error: 'Missing repository ID',
      });
    }
    
    // Verify repository exists
    const repository = await repositoryService.getRepositoryById(parseInt(repoId, 10));
    
    if (!repository) {
      return processResponse(res, 404, {
        error: 'Repository not found',
      });
    }
    
    const options = {
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      orderBy,
      orderDirection
    };
    
    const result = await mergeRequestService.getMergeRequestsByRepository(
      parseInt(repoId, 10),
      options
    );
    
    return processResponse(res, 200, {
      data: result.data,
      meta: {
        repository_id: parseInt(repoId, 10),
        repository_name: repository.name,
        count: result.count,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Error retrieving repository merge requests: ${error.message}`, {
      error,
      repositoryId: req.params.repoId
    });
    return processResponse(res, 500, {
      error: 'Failed to retrieve repository merge requests',
      details: error.message
    });
  }
}

/**
 * Get merge requests by author
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getMergeRequestsByAuthor(req, res) {
  try {
    const { author } = req.params;
    const {
      status,
      limit = 10,
      offset = 0,
      order_by: orderBy = 'updated_at',
      order_direction: orderDirection = 'desc'
    } = req.query;
    
    if (!author) {
      return processResponse(res, 400, {
        error: 'Missing author username',
      });
    }
    
    const options = {
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      orderBy,
      orderDirection
    };
    
    const result = await mergeRequestService.getMergeRequestsByAuthor(author, options);
    
    return processResponse(res, 200, {
      data: result.data,
      meta: {
        author,
        count: result.count,
        pagination: result.pagination,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Error retrieving author merge requests: ${error.message}`, {
      error,
      author: req.params.author
    });
    return processResponse(res, 500, {
      error: 'Failed to retrieve author merge requests',
      details: error.message
    });
  }
}

/**
 * Fetch and store merge requests for a repository from GitHub
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function fetchAndStoreMergeRequests(req, res) {
  try {
    const { owner, repo } = req.params;
    const { state = 'all', per_page = 10 } = req.query;
    
    if (!owner || !repo) {
      return processResponse(res, 400, {
        error: 'Missing repository owner or name',
      });
    }
    
    // Find repository in database
    const repository = await repositoryService.getRepositoryByFullName(`${owner}/${repo}`);
    
    if (!repository) {
      return processResponse(res, 404, {
        error: 'Repository not found in database',
      });
    }
    
    logger.info(`Fetching pull requests for ${owner}/${repo}`, {
      owner,
      repo,
      state,
      per_page: parseInt(per_page, 10)
    });
    
    // Fetch pull requests from GitHub
    const octokit = await githubClient.getOctokit();
    
    const { data: pullRequests } = await octokit.rest.pulls.list({
      owner,
      repo,
      state,
      per_page: parseInt(per_page, 10),
      sort: 'updated',
      direction: 'desc'
    });
    
    logger.info(`Fetched ${pullRequests.length} pull requests from GitHub`);
    
    // Process and store each pull request
    const processedPRs = [];
    for (const pr of pullRequests) {
      try {
        // Process the pull request data
        const processedPR = await processMergeRequestData(pr, repository.id);
        
        // Store in database
        const result = await mergeRequestService.storeMergeRequestData(processedPR);
        
        processedPRs.push({
          id: processedPR.id,
          number: processedPR.number,
          title: processedPR.title,
          operation: result.operation
        });
      } catch (prError) {
        logger.error(`Error processing pull request #${pr.number}: ${prError.message}`, {
          error: prError,
          pr_number: pr.number
        });
      }
    }
    
    return processResponse(res, 200, {
      data: processedPRs,
      meta: {
        repository_id: repository.id,
        repository_name: `${owner}/${repo}`,
        total_processed: processedPRs.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Error fetching and storing pull requests: ${error.message}`, {
      error,
      owner: req.params.owner,
      repo: req.params.repo
    });
    return processResponse(res, 500, {
      error: 'Failed to fetch and store pull requests',
      details: error.message
    });
  }
}

/**
 * Get recent merge requests by status
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function getRecentMergeRequestsByStatus(req, res) {
  try {
    const { status } = req.params;
    const { limit = 10 } = req.query;
    
    if (!status || !['open', 'closed', 'merged'].includes(status)) {
      return processResponse(res, 400, {
        error: 'Invalid status value. Must be one of: open, closed, merged',
      });
    }
    
    const mergeRequests = await mergeRequestService.getRecentMergeRequestsByStatus(
      status,
      parseInt(limit, 10)
    );
    
    return processResponse(res, 200, {
      data: mergeRequests,
      meta: {
        status,
        count: mergeRequests.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Error retrieving recent merge requests: ${error.message}`, {
      error,
      status: req.params.status
    });
    return processResponse(res, 500, {
      error: 'Failed to retrieve recent merge requests',
      details: error.message
    });
  }
}

export default {
  getAllMergeRequests,
  getMergeRequestById,
  getMergeRequestsByRepository,
  getMergeRequestsByAuthor,
  fetchAndStoreMergeRequests,
  getRecentMergeRequestsByStatus
}; 