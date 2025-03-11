/**
 * Merge Request Supabase Service
 * 
 * This service is responsible for storing and retrieving merge request (pull request) data
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
 * MergeRequestService class for managing merge requests in the database
 */
export class MergeRequestService {
  constructor(supabaseClient) {
    this.supabaseClient = supabaseClient;
  }
  
  /**
   * Store merge request data in the database
   */
  async storeMergeRequestData(mergeRequestData) {
    try {
      // Ensure data has required fields
      if (!mergeRequestData.id || !mergeRequestData.title) {
        throw new Error('Merge request data must include id and title');
      }
      
      const { data, error } = await this.supabaseClient.getClient()
        .from('merge_requests')
        .upsert({
          id: mergeRequestData.id,
          title: mergeRequestData.title,
          description: mergeRequestData.body || null,
          status: mergeRequestData.state || 'open',
          author: mergeRequestData.user?.login || null,
          author_avatar: mergeRequestData.user?.avatar_url || null,
          created_at: mergeRequestData.created_at,
          updated_at: mergeRequestData.updated_at,
          closed_at: mergeRequestData.closed_at || null,
          merged_at: mergeRequestData.merged_at || null,
          base_branch: mergeRequestData.base?.ref || null,
          head_branch: mergeRequestData.head?.ref || null,
          repository_id: mergeRequestData.repository_id,
          is_enriched: mergeRequestData.is_enriched || false,
          github_link: mergeRequestData.html_url || null,
          labels: mergeRequestData.labels?.map(label => label.name) || []
        }, {
          onConflict: 'id',
          returning: 'minimal'
        });
      
      if (error) {
        logger.error('Failed to store merge request data', { error });
        throw error;
      }
      
      logger.info('Merge request data stored successfully', { 
        mergeRequest: mergeRequestData.title 
      });
      
      return data;
    } catch (error) {
      logger.error('Error storing merge request data', { error });
      throw error;
    }
  }
  
  /**
   * Get a merge request by id
   */
  async getMergeRequestById(mergeRequestId) {
    try {
      const { data, error } = await this.supabaseClient.getClient()
        .from('merge_requests')
        .select('*')
        .eq('id', mergeRequestId)
        .single();
      
      if (error) {
        // If the error is not 'No rows found', log and throw
        if (error.code !== 'PGRST116') {
          logger.error('Failed to get merge request by id', { error, mergeRequestId });
          throw error;
        }
        return null;
      }
      
      return data;
    } catch (error) {
      logger.error('Error getting merge request by id', { error, mergeRequestId });
      throw error;
    }
  }
  
  /**
   * Update a merge request
   */
  async updateMergeRequest(mergeRequestId, updateData) {
    try {
      const { data, error } = await this.supabaseClient.getClient()
        .from('merge_requests')
        .update(updateData)
        .eq('id', mergeRequestId)
        .select();
      
      if (error) {
        logger.error('Failed to update merge request', { error, mergeRequestId });
        throw error;
      }
      
      return data[0];
    } catch (error) {
      logger.error('Error updating merge request', { error, mergeRequestId });
      throw error;
    }
  }
  
  /**
   * Get all merge requests with optional filtering and pagination
   */
  async getAllMergeRequests(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        sortBy = 'created_at',
        sortDirection = 'desc',
        status = null,
        enriched = null
      } = options;
      
      let query = this.supabaseClient.getClient()
        .from('merge_requests')
        .select('*');
      
      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }
      
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
        logger.error('Failed to get merge requests', { error });
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error('Error getting merge requests', { error });
      throw error;
    }
  }
  
  /**
   * Get merge requests for a specific repository
   */
  async getMergeRequestsByRepository(repositoryId, options = {}) {
    try {
      const { 
        limit = 50, 
        offset = 0,
        status = null 
      } = options;
      
      let query = this.supabaseClient.getClient()
        .from('merge_requests')
        .select('*')
        .eq('repository_id', repositoryId);
      
      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }
      
      // Apply pagination
      query = query.order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      const { data, error } = await query;
      
      if (error) {
        logger.error('Failed to get merge requests by repository', { 
          error,
          repositoryId
        });
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error('Error getting merge requests by repository', { 
        error,
        repositoryId
      });
      throw error;
    }
  }
  
  /**
   * Get merge requests by author
   */
  async getMergeRequestsByAuthor(author, options = {}) {
    try {
      const { 
        limit = 50, 
        offset = 0,
        status = null 
      } = options;
      
      let query = this.supabaseClient.getClient()
        .from('merge_requests')
        .select('*')
        .eq('author', author);
      
      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }
      
      // Apply pagination
      query = query.order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      const { data, error } = await query;
      
      if (error) {
        logger.error('Failed to get merge requests by author', { 
          error,
          author
        });
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error('Error getting merge requests by author', { 
        error,
        author
      });
      throw error;
    }
  }
  
  /**
   * Get recent merge requests by status
   */
  async getRecentMergeRequestsByStatus(status, limit = 10) {
    try {
      const { data, error } = await this.supabaseClient.getClient()
        .from('merge_requests')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        logger.error('Failed to get recent merge requests by status', { 
          error,
          status
        });
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error('Error getting recent merge requests by status', { 
        error,
        status
      });
      throw error;
    }
  }
  
  /**
   * Store pull request review data
   */
  async storePullRequestReview(reviewData) {
    try {
      const { data, error } = await this.supabaseClient.getClient()
        .from('pull_request_reviewers')
        .insert({
          pull_request_id: reviewData.pull_request_id,
          reviewer_id: reviewData.reviewer_id,
          status: reviewData.status,
          submitted_at: reviewData.submitted_at
        })
        .select();
      
      if (error) {
        logger.error('Failed to store pull request review', { error });
        throw error;
      }
      
      return data[0];
    } catch (error) {
      logger.error('Error storing pull request review', { error });
      throw error;
    }
  }
  
  /**
   * Store pull request comment
   */
  async storePullRequestComment(commentData) {
    try {
      const { data, error } = await this.supabaseClient.getClient()
        .from('pull_request_comments')
        .insert({
          pull_request_id: commentData.pull_request_id,
          github_id: commentData.github_id,
          author: commentData.author,
          content: commentData.content,
          created_at: commentData.created_at,
          updated_at: commentData.updated_at,
          file_path: commentData.file_path,
          line_number: commentData.line_number
        })
        .select();
      
      if (error) {
        logger.error('Failed to store pull request comment', { error });
        throw error;
      }
      
      return data[0];
    } catch (error) {
      logger.error('Error storing pull request comment', { error });
      throw error;
    }
  }
} 