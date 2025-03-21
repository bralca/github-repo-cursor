/**
 * Contributor Enricher
 * 
 * Enriches contributor data with additional information from GitHub API.
 * Processes contributors in batches and handles rate limiting.
 */

import { logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Contributor Enricher class
 */
export class ContributorEnricher {
  /**
   * Create a new contributor enricher
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
   * Enrich all unenriched contributors
   * @returns {Promise<Object>} Enrichment statistics
   */
  async enrichAllContributors() {
    logger.info('Starting contributor enrichment process');
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
      
      // Fetch a batch of unenriched contributors
      logger.info(`Fetching batch of unenriched contributors (offset: ${offset}, batch size: ${this.config.batchSize})`);
      const contributors = await this.getUnenrichedContributors(offset);
      
      if (contributors.length === 0) {
        logger.info('No more unenriched contributors found');
        hasMore = false;
        break;
      }
      
      logger.info(`Found ${contributors.length} unenriched contributors`);
      
      try {
        // Process the batch
        await this.processBatch(contributors);
        
        // Update offset for next batch
        offset += this.config.batchSize;
        
        // No safety check - process all contributors until none are left
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
    
    logger.info('Contributor enrichment process completed', { stats: this.stats });
    return this.stats;
  }
  
  /**
   * Enrich contributors (simplified method that processes a single batch)
   * @returns {Promise<Object>} Enrichment statistics
   */
  async enrichContributors() {
    logger.info('Starting contributor enrichment batch');
    
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
      // Fetch a batch of unenriched contributors
      const contributors = await this.getUnenrichedContributors(0);
      
      if (contributors.length === 0) {
        logger.info('No unenriched contributors found');
        return this.stats;
      }
      
      logger.info(`Found ${contributors.length} unenriched contributors to process`);
      
      // Process the batch
      await this.processBatch(contributors);
      
      logger.info('Contributor enrichment batch completed', { stats: this.stats });
      return this.stats;
    } catch (error) {
      logger.error('Error in contributor enrichment batch', { error });
      
      // If this is not a rate limit error, increment the failed count
      if (!this.stats.rateLimited) {
        this.stats.failed += 1;
      }
      
      return this.stats;
    }
  }
  
  /**
   * Get unenriched contributors from the database
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of unenriched contributors
   * @private
   */
  async getUnenrichedContributors(offset = 0) {
    try {
      // Query for contributors with is_enriched = 0 and enrichment_attempts < 3
      const query = `
        SELECT id, github_id, username, enrichment_attempts
        FROM contributors 
        WHERE is_enriched = 0 AND enrichment_attempts < 3
        ORDER BY enrichment_attempts ASC, github_id ASC
        LIMIT ? OFFSET ?
      `;
      
      const contributors = await this.db.all(query, [this.config.batchSize, offset]);
      return contributors;
    } catch (error) {
      logger.error('Error fetching unenriched contributors', { error });
      throw error;
    }
  }
  
  /**
   * Process a batch of contributors
   * @param {Array} contributors - Contributors to process
   * @returns {Promise<void>}
   * @private
   */
  async processBatch(contributors) {
    for (const contributor of contributors) {
      try {
        logger.info(`Enriching contributor: ${contributor.username || contributor.id} (ID: ${contributor.id})`);
        
        // Enrich the contributor
        const enriched = await this.enrichContributor(contributor);
        
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
        
        logger.error(`Error enriching contributor: ${contributor.username || contributor.id}`, { error });
        
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
   * Enrich a single contributor with additional data from GitHub API
   * @param {Object} contributor - Contributor to enrich
   * @returns {Promise<boolean>} True if enrichment was successful
   * @private
   */
  async enrichContributor(contributor) {
    const { id, github_id, username } = contributor;
    
    if (!username) {
      logger.warn(`Contributor ${id} has no username, cannot enrich`);
      
      // Mark as enriched but with minimal data to prevent retries
      try {
        await this.db.run(
          `UPDATE contributors SET 
           is_enriched = 1, 
           updated_at = ? 
           WHERE id = ?`,
          [new Date().toISOString(), id]
        );
      } catch (error) {
        logger.error(`Error marking contributor ${id} as enriched due to missing username`, { error });
      }
      
      return false;
    }
    
    // First, increment the attempt counter
    try {
      await this.db.run(
        'UPDATE contributors SET enrichment_attempts = enrichment_attempts + 1 WHERE id = ?',
        [id]
      );
      
      logger.info(`Incrementing enrichment attempt for contributor ${username} (ID: ${id}), attempt #${contributor.enrichment_attempts + 1}`);
    } catch (error) {
      logger.error(`Error updating enrichment attempt counter for contributor ${id}`, { error });
      // Continue with enrichment even if counter update fails
    }
    
    try {
      // Get contributor details from GitHub API
      logger.info(`Fetching details for contributor ${username} from GitHub API`);
      const userData = await this.githubClient.getUser(username);
      
      if (!userData) {
        logger.warn(`Contributor ${username} not found on GitHub`);
        this.stats.notFound++;
        
        // Mark as enriched but with error status to prevent retries
        await this.db.run(
          `UPDATE contributors SET 
           is_enriched = 1, 
           updated_at = ? 
           WHERE id = ?`,
          [new Date().toISOString(), id]
        );
        
        return false;
      }
      
      // Get user's repositories to determine top languages
      let languages = [];
      try {
        // Get top language data
        languages = await this.fetchUserTopLanguages(username);
        logger.info(`Fetched top languages for ${username}: ${languages.length} languages found`);
      } catch (langError) {
        logger.warn(`Could not fetch top languages for ${username}`, { error: langError });
        // Continue without language data
      }
      
      // Get user's organizations
      let organizations = [];
      try {
        organizations = await this.fetchUserOrganizations(username);
        logger.info(`Fetched organizations for ${username}: ${organizations.length} organizations found`);
      } catch (orgError) {
        logger.warn(`Could not fetch organizations for ${username}`, { error: orgError });
        // Continue without organization data
      }
      
      // Add languages and organizations to user data
      userData.languages = languages;
      userData.organizations = organizations;
      
      // Map the API response to our database schema
      const contributorToUpdate = this.mapContributorData(userData, id);
      
      // Prepare fields for update query
      const fields = Object.keys(contributorToUpdate)
        .filter(field => field !== 'id') // Exclude id from updates
        .map(field => `${field} = ?`)
        .join(', ');
      
      // Prepare values for update query
      const values = Object.keys(contributorToUpdate)
        .filter(field => field !== 'id')
        .map(field => contributorToUpdate[field]);
      
      // Add id for WHERE clause
      values.push(id);
      
      // Update contributor in database
      await this.db.run(
        `UPDATE contributors SET ${fields} WHERE id = ?`,
        values
      );
      
      logger.info(`Successfully enriched contributor ${username}`);
      return true;
    } catch (error) {
      // Check if this is a rate limit error
      const isRateLimitError = error.status === 403 && 
        (error.message.includes('rate limit') || 
         (error.response && error.response.headers && 
          error.response.headers['x-ratelimit-remaining'] === '0'));
      
      if (isRateLimitError) {
        logger.warn(`Rate limit hit when enriching contributor ${username}`, { error });
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
            'UPDATE contributors SET enrichment_attempts = enrichment_attempts - 1 WHERE id = ?',
            [id]
          );
        } catch (counterError) {
          logger.error(`Error reverting enrichment attempt counter for contributor ${id}`, { counterError });
          // Continue even if counter update fails
        }
        
        return false;
      }
      
      // For other errors, log and update stats
      logger.error(`Error enriching contributor ${username}`, { error });
      
      // If this was the 3rd attempt, mark as enriched to prevent further attempts
      if (contributor.enrichment_attempts >= 2) { // This is already the 3rd attempt (0-indexed)
        logger.warn(`Maximum enrichment attempts reached for contributor ${username}, marking as failed but enriched`);
        
        try {
          await this.db.run(
            `UPDATE contributors SET 
             is_enriched = 1,
             updated_at = ? 
             WHERE id = ?`,
            [new Date().toISOString(), id]
          );
        } catch (updateError) {
          logger.error(`Error marking contributor ${id} as enriched after max attempts`, { updateError });
        }
      }
      
      return false;
    }
  }
  
  /**
   * Map GitHub API contributor data to our database schema
   * @param {Object} userData - GitHub API user data
   * @param {string} existingId - Existing contributor ID (if updating)
   * @returns {Object} Mapped contributor data
   * @private
   */
  mapContributorData(userData, existingId) {
    if (!userData) return null;
    
    // Use existing ID if provided, otherwise generate a new UUID
    const id = existingId || uuidv4();
    
    // If top languages is available as an object, convert to JSON string
    let topLanguages = '[]';
    if (userData.languages && Array.isArray(userData.languages)) {
      topLanguages = JSON.stringify(userData.languages);
    } else if (userData.languages && typeof userData.languages === 'object') {
      topLanguages = JSON.stringify(Object.keys(userData.languages));
    }
    
    // If organizations is available as an array, convert to JSON string
    let organizations = '[]';
    if (userData.organizations && Array.isArray(userData.organizations)) {
      organizations = JSON.stringify(userData.organizations);
    }
    
    // Map GitHub API fields to our database schema
    return {
      id,
      github_id: userData.id,
      username: userData.login,
      name: userData.name,
      avatar: userData.avatar_url,
      bio: userData.bio,
      company: userData.company,
      blog: userData.blog,
      twitter_username: userData.twitter_username,
      location: userData.location,
      followers: userData.followers,
      repositories: userData.public_repos,
      // Calculate impact score based on activity (simplified version)
      impact_score: this.calculateImpactScore(userData),
      // Fields that will be populated during enrichment
      role_classification: this.classifyContributorRole(userData),
      top_languages: topLanguages,
      organizations: organizations,
      is_enriched: 1, // Mark as enriched
      updated_at: new Date().toISOString()
    };
  }
  
  /**
   * Calculate an impact score for the contributor
   * @param {Object} userData - GitHub API user data
   * @returns {number} Impact score (0-100)
   * @private
   */
  calculateImpactScore(userData) {
    let score = 0;
    
    // Factor 1: Public repositories
    if (userData.public_repos) {
      if (userData.public_repos > 100) score += 25;
      else if (userData.public_repos > 50) score += 20;
      else if (userData.public_repos > 20) score += 15;
      else if (userData.public_repos > 5) score += 10;
      else score += 5;
    }
    
    // Factor 2: Followers
    if (userData.followers) {
      if (userData.followers > 1000) score += 25;
      else if (userData.followers > 500) score += 20;
      else if (userData.followers > 100) score += 15;
      else if (userData.followers > 10) score += 10;
      else score += 5;
    }
    
    // Factor 3: Account age
    if (userData.created_at) {
      const createdDate = new Date(userData.created_at);
      const now = new Date();
      const accountAgeYears = (now - createdDate) / (1000 * 60 * 60 * 24 * 365);
      
      if (accountAgeYears > 10) score += 20;
      else if (accountAgeYears > 5) score += 15;
      else if (accountAgeYears > 2) score += 10;
      else if (accountAgeYears > 1) score += 5;
    }
    
    // Factor 4: Profile completeness
    if (userData.name) score += 5;
    if (userData.bio) score += 5;
    if (userData.location) score += 5;
    if (userData.company) score += 5;
    if (userData.blog) score += 5;
    if (userData.twitter_username) score += 5;
    
    // Cap at 100
    return Math.min(score, 100);
  }
  
  /**
   * Classify contributor role based on activity
   * @param {Object} userData - GitHub API user data
   * @returns {string} Role classification
   * @private
   */
  classifyContributorRole(userData) {
    // Simple classification based on public repos and followers
    const repos = userData.public_repos || 0;
    const followers = userData.followers || 0;
    
    if (repos > 100 && followers > 1000) {
      return 'project_lead';
    } else if (repos > 50 && followers > 500) {
      return 'maintainer';
    } else if (repos > 20 && followers > 100) {
      return 'regular_contributor';
    } else if (repos > 5) {
      return 'occasional_contributor';
    } else {
      return 'first_time_contributor';
    }
  }
  
  /**
   * Update contributor in the database
   * @param {Object} contributor - Contributor data to update
   * @returns {Promise<void>}
   * @private
   */
  async updateContributor(contributor) {
    if (!contributor) return;
    
    try {
      // Use upsert to update or insert contributor
      const query = `
        INSERT INTO contributors (
          id, github_id, username, name, avatar, bio, company, blog, 
          twitter_username, location, followers, repositories, impact_score, 
          role_classification, top_languages, organizations, is_enriched, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          username = excluded.username,
          name = excluded.name,
          avatar = excluded.avatar,
          bio = excluded.bio,
          company = excluded.company,
          blog = excluded.blog,
          twitter_username = excluded.twitter_username,
          location = excluded.location,
          followers = excluded.followers,
          repositories = excluded.repositories,
          impact_score = excluded.impact_score,
          role_classification = excluded.role_classification,
          top_languages = excluded.top_languages,
          organizations = excluded.organizations,
          is_enriched = excluded.is_enriched,
          updated_at = excluded.updated_at
      `;
      
      await this.db.run(query, [
        contributor.id,
        contributor.github_id,
        contributor.username,
        contributor.name,
        contributor.avatar,
        contributor.bio,
        contributor.company,
        contributor.blog,
        contributor.twitter_username,
        contributor.location,
        contributor.followers,
        contributor.repositories,
        contributor.impact_score,
        contributor.role_classification,
        contributor.top_languages,
        contributor.organizations,
        contributor.is_enriched,
        contributor.updated_at
      ]);
      
      logger.info(`Updated contributor in database: ${contributor.username}`);
    } catch (error) {
      logger.error(`Error updating contributor in database: ${contributor.username}`, { error });
      throw error;
    }
  }
  
  /**
   * Mark a contributor as enriched without additional data
   * @param {string} contributorId - Contributor ID to mark as enriched
   * @param {Object} data - Minimal data to update
   * @returns {Promise<void>}
   * @private
   */
  async markContributorAsEnriched(contributorId, data = {}) {
    try {
      const query = `
        UPDATE contributors 
        SET is_enriched = 1, updated_at = ?
        WHERE id = ?
      `;
      
      await this.db.run(query, [new Date().toISOString(), contributorId]);
      
      logger.info(`Marked contributor ${contributorId} as enriched`);
    } catch (error) {
      logger.error(`Error marking contributor ${contributorId} as enriched`, { error });
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
        logger.debug('Closing contributor enricher database connection');
        await this.db.close();
        logger.debug('Contributor enricher database connection closed successfully');
      } catch (error) {
        logger.error('Error closing contributor enricher database connection', { error });
      }
    }
  }
} 