/**
 * Sitemap Controller
 * 
 * Handles database operations for sitemap generation, including:
 * - Fetching entities (repositories, contributors, merge requests) with pagination
 * - Reading and updating sitemap metadata
 */

import { getConnection } from '../db/connection-manager.js';
import { logger } from '../utils/logger.js';
import { initSitemapTable } from '../utils/db-init-sitemap.js';
import fs from 'fs';
import path from 'path';
import xmlbuilder from 'xmlbuilder';

/**
 * Get all sitemap metadata
 * @returns {Promise<Array>} Array of sitemap metadata records
 */
export async function getAllSitemapMetadata() {
  try {
    const db = await getConnection();
    return await db.all('SELECT * FROM sitemap_metadata ORDER BY entity_type');
  } catch (error) {
    logger.error(`Error fetching sitemap metadata: ${error.message}`, { error });
    return [];
  }
}

/**
 * Get sitemap metadata for a specific entity type
 * @param {string} entityType - Entity type (e.g., 'repositories', 'contributors')
 * @returns {Promise<Object>} Sitemap metadata record
 */
export async function getSitemapMetadata(entityType) {
  try {
    const db = await getConnection();
    const metadata = await db.get(
      'SELECT * FROM sitemap_metadata WHERE entity_type = ?',
      [entityType]
    );
    
    return metadata || null;
  } catch (error) {
    logger.error(`Error fetching sitemap metadata for ${entityType}: ${error.message}`, { error });
    return null;
  }
}

/**
 * Update sitemap metadata
 * @param {string} entityType - Entity type
 * @param {string} filePath - Path to the sitemap file
 * @param {number} urlCount - Number of URLs in the sitemap
 * @param {string} lastBuildDate - Date the sitemap was last built
 * @returns {Promise<boolean>} Success status
 */
export async function updateSitemapMetadata(entityType, filePath, urlCount, lastBuildDate) {
  try {
    const db = await getConnection();
    
    // Start transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Check if metadata already exists
      const existingMetadata = await db.get(
        'SELECT * FROM sitemap_metadata WHERE entity_type = ?',
        [entityType]
      );
      
      if (existingMetadata) {
        // Update existing metadata
        await db.run(
          'UPDATE sitemap_metadata SET file_path = ?, url_count = ?, last_build_date = ?, updated_at = CURRENT_TIMESTAMP WHERE entity_type = ?',
          [filePath, urlCount, lastBuildDate, entityType]
        );
      } else {
        // Insert new metadata
        await db.run(
          'INSERT INTO sitemap_metadata (entity_type, file_path, url_count, last_build_date, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          [entityType, filePath, urlCount, lastBuildDate]
        );
      }
      
      // Commit transaction
      await db.run('COMMIT');
      return true;
    } catch (error) {
      // Rollback transaction on error
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error(`Error updating sitemap metadata for ${entityType}: ${error.message}`, { error });
    return false;
  }
}

/**
 * Fetch repositories for sitemap generation with pagination
 * @param {number} limit - Maximum number of repositories to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array<Object>>} Array of repository objects
 */
export async function fetchRepositoriesForSitemap(limit = 1000, offset = 0) {
  try {
    const db = await getConnection();
    
    // Get repositories with their full_name
    const repositories = await db.all(
      `SELECT id, name, full_name, url
       FROM repositories
       ORDER BY stars DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    logger.info(`Fetched ${repositories.length} repositories for sitemap (offset: ${offset})`);
    return repositories;
  } catch (error) {
    logger.error(`Error fetching repositories for sitemap: ${error.message}`, { error });
    return [];
  }
}

/**
 * Fetch contributors for sitemap generation with pagination
 * @param {number} limit - Maximum number of contributors to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array<Object>>} Array of contributor objects
 */
export async function fetchContributorsForSitemap(limit = 1000, offset = 0) {
  try {
    const db = await getConnection();
    
    // Get contributors with their username and github_id
    const contributors = await db.all(
      `SELECT id, username, name, url
       FROM contributors
       ORDER BY total_commits DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    logger.info(`Fetched ${contributors.length} contributors for sitemap (offset: ${offset})`);
    return contributors;
  } catch (error) {
    logger.error(`Error fetching contributors for sitemap: ${error.message}`, { error });
    return [];
  }
}

/**
 * Fetch merge requests for sitemap generation with pagination
 * @param {number} limit - Maximum number of merge requests to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array<Object>>} Array of merge request objects
 */
export async function fetchMergeRequestsForSitemap(limit = 1000, offset = 0) {
  try {
    const db = await getConnection();
    
    // Get merge requests with their repository information
    const mergeRequests = await db.all(
      `SELECT 
        mr.id, 
        mr.number, 
        mr.title, 
        r.full_name AS repository_name
      FROM merge_requests mr
      JOIN repositories r ON mr.repository_id = r.id
      ORDER BY mr.created_at DESC
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    logger.info(`Fetched ${mergeRequests.length} merge requests for sitemap (offset: ${offset})`);
    return mergeRequests;
  } catch (error) {
    logger.error(`Error fetching merge requests for sitemap: ${error.message}`, { error });
    return [];
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
      logger.error(`Unknown entity type for sitemap: ${entityType}`);
      return [];
  }
}

/**
 * Count the total number of entities for a specific type
 * @param {string} entityType - Type of entity to count (repositories, contributors, merge_requests)
 * @returns {Promise<number>} Total count of entities
 */
export async function countEntitiesForSitemap(entityType) {
  try {
    const db = await getConnection();
    
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
        logger.error(`Unknown entity type for sitemap count: ${entityType}`);
        return 0;
    }
    
    const result = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
    return result.count;
  } catch (error) {
    logger.error(`Error counting ${entityType} for sitemap: ${error.message}`, { error });
    return 0;
  }
}

/**
 * Generate sitemap for repositories
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function generateRepositoriesSitemap(req, res) {
  try {
    const db = await getConnection();
    
    // Query repositories
    const repositories = await db.all(`
      SELECT full_name 
      FROM repositories 
      LIMIT 50000
    `);
    
    // Generate sitemap XML
    const sitemapXml = generateSitemapXml(repositories, 'repository');
    
    // Return XML
    res.setHeader('Content-Type', 'application/xml');
    return res.send(sitemapXml);
  } catch (error) {
    logger.error(`Error generating repositories sitemap: ${error.message}`, { error });
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Generate sitemap for contributors
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function generateContributorsSitemap(req, res) {
  try {
    const db = await getConnection();
    
    // Query contributors
    const contributors = await db.all(`
      SELECT username 
      FROM contributors 
      LIMIT 50000
    `);
    
    // Generate sitemap XML
    const sitemapXml = generateSitemapXml(contributors, 'contributor');
    
    // Return XML
    res.setHeader('Content-Type', 'application/xml');
    return res.send(sitemapXml);
  } catch (error) {
    logger.error(`Error generating contributors sitemap: ${error.message}`, { error });
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Generate sitemap for merge requests
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function generateMergeRequestsSitemap(req, res) {
  try {
    const db = await getConnection();
    
    // Query merge requests
    const mergeRequests = await db.all(`
      SELECT mr.number, r.full_name 
      FROM merge_requests mr
      JOIN repositories r ON mr.repository_id = r.id
      LIMIT 50000
    `);
    
    // Generate sitemap XML
    const sitemapXml = generateSitemapXml(mergeRequests, 'merge-request');
    
    // Return XML
    res.setHeader('Content-Type', 'application/xml');
    return res.send(sitemapXml);
  } catch (error) {
    logger.error(`Error generating merge requests sitemap: ${error.message}`, { error });
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Generate sitemap for commits
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function generateCommitsSitemap(req, res) {
  try {
    const db = await getConnection();
    
    // Query commits
    const commits = await db.all(`
      SELECT c.sha, r.full_name 
      FROM commits c
      JOIN repositories r ON c.repository_id = r.id
      LIMIT 50000
    `);
    
    // Generate sitemap XML
    const sitemapXml = generateSitemapXml(commits, 'commit');
    
    // Return XML
    res.setHeader('Content-Type', 'application/xml');
    return res.send(sitemapXml);
  } catch (error) {
    logger.error(`Error generating commits sitemap: ${error.message}`, { error });
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Generate sitemap index
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export async function generateSitemapIndex(req, res) {
  try {
    // Get the base URL from environment or use default
    const baseUrl = process.env.BASE_URL || 'https://github-explorer.example.com';
    
    // Build sitemap index XML
    const sitemapIndex = {
      sitemapindex: {
        '@xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
        sitemap: [
          {
            loc: `${baseUrl}/sitemap/repositories.xml`,
            lastmod: new Date().toISOString()
          },
          {
            loc: `${baseUrl}/sitemap/contributors.xml`,
            lastmod: new Date().toISOString()
          },
          {
            loc: `${baseUrl}/sitemap/merge-requests.xml`,
            lastmod: new Date().toISOString()
          },
          {
            loc: `${baseUrl}/sitemap/commits.xml`,
            lastmod: new Date().toISOString()
          }
        ]
      }
    };
    
    // Convert to XML
    const xml = xmlbuilder.create(sitemapIndex).end({ pretty: true });
    
    // Return XML
    res.setHeader('Content-Type', 'application/xml');
    return res.send(xml);
  } catch (error) {
    logger.error(`Error generating sitemap index: ${error.message}`, { error });
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Generate sitemap XML for the specified type
 * @param {Array} items - Array of database items
 * @param {string} type - Type of items (repository, contributor, merge-request, commit)
 * @returns {string} Sitemap XML
 */
function generateSitemapXml(items, type) {
  // Get the base URL from environment or use default
  const baseUrl = process.env.BASE_URL || 'https://github-explorer.example.com';
  
  // Build sitemap XML
  const sitemap = {
    urlset: {
      '@xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
      url: []
    }
  };
  
  // Generate URL entries based on type
  switch (type) {
    case 'repository':
      items.forEach(repo => {
        sitemap.urlset.url.push({
          loc: `${baseUrl}/repositories/${repo.slug || repo.full_name}`,
          changefreq: 'weekly',
          priority: '0.8'
        });
      });
      break;
    
    case 'contributor':
      items.forEach(contributor => {
        sitemap.urlset.url.push({
          loc: `${baseUrl}/contributors/${contributor.username}`,
          changefreq: 'weekly',
          priority: '0.7'
        });
      });
      break;
    
    case 'merge-request':
      items.forEach(mr => {
        sitemap.urlset.url.push({
          loc: `${baseUrl}/repositories/${mr.full_name}/pulls/${mr.number}`,
          changefreq: 'monthly',
          priority: '0.6'
        });
      });
      break;
    
    case 'commit':
      items.forEach(commit => {
        sitemap.urlset.url.push({
          loc: `${baseUrl}/repositories/${commit.full_name}/commits/${commit.sha}`,
          changefreq: 'never',
          priority: '0.5'
        });
      });
      break;
    
    default:
      throw new Error(`Unknown sitemap type: ${type}`);
  }
  
  // Convert to XML
  const xml = xmlbuilder.create(sitemap).end({ pretty: true });
  
  return xml;
}

// Export all functions
export default {
  getAllSitemapMetadata,
  getSitemapMetadata,
  updateSitemapMetadata,
  fetchRepositoriesForSitemap,
  fetchContributorsForSitemap,
  fetchMergeRequestsForSitemap,
  fetchEntitiesForSitemap,
  countEntitiesForSitemap,
  generateRepositoriesSitemap,
  generateContributorsSitemap,
  generateMergeRequestsSitemap,
  generateCommitsSitemap,
  generateSitemapIndex
}; 