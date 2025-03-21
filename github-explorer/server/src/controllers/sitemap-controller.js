/**
 * Sitemap Controller
 * 
 * Handles database operations for sitemap generation, including:
 * - Fetching entities (repositories, contributors, merge requests) with pagination
 * - Reading and updating sitemap metadata
 */

import { openSQLiteConnection, closeSQLiteConnection } from '../utils/sqlite.js';
import { logger } from '../utils/logger.js';
import { initSitemapTable } from '../utils/db-init-sitemap.js';

/**
 * Get the sitemap metadata for all entity types
 * @returns {Promise<Array<Object>>} Array of sitemap metadata objects
 */
export async function getSitemapMetadata() {
  let db = null;
  
  try {
    db = await openSQLiteConnection();
    return await db.all('SELECT * FROM sitemap_metadata ORDER BY entity_type');
  } catch (error) {
    logger.error(`Error fetching sitemap metadata: ${error.message}`, { error });
    throw error;
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

/**
 * Get sitemap metadata for a specific entity type
 * @param {string} entityType - The entity type (repositories, contributors, etc.)
 * @returns {Promise<Object>} Sitemap metadata for the entity type
 */
export async function getSitemapMetadataForType(entityType) {
  let db = null;
  
  try {
    db = await openSQLiteConnection();
    const metadata = await db.get(
      'SELECT * FROM sitemap_metadata WHERE entity_type = ?',
      [entityType]
    );
    
    if (!metadata) {
      // Initialize if not found
      await initSitemapTable();
      return await db.get(
        'SELECT * FROM sitemap_metadata WHERE entity_type = ?',
        [entityType]
      );
    }
    
    return metadata;
  } catch (error) {
    logger.error(`Error fetching sitemap metadata for ${entityType}: ${error.message}`, { error });
    throw error;
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

/**
 * Update sitemap metadata for a specific entity type
 * @param {string} entityType - The entity type (repositories, contributors, etc.)
 * @param {Object} updates - Fields to update: { current_page, url_count }
 * @returns {Promise<Object>} Updated sitemap metadata
 */
export async function updateSitemapMetadata(entityType, updates) {
  let db = null;
  
  try {
    db = await openSQLiteConnection();
    
    // Start transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update the metadata
    await db.run(
      `UPDATE sitemap_metadata
       SET current_page = ?, url_count = ?, last_updated = CURRENT_TIMESTAMP
       WHERE entity_type = ?`,
      [updates.current_page, updates.url_count, entityType]
    );
    
    // Commit transaction
    await db.run('COMMIT');
    
    // Return the updated metadata
    return await getSitemapMetadataForType(entityType);
  } catch (error) {
    // Rollback on error
    if (db) {
      await db.run('ROLLBACK');
    }
    
    logger.error(`Error updating sitemap metadata for ${entityType}: ${error.message}`, { error });
    throw error;
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

/**
 * Fetch repositories for sitemap generation with pagination
 * @param {number} limit - Maximum number of repositories to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array<Object>>} Array of repository objects
 */
export async function fetchRepositoriesForSitemap(limit = 1000, offset = 0) {
  let db = null;
  
  try {
    db = await openSQLiteConnection();
    
    // Get repositories with their full_name
    const repositories = await db.all(
      `SELECT r.id, r.github_id, r.full_name, r.updated_at
       FROM repositories r
       ORDER BY r.id
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    logger.info(`Fetched ${repositories.length} repositories for sitemap (offset: ${offset})`);
    return repositories;
  } catch (error) {
    logger.error(`Error fetching repositories for sitemap: ${error.message}`, { error });
    throw error;
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

/**
 * Fetch contributors for sitemap generation with pagination
 * @param {number} limit - Maximum number of contributors to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array<Object>>} Array of contributor objects
 */
export async function fetchContributorsForSitemap(limit = 1000, offset = 0) {
  let db = null;
  
  try {
    db = await openSQLiteConnection();
    
    // Get contributors with their username and github_id
    const contributors = await db.all(
      `SELECT c.id, c.github_id, c.username, c.updated_at
       FROM contributors c
       ORDER BY c.id
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    logger.info(`Fetched ${contributors.length} contributors for sitemap (offset: ${offset})`);
    return contributors;
  } catch (error) {
    logger.error(`Error fetching contributors for sitemap: ${error.message}`, { error });
    throw error;
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

/**
 * Fetch merge requests for sitemap generation with pagination
 * @param {number} limit - Maximum number of merge requests to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array<Object>>} Array of merge request objects
 */
export async function fetchMergeRequestsForSitemap(limit = 1000, offset = 0) {
  let db = null;
  
  try {
    db = await openSQLiteConnection();
    
    // Get merge requests with their repository information
    const mergeRequests = await db.all(
      `SELECT mr.id, mr.github_id, mr.updated_at, r.full_name as repository_full_name
       FROM merge_requests mr
       JOIN repositories r ON mr.repository_id = r.id
       ORDER BY mr.id
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    logger.info(`Fetched ${mergeRequests.length} merge requests for sitemap (offset: ${offset})`);
    return mergeRequests;
  } catch (error) {
    logger.error(`Error fetching merge requests for sitemap: ${error.message}`, { error });
    throw error;
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

/**
 * Fetch entities for sitemap generation based on entity type
 * @param {string} entityType - Type of entity to fetch (repositories, contributors, merge_requests)
 * @param {number} limit - Maximum number of entities to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array<Object>>} Array of entity objects
 */
export async function fetchEntitiesForSitemap(entityType, limit = 1000, offset = 0) {
  switch (entityType) {
    case 'repositories':
      return fetchRepositoriesForSitemap(limit, offset);
    case 'contributors':
      return fetchContributorsForSitemap(limit, offset);
    case 'merge_requests':
      return fetchMergeRequestsForSitemap(limit, offset);
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

/**
 * Count the total number of entities for a specific type
 * @param {string} entityType - Type of entity to count (repositories, contributors, merge_requests)
 * @returns {Promise<number>} Total count of entities
 */
export async function countEntitiesForSitemap(entityType) {
  let db = null;
  
  try {
    db = await openSQLiteConnection();
    
    let table;
    switch (entityType) {
      case 'repositories':
        table = 'repositories';
        break;
      case 'contributors':
        table = 'contributors';
        break;
      case 'merge_requests':
        table = 'merge_requests';
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
    
    const result = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
    return result.count;
  } catch (error) {
    logger.error(`Error counting ${entityType} for sitemap: ${error.message}`, { error });
    throw error;
  } finally {
    if (db) {
      await closeSQLiteConnection(db);
    }
  }
}

// Export all functions
export default {
  getSitemapMetadata,
  getSitemapMetadataForType,
  updateSitemapMetadata,
  fetchRepositoriesForSitemap,
  fetchContributorsForSitemap,
  fetchMergeRequestsForSitemap,
  fetchEntitiesForSitemap,
  countEntitiesForSitemap
}; 