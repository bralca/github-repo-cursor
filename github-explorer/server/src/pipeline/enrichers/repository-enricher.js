/**
 * Repository Enricher
 * 
 * Enriches repository data with additional information from GitHub API.
 * Processes repositories in batches and handles rate limiting.
 */

import { logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Repository Enricher class
 */
export class RepositoryEnricher {
  /**
   * Create a new repository enricher
   * @param {Object} options - Options
   * @param {Object} options.githubClient - GitHub API client
   * @param {Object} options.db - Database connection
   * @param {Object} options.config - Configuration options
   */
  constructor({ githubClient, db, config = {} }) {
    this.githubClient = githubClient;
    this.db = db;
    this.config = {
      batchSize: 10,
      maxRetries: 3,
      retryDelay: 1000,
      abortOnError: false,
      ...config
    };
    
    this.stats = {
      processed: 0,
      success: 0,
      failed: 0,
      notFound: 0,
      rateLimited: false,
      rateLimitReset: null
    };
  }
  
  /**
   * Enrich all unenriched repositories
   * @returns {Promise<Object>} Enrichment statistics
   */
  async enrichAllRepositories() {
    logger.info('Starting repository enrichment process');
    let hasMore = true;
    let offset = 0;
    
    while (hasMore) {
      // Check if we've been rate limited in a previous batch
      if (this.stats.rateLimited) {
        const now = new Date();
        const resetTime = new Date(this.stats.rateLimitReset);
        
        if (now < resetTime) {
          const waitTimeMs = resetTime.getTime() - now.getTime() + 1000; // Add 1 second buffer
          logger.info(`Rate limited by GitHub API. Waiting ${Math.ceil(waitTimeMs / 1000)} seconds until ${resetTime.toISOString()}`);
          await new Promise(resolve => setTimeout(resolve, waitTimeMs));
        }
        
        this.stats.rateLimited = false;
        this.stats.rateLimitReset = null;
      }
      
      // Fetch a batch of unenriched repositories
      logger.info(`Fetching batch of unenriched repositories (offset: ${offset}, batch size: ${this.config.batchSize})`);
      const repositories = await this.getUnenrichedRepositories(offset);
      
      if (repositories.length === 0) {
        logger.info('No more unenriched repositories found');
        hasMore = false;
        break;
      }
      
      logger.info(`Found ${repositories.length} unenriched repositories`);
      
      try {
        // Process the batch
        await this.processBatch(repositories);
        
        // Update offset for next batch
        offset += this.config.batchSize;
        
        // No safety check - process all repositories until none are left
      } catch (error) {
        // If we hit rate limits during batch processing, wait and try again with the same offset
        if (this.stats.rateLimited) {
          logger.warn(`Rate limited during batch processing. Will retry the same batch after waiting.`);
          // Don't update offset - we'll retry the same batch
          continue;
        }
        
        // For other errors, log and continue with next batch
        logger.error(`Error processing batch at offset ${offset}:`, { error });
        offset += this.config.batchSize;
      }
    }
    
    logger.info('Repository enrichment process completed', { stats: this.stats });
    return this.stats;
  }
  
  /**
   * Get unenriched repositories from the database
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of unenriched repositories
   * @private
   */
  async getUnenrichedRepositories(offset = 0) {
    try {
      // Query for repositories with is_enriched = 0
      const query = `
        SELECT id, github_id, name, full_name 
        FROM repositories 
        WHERE is_enriched = 0
        LIMIT ? OFFSET ?
      `;
      
      const repositories = await this.db.all(query, [this.config.batchSize, offset]);
      return repositories;
    } catch (error) {
      logger.error('Error fetching unenriched repositories', { error });
      throw error;
    }
  }
  
  /**
   * Process a batch of repositories
   * @param {Array} repositories - Repositories to process
   * @returns {Promise<void>}
   * @private
   */
  async processBatch(repositories) {
    for (const repository of repositories) {
      try {
        logger.info(`Enriching repository: ${repository.full_name} (ID: ${repository.id})`);
        
        // Enrich the repository
        const enriched = await this.enrichRepository(repository);
        
        if (enriched) {
          this.stats.success++;
        } else {
          this.stats.failed++;
        }
        
        this.stats.processed++;
        
        // If we've been rate limited, stop processing this batch
        if (this.stats.rateLimited) {
          logger.warn('Rate limit detected during batch processing. Pausing batch processing.');
          break;
        }
      } catch (error) {
        this.stats.failed++;
        this.stats.processed++;
        
        logger.error(`Error enriching repository: ${repository.full_name}`, { error });
        
        // If we've been rate limited, stop processing this batch
        if (this.stats.rateLimited) {
          logger.warn('Rate limit detected during batch processing. Pausing batch processing.');
          break;
        }
        
        if (this.config.abortOnError) {
          throw error;
        }
      }
    }
    
    // If we're rate limited at the end of batch processing, throw an error
    // to signal the main loop to wait before continuing
    if (this.stats.rateLimited) {
      throw new Error('Rate limited during batch processing. Need to wait before continuing.');
    }
  }
  
  /**
   * Enrich a single repository
   * @param {Object} repository - Repository to enrich
   * @returns {Promise<boolean>} Success status
   * @private
   */
  async enrichRepository(repository) {
    try {
      // Extract owner and name from full_name
      const [owner, repo] = (repository.full_name || '').split('/');
      
      if (!owner || !repo) {
        logger.warn(`Invalid repository name format: ${repository.full_name}`);
        return false;
      }
      
      // Fetch repository data from GitHub API
      const repoData = await this.fetchRepositoryData(owner, repo);
      
      if (!repoData) {
        return false;
      }
      
      // Map GitHub API response to our database schema
      const mappedData = this.mapRepositoryData(repoData, repository.id);
      
      // Update the repository in the database
      await this.updateRepository(mappedData);
      
      logger.info(`Successfully enriched repository: ${repository.full_name}`);
      return true;
    } catch (error) {
      // Check if this is a rate limit error
      if (error.message && error.message.includes('API rate limit exceeded')) {
        // Extract rate limit reset time from error if available
        const resetMatch = error.message.match(/Reset in ([0-9]+) seconds/);
        if (resetMatch && resetMatch[1]) {
          const resetSeconds = parseInt(resetMatch[1], 10);
          const resetTime = new Date(Date.now() + resetSeconds * 1000);
          
          this.stats.rateLimited = true;
          this.stats.rateLimitReset = resetTime.toISOString();
          
          logger.warn(`GitHub API rate limit exceeded. Will reset at ${resetTime.toISOString()}`);
        } else {
          // Default to waiting 60 minutes if we can't parse the reset time
          const resetTime = new Date(Date.now() + 60 * 60 * 1000);
          
          this.stats.rateLimited = true;
          this.stats.rateLimitReset = resetTime.toISOString();
          
          logger.warn(`GitHub API rate limit exceeded. Using default wait time of 60 minutes until ${resetTime.toISOString()}`);
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Fetch repository data from GitHub API
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Object>} Repository data
   * @private
   */
  async fetchRepositoryData(owner, repo) {
    try {
      logger.info(`Fetching data for repository: ${owner}/${repo}`);
      
      // Use GitHub client to fetch repository data
      const repoData = await this.githubClient.getRepository(`${owner}/${repo}`);
      
      // Check for rate limit information in headers (if available)
      if (repoData.headers) {
        const remaining = parseInt(repoData.headers['x-ratelimit-remaining'], 10);
        const resetTimestamp = parseInt(repoData.headers['x-ratelimit-reset'], 10);
        
        if (!isNaN(remaining) && remaining < 10) {
          // If we're getting close to rate limit, log a warning
          const resetTime = new Date(resetTimestamp * 1000);
          logger.warn(`GitHub API rate limit running low: ${remaining} requests remaining. Resets at ${resetTime.toISOString()}`);
        }
      }
      
      return repoData;
    } catch (error) {
      // Check if repository wasn't found
      if (error.message && error.message.includes('Not Found')) {
        logger.warn(`Repository not found: ${owner}/${repo}`);
        this.stats.notFound++;
        return null;
      }
      
      // Re-throw other errors
      throw error;
    }
  }
  
  /**
   * Map GitHub API repository data to our database schema
   * @param {Object} repoData - GitHub API repository data
   * @param {string} existingId - Existing repository ID (if updating)
   * @returns {Object} Mapped repository data
   * @private
   */
  mapRepositoryData(repoData, existingId) {
    if (!repoData) return null;
    
    // Use existing ID if provided, otherwise generate a new UUID
    const id = existingId || uuidv4();
    
    // Map GitHub API fields to our database schema
    return {
      id,
      github_id: repoData.id,
      name: repoData.name,
      full_name: repoData.full_name,
      description: repoData.description,
      url: repoData.html_url,
      api_url: repoData.url,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      open_issues_count: repoData.open_issues_count,
      last_updated: repoData.updated_at,
      size_kb: repoData.size,
      watchers_count: repoData.watchers_count,
      primary_language: repoData.language,
      license: repoData.license ? repoData.license.spdx_id : null,
      is_fork: repoData.fork ? 1 : 0,
      is_archived: repoData.archived ? 1 : 0,
      default_branch: repoData.default_branch,
      is_enriched: 1, // Mark as enriched
      updated_at: new Date().toISOString()
    };
  }
  
  /**
   * Update repository in the database
   * @param {Object} repository - Repository data to update
   * @returns {Promise<void>}
   * @private
   */
  async updateRepository(repository) {
    if (!repository) return;
    
    try {
      // Use upsert to update or insert repository
      const query = `
        INSERT INTO repositories (
          id, github_id, name, full_name, description, url, api_url,
          stars, forks, open_issues_count, last_updated, size_kb,
          watchers_count, primary_language, license, is_fork,
          is_archived, default_branch, is_enriched, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          description = excluded.description,
          url = excluded.url,
          api_url = excluded.api_url,
          stars = excluded.stars,
          forks = excluded.forks,
          open_issues_count = excluded.open_issues_count,
          last_updated = excluded.last_updated,
          size_kb = excluded.size_kb,
          watchers_count = excluded.watchers_count,
          primary_language = excluded.primary_language,
          license = excluded.license,
          is_fork = excluded.is_fork,
          is_archived = excluded.is_archived,
          default_branch = excluded.default_branch,
          is_enriched = excluded.is_enriched,
          updated_at = excluded.updated_at
      `;
      
      await this.db.run(query, [
        repository.id,
        repository.github_id,
        repository.name,
        repository.full_name,
        repository.description,
        repository.url,
        repository.api_url,
        repository.stars,
        repository.forks,
        repository.open_issues_count,
        repository.last_updated,
        repository.size_kb,
        repository.watchers_count,
        repository.primary_language,
        repository.license,
        repository.is_fork,
        repository.is_archived,
        repository.default_branch,
        repository.is_enriched,
        repository.updated_at
      ]);
      
      logger.info(`Updated repository in database: ${repository.full_name}`);
    } catch (error) {
      logger.error(`Error updating repository in database: ${repository.full_name}`, { error });
      throw error;
    }
  }
} 