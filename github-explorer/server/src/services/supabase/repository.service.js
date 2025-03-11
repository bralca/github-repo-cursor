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
 * Store repository data in Supabase
 * @param {object} repositoryData - Processed repository data
 * @returns {Promise<object>} - Result of the insert/update operation
 */
export async function storeRepositoryData(repositoryData) {
  if (!repositoryData || !repositoryData.name) {
    logger.error('Invalid repository data provided for storage');
    throw new Error('Valid repository data is required');
  }

  try {
    logger.info(`Storing repository data for: ${repositoryData.name}`);
    
    // Check if repository already exists
    const { data: existingRepo, error: lookupError } = await supabase
      .from('repositories')
      .select('id, name')
      .eq('name', repositoryData.name)
      .maybeSingle();
    
    if (lookupError) {
      logger.error(`Error looking up repository: ${lookupError.message}`, { 
        error: lookupError, 
        repositoryName: repositoryData.name 
      });
      throw lookupError;
    }
    
    let result;
    
    // Update or insert repository data
    if (existingRepo) {
      // Update existing repository
      const { data, error } = await supabase
        .from('repositories')
        .update({
          ...repositoryData,
          last_updated: new Date().toISOString()
        })
        .eq('id', existingRepo.id)
        .select();
      
      if (error) throw error;
      result = { data, operation: 'update', id: existingRepo.id };
      logger.info(`Updated repository data for: ${repositoryData.name} (ID: ${existingRepo.id})`);
    } else {
      // Insert new repository
      const { data, error } = await supabase
        .from('repositories')
        .insert(repositoryData)
        .select();
      
      if (error) throw error;
      result = { data, operation: 'insert', id: data[0].id };
      logger.info(`Inserted new repository: ${repositoryData.name} (ID: ${data[0].id})`);
    }
    
    return result;
  } catch (error) {
    logger.error(`Error storing repository data: ${error.message}`, {
      error,
      repositoryName: repositoryData.name
    });
    throw new Error(`Failed to store repository data: ${error.message}`);
  }
}

/**
 * Retrieve repository by name
 * @param {string} repositoryName - Name of the repository to retrieve
 * @returns {Promise<object>} - Repository data
 */
export async function getRepositoryByName(repositoryName) {
  try {
    const { data, error } = await supabase
      .from('repositories')
      .select('*')
      .eq('name', repositoryName)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error retrieving repository: ${error.message}`, {
      error,
      repositoryName
    });
    throw new Error(`Failed to retrieve repository: ${error.message}`);
  }
}

/**
 * Update specific repository fields
 * @param {number} repositoryId - ID of the repository to update
 * @param {object} updateData - Data fields to update
 * @returns {Promise<object>} - Updated repository data
 */
export async function updateRepository(repositoryId, updateData) {
  try {
    const { data, error } = await supabase
      .from('repositories')
      .update({
        ...updateData,
        last_updated: new Date().toISOString()
      })
      .eq('id', repositoryId)
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error updating repository: ${error.message}`, {
      error,
      repositoryId
    });
    throw new Error(`Failed to update repository: ${error.message}`);
  }
}

/**
 * Get all repositories with optional filtering
 * @param {object} options - Filter and pagination options
 * @returns {Promise<object>} - List of repositories and count
 */
export async function getAllRepositories(options = {}) {
  const {
    isEnriched = null,
    limit = 10,
    offset = 0,
    orderBy = 'stars',
    orderDirection = 'desc'
  } = options;
  
  try {
    let query = supabase
      .from('repositories')
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
    logger.error(`Error retrieving repositories: ${error.message}`, { error });
    throw new Error(`Failed to retrieve repositories: ${error.message}`);
  }
}

/**
 * Delete a repository and related data
 * @param {number} repositoryId - ID of the repository to delete
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteRepository(repositoryId) {
  try {
    // Start a transaction to handle related data
    const { error } = await supabase.rpc('delete_repository_cascade', {
      repository_id: repositoryId
    });
    
    if (error) throw error;
    
    logger.info(`Successfully deleted repository with ID: ${repositoryId}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting repository: ${error.message}`, {
      error,
      repositoryId
    });
    throw new Error(`Failed to delete repository: ${error.message}`);
  }
}

export default {
  storeRepositoryData,
  getRepositoryByName,
  updateRepository,
  getAllRepositories,
  deleteRepository
}; 