/**
 * GitHub Client Service
 * 
 * This service provides an authenticated client for interacting with the GitHub API.
 * It handles token management, rate limiting, and provides a centralized interface
 * for all GitHub API operations.
 */

import { Octokit } from 'octokit';
import { logger } from '../../utils/logger.js';

// In-memory cache implementation
const cache = {
  data: new Map(),
  ttls: new Map(),
  
  get(key) {
    const expiry = this.ttls.get(key);
    if (expiry && expiry > Date.now()) {
      logger.debug(`Cache hit for ${key}`);
      return this.data.get(key);
    }
    
    if (this.data.has(key)) {
      logger.debug(`Cache expired for ${key}`);
      this.data.delete(key);
      this.ttls.delete(key);
    }
    
    return null;
  },
  
  set(key, value, ttlMs = 300000) { // Default TTL: 5 minutes
    this.data.set(key, value);
    this.ttls.set(key, Date.now() + ttlMs);
    logger.debug(`Cache set for ${key}, expires in ${ttlMs}ms`);
  },
  
  invalidate(key) {
    this.data.delete(key);
    this.ttls.delete(key);
    logger.debug(`Cache invalidated for ${key}`);
  },
  
  getKeys() {
    return Array.from(this.data.keys());
  },
  
  clear() {
    this.data.clear();
    this.ttls.clear();
    logger.debug('Cache cleared');
  }
};

// Circuit breaker implementation
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.monitorInterval = options.monitorInterval || 5000; // 5 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.lastStateChangeTime = Date.now();
    this.intervalId = null; // Store interval ID
    
    // Start monitoring
    this.monitor();
  }
  
  monitor() {
    this.intervalId = setInterval(() => {
      if (this.state === 'OPEN' && 
          (Date.now() - this.lastStateChangeTime) > this.resetTimeout) {
        this.halfOpen();
      }
    }, this.monitorInterval);
  }
  
  // Add method to stop monitoring
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.debug('Circuit breaker monitoring stopped');
    }
  }
  
  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.close();
    }
    this.failureCount = 0;
  }
  
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      this.open();
    }
  }
  
  open() {
    if (this.state !== 'OPEN') {
      logger.warn('Circuit breaker opened due to excessive failures');
      this.state = 'OPEN';
      this.lastStateChangeTime = Date.now();
    }
  }
  
  halfOpen() {
    if (this.state !== 'HALF_OPEN') {
      logger.info('Circuit breaker half-open, testing service availability');
      this.state = 'HALF_OPEN';
      this.lastStateChangeTime = Date.now();
    }
  }
  
  close() {
    if (this.state !== 'CLOSED') {
      logger.info('Circuit breaker closed, service healthy');
      this.state = 'CLOSED';
      this.lastStateChangeTime = Date.now();
      this.failureCount = 0;
    }
  }
  
  isAllowed() {
    return this.state !== 'OPEN';
  }
  
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChangeTime: this.lastStateChangeTime
    };
  }
}

class GitHubClient {
  constructor() {
    this.octokit = null;
    this.initialized = false;
    this.rateLimits = {
      core: { limit: 0, remaining: 0, reset: 0 },
      search: { limit: 0, remaining: 0, reset: 0 },
      graphql: { limit: 0, remaining: 0, reset: 0 }
    };
    this.rateLimitWarningThreshold = 0.1; // Warn when 10% remaining
    this.retryCount = 0;
    this.maxRetries = 3;
    this.cache = cache;
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000 // 1 minute
    });
    
    // Rate limiting queue
    this.requestQueue = [];
    this.isProcessingQueue = false;
    
    // Batch processing support
    this.batchSize = 5; // Default batch size for bulk operations
    this.batchDelay = 1000; // Default delay between batches (1 second)
  }

  /**
   * Initialize the GitHub client with authentication
   */
  async initialize() {
    try {
      if (!process.env.GITHUB_API_TOKEN) {
        throw new Error('GitHub API token not found in environment variables');
      }

      this.octokit = new Octokit({
        auth: process.env.GITHUB_API_TOKEN,
        throttle: {
          onRateLimit: (retryAfter, options, octokit, retryCount) => {
            logger.warn(`Rate limit exceeded, retrying after ${retryAfter} seconds`);
            this._handleRateLimitHit('core', retryAfter);
            return retryCount < this.maxRetries;
          },
          onSecondaryRateLimit: (retryAfter, options, octokit) => {
            logger.warn(`Secondary rate limit hit, retrying after ${retryAfter} seconds`);
            this._handleRateLimitHit('secondary', retryAfter);
            return true;
          }
        }
      });

      this.initialized = true;
      
      // Fetch rate limits as a test of authentication
      await this.getRateLimits();
      
      logger.info('GitHub client initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Error initializing GitHub client: ${error.message}`, { error });
      throw new Error(`Failed to initialize GitHub client: ${error.message}`);
    }
  }

  /**
   * Get the authenticated Octokit instance
   * @returns {Octokit} Authenticated Octokit instance
   */
  async getOctokit() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.octokit;
  }

  /**
   * Get GitHub API rate limits
   * @returns {Object} Rate limit information
   */
  async getRateLimits() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check if we have a cached version
      const cachedRateLimits = this.cache.get('github_rate_limits');
      if (cachedRateLimits) {
        this.rateLimits = cachedRateLimits;
        return cachedRateLimits;
      }
      
      const { data } = await this.octokit.rest.rateLimit.get();
      this.rateLimits = data.resources;
      
      // Cache rate limits for 60 seconds
      this.cache.set('github_rate_limits', data.resources, 60000);
      
      // Log current rate limits
      logger.info('GitHub API rate limits:', {
        core: {
          limit: data.resources.core.limit,
          remaining: data.resources.core.remaining,
          used: data.resources.core.used
        },
        search: {
          limit: data.resources.search.limit,
          remaining: data.resources.search.remaining,
          used: data.resources.search.used
        },
        graphql: {
          limit: data.resources.graphql.limit,
          remaining: data.resources.graphql.remaining,
          used: data.resources.graphql.used
        }
      });
      
      // Check if we're approaching rate limits
      this._checkRateLimitStatus();
      
      return data.resources;
    } catch (error) {
      this._handleApiError(error, 'getRateLimits');
      throw new Error(`Failed to fetch rate limits: ${error.message}`);
    }
  }

  /**
   * Get repository information
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {boolean} useCache - Whether to use cached data if available
   * @returns {Object} Repository data
   */
  async getRepository(owner, repo, useCache = true) {
    const cacheKey = `repo_${owner}_${repo}`;
    
    try {
      if (!this.circuitBreaker.isAllowed()) {
        throw new Error('Circuit breaker open, GitHub API unavailable');
      }
      
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check cache if allowed
      if (useCache) {
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }
      
      // Check rate limits before making the call
      await this._ensureRateLimitAvailability('core');
      
      const result = await this._executeWithRetry(async () => {
        return await this.octokit.rest.repos.get({
          owner,
          repo
        });
      });
      
      const { data } = result;
      
      // Cache the result (30 minutes for repository data)
      this.cache.set(cacheKey, data, 30 * 60 * 1000);
      
      this.circuitBreaker.recordSuccess();
      return data;
    } catch (error) {
      this._handleApiError(error, 'getRepository', { owner, repo });
      throw new Error(`Failed to fetch repository: ${error.message}`);
    }
  }

  /**
   * Get repository contributors
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {object} options - Query options (per_page, page)
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Array} List of contributors
   */
  async getRepositoryContributors(owner, repo, options = {}, useCache = true) {
    const { per_page = 100, page = 1 } = options;
    const cacheKey = `repo_contributors_${owner}_${repo}_${page}_${per_page}`;
    
    try {
      if (!this.circuitBreaker.isAllowed()) {
        throw new Error('Circuit breaker open, GitHub API unavailable');
      }
      
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check cache if allowed
      if (useCache) {
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }
      
      // Check rate limits before making the call
      await this._ensureRateLimitAvailability('core');
      
      const result = await this._executeWithRetry(async () => {
        return await this.octokit.rest.repos.listContributors({
          owner,
          repo,
          per_page,
          page
        });
      });
      
      const { data } = result;
      
      // Cache the result (15 minutes for contributor data)
      this.cache.set(cacheKey, data, 15 * 60 * 1000);
      
      this.circuitBreaker.recordSuccess();
      return data;
    } catch (error) {
      this._handleApiError(error, 'getRepositoryContributors', { owner, repo });
      throw new Error(`Failed to fetch contributors: ${error.message}`);
    }
  }

  /**
   * Get user information
   * @param {string} username - GitHub username
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Object} User data
   */
  async getUser(username, useCache = true) {
    const cacheKey = `user_${username}`;
    
    try {
      if (!this.circuitBreaker.isAllowed()) {
        throw new Error('Circuit breaker open, GitHub API unavailable');
      }
      
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check cache if allowed
      if (useCache) {
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }
      
      // Check rate limits before making the call
      await this._ensureRateLimitAvailability('core');
      
      const result = await this._executeWithRetry(async () => {
        return await this.octokit.rest.users.getByUsername({
          username
        });
      });
      
      const { data } = result;
      
      // Cache the result (1 hour for user data)
      this.cache.set(cacheKey, data, 60 * 60 * 1000);
      
      this.circuitBreaker.recordSuccess();
      return data;
    } catch (error) {
      this._handleApiError(error, 'getUser', { username });
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  /**
   * Get repository pull requests
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {object} options - Query options
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Array} List of pull requests
   */
  async getRepositoryPullRequests(owner, repo, options = {}, useCache = true) {
    const { state = 'all', per_page = 100, page = 1, sort = 'updated', direction = 'desc' } = options;
    const cacheKey = `repo_pulls_${owner}_${repo}_${state}_${page}_${per_page}_${sort}_${direction}`;
    
    try {
      if (!this.circuitBreaker.isAllowed()) {
        throw new Error('Circuit breaker open, GitHub API unavailable');
      }
      
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check cache if allowed
      if (useCache) {
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }
      
      // Check rate limits before making the call
      await this._ensureRateLimitAvailability('core');
      
      const result = await this._executeWithRetry(async () => {
        return await this.octokit.rest.pulls.list({
          owner,
          repo,
          state,
          per_page,
          page,
          sort,
          direction
        });
      });
      
      const { data } = result;
      
      // Cache the result (5 minutes for PRs data, shorter because they change frequently)
      this.cache.set(cacheKey, data, 5 * 60 * 1000);
      
      this.circuitBreaker.recordSuccess();
      return data;
    } catch (error) {
      this._handleApiError(error, 'getRepositoryPullRequests', { owner, repo });
      throw new Error(`Failed to fetch pull requests: ${error.message}`);
    }
  }

  /**
   * Get repository commits
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {object} options - Query options
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Array} List of commits
   */
  async getRepositoryCommits(owner, repo, options = {}, useCache = true) {
    const { per_page = 100, page = 1, sha = undefined, path = undefined } = options;
    const cacheKey = `repo_commits_${owner}_${repo}_${sha || 'main'}_${path || 'all'}_${page}_${per_page}`;
    
    try {
      if (!this.circuitBreaker.isAllowed()) {
        throw new Error('Circuit breaker open, GitHub API unavailable');
      }
      
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Check cache if allowed
      if (useCache) {
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }
      
      // Check rate limits before making the call
      await this._ensureRateLimitAvailability('core');
      
      const result = await this._executeWithRetry(async () => {
        return await this.octokit.rest.repos.listCommits({
          owner,
          repo,
          per_page,
          page,
          ...(sha && { sha }),
          ...(path && { path })
        });
      });
      
      const { data } = result;
      
      // Cache the result (15 minutes for commit data)
      this.cache.set(cacheKey, data, 15 * 60 * 1000);
      
      this.circuitBreaker.recordSuccess();
      return data;
    } catch (error) {
      this._handleApiError(error, 'getRepositoryCommits', { owner, repo });
      throw new Error(`Failed to fetch commits: ${error.message}`);
    }
  }

  /**
   * Batch process multiple GitHub API requests
   * @param {Array} requests - Array of request functions that return promises
   * @param {object} options - Batch processing options
   * @returns {Array} - Array of results
   */
  async batchProcess(requests, options = {}) {
    const { 
      batchSize = this.batchSize, 
      batchDelay = this.batchDelay,
      abortOnError = false
    } = options;
    
    logger.info(`Processing ${requests.length} requests in batches of ${batchSize}`);
    
    const results = [];
    const errors = [];
    
    // Process requests in batches
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      logger.debug(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(requests.length / batchSize)}`);
      
      try {
        // Process the current batch concurrently
        const batchPromises = batch.map(async (requestFn, index) => {
          try {
            return await requestFn();
          } catch (error) {
            logger.error(`Error in batch item ${i + index}:`, error);
            errors.push({ index: i + index, error });
            
            if (abortOnError) {
              throw error;
            }
            
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // If this isn't the last batch, wait before processing the next one
        if (i + batchSize < requests.length) {
          logger.debug(`Waiting ${batchDelay}ms before next batch`);
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      } catch (error) {
        if (abortOnError) {
          logger.error(`Batch processing aborted due to error:`, error);
          throw error;
        }
      }
    }
    
    return {
      results: results.filter(result => result !== null),
      errors,
      totalRequests: requests.length,
      successfulRequests: results.filter(result => result !== null).length,
      failedRequests: errors.length
    };
  }

  /**
   * Clear cache or specific cache items
   * @param {string|null} pattern - Optional pattern to match cache keys
   */
  clearCache(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      logger.info('GitHub client cache cleared');
      return;
    }
    
    const keys = this.cache.getKeys();
    const regex = new RegExp(pattern);
    let count = 0;
    
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.invalidate(key);
        count++;
      }
    }
    
    logger.info(`Cleared ${count} cache items matching pattern: ${pattern}`);
  }

  /**
   * Get circuit breaker status
   * @returns {Object} Circuit breaker state
   */
  getCircuitBreakerStatus() {
    return this.circuitBreaker.getState();
  }

  /**
   * Reset circuit breaker to closed state
   */
  resetCircuitBreaker() {
    this.circuitBreaker.close();
    logger.info('Circuit breaker manually reset to closed state');
  }

  /**
   * Clean up resources to allow graceful shutdown
   */
  cleanup() {
    // Stop circuit breaker monitoring
    this.circuitBreaker.stopMonitoring();
    // Clear any other resources that might prevent process exit
    logger.info('GitHub client resources cleaned up');
  }

  // Private methods

  /**
   * Execute a function with retry logic
   * @param {Function} fn - Function to execute
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise} - Promise resolving to the function result
   * @private
   */
  async _executeWithRetry(fn, maxRetries = this.maxRetries) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Calculate backoff time with exponential backoff and jitter
          const backoffTime = Math.min(
            1000 * Math.pow(2, attempt - 1) + Math.random() * 1000,
            60000 // Max 60 seconds
          );
          logger.debug(`Retry attempt ${attempt}/${maxRetries}, waiting ${Math.round(backoffTime)}ms`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
        
        return await fn();
      } catch (error) {
        lastError = error;
        
        // If this is a rate limit error, wait for reset time
        if (error.status === 403 && error.response?.headers?.['x-ratelimit-remaining'] === '0') {
          const resetTime = error.response.headers['x-ratelimit-reset'];
          if (resetTime) {
            const waitTime = (parseInt(resetTime, 10) * 1000) - Date.now();
            if (waitTime > 0) {
              logger.warn(`Rate limit exceeded, waiting for reset: ${Math.ceil(waitTime / 1000)}s`);
              await new Promise(resolve => setTimeout(resolve, waitTime + 1000)); // Add 1s buffer
            }
          }
        }
        
        // If this is not the last attempt, log and continue
        if (attempt < maxRetries) {
          logger.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`);
          continue;
        }
        
        // This was the last attempt, record the failure
        this.circuitBreaker.recordFailure();
        throw error;
      }
    }
    
    throw lastError;
  }

  /**
   * Handle API errors and record them
   * @param {Error} error - Error object
   * @param {string} operation - Name of the operation that failed
   * @param {object} context - Additional context for the error
   * @private
   */
  _handleApiError(error, operation, context = {}) {
    // Record the failure for circuit breaker
    this.circuitBreaker.recordFailure();
    
    // Enhanced error logging
    logger.error(`GitHub API error in ${operation}: ${error.message}`, {
      operation,
      error,
      errorStatus: error.status,
      errorName: error.name,
      context,
      circuitBreakerState: this.circuitBreaker.getState()
    });
    
    // If this is a rate limit error, update our rate limit understanding
    if (error.status === 403 && error.response?.headers?.['x-ratelimit-remaining'] === '0') {
      const resetTime = error.response.headers['x-ratelimit-reset'];
      if (resetTime) {
        const resetDate = new Date(parseInt(resetTime, 10) * 1000);
        logger.warn(`Rate limit exceeded, reset at: ${resetDate.toISOString()}`);
        
        // Force refresh rate limits
        this.cache.invalidate('github_rate_limits');
      }
    }
  }

  /**
   * Handle rate limit being hit
   * @param {string} type - Type of rate limit (core, search, graphql, secondary)
   * @param {number} retryAfter - Seconds to wait before retrying
   * @private
   */
  _handleRateLimitHit(type, retryAfter) {
    logger.warn(`GitHub ${type} rate limit hit, retry after ${retryAfter}s`);
    
    // Invalidate rate limits cache
    this.cache.invalidate('github_rate_limits');
    
    // In a production app, we might want to:
    // 1. Emit an event that can be monitored
    // 2. Slow down other requests
    // 3. Switch to a different token or strategy
  }

  /**
   * Check if we're approaching rate limit thresholds
   * @private
   */
  _checkRateLimitStatus() {
    // Check core rate limit
    if (this.rateLimits.core) {
      const coreRemaining = this.rateLimits.core.remaining;
      const coreLimit = this.rateLimits.core.limit;
      const coreResetTime = new Date(this.rateLimits.core.reset * 1000);
      
      if (coreRemaining / coreLimit < this.rateLimitWarningThreshold) {
        logger.warn(`GitHub API core rate limit warning: ${coreRemaining}/${coreLimit} remaining, resets at ${coreResetTime.toISOString()}`);
      }
    }
    
    // Check search rate limit
    if (this.rateLimits.search) {
      const searchRemaining = this.rateLimits.search.remaining;
      const searchLimit = this.rateLimits.search.limit;
      const searchResetTime = new Date(this.rateLimits.search.reset * 1000);
      
      if (searchRemaining / searchLimit < this.rateLimitWarningThreshold) {
        logger.warn(`GitHub API search rate limit warning: ${searchRemaining}/${searchLimit} remaining, resets at ${searchResetTime.toISOString()}`);
      }
    }
  }

  /**
   * Ensure there's enough rate limit available for an API call
   * @param {string} type - Type of rate limit (core, search, graphql)
   * @private
   */
  async _ensureRateLimitAvailability(type = 'core') {
    // Refresh rate limits if we don't have them or they're old
    if (!this.rateLimits[type] || this.cache.get('github_rate_limits') === null) {
      await this.getRateLimits();
    }
    
    const limitInfo = this.rateLimits[type];
    
    // If we have enough remaining, proceed
    if (limitInfo.remaining > 5) { // Keep a buffer of 5 requests
      return;
    }
    
    // Calculate time to wait for reset
    const resetTime = limitInfo.reset * 1000; // Convert to milliseconds
    const now = Date.now();
    const waitTime = resetTime - now + 1000; // Add 1s buffer
    
    if (waitTime > 0) {
      logger.warn(`Waiting for ${type} rate limit reset: ${Math.ceil(waitTime / 1000)}s`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Refresh rate limits after waiting
      await this.getRateLimits();
    } else {
      // Reset time is in the past, refresh rate limits
      await this.getRateLimits();
    }
  }
}

// Export a singleton instance
const githubClient = new GitHubClient();
export default githubClient; 