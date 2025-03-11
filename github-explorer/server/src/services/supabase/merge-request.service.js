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
 * Store merge request data in Supabase
 * @param {object} mergeRequestData - Processed merge request data
 * @returns {Promise<object>} - Result of the insert/update operation
 */
export async function storeMergeRequestData(mergeRequestData) {
  if (!mergeRequestData || !mergeRequestData.id) {
    logger.error('Invalid merge request data provided for storage');
    throw new Error('Valid merge request data is required');
  }

  try {
    logger.info(`Storing merge request data for PR ID: ${mergeRequestData.id}`);
    
    // Check if merge request already exists
    const { data: existingMR, error: lookupError } = await supabase
      .from('merge_requests')
      .select('id')
      .eq('id', mergeRequestData.id)
      .maybeSingle();
    
    if (lookupError) {
      logger.error(`Error looking up merge request: ${lookupError.message}`, { 
        error: lookupError, 
        mergeRequestId: mergeRequestData.id 
      });
      throw lookupError;
    }
    
    let result;
    
    // Update or insert merge request data
    if (existingMR) {
      // Update existing merge request
      const { data, error } = await supabase
        .from('merge_requests')
        .update(mergeRequestData)
        .eq('id', existingMR.id)
        .select();
      
      if (error) throw error;
      result = { data, operation: 'update', id: existingMR.id };
      logger.info(`Updated merge request data for ID: ${existingMR.id}`);
    } else {
      // Insert new merge request
      const { data, error } = await supabase
        .from('merge_requests')
        .insert(mergeRequestData)
        .select();
      
      if (error) throw error;
      result = { data, operation: 'insert', id: data[0].id };
      logger.info(`Inserted new merge request with ID: ${data[0].id}`);
    }
    
    return result;
  } catch (error) {
    logger.error(`Error storing merge request data: ${error.message}`, {
      error,
      mergeRequestId: mergeRequestData.id
    });
    throw new Error(`Failed to store merge request data: ${error.message}`);
  }
}

/**
 * Retrieve merge request by ID
 * @param {number} mergeRequestId - ID of the merge request to retrieve
 * @returns {Promise<object>} - Merge request data
 */
export async function getMergeRequestById(mergeRequestId) {
  try {
    const { data, error } = await supabase
      .from('merge_requests')
      .select('*')
      .eq('id', mergeRequestId)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error retrieving merge request: ${error.message}`, {
      error,
      mergeRequestId
    });
    throw new Error(`Failed to retrieve merge request: ${error.message}`);
  }
}

/**
 * Update specific merge request fields
 * @param {number} mergeRequestId - ID of the merge request to update
 * @param {object} updateData - Data fields to update
 * @returns {Promise<object>} - Updated merge request data
 */
export async function updateMergeRequest(mergeRequestId, updateData) {
  try {
    const { data, error } = await supabase
      .from('merge_requests')
      .update(updateData)
      .eq('id', mergeRequestId)
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error updating merge request: ${error.message}`, {
      error,
      mergeRequestId
    });
    throw new Error(`Failed to update merge request: ${error.message}`);
  }
}

/**
 * Get all merge requests with optional filtering
 * @param {object} options - Filter and pagination options
 * @returns {Promise<object>} - List of merge requests and count
 */
export async function getAllMergeRequests(options = {}) {
  const {
    repositoryId = null,
    status = null,
    author = null,
    isEnriched = null,
    limit = 10,
    offset = 0,
    orderBy = 'updated_at',
    orderDirection = 'desc'
  } = options;
  
  try {
    let query = supabase
      .from('merge_requests')
      .select('*', { count: 'exact' });
    
    // Apply optional filters
    if (repositoryId !== null) {
      query = query.eq('repository_id', repositoryId);
    }
    
    if (status !== null) {
      query = query.eq('status', status);
    }
    
    if (author !== null) {
      query = query.eq('author', author);
    }
    
    if (isEnriched !== null) {
      query = query.eq('is_enriched', isEnriched);
    }
    
    // Apply sorting
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return {
      data,
      count,
      pagination: {
        offset,
        limit,
        hasMore: count > offset + limit
      }
    };
  } catch (error) {
    logger.error(`Error retrieving merge requests: ${error.message}`, { error });
    throw new Error(`Failed to retrieve merge requests: ${error.message}`);
  }
}

/**
 * Get merge requests for a specific repository
 * @param {number} repositoryId - Repository ID
 * @param {object} options - Filter and pagination options
 * @returns {Promise<object>} - List of merge requests and count
 */
export async function getMergeRequestsByRepository(repositoryId, options = {}) {
  const defaultOptions = {
    repositoryId,
    ...options
  };
  
  return getAllMergeRequests(defaultOptions);
}

/**
 * Get merge requests by a specific author
 * @param {string} author - Author username
 * @param {object} options - Filter and pagination options
 * @returns {Promise<object>} - List of merge requests and count
 */
export async function getMergeRequestsByAuthor(author, options = {}) {
  const defaultOptions = {
    author,
    ...options
  };
  
  return getAllMergeRequests(defaultOptions);
}

/**
 * Get recent merge requests with a specific status
 * @param {string} status - Status (open, closed, merged)
 * @param {number} limit - Maximum number of PRs to retrieve
 * @returns {Promise<Array>} - List of merge requests
 */
export async function getRecentMergeRequestsByStatus(status, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('merge_requests')
      .select('*')
      .eq('status', status)
      .order('updated_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error retrieving recent merge requests: ${error.message}`, {
      error,
      status
    });
    throw new Error(`Failed to retrieve recent merge requests: ${error.message}`);
  }
}

/**
 * Store PR review data
 * @param {object} reviewData - Review data to store
 * @returns {Promise<object>} - Result of the operation
 */
export async function storePullRequestReview(reviewData) {
  try {
    const { data, error } = await supabase
      .from('pull_request_reviewers')
      .insert(reviewData)
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error storing PR review data: ${error.message}`, {
      error,
      prId: reviewData.pull_request_id
    });
    throw new Error(`Failed to store PR review data: ${error.message}`);
  }
}

/**
 * Store PR comment data
 * @param {object} commentData - Comment data to store
 * @returns {Promise<object>} - Result of the operation
 */
export async function storePullRequestComment(commentData) {
  try {
    const { data, error } = await supabase
      .from('pull_request_comments')
      .insert(commentData)
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error storing PR comment data: ${error.message}`, {
      error,
      prId: commentData.pull_request_id
    });
    throw new Error(`Failed to store PR comment data: ${error.message}`);
  }
}

export default {
  storeMergeRequestData,
  getMergeRequestById,
  updateMergeRequest,
  getAllMergeRequests,
  getMergeRequestsByRepository,
  getMergeRequestsByAuthor,
  getRecentMergeRequestsByStatus,
  storePullRequestReview,
  storePullRequestComment
}; 