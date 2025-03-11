/**
 * Repository Supabase Service
 * 
 * This service is responsible for storing and retrieving repository data
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
 * RepositoryService class for managing repositories in the database
 */
export class RepositoryService {
  constructor(supabaseClient) {
    this.supabaseClient = supabaseClient;
  }
  
  /**
   * Store repository data in the database
   */
  async storeRepositoryData(repositoryData) {
    try {
      // Ensure data has required fields
      if (!repositoryData.id || !repositoryData.name) {
        throw new Error('Repository data must include id and name');
      }
      
      const { data, error } = await this.supabaseClient.getClient()
        .from('repositories')
        .upsert({
          id: repositoryData.id,
          name: repositoryData.name,
          description: repositoryData.description || null,
          url: repositoryData.html_url || repositoryData.url,
          stars: repositoryData.stargazers_count || repositoryData.stars || 0,
          forks: repositoryData.forks_count || repositoryData.forks || 0,
          is_enriched: repositoryData.is_enriched || false,
          open_issues_count: repositoryData.open_issues_count || 0,
          size_kb: repositoryData.size || null,
          watchers_count: repositoryData.watchers_count || 0,
          primary_language: repositoryData.language || null,
          license: repositoryData.license?.name || null
        }, {
          onConflict: 'id',
          returning: 'minimal'
        });
      
      if (error) {
        logger.error('Failed to store repository data', { error });
        throw error;
      }
      
      logger.info('Repository data stored successfully', { 
        repository: repositoryData.name 
      });
      
      return data;
    } catch (error) {
      logger.error('Error storing repository data', { error });
      throw error;
    }
  }
  
  /**
   * Get a repository by name
   */
  async getRepositoryByName(repositoryName) {
    try {
      const { data, error } = await this.supabaseClient.getClient()
        .from('repositories')
        .select('*')
        .eq('name', repositoryName)
        .single();
      
      if (error) {
        // If the error is not 'No rows found', log and throw
        if (error.code !== 'PGRST116') {
          logger.error('Failed to get repository by name', { error, repositoryName });
          throw error;
        }
        return null;
      }
      
      return data;
    } catch (error) {
      logger.error('Error getting repository by name', { error, repositoryName });
      throw error;
    }
  }
  
  /**
   * Update a repository
   */
  async updateRepository(repositoryId, updateData) {
    try {
      const { data, error } = await this.supabaseClient.getClient()
        .from('repositories')
        .update(updateData)
        .eq('id', repositoryId)
        .select();
      
      if (error) {
        logger.error('Failed to update repository', { error, repositoryId });
        throw error;
      }
      
      return data[0];
    } catch (error) {
      logger.error('Error updating repository', { error, repositoryId });
      throw error;
    }
  }
  
  /**
   * Get all repositories with optional filtering and pagination
   */
  async getAllRepositories(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        sortBy = 'name',
        sortDirection = 'asc',
        enriched = null
      } = options;
      
      let query = this.supabaseClient.getClient()
        .from('repositories')
        .select('*');
      
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
        logger.error('Failed to get repositories', { error });
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error('Error getting repositories', { error });
      throw error;
    }
  }
  
  /**
   * Delete a repository
   */
  async deleteRepository(repositoryId) {
    try {
      const { data, error } = await this.supabaseClient.getClient()
        .from('repositories')
        .delete()
        .eq('id', repositoryId);
      
      if (error) {
        logger.error('Failed to delete repository', { error, repositoryId });
        throw error;
      }
      
      return { success: true, repositoryId };
    } catch (error) {
      logger.error('Error deleting repository', { error, repositoryId });
      throw error;
    }
  }
} 