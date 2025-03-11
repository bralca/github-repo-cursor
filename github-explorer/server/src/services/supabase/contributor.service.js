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
 * Store contributor data in Supabase
 * @param {object} contributorData - Processed contributor data
 * @returns {Promise<object>} - Result of the insert/update operation
 */
export async function storeContributorData(contributorData) {
  if (!contributorData || !contributorData.username) {
    logger.error('Invalid contributor data provided for storage');
    throw new Error('Valid contributor data is required');
  }

  try {
    logger.info(`Storing contributor data for: ${contributorData.username}`);
    
    // Check if contributor already exists
    const { data: existingContributor, error: lookupError } = await supabase
      .from('contributors')
      .select('id, username')
      .eq('username', contributorData.username)
      .maybeSingle();
    
    if (lookupError) {
      logger.error(`Error looking up contributor: ${lookupError.message}`, { 
        error: lookupError, 
        username: contributorData.username 
      });
      throw lookupError;
    }
    
    let result;
    
    // Update or insert contributor data
    if (existingContributor) {
      // Update existing contributor
      const { data, error } = await supabase
        .from('contributors')
        .update(contributorData)
        .eq('id', existingContributor.id)
        .select();
      
      if (error) throw error;
      result = { data, operation: 'update', id: existingContributor.id };
      logger.info(`Updated contributor data for: ${contributorData.username} (ID: ${existingContributor.id})`);
    } else {
      // Insert new contributor
      const { data, error } = await supabase
        .from('contributors')
        .insert(contributorData)
        .select();
      
      if (error) throw error;
      result = { data, operation: 'insert', id: data[0].id };
      logger.info(`Inserted new contributor: ${contributorData.username} (ID: ${data[0].id})`);
    }
    
    return result;
  } catch (error) {
    logger.error(`Error storing contributor data: ${error.message}`, {
      error,
      username: contributorData.username
    });
    throw new Error(`Failed to store contributor data: ${error.message}`);
  }
}

/**
 * Retrieve contributor by username
 * @param {string} username - Username of the contributor to retrieve
 * @returns {Promise<object>} - Contributor data
 */
export async function getContributorByUsername(username) {
  try {
    const { data, error } = await supabase
      .from('contributors')
      .select('*')
      .eq('username', username)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error retrieving contributor: ${error.message}`, {
      error,
      username
    });
    throw new Error(`Failed to retrieve contributor: ${error.message}`);
  }
}

/**
 * Update specific contributor fields
 * @param {string} contributorId - ID of the contributor to update
 * @param {object} updateData - Data fields to update
 * @returns {Promise<object>} - Updated contributor data
 */
export async function updateContributor(contributorId, updateData) {
  try {
    const { data, error } = await supabase
      .from('contributors')
      .update(updateData)
      .eq('id', contributorId)
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error updating contributor: ${error.message}`, {
      error,
      contributorId
    });
    throw new Error(`Failed to update contributor: ${error.message}`);
  }
}

/**
 * Get all contributors with optional filtering
 * @param {object} options - Filter and pagination options
 * @returns {Promise<object>} - List of contributors and count
 */
export async function getAllContributors(options = {}) {
  const {
    isEnriched = null,
    limit = 10,
    offset = 0,
    orderBy = 'impact_score',
    orderDirection = 'desc'
  } = options;
  
  try {
    let query = supabase
      .from('contributors')
      .select('*', { count: 'exact' });
    
    // Apply optional filters
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
    logger.error(`Error retrieving contributors: ${error.message}`, { error });
    throw new Error(`Failed to retrieve contributors: ${error.message}`);
  }
}

/**
 * Get top contributors by impact score
 * @param {number} limit - Number of contributors to retrieve
 * @returns {Promise<Array>} - List of top contributors
 */
export async function getTopContributors(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('contributors')
      .select('*')
      .order('impact_score', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error retrieving top contributors: ${error.message}`, { error });
    throw new Error(`Failed to retrieve top contributors: ${error.message}`);
  }
}

/**
 * Link contributor to repository (create or update junction record)
 * @param {string} contributorId - Contributor ID
 * @param {number} repositoryId - Repository ID
 * @param {number} contributionCount - Number of contributions
 * @returns {Promise<object>} - Junction record data
 */
export async function linkContributorToRepository(contributorId, repositoryId, contributionCount = 1) {
  try {
    // Check if relationship already exists
    const { data: existingLink, error: lookupError } = await supabase
      .from('contributor_repository')
      .select('contributor_id, repository_id, contribution_count')
      .eq('contributor_id', contributorId)
      .eq('repository_id', repositoryId)
      .maybeSingle();
      
    if (lookupError) throw lookupError;
    
    // Update or insert relationship
    if (existingLink) {
      // Update existing link
      const { data, error } = await supabase
        .from('contributor_repository')
        .update({
          contribution_count: existingLink.contribution_count + contributionCount
        })
        .eq('contributor_id', contributorId)
        .eq('repository_id', repositoryId)
        .select();
        
      if (error) throw error;
      return { data, operation: 'update' };
    } else {
      // Create new link
      const { data, error } = await supabase
        .from('contributor_repository')
        .insert({
          contributor_id: contributorId,
          repository_id: repositoryId,
          contribution_count: contributionCount
        })
        .select();
        
      if (error) throw error;
      return { data, operation: 'insert' };
    }
  } catch (error) {
    logger.error(`Error linking contributor to repository: ${error.message}`, {
      error,
      contributorId,
      repositoryId
    });
    throw new Error(`Failed to link contributor to repository: ${error.message}`);
  }
}

/**
 * Get contributors for a specific repository
 * @param {number} repositoryId - Repository ID
 * @param {number} limit - Maximum number of contributors to return
 * @returns {Promise<Array>} - List of contributors
 */
export async function getContributorsForRepository(repositoryId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('contributor_repository')
      .select(`
        contribution_count,
        contributors:contributor_id(*)
      `)
      .eq('repository_id', repositoryId)
      .order('contribution_count', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    // Transform the data to a more usable format
    return data.map(item => ({
      ...item.contributors,
      contribution_count: item.contribution_count
    }));
  } catch (error) {
    logger.error(`Error retrieving contributors for repository: ${error.message}`, {
      error,
      repositoryId
    });
    throw new Error(`Failed to retrieve contributors for repository: ${error.message}`);
  }
}

export default {
  storeContributorData,
  getContributorByUsername,
  updateContributor,
  getAllContributors,
  getTopContributors,
  linkContributorToRepository,
  getContributorsForRepository
}; 