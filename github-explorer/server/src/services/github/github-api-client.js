import { Octokit } from '@octokit/rest';
import { logger } from '../../utils/logger.js';
import { githubClientFactory } from './github-client.js';

/**
 * GitHub API Client
 * 
 * High-level client for GitHub API operations, providing methods specifically
 * designed for the data pipeline functionality.
 */
export class GitHubApiClient {
  /**
   * Create a new GitHub API client
   * @param {Object} options - Client options
   */
  constructor(options = {}) {
    this.clientId = options.clientId || 'pipeline-test';
    this.token = options.token || process.env.GITHUB_TOKEN;
    
    if (!this.token) {
      logger.warn('No GitHub token provided - API calls may be rate limited');
    }
    
    // Create an Octokit client using the factory
    this.octokit = githubClientFactory.createClient({
      clientId: this.clientId, 
      token: this.token
    });
    
    logger.info(`GitHubApiClient initialized with client ID: ${this.clientId}`);
  }
  
  /**
   * Get repository details
   * @param {string} fullName - Full repository name (owner/repo)
   * @returns {Promise<Object>} Repository data
   */
  async getRepository(fullName) {
    try {
      logger.info(`Fetching repository: ${fullName}`);
      
      const [owner, repo] = fullName.split('/');
      
      if (!owner || !repo) {
        throw new Error(`Invalid repository name: ${fullName}. Format should be 'owner/repo'`);
      }
      
      const { data } = await this.octokit.repos.get({
        owner,
        repo
      });
      
      return data;
    } catch (error) {
      logger.error(`Failed to fetch repository: ${fullName}`, { error });
      throw new Error(`Failed to fetch repository: ${error.message}`);
    }
  }
  
  /**
   * Get repository language breakdown
   * @param {string} fullName - Full repository name (owner/repo)
   * @returns {Promise<Object>} Language data
   */
  async getRepositoryLanguages(fullName) {
    try {
      logger.info(`Fetching languages for repository: ${fullName}`);
      
      const [owner, repo] = fullName.split('/');
      
      if (!owner || !repo) {
        throw new Error(`Invalid repository name: ${fullName}. Format should be 'owner/repo'`);
      }
      
      const { data } = await this.octokit.repos.listLanguages({
        owner,
        repo
      });
      
      return data;
    } catch (error) {
      logger.error(`Failed to fetch language data: ${fullName}`, { error });
      throw new Error(`Failed to fetch language data: ${error.message}`);
    }
  }
  
  /**
   * Get pull requests for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} state - Pull request state ('open', 'closed', 'all')
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Pull request data with response headers
   */
  async getPullRequests(owner, repo, state = 'all', options = {}) {
    try {
      logger.info(`Fetching pull requests for repository: ${owner}/${repo}`);
      
      const response = await this.octokit.pulls.list({
        owner,
        repo,
        state,
        ...options
      });
      
      return {
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      logger.error(`Failed to fetch pull requests: ${owner}/${repo}`, { error });
      throw new Error(`Failed to fetch pull requests: ${error.message}`);
    }
  }
  
  /**
   * Get details for a specific pull request
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} pullNumber - Pull request number
   * @returns {Promise<Object>} Pull request data
   */
  async getPullRequest(owner, repo, pullNumber) {
    try {
      // Validate inputs
      if (!owner || typeof owner !== 'string') {
        throw new Error(`Invalid owner parameter: ${owner}`);
      }
      
      if (!repo || typeof repo !== 'string') {
        throw new Error(`Invalid repo parameter: ${repo}`);
      }
      
      // Ensure pullNumber is a number
      const prNumber = parseInt(pullNumber, 10);
      if (isNaN(prNumber) || prNumber <= 0) {
        throw new Error(`Invalid pull request number: ${pullNumber}`);
      }
      
      logger.info(`Fetching pull request #${prNumber} for ${owner}/${repo}`);
      
      const { data } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber
      });
      
      return data;
    } catch (error) {
      logger.error(`Failed to fetch pull request #${pullNumber} for ${owner}/${repo}`, { 
        error,
        owner,
        repo,
        pullNumber 
      });
      throw new Error(`Failed to fetch pull request: ${error.message}`);
    }
  }
  
  /**
   * Get commits for a specific pull request
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} pullNumber - Pull request number
   * @returns {Promise<Object>} Commit data with response headers
   */
  async getPullRequestCommits(owner, repo, pullNumber) {
    try {
      // Validate inputs
      if (!owner || typeof owner !== 'string') {
        throw new Error(`Invalid owner parameter: ${owner}`);
      }
      
      if (!repo || typeof repo !== 'string') {
        throw new Error(`Invalid repo parameter: ${repo}`);
      }
      
      // Ensure pullNumber is a number
      const prNumber = parseInt(pullNumber, 10);
      if (isNaN(prNumber) || prNumber <= 0) {
        throw new Error(`Invalid pull request number: ${pullNumber}`);
      }
      
      logger.info(`Fetching commits for pull request #${prNumber} for ${owner}/${repo}`);
      
      const response = await this.octokit.pulls.listCommits({
        owner,
        repo,
        pull_number: prNumber,
        per_page: 100
      });
      
      return {
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      logger.error(`Failed to fetch commits for PR #${pullNumber} for ${owner}/${repo}`, {
        error,
        owner,
        repo,
        pullNumber
      });
      throw new Error(`Failed to fetch pull request commits: ${error.message}`);
    }
  }
  
  /**
   * Get reviews for a specific pull request
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} pullNumber - Pull request number
   * @returns {Promise<Array>} Review data
   */
  async getPullRequestReviews(owner, repo, pullNumber) {
    try {
      // Validate inputs
      if (!owner || typeof owner !== 'string') {
        throw new Error(`Invalid owner parameter: ${owner}`);
      }
      
      if (!repo || typeof repo !== 'string') {
        throw new Error(`Invalid repo parameter: ${repo}`);
      }
      
      // Ensure pullNumber is a number
      const prNumber = parseInt(pullNumber, 10);
      if (isNaN(prNumber) || prNumber <= 0) {
        throw new Error(`Invalid pull request number: ${pullNumber}`);
      }
      
      logger.info(`Fetching reviews for pull request #${prNumber} for ${owner}/${repo}`);
      
      const { data } = await this.octokit.pulls.listReviews({
        owner,
        repo,
        pull_number: prNumber
      });
      
      return data;
    } catch (error) {
      logger.error(`Failed to fetch reviews for PR #${pullNumber} for ${owner}/${repo}`, {
        error,
        owner,
        repo,
        pullNumber
      });
      throw new Error(`Failed to fetch pull request reviews: ${error.message}`);
    }
  }
  
  /**
   * Get review comments for a specific pull request
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} pullNumber - Pull request number
   * @returns {Promise<Array>} Comment data
   */
  async getPullRequestComments(owner, repo, pullNumber) {
    try {
      // Validate inputs
      if (!owner || typeof owner !== 'string') {
        throw new Error(`Invalid owner parameter: ${owner}`);
      }
      
      if (!repo || typeof repo !== 'string') {
        throw new Error(`Invalid repo parameter: ${repo}`);
      }
      
      // Ensure pullNumber is a number
      const prNumber = parseInt(pullNumber, 10);
      if (isNaN(prNumber) || prNumber <= 0) {
        throw new Error(`Invalid pull request number: ${pullNumber}`);
      }
      
      logger.info(`Fetching comments for pull request #${prNumber} for ${owner}/${repo}`);
      
      const { data } = await this.octokit.pulls.listReviewComments({
        owner,
        repo,
        pull_number: prNumber,
        per_page: 100
      });
      
      return data;
    } catch (error) {
      logger.error(`Failed to fetch comments for PR #${pullNumber} for ${owner}/${repo}`, {
        error,
        owner,
        repo,
        pullNumber
      });
      throw new Error(`Failed to fetch pull request comments: ${error.message}`);
    }
  }
  
  /**
   * Get user details
   * @param {string} username - GitHub username
   * @returns {Promise<Object>} User data
   */
  async getUser(username) {
    try {
      logger.info(`Fetching user: ${username}`);
      
      const { data } = await this.octokit.users.getByUsername({
        username
      });
      
      return data;
    } catch (error) {
      logger.error(`Failed to fetch user: ${username}`, { error });
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }
  
  /**
   * Get user details by ID
   * @param {number} userId - GitHub user ID
   * @returns {Promise<Object>} User data
   */
  async getUserById(userId) {
    try {
      logger.info(`Fetching user by ID: ${userId}`);
      
      const { data } = await this.octokit.request('GET /user/{id}', {
        id: userId,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      return data;
    } catch (error) {
      logger.error(`Failed to fetch user by ID: ${userId}`, { error });
      throw new Error(`Failed to fetch user by ID: ${error.message}`);
    }
  }
  
  /**
   * Get commit details
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} commitSha - Commit SHA
   * @returns {Promise<Object>} Commit data
   */
  async getCommit(owner, repo, commitSha) {
    try {
      // Validate inputs
      if (!owner || typeof owner !== 'string') {
        throw new Error(`Invalid owner parameter: ${owner}`);
      }
      
      if (!repo || typeof repo !== 'string') {
        throw new Error(`Invalid repo parameter: ${repo}`);
      }
      
      if (!commitSha || typeof commitSha !== 'string') {
        throw new Error(`Invalid commit SHA: ${commitSha}`);
      }
      
      logger.info(`Fetching commit: ${commitSha.substring(0, 7)} for ${owner}/${repo}`);
      
      const { data } = await this.octokit.repos.getCommit({
        owner,
        repo,
        ref: commitSha
      });
      
      return data;
    } catch (error) {
      logger.error(`Failed to fetch commit: ${commitSha ? commitSha.substring(0, 7) : 'unknown'} for ${owner}/${repo}`, {
        error,
        owner, 
        repo,
        commitSha
      });
      throw new Error(`Failed to fetch commit: ${error.message}`);
    }
  }
  
  /**
   * Check API rate limits
   * @returns {Promise<Object>} Rate limit data
   */
  async getRateLimits() {
    try {
      logger.info('Checking GitHub API rate limits');
      
      const { data } = await this.octokit.rateLimit.get();
      
      // Log detailed rate limit information
      logger.info('GitHub API rate limits:', {
        core: data.resources.core,
        search: data.resources.search,
        graphql: data.resources.graphql
      });
      
      return data;
    } catch (error) {
      logger.error('Failed to check rate limits', { error });
      throw new Error(`Failed to check rate limits: ${error.message}`);
    }
  }
  
  /**
   * Get files changed in a pull request
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} pullNumber - Pull request number
   * @returns {Promise<Object>} Pull request files data with response headers
   */
  async getPullRequestFiles(owner, repo, pullNumber) {
    try {
      // Validate inputs
      if (!owner || typeof owner !== 'string') {
        throw new Error(`Invalid owner parameter: ${owner}`);
      }
      
      if (!repo || typeof repo !== 'string') {
        throw new Error(`Invalid repo parameter: ${repo}`);
      }
      
      // Ensure pullNumber is a number
      const prNumber = parseInt(pullNumber, 10);
      if (isNaN(prNumber) || prNumber <= 0) {
        throw new Error(`Invalid pull request number: ${pullNumber}`);
      }
      
      logger.info(`Fetching files for pull request #${prNumber} for ${owner}/${repo}`);
      
      const response = await this.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
        per_page: 100
      });
      
      return {
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      logger.error(`Failed to fetch files for PR #${pullNumber} for ${owner}/${repo}`, {
        error,
        owner,
        repo,
        pullNumber
      });
      throw new Error(`Failed to fetch pull request files: ${error.message}`);
    }
  }
  
  async listPublicEvents(options = {}) {
    try {
      logger.info(`GitHub API: Fetching public events`, {
        options: JSON.stringify(options),
        clientId: this.clientId
      });
      
      const response = await this.octokit.activity.listPublicEvents({
        per_page: options.per_page || 100,
        ...options
      });
      
      // Log API response details
      logger.info(`GitHub API: Public events fetched successfully`, {
        status: response.status,
        items_count: response.data?.length || 0,
        rate_limit_remaining: response.headers?.['x-ratelimit-remaining'],
        rate_limit_reset: response.headers?.['x-ratelimit-reset']
      });
      
      return response;
    } catch (error) {
      logger.error(`GitHub API: Error fetching public events`, {
        error: error.message,
        status: error.status,
        headers: error.headers,
        clientId: this.clientId
      });
      throw error;
    }
  }
} 