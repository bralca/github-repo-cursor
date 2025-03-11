import { githubClient } from '../services/github-client.js';
import { logger } from '../utils/logger.js';

/**
 * Get repository information
 */
export const getRepository = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    if (!owner || !repo) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Owner and repo parameters are required'
      });
    }
    
    const data = await githubClient.getRepository(owner, repo);
    
    return res.json({
      data,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching repository:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get repository contributors
 */
export const getContributors = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    if (!owner || !repo) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Owner and repo parameters are required'
      });
    }
    
    const data = await githubClient.getContributors(owner, repo);
    
    return res.json({
      data,
      meta: {
        timestamp: new Date().toISOString(),
        count: data.length
      }
    });
  } catch (error) {
    logger.error('Error fetching contributors:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get pull requests for a repository
 */
export const getPullRequests = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { state = 'all', per_page = 100 } = req.query;
    
    if (!owner || !repo) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Owner and repo parameters are required'
      });
    }
    
    const data = await githubClient.getPullRequests(owner, repo, { 
      state, 
      per_page: parseInt(per_page, 10) 
    });
    
    return res.json({
      data,
      meta: {
        timestamp: new Date().toISOString(),
        count: data.length
      }
    });
  } catch (error) {
    logger.error('Error fetching pull requests:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get commits for a repository
 */
export const getCommits = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { per_page = 100, sha, path } = req.query;
    
    if (!owner || !repo) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Owner and repo parameters are required'
      });
    }
    
    const options = { 
      per_page: parseInt(per_page, 10)
    };
    
    if (sha) options.sha = sha;
    if (path) options.path = path;
    
    const data = await githubClient.getCommits(owner, repo, options);
    
    return res.json({
      data,
      meta: {
        timestamp: new Date().toISOString(),
        count: data.length
      }
    });
  } catch (error) {
    logger.error('Error fetching commits:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get GitHub API rate limit information
 */
export const getRateLimit = async (req, res) => {
  try {
    const data = await githubClient.getRateLimit();
    
    return res.json({
      data,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching rate limit:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}; 