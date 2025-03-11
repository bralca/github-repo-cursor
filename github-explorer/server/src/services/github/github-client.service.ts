import { Octokit } from '@octokit/rest';
import { throttling } from '@octokit/plugin-throttling';
import { retry } from '@octokit/plugin-retry';
import githubConfig from '../../config/github.config';
import logger from '../../utils/logger';

// Create custom Octokit with plugins
const CustomOctokit = Octokit.plugin(throttling, retry);

/**
 * GitHub API client with rate limiting and retry functionality
 */
class GitHubClient {
  private octokit: Octokit;
  
  constructor() {
    this.octokit = new CustomOctokit({
      auth: githubConfig.GITHUB_TOKEN,
      baseUrl: githubConfig.GITHUB_API_URL,
      userAgent: 'GitHub-Explorer-Pipeline-Server',
      timeZone: 'UTC',
      previews: [],
      throttle: {
        enabled: githubConfig.GITHUB_RATE_LIMIT_ENABLED,
        onRateLimit: (retryAfter: number, options: any) => {
          logger.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
          
          // Retry twice after hitting a rate limit
          if (options.request.retryCount < 2) {
            logger.info(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
          
          logger.error(`Rate limit exceeded, not retrying further`);
          return false;
        },
        onSecondaryRateLimit: (retryAfter: number, options: any) => {
          logger.warn(`Secondary rate limit hit for ${options.method} ${options.url}`);
          
          // Retry once for secondary rate limits
          if (options.request.retryCount < 1) {
            logger.info(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
          
          logger.error(`Secondary rate limit exceeded, not retrying further`);
          return false;
        },
      },
      retry: {
        doNotRetry: ['429'],
        retries: githubConfig.GITHUB_MAX_RETRIES,
        retryAfter: githubConfig.GITHUB_RETRY_AFTER,
      },
      request: {
        headers: {
          accept: githubConfig.GITHUB_ACCEPT_HEADER,
          'X-GitHub-Api-Version': githubConfig.GITHUB_API_VERSION,
        },
      },
    });
  }
  
  /**
   * Get the Octokit instance
   */
  getOctokit(): Octokit {
    return this.octokit;
  }
  
  /**
   * Check GitHub API rate limits
   */
  async checkRateLimit() {
    try {
      const response = await this.octokit.rateLimit.get();
      const { limit, remaining, reset, used } = response.data.rate;
      
      logger.info({
        msg: 'GitHub API rate limit status',
        limit,
        remaining,
        used,
        resetAt: new Date(reset * 1000).toISOString(),
        percentUsed: Math.round((used / limit) * 100),
      });
      
      return response.data;
    } catch (error) {
      logger.error({ msg: 'Failed to check rate limit', error });
      throw error;
    }
  }
  
  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string) {
    try {
      const response = await this.octokit.repos.get({
        owner,
        repo,
      });
      
      return response.data;
    } catch (error) {
      logger.error({ msg: 'Failed to get repository', owner, repo, error });
      throw error;
    }
  }
  
  /**
   * Get pull requests for a repository
   */
  async getPullRequests(owner: string, repo: string, options: { state?: 'open' | 'closed' | 'all', perPage?: number, page?: number } = {}) {
    const { state = 'all', perPage = githubConfig.GITHUB_DEFAULT_PER_PAGE, page = 1 } = options;
    
    try {
      const response = await this.octokit.pulls.list({
        owner,
        repo,
        state,
        per_page: perPage,
        page,
      });
      
      return response.data;
    } catch (error) {
      logger.error({ msg: 'Failed to get pull requests', owner, repo, options, error });
      throw error;
    }
  }
  
  /**
   * Get commits for a repository
   */
  async getCommits(owner: string, repo: string, options: { perPage?: number, page?: number, since?: string, until?: string } = {}) {
    const { perPage = githubConfig.GITHUB_DEFAULT_PER_PAGE, page = 1, since, until } = options;
    
    try {
      const response = await this.octokit.repos.listCommits({
        owner,
        repo,
        per_page: perPage,
        page,
        since,
        until,
      });
      
      return response.data;
    } catch (error) {
      logger.error({ msg: 'Failed to get commits', owner, repo, options, error });
      throw error;
    }
  }
  
  /**
   * Get commit details
   */
  async getCommit(owner: string, repo: string, ref: string) {
    try {
      const response = await this.octokit.repos.getCommit({
        owner,
        repo,
        ref,
      });
      
      return response.data;
    } catch (error) {
      logger.error({ msg: 'Failed to get commit details', owner, repo, ref, error });
      throw error;
    }
  }
  
  /**
   * Get contributor details
   */
  async getContributor(username: string) {
    try {
      const response = await this.octokit.users.getByUsername({
        username,
      });
      
      return response.data;
    } catch (error) {
      logger.error({ msg: 'Failed to get contributor details', username, error });
      throw error;
    }
  }
  
  /**
   * Get repository contributors
   */
  async getRepositoryContributors(owner: string, repo: string, options: { perPage?: number, page?: number } = {}) {
    const { perPage = githubConfig.GITHUB_DEFAULT_PER_PAGE, page = 1 } = options;
    
    try {
      const response = await this.octokit.repos.listContributors({
        owner,
        repo,
        per_page: perPage,
        page,
      });
      
      return response.data;
    } catch (error) {
      logger.error({ msg: 'Failed to get repository contributors', owner, repo, options, error });
      throw error;
    }
  }
}

// Create singleton instance
const githubClient = new GitHubClient();

export default githubClient; 