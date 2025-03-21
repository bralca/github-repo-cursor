/**
 * Sitemap Generator
 * 
 * Core functions for generating XML sitemaps for different entity types.
 * Handles the creation of individual sitemap files and the sitemap index.
 */

import fs from 'fs/promises';
import path from 'path';
import { XMLBuilder } from 'fast-xml-parser';
import { logger } from '../utils/logger.js';

// Constants
export const SITEMAP_MAX_URLS = 49000; // Maximum URLs per sitemap file (50,000 is the limit, using 49,000 for safety)
export const ENTITY_TYPES = ['repositories', 'contributors', 'merge_requests'];
export const BASE_URL = process.env.BASE_URL || 'https://github-explorer.com';
export const SITEMAP_DIR = path.resolve(process.cwd(), 'github-explorer/public/sitemaps');
export const SITEMAP_INDEX_PATH = path.resolve(process.cwd(), 'github-explorer/public/sitemap.xml');

/**
 * Generate XML for a sitemap with the provided URLs
 * @param {Array<Object>} urls - Array of URL objects with loc, lastmod, and changefreq properties
 * @returns {string} XML string for the sitemap
 */
export function generateSitemapXML(urls) {
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
      url: urls.map(url => ({
        loc: url.loc,
        lastmod: url.lastmod || new Date().toISOString().split('T')[0],
        changefreq: url.changefreq || 'weekly',
        priority: url.priority || '0.7'
      }))
    }
  };

  return xmlBuilder.build(sitemap);
}

/**
 * Generate XML for the sitemap index file
 * @param {Array<Object>} sitemaps - Array of sitemap objects with loc and lastmod properties
 * @returns {string} XML string for the sitemap index
 */
export function generateSitemapIndexXML(sitemaps) {
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
      sitemap: sitemaps.map(sitemap => ({
        loc: sitemap.loc,
        lastmod: sitemap.lastmod || new Date().toISOString().split('T')[0]
      }))
    }
  };

  return xmlBuilder.build(sitemapIndex);
}

/**
 * Write a sitemap file to disk
 * @param {string} filename - Name of the sitemap file
 * @param {string} content - XML content of the sitemap
 * @returns {Promise<string>} The path to the written file
 */
export async function writeSitemapFile(filename, content) {
  try {
    // Ensure the directory exists
    await fs.mkdir(SITEMAP_DIR, { recursive: true });
    
    const filePath = path.join(SITEMAP_DIR, filename);
    await fs.writeFile(filePath, content, 'utf8');
    logger.info(`Sitemap file written: ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error(`Error writing sitemap file ${filename}: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Write the sitemap index file
 * @param {Array<Object>} sitemaps - Array of sitemap objects with loc and lastmod properties
 * @returns {Promise<string>} The path to the written file
 */
export async function writeSitemapIndex(sitemaps) {
  try {
    // Generate the sitemap index XML
    const indexXML = generateSitemapIndexXML(sitemaps);
    
    // Ensure the parent directory exists
    await fs.mkdir(path.dirname(SITEMAP_INDEX_PATH), { recursive: true });
    
    // Write the sitemap index file
    await fs.writeFile(SITEMAP_INDEX_PATH, indexXML, 'utf8');
    logger.info(`Sitemap index written: ${SITEMAP_INDEX_PATH}`);
    return SITEMAP_INDEX_PATH;
  } catch (error) {
    logger.error(`Error writing sitemap index: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Format a URL for the sitemap based on entity type and data
 * @param {string} entityType - Type of entity (repositories, contributors, etc.)
 * @param {Object} entity - The entity data
 * @returns {Object} URL object with loc, lastmod, and changefreq properties
 */
export function formatEntityUrl(entityType, entity) {
  let url = '';
  const now = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
  let lastmod = entity.updated_at ? new Date(entity.updated_at).toISOString().split('T')[0] : now;
  let priority = '0.7';
  let changefreq = 'weekly';
  
  switch (entityType) {
    case 'repositories':
      url = `${BASE_URL}/repository/${entity.full_name}`;
      priority = '0.8';
      break;
    case 'contributors':
      url = `${BASE_URL}/contributor/${entity.username || entity.github_id}`;
      break;
    case 'merge_requests':
      url = `${BASE_URL}/repository/${entity.repository_full_name}/pull/${entity.github_id}`;
      changefreq = 'monthly';
      break;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
  
  return {
    loc: url,
    lastmod,
    changefreq,
    priority
  };
}

export default {
  generateSitemapXML,
  generateSitemapIndexXML,
  writeSitemapFile,
  writeSitemapIndex,
  formatEntityUrl,
  SITEMAP_MAX_URLS,
  ENTITY_TYPES,
  BASE_URL,
  SITEMAP_DIR,
  SITEMAP_INDEX_PATH
}; 