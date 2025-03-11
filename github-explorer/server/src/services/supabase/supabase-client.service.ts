import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import dotenv from 'dotenv';
import logger from '../../utils/logger';

// Load environment variables
dotenv.config();

// Define schema for Supabase configuration
const supabaseConfigSchema = z.object({
  SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'Supabase service key is required'),
});

// Parse and validate environment variables
const supabaseConfig = supabaseConfigSchema.parse({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
});

/**
 * Supabase client for database interactions
 */
class SupabaseService {
  private client: SupabaseClient;
  
  constructor() {
    this.client = createClient(
      supabaseConfig.SUPABASE_URL,
      supabaseConfig.SUPABASE_SERVICE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
    
    logger.info('Supabase client initialized');
  }
  
  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.client;
  }
  
  /**
   * Store raw GitHub data in the database
   */
  async storeRawGitHubData(data: any) {
    try {
      const { data: insertedData, error } = await this.client
        .from('github_raw_data')
        .insert(data)
        .select();
      
      if (error) {
        logger.error({ msg: 'Failed to store raw GitHub data', error });
        throw error;
      }
      
      return insertedData;
    } catch (error) {
      logger.error({ msg: 'Error storing raw GitHub data', error });
      throw error;
    }
  }
  
  /**
   * Get unprocessed GitHub raw data
   */
  async getUnprocessedRawData(limit: number = 100) {
    try {
      const { data, error } = await this.client
        .from('github_raw_data')
        .select('*')
        .eq('processed', false)
        .limit(limit);
      
      if (error) {
        logger.error({ msg: 'Failed to get unprocessed raw data', error });
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error({ msg: 'Error getting unprocessed raw data', error });
      throw error;
    }
  }
  
  /**
   * Mark raw data as processed
   */
  async markRawDataAsProcessed(ids: number[]) {
    try {
      const { data, error } = await this.client
        .from('github_raw_data')
        .update({ processed: true })
        .in('id', ids)
        .select();
      
      if (error) {
        logger.error({ msg: 'Failed to mark raw data as processed', error });
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error({ msg: 'Error marking raw data as processed', error });
      throw error;
    }
  }
  
  /**
   * Upsert repositories
   */
  async upsertRepositories(repositories: any[]) {
    try {
      const { data, error } = await this.client
        .from('repositories')
        .upsert(repositories, { onConflict: 'id' })
        .select();
      
      if (error) {
        logger.error({ msg: 'Failed to upsert repositories', error });
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error({ msg: 'Error upserting repositories', error });
      throw error;
    }
  }
  
  /**
   * Upsert contributors
   */
  async upsertContributors(contributors: any[]) {
    try {
      const { data, error } = await this.client
        .from('contributors')
        .upsert(contributors, { onConflict: 'id' })
        .select();
      
      if (error) {
        logger.error({ msg: 'Failed to upsert contributors', error });
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error({ msg: 'Error upserting contributors', error });
      throw error;
    }
  }
  
  /**
   * Upsert merge requests
   */
  async upsertMergeRequests(mergeRequests: any[]) {
    try {
      const { data, error } = await this.client
        .from('merge_requests')
        .upsert(mergeRequests, { onConflict: 'id' })
        .select();
      
      if (error) {
        logger.error({ msg: 'Failed to upsert merge requests', error });
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error({ msg: 'Error upserting merge requests', error });
      throw error;
    }
  }
  
  /**
   * Upsert commits
   */
  async upsertCommits(commits: any[]) {
    try {
      const { data, error } = await this.client
        .from('commits')
        .upsert(commits, { onConflict: 'hash' })
        .select();
      
      if (error) {
        logger.error({ msg: 'Failed to upsert commits', error });
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error({ msg: 'Error upserting commits', error });
      throw error;
    }
  }
}

// Create singleton instance
const supabaseService = new SupabaseService();

export default supabaseService; 