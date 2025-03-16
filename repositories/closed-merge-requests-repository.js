// This file contains functions for accessing raw GitHub data from the database
import { getDb } from '../lib/database';

/**
 * Get raw GitHub data by entity type and GitHub ID
 * @param {string} entityType - The type of entity (repository, user, etc.)
 * @param {string} githubId - The GitHub ID of the entity
 * @returns {Promise<Object>} - The raw data
 */
export async function getRawDataByEntityAndId(entityType, githubId) {
  const db = await getDb();
  
  try {
    const query = `
      SELECT * FROM closed_merge_requests_raw
      WHERE entity_type = ? AND github_id = ?
    `;
    
    const result = await db.get(query, [entityType, githubId]);
    
    if (result && result.data) {
      result.data = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching raw data:', error);
    return null;
  }
}

/**
 * Store raw GitHub data
 * @param {Object} data - The data object containing entity_type, github_id, and data
 * @returns {Promise<boolean>} - Success indicator
 */
export async function storeRawData(data) {
  const db = await getDb();
  
  try {
    const now = new Date().toISOString();
    const jsonData = typeof data.data === 'object' ? JSON.stringify(data.data) : data.data;
    
    const query = `
      INSERT INTO closed_merge_requests_raw
      (entity_type, github_id, data, fetched_at, api_endpoint, etag, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.run(query, [
      data.entity_type,
      data.github_id,
      jsonData,
      data.fetched_at || now,
      data.api_endpoint || null,
      data.etag || null,
      now
    ]);
    
    return true;
  } catch (error) {
    console.error('Error storing raw data:', error);
    return false;
  }
}

/**
 * Get raw data by entity type with pagination
 * @param {string} entityType - The type of entity
 * @param {Object} options - Pagination options
 * @returns {Promise<Array>} - Array of raw data objects
 */
export async function getRawDataByEntityType(entityType, options = {}) {
  const db = await getDb();
  const limit = options.limit || 20;
  const offset = options.offset || 0;
  const orderBy = options.orderBy || 'fetched_at';
  const order = options.order === 'asc' ? 'ASC' : 'DESC';
  
  try {
    const query = `
      SELECT * FROM closed_merge_requests_raw
      WHERE entity_type = ?
      ORDER BY ${orderBy} ${order}
      LIMIT ? OFFSET ?
    `;
    
    const results = await db.all(query, [entityType, limit, offset]);
    
    // Parse JSON data
    return results.map(result => {
      if (result.data) {
        result.data = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
      }
      return result;
    });
  } catch (error) {
    console.error('Error fetching raw data by entity type:', error);
    return [];
  }
}

/**
 * Get all raw data with pagination
 * @param {Object} options - Pagination options
 * @returns {Promise<Array>} - Array of raw data objects
 */
export async function getAllRawData(options = {}) {
  const db = await getDb();
  const limit = options.limit || 20;
  const offset = options.offset || 0;
  const orderBy = options.orderBy || 'fetched_at';
  const order = options.order === 'asc' ? 'ASC' : 'DESC';
  
  try {
    const query = `
      SELECT * FROM closed_merge_requests_raw
      ORDER BY ${orderBy} ${order}
      LIMIT ? OFFSET ?
    `;
    
    const results = await db.all(query, [limit, offset]);
    
    // Parse JSON data
    return results.map(result => {
      if (result.data) {
        result.data = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
      }
      return result;
    });
  } catch (error) {
    console.error('Error fetching all raw data:', error);
    return [];
  }
}

/**
 * Delete raw data by ID
 * @param {number} id - The ID of the raw data to delete
 * @returns {Promise<boolean>} - Success indicator
 */
export async function deleteRawDataById(id) {
  const db = await getDb();
  
  try {
    const query = `
      DELETE FROM closed_merge_requests_raw
      WHERE id = ?
    `;
    
    await db.run(query, [id]);
    return true;
  } catch (error) {
    console.error('Error deleting raw data:', error);
    return false;
  }
}

/**
 * Count raw data by entity type
 * @param {string} entityType - The type of entity
 * @returns {Promise<number>} - The count
 */
export async function countRawDataByEntityType(entityType) {
  const db = await getDb();
  
  try {
    const query = `
      SELECT COUNT(*) as count 
      FROM closed_merge_requests_raw
      WHERE entity_type = ?
    `;
    
    const result = await db.get(query, [entityType]);
    return result.count;
  } catch (error) {
    console.error('Error counting raw data:', error);
    return 0;
  }
}

/**
 * Get raw data by date range
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Promise<Array>} - Array of raw data objects
 */
export async function getRawDataByDateRange(startDate, endDate) {
  const db = await getDb();
  
  try {
    const query = `
      SELECT * FROM closed_merge_requests_raw
      WHERE fetched_at BETWEEN ? AND ?
      ORDER BY fetched_at DESC
    `;
    
    const results = await db.all(query, [startDate, endDate]);
    
    // Parse JSON data
    return results.map(result => {
      if (result.data) {
        result.data = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
      }
      return result;
    });
  } catch (error) {
    console.error('Error fetching raw data by date range:', error);
    return [];
  }
} 