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
   * Get unenriched contributors from the database
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of unenriched contributors
   * @private
   */
  async getUnenrichedContributors(offset = 0) {
    try {
      // Query for contributors with is_enriched = 0 that have a github_id
      const query = `
        SELECT id, github_id, username, name 
        FROM contributors 
        WHERE is_enriched = 0 AND github_id IS NOT NULL
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
   * Enrich a single contributor
   * @param {Object} contributor - Contributor to enrich
   * @returns {Promise<boolean>} Success status
   * @private
   */
  async enrichContributor(contributor) {
    try {
      // We only use github_id for lookup to prevent issues with placeholder usernames
      const githubId = contributor.github_id;
      
      if (!githubId) {
        logger.warn(`Missing github_id for contributor: ${contributor.id}. Username lookups are disabled.`);
        
        // Mark placeholder contributors as enriched but failed
        await this.markContributorAsEnriched(contributor.id, {});
        return false;
      }
      
      // Fetch contributor data from GitHub API using github_id only
      const userData = await this.fetchContributorData(null, githubId);
      
      if (!userData) {
        // Mark as enriched anyway to prevent repeated processing
        await this.markContributorAsEnriched(contributor.id, {});
        return false;
      }
      
      // Map GitHub API response to our database schema
      const mappedData = this.mapContributorData(userData, contributor.id);
      
      // Update the contributor in the database
      await this.updateContributor(mappedData);
      
      logger.info(`Successfully enriched contributor: ${contributor.username || contributor.id}`);
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
   * Fetch contributor data from GitHub API
   * @param {string} username - Contributor username (ignored)
   * @param {number} githubId - Contributor GitHub ID
   * @returns {Promise<Object>} Contributor data
   * @private
   */
  async fetchContributorData(username, githubId) {
    try {
      // ONLY use github_id for lookups, never username
      if (githubId) {
        logger.info(`Fetching data for contributor by ID: ${githubId}`);
        
        // Use GitHub client to fetch user data by ID
        const userData = await this.githubClient.getUserById(githubId);
        
        // Check for rate limit information in headers (if available)
        if (userData.headers) {
          const remaining = parseInt(userData.headers['x-ratelimit-remaining'], 10);
          const resetTimestamp = parseInt(userData.headers['x-ratelimit-reset'], 10);
          
          if (!isNaN(remaining) && remaining < 10) {
            // If we're getting close to rate limit, log a warning
            const resetTime = new Date(resetTimestamp * 1000);
            logger.warn(`GitHub API rate limit running low: ${remaining} requests remaining. Resets at ${resetTime.toISOString()}`);
          }
        }
        
        return userData;
      }
      
      // If we don't have a github_id, log a warning and return null
      logger.warn('No GitHub ID provided for contributor lookup. Username lookups are disabled to prevent mistaken identity issues.');
      return null;
    } catch (error) {
      // Check if user wasn't found
      if (error.message && error.message.includes('Not Found')) {
        logger.warn(`Contributor not found with ID: ${githubId}`);
        this.stats.notFound++;
        return null;
      }
      
      // Re-throw other errors
      throw error;
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
} 