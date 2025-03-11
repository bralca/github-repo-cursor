import { Octokit } from 'octokit';
import { logger } from '../utils/logger.js';

// Create a GitHub client with authentication and error handling
export class GitHubClient {
  constructor(token) {
    if (!token) {
      logger.warn('GitHub token not provided. Rate limits will be severely restricted.');
    }

    this.octokit = new Octokit({
      auth: token,
      throttle: {
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
          logger.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
          
          if (retryCount < 2) {
            logger.info(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
          
          return false;
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
          logger.warn(`Secondary rate limit detected for ${options.method} ${options.url}`);
          return true;
        },
      }
    });
    
    logger.info('GitHub client initialized');
  }

  /**
   * Get repository information
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Repository data
   */
  async getRepository(owner, repo) {
    try {
      logger.debug(`Fetching repository: ${owner}/${repo}`);
      const { data } = await this.octokit.rest.repos.get({
        owner,
        repo
      });
      
      return data;
    } catch (error) {
      logger.error(`Failed to fetch repository ${owner}/${repo}`, error);
      throw new Error(`Failed to fetch repository: ${error.message}`);
    }
  }

  /**
   * Get repository contributors
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Array>} Contributors data
   */
  async getContributors(owner, repo) {
    try {
      logger.debug(`Fetching contributors for repository: ${owner}/${repo}`);
      const { data } = await this.octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 100
      });
      
      return data;
    } catch (error) {
      logger.error(`Failed to fetch contributors for ${owner}/${repo}`, error);
      throw new Error(`Failed to fetch contributors: ${error.message}`);
    }
  }

  /**
   * Get pull requests for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Options for the request
   * @returns {Promise<Array>} Pull requests data
   */
  async getPullRequests(owner, repo, options = { state: 'all', per_page: 100 }) {
    try {
      logger.debug(`Fetching pull requests for repository: ${owner}/${repo}`);
      const { data } = await this.octokit.rest.pulls.list({
        owner,
        repo,
        ...options
      });
      
      return data;
    } catch (error) {
      logger.error(`Failed to fetch pull requests for ${owner}/${repo}`, error);
      throw new Error(`Failed to fetch pull requests: ${error.message}`);
    }
  }

  /**
   * Get commits for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} options - Options for the request
   * @returns {Promise<Array>} Commits data
   */
  async getCommits(owner, repo, options = { per_page: 100 }) {
    try {
      logger.debug(`Fetching commits for repository: ${owner}/${repo}`);
      const { data } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        ...options
      });
      
      return data;
    } catch (error) {
      logger.error(`Failed to fetch commits for ${owner}/${repo}`, error);
      throw new Error(`Failed to fetch commits: ${error.message}`);
    }
  }

  /**
   * Get rate limit information
   * @returns {Promise<Object>} Rate limit data
   */
  async getRateLimit() {
    try {
      const { data } = await this.octokit.rest.rateLimit.get();
      return data.resources;
    } catch (error) {
      logger.error('Failed to fetch rate limit information', error);
      throw new Error(`Failed to fetch rate limit: ${error.message}`);
    }
  }
}

// Export a singleton instance with the GitHub token from environment
export const githubClient = new GitHubClient(process.env.GITHUB_TOKEN); 