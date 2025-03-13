/**
 * Contributor Supabase Service
 * 
 * This service is responsible for storing and retrieving contributor data
 * from the Supabase database.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please check environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * ContributorService class for managing contributors in the database
 */
export class ContributorService {
  constructor(supabaseClient) {
    this.supabaseClient = supabaseClient;
  }
  
  /**
   * Store contributor data in the database
   */
  async storeContributorData(contributorData) {
    try {
      // Ensure data has required fields
      if (!contributorData.id || !contributorData.username) {
        throw new Error('Contributor data must include id and username');
      }
      
      const { data, error } = await this.supabaseClient.getClient()
        .from('contributors')
        .upsert({
          id: contributorData.id,
          username: contributorData.username,
          name: contributorData.name || null,
          avatar: contributorData.avatar_url || null,
          bio: contributorData.bio || null,
          company: contributorData.company || null,
          blog: contributorData.blog || null,
          twitter_username: contributorData.twitter_username || null,
          location: contributorData.location || null,
          followers: contributorData.followers || 0,
          repositories: contributorData.public_repos || 0,
          is_enriched: contributorData.is_enriched || false
        }, {
          onConflict: 'id',
          returning: 'minimal'
        });
      
      if (error) {
        logger.error('Failed to store contributor data', { error });
        throw error;
      }
      
      logger.info('Contributor data stored successfully', { 
        contributor: contributorData.username 
      });
      
      return data;
    } catch (error) {
      logger.error('Error storing contributor data', { error });
      throw error;
    }
  }
  
  /**
   * Get a contributor by username
   */
  async getContributorByUsername(username) {
    try {
      const { data, error } = await this.supabaseClient.getClient()
        .from('contributors')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) {
        // If the error is not 'No rows found', log and throw
        if (error.code !== 'PGRST116') {
          logger.error('Failed to get contributor by username', { error, username });
          throw error;
        }
        return null;
      }
      
      return data;
    } catch (error) {
      logger.error('Error getting contributor by username', { error, username });
      throw error;
    }
  }
  
  /**
   * Update a contributor
   */
  async updateContributor(contributorId, updateData) {
    try {
      const { data, error } = await this.supabaseClient.getClient()
        .from('contributors')
        .update(updateData)
        .eq('id', contributorId)
        .select();
      
      if (error) {
        logger.error('Failed to update contributor', { error, contributorId });
        throw error;
      }
      
      return data[0];
    } catch (error) {
      logger.error('Error updating contributor', { error, contributorId });
      throw error;
    }
  }
  
  /**
   * Get all contributors with optional filtering and pagination
   */
  async getAllContributors(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        sortBy = 'username',
        sortDirection = 'asc',
        enriched = null
      } = options;
      
      let query = this.supabaseClient.getClient()
        .from('contributors')
        .select('*, contributor_repository(repository_id, contribution_count)');
      
      // Apply is_enriched filter if provided
      if (enriched !== null) {
        query = query.eq('is_enriched', enriched);
      }
      
      // Apply sorting
      query = query.order(sortBy, { ascending: sortDirection === 'asc' });
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1);
      
      const { data, error } = await query;
      
      if (error) {
        logger.error('Failed to get contributors', { error });
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error('Error getting contributors', { error });
      throw error;
    }
  }
  
  /**
   * Get top contributors by contribution count
   */
  async getTopContributors(limit = 10) {
    try {
      const { data, error } = await this.supabaseClient.getClient()
        .rpc('get_top_contributors_by_commits', { limit_count: limit });
      
      if (error) {
        logger.error('Failed to get top contributors', { error });
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error('Error getting top contributors', { error });
      throw error;
    }
  }
  
  /**
   * Link a contributor to a repository
   */
  async linkContributorToRepository(contributorId, repositoryId, contributionCount = 1) {
    try {
      // First check if the relationship exists
      const { data: existingData, error: existingError } = await this.supabaseClient.getClient()
        .from('contributor_repository')
        .select('*')
        .eq('contributor_id', contributorId)
        .eq('repository_id', repositoryId)
        .single();
      
      if (existingError && existingError.code !== 'PGRST116') {
        logger.error('Failed to check contributor-repository relationship', { 
          error: existingError,
          contributorId,
          repositoryId
        });
        throw existingError;
      }
      
      // If relationship exists, update the contribution count
      if (existingData) {
        const newCount = existingData.contribution_count + contributionCount;
        
        const { data, error } = await this.supabaseClient.getClient()
          .from('contributor_repository')
          .update({ contribution_count: newCount })
          .eq('contributor_id', contributorId)
          .eq('repository_id', repositoryId)
          .select();
        
        if (error) {
          logger.error('Failed to update contributor-repository relationship', { 
            error,
            contributorId,
            repositoryId
          });
          throw error;
        }
        
        return data[0];
      } else {
        // If relationship doesn't exist, create a new one
        const { data, error } = await this.supabaseClient.getClient()
          .from('contributor_repository')
          .insert({
            contributor_id: contributorId,
            repository_id: repositoryId,
            contribution_count: contributionCount
          })
          .select();
        
        if (error) {
          logger.error('Failed to create contributor-repository relationship', { 
            error,
            contributorId,
            repositoryId
          });
          throw error;
        }
        
        return data[0];
      }
    } catch (error) {
      logger.error('Error linking contributor to repository', { 
        error,
        contributorId,
        repositoryId
      });
      throw error;
    }
  }
  
  /**
   * Get contributors for a specific repository
   */
  async getContributorsForRepository(repositoryId, limit = 10) {
    try {
      const { data, error } = await this.supabaseClient.getClient()
        .from('contributor_repository')
        .select('contributor_id, contribution_count, contributors(*)')
        .eq('repository_id', repositoryId)
        .order('contribution_count', { ascending: false })
        .limit(limit);
      
      if (error) {
        logger.error('Failed to get contributors for repository', { 
          error,
          repositoryId
        });
        throw error;
      }
      
      // Transform the data to a more usable format
      return data.map(item => ({
        ...item.contributors,
        contribution_count: item.contribution_count
      }));
    } catch (error) {
      logger.error('Error getting contributors for repository', { 
        error,
        repositoryId
      });
      throw error;
    }
  }
}

// Create an instance of the contributor service
const contributorService = new ContributorService(supabase);

// Export the service instance as default
export default contributorService;

// Export individual methods for backward compatibility
export const storeContributorData = contributorService.storeContributorData.bind(contributorService);
export const getContributorByUsername = contributorService.getContributorByUsername.bind(contributorService);
export const getAllContributors = contributorService.getAllContributors.bind(contributorService);
export const getTopContributors = contributorService.getTopContributors.bind(contributorService);
export const updateContributor = contributorService.updateContributor.bind(contributorService);
export const linkContributorToRepository = contributorService.linkContributorToRepository.bind(contributorService);
export const getContributorsForRepository = contributorService.getContributorsForRepository.bind(contributorService); 