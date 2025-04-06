/**
 * Sitemap Generation Script
 * 
 * This script generates XML sitemaps for all entities in the database.
 * It's designed to be run at server startup and can also be triggered manually.
 */

import fs from 'fs/promises';
import path from 'path';
import { XMLBuilder } from 'fast-xml-parser';
import { getConnection } from '../src/db/connection-manager.js';
import { logger } from '../src/utils/logger.js';
import { fileURLToPath } from 'url';

// Constants for sitemap configuration
// Use environment variable SITEMAP_BASE_URL if available, otherwise default to localhost
const BASE_URL = process.env.SITEMAP_BASE_URL || 'http://localhost:3000';
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const SITEMAPS_DIR = path.join(PUBLIC_DIR, 'sitemaps');
const SITEMAP_INDEX_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

// Constants
const SITEMAP_MAX_URLS = 49000; // Maximum URLs per sitemap file (50,000 is the limit, using 49,000 for safety)

// Entity types with their SQL queries and URL generation functions
const ENTITY_CONFIGS = [
  {
    type: 'repositories',
    query: `
      SELECT r.id, r.github_id, r.name, r.full_name, r.updated_at
      FROM repositories r
      ORDER BY r.updated_at DESC
    `,
    generateUrl: (repo) => {
      const name = repo.name;
      const githubId = repo.github_id;
      const slug = toSlug(name) + '-' + githubId;
      return {
        loc: `${BASE_URL}/${slug}`,
        lastmod: repo.updated_at ? new Date(repo.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.8'
      };
    }
  },
  {
    type: 'contributors',
    query: `
      SELECT c.id, c.github_id, c.name, c.username, c.updated_at
      FROM contributors c
      ORDER BY c.updated_at DESC
    `,
    generateUrl: (contributor) => {
      const name = contributor.name || 'contributor';
      const username = contributor.username || '';
      const githubId = contributor.github_id;
      let slug = toSlug(name);
      if (username) {
        slug += '-' + toSlug(username);
      }
      slug += '-' + githubId;
      
      return {
        loc: `${BASE_URL}/contributors/${slug}`,
        lastmod: contributor.updated_at ? new Date(contributor.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.7'
      };
    }
  },
  {
    type: 'merge_requests',
    query: `
      SELECT 
        mr.id, mr.github_id, mr.title, mr.updated_at,
        r.name as repository_name, r.github_id as repository_github_id
      FROM merge_requests mr
      JOIN repositories r ON mr.repository_id = r.id
      ORDER BY mr.updated_at DESC
    `,
    generateUrl: (mr) => {
      const repoName = mr.repository_name;
      const repoGithubId = mr.repository_github_id;
      const repoSlug = toSlug(repoName) + '-' + repoGithubId;
      
      const mrTitle = mr.title || 'merge-request';
      const mrGithubId = mr.github_id;
      const mrSlug = toSlug(mrTitle) + '-' + mrGithubId;
      
      return {
        loc: `${BASE_URL}/${repoSlug}/merge-requests/${mrSlug}`,
        lastmod: mr.updated_at ? new Date(mr.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.6'
      };
    }
  },
  {
    type: 'commits',
    query: `
      SELECT DISTINCT
        c.id, c.github_id, c.committed_at, c.updated_at,
        r.name as repository_name, r.github_id as repository_github_id,
        mr.title as mr_title, mr.github_id as mr_github_id,
        contrib.name as contributor_name, contrib.username as contributor_username, contrib.github_id as contributor_github_id
      FROM commits c
      JOIN repositories r ON c.repository_id = r.id
      LEFT JOIN merge_requests mr ON c.pull_request_id = mr.id
      LEFT JOIN contributors contrib ON c.contributor_id = contrib.id
      ORDER BY c.committed_at DESC
    `,
    generateUrl: (commit) => {
      // Repository slug
      const repoName = commit.repository_name;
      const repoGithubId = commit.repository_github_id;
      const repoSlug = toSlug(repoName) + '-' + repoGithubId;
      
      // Merge request slug
      const mrTitle = commit.mr_title || 'merge-request';
      const mrGithubId = commit.mr_github_id;
      const mrSlug = toSlug(mrTitle) + '-' + mrGithubId;
      
      // Contributor slug
      const contribName = commit.contributor_name || 'contributor';
      const contribUsername = commit.contributor_username || '';
      const contribGithubId = commit.contributor_github_id;
      let contribSlug = toSlug(contribName);
      if (contribUsername) {
        contribSlug += '-' + toSlug(contribUsername);
      }
      contribSlug += '-' + contribGithubId;
      
      // Commit ID (SHA)
      const commitId = commit.github_id;
      
      return {
        loc: `${BASE_URL}/${repoSlug}/merge-requests/${mrSlug}/authors/${contribSlug}/commits/${commitId}`,
        lastmod: commit.updated_at ? new Date(commit.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.5'
      };
    }
  }
];

/**
 * Converts a string to a URL-friendly slug
 */
function toSlug(input) {
  if (!input) return '';
  
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters except hyphens
    .replace(/\-\-+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')          // Trim hyphens from start
    .replace(/-+$/, '')          // Trim hyphens from end
    .substring(0, 50);           // Truncate to maximum length
}

/**
 * Generate XML for a sitemap with the provided URLs
 */
function generateSitemapXML(urls) {
  const xmlBuilder = new XMLBuilder({
    format: true,
    ignoreAttributes: false,
    processEntities: true,
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
  });

  const sitemap = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    urlset: {
      '@_xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
      url: urls
    }
  };

  return xmlBuilder.build(sitemap);
}

/**
 * Generate XML for the sitemap index file
 */
function generateSitemapIndexXML(sitemaps) {
  const xmlBuilder = new XMLBuilder({
    format: true,
    ignoreAttributes: false,
    processEntities: true,
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
  });

  const sitemapIndex = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    sitemapindex: {
      '@_xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
      sitemap: sitemaps
    }
  };

  return xmlBuilder.build(sitemapIndex);
}

/**
 * Generate all sitemaps and the sitemap index
 */
async function generateAllSitemaps() {
  try {
    // Ensure directories exist
    await ensureDirectoriesExist();
    
    // Connect to the database
    const db = await getConnection();
    
    // Update sitemap_status to indicate generation has started
    await db.run(`
      INSERT OR REPLACE INTO sitemap_status 
      (status, is_generating, error_message, updated_at) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, ['generating', true, null]);
    
    // Generate sitemaps for all entity types
    const allSitemapFiles = [];
    for (const entityConfig of ENTITY_CONFIGS) {
      const sitemapFiles = await generateEntitySitemap(db, entityConfig);
      allSitemapFiles.push(...sitemapFiles);
    }
    
    // Generate the sitemap index
    if (allSitemapFiles.length > 0) {
      const indexXML = generateSitemapIndexXML(allSitemapFiles);
      await fs.writeFile(SITEMAP_INDEX_PATH, indexXML, 'utf8');
      logger.info(`Wrote sitemap index: ${SITEMAP_INDEX_PATH} with ${allSitemapFiles.length} sitemaps`);
      
      // Update sitemap_status to indicate generation is complete
      await db.run(`
        UPDATE sitemap_status 
        SET status = ?, is_generating = ?, item_count = ?, file_size = ?, 
            last_generated = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE 1=1
      `, ['generated', false, allSitemapFiles.reduce((total, file) => total + 1, 0), 0]);
    } else {
      logger.warn('No sitemaps were generated, skipping sitemap index');
      
      // Update sitemap_status to indicate generation failed
      await db.run(`
        UPDATE sitemap_status 
        SET status = ?, is_generating = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
        WHERE 1=1
      `, ['error', false, 'No entities found to include in sitemap']);
    }
    
    logger.info('Sitemap generation completed successfully');
    return true;
  } catch (error) {
    logger.error(`Error generating sitemaps: ${error.message}`, { 
      errorMessage: error.message,
      errorStack: error.stack
    });
    
    // Update sitemap_status to indicate generation failed
    try {
      const errorDb = await getConnection();
      await errorDb.run(`
        UPDATE sitemap_status 
        SET status = ?, is_generating = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
        WHERE 1=1
      `, ['error', false, error.message]);
    } catch (dbError) {
      logger.error(`Error updating sitemap status: ${dbError.message}`, { 
        errorMessage: dbError.message,
        errorStack: dbError.stack
      });
    }
    
    return false;
  }
}

/**
 * Generate sitemaps for a specific entity type
 * @param {Object} db - Database connection
 * @param {Object} entityConfig - Entity configuration
 * @returns {Promise<Array>} Array of sitemap file information
 */
async function generateEntitySitemap(db, entityConfig) {
  const { type, query, generateUrl } = entityConfig;
  logger.info(`Generating sitemap for entity type: ${type}`);
  
  try {
    // Get all entities from the database
    const entities = await db.all(query);
    
    if (!entities || entities.length === 0) {
      logger.warn(`No ${type} found to include in sitemap`);
      return [];
    }
    
    logger.info(`Found ${entities.length} ${type} to include in sitemap`);
    
    // Split entities into chunks if needed
    const chunks = [];
    if (entities.length > SITEMAP_MAX_URLS) {
      for (let i = 0; i < entities.length; i += SITEMAP_MAX_URLS) {
        chunks.push(entities.slice(i, i + SITEMAP_MAX_URLS));
      }
    } else {
      chunks.push(entities);
    }
    
    const sitemapFiles = [];
    
    // Create sitemap files
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const urls = chunk.map(entity => generateUrl(entity));
      
      // Generate XML sitemap
      const sitemapXML = generateSitemapXML(urls);
      
      // Create sitemap filename
      const sitemapFilename = chunks.length > 1 ? `${type}-${i + 1}.xml` : `${type}.xml`;
      const sitemapPath = path.join(SITEMAPS_DIR, sitemapFilename);
      
      // Write sitemap to file
      await fs.writeFile(sitemapPath, sitemapXML, 'utf8');
      
      logger.info(`Wrote sitemap file: ${sitemapPath} with ${urls.length} URLs`);
      
      // Add sitemap info to the list
      sitemapFiles.push({
        path: sitemapPath,
        filename: sitemapFilename,
        type,
        count: urls.length,
        lastmod: new Date().toISOString(),
        // Also add the loc property for the sitemap index
        loc: `${BASE_URL}/sitemaps/${sitemapFilename}`
      });
    }
    
    return sitemapFiles;
  } catch (error) {
    logger.error(`Error generating sitemap for ${type}: ${error.message}`, { 
      errorMessage: error.message, 
      errorStack: error.stack 
    });
    return [];
  }
}

/**
 * Ensure the directories for sitemaps exist
 */
async function ensureDirectoriesExist() {
  try {
    // Create public directory if it doesn't exist
    await fs.mkdir(PUBLIC_DIR, { recursive: true });
    
    // Create sitemaps directory if it doesn't exist
    await fs.mkdir(SITEMAPS_DIR, { recursive: true });
    
    logger.info(`Sitemap directories created/verified: ${SITEMAPS_DIR}`);
  } catch (error) {
    logger.error(`Error creating sitemap directories: ${error.message}`, { error });
    throw error;
  }
}

// Execute the script if run directly (ES module alternative to require.main === module)
const currentFilePath = fileURLToPath(import.meta.url);
const currentFileIsMain = process.argv[1] === currentFilePath;

if (currentFileIsMain) {
  generateAllSitemaps().then(success => {
    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
}

export default generateAllSitemaps; 