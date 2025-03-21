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
   * Enrich repositories (simplified method that processes a single batch)
   * @returns {Promise<Object>} Enrichment statistics
   */
  async enrichRepositories() {
    logger.info('Starting repository enrichment batch');
    
    // Reset stats for this batch
    this.stats = {
      processed: 0,
      success: 0,
      failed: 0,
      notFound: 0,
      rateLimited: false,
      rateLimitReset: null
    };
    
    try {
      // Fetch a batch of unenriched repositories
      const repositories = await this.getUnenrichedRepositories(0);
      
      if (repositories.length === 0) {
        logger.info('No unenriched repositories found');
        return this.stats;
      }
      
      logger.info(`Found ${repositories.length} unenriched repositories to process`);
      
      // Process the batch
      await this.processBatch(repositories);
      
      logger.info('Repository enrichment batch completed', { stats: this.stats });
      return this.stats;
    } catch (error) {
      logger.error('Error in repository enrichment batch', { error });
      
      // If this is not a rate limit error, increment the failed count
      if (!this.stats.rateLimited) {
        this.stats.failed += 1;
      }
      
      return this.stats;
    }
  }
  
  /**
   * Get unenriched repositories from the database
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of unenriched repositories
   * @private
   */
  async getUnenrichedRepositories(offset = 0) {
    try {
      // Query for repositories with is_enriched = 0 and enrichment_attempts < 3
      const query = `
        SELECT id, github_id, name, full_name, enrichment_attempts
        FROM repositories 
        WHERE is_enriched = 0 AND enrichment_attempts < 3
        ORDER BY enrichment_attempts ASC, github_id ASC
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
   * Enrich a single repository with additional data from GitHub API
   * @param {Object} repository - Repository to enrich
   * @returns {Promise<boolean>} True if enrichment was successful
   * @private
   */
  async enrichRepository(repository) {
    const { id, github_id, full_name } = repository;
    
    // First, increment the attempt counter
    try {
      await this.db.run(
        'UPDATE repositories SET enrichment_attempts = enrichment_attempts + 1 WHERE id = ?',
        [id]
      );
      
      logger.info(`Incrementing enrichment attempt for repository ${full_name} (ID: ${id}), attempt #${repository.enrichment_attempts + 1}`);
    } catch (error) {
      logger.error(`Error updating enrichment attempt counter for repository ${id}`, { error });
      // Continue with enrichment even if counter update fails
    }
    
    try {
      // Get repository details from GitHub API
      logger.info(`Fetching details for repository ${full_name} from GitHub API`);
      const repoData = await this.githubClient.getRepository(full_name);
      
      if (!repoData) {
        logger.warn(`Repository ${full_name} not found on GitHub`);
        this.stats.notFound++;
        
        // Mark as enriched but with error status to prevent retries
        await this.db.run(
          `UPDATE repositories SET 
           is_enriched = 1, 
           updated_at = ? 
           WHERE id = ?`,
          [new Date().toISOString(), id]
        );
        
        return false;
      }
      
      // Map the API response to our database schema
      const repoToUpdate = this.mapRepositoryData(repoData, id);
      
      // Prepare fields for update query
      const fields = Object.keys(repoToUpdate)
        .filter(field => field !== 'id') // Exclude id from updates
        .map(field => `${field} = ?`)
        .join(', ');
      
      // Prepare values for update query
      const values = Object.keys(repoToUpdate)
        .filter(field => field !== 'id')
        .map(field => repoToUpdate[field]);
      
      // Add id for WHERE clause
      values.push(id);
      
      // Update repository in database
      await this.db.run(
        `UPDATE repositories SET ${fields} WHERE id = ?`,
        values
      );
      
      logger.info(`Successfully enriched repository ${full_name}`);
      return true;
    } catch (error) {
      // Check if this is a rate limit error
      const isRateLimitError = error.status === 403 && 
        (error.message.includes('rate limit') || 
         (error.response && error.response.headers && 
          error.response.headers['x-ratelimit-remaining'] === '0'));
      
      if (isRateLimitError) {
        logger.warn(`Rate limit hit when enriching repository ${full_name}`, { error });
        this.stats.rateLimited = true;
        
        // Get reset time from headers if available
        const resetTime = error.response && error.response.headers && 
          error.response.headers['x-ratelimit-reset'] ? 
          parseInt(error.response.headers['x-ratelimit-reset']) : 
          null;
        
        if (resetTime) {
          this.stats.rateLimitReset = resetTime;
          logger.info(`Rate limit will reset at ${new Date(resetTime * 1000).toISOString()}`);
        }
        
        // Don't increment the attempt counter for rate limit errors
        // Revert the attempt counter increment we did at the start
        try {
          await this.db.run(
            'UPDATE repositories SET enrichment_attempts = enrichment_attempts - 1 WHERE id = ?',
            [id]
          );
        } catch (counterError) {
          logger.error(`Error reverting enrichment attempt counter for repository ${id}`, { counterError });
          // Continue even if counter update fails
        }
        
        return false;
      }
      
      // For other errors, log and update stats
      logger.error(`Error enriching repository ${full_name}`, { error });
      
      // If this was the 3rd attempt, mark as enriched to prevent further attempts
      if (repository.enrichment_attempts >= 2) { // This is already the 3rd attempt (0-indexed)
        logger.warn(`Maximum enrichment attempts reached for repository ${full_name}, marking as failed but enriched`);
        
        try {
          await this.db.run(
            `UPDATE repositories SET 
             is_enriched = 1,
             updated_at = ? 
             WHERE id = ?`,
            [new Date().toISOString(), id]
          );
        } catch (updateError) {
          logger.error(`Error marking repository ${id} as enriched after max attempts`, { updateError });
        }
      }
      
      return false;
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
  
  /**
   * Close the database connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.db) {
      try {
        logger.debug('Closing repository enricher database connection');
        await this.db.close();
        logger.debug('Repository enricher database connection closed successfully');
      } catch (error) {
        logger.error('Error closing repository enricher database connection', { error });
      }
    }
  }
} 