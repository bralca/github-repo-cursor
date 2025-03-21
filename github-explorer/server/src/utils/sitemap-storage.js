/**
 * Sitemap Storage Utilities
 * 
 * Provides functions for managing sitemap files in the filesystem.
 * Handles operations like listing existing sitemaps, reading sitemap content,
 * and cleaning up old sitemap files.
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';
import { SITEMAP_DIR, SITEMAP_INDEX_PATH } from '../sitemap/generator.js';

/**
 * Check if the sitemaps directory exists and create it if it doesn't
 * @returns {Promise<void>}
 */
export async function ensureSitemapDirExists() {
  try {
    await fs.mkdir(SITEMAP_DIR, { recursive: true });
    logger.info(`Sitemap directory created/verified: ${SITEMAP_DIR}`);
  } catch (error) {
    logger.error(`Error ensuring sitemap directory exists: ${error.message}`, { error });
    throw error;
  }
}

/**
 * List all sitemap files for a specific entity type
 * @param {string} entityType - The entity type (repositories, contributors, etc.)
 * @returns {Promise<Array<string>>} Array of sitemap filenames
 */
export async function listSitemapFiles(entityType) {
  try {
    await ensureSitemapDirExists();
    
    const files = await fs.readdir(SITEMAP_DIR);
    const filteredFiles = files.filter(file => 
      file.startsWith(`${entityType}-`) && file.endsWith('.xml')
    );
    
    logger.info(`Found ${filteredFiles.length} sitemap files for ${entityType}`);
    return filteredFiles;
  } catch (error) {
    logger.error(`Error listing sitemap files for ${entityType}: ${error.message}`, { error });
    throw error;
  }
}

/**
 * List all sitemap files in the sitemap directory
 * @returns {Promise<Array<string>>} Array of sitemap filenames
 */
export async function listAllSitemapFiles() {
  try {
    await ensureSitemapDirExists();
    
    const files = await fs.readdir(SITEMAP_DIR);
    const sitemapFiles = files.filter(file => file.endsWith('.xml'));
    
    logger.info(`Found ${sitemapFiles.length} total sitemap files`);
    return sitemapFiles;
  } catch (error) {
    logger.error(`Error listing all sitemap files: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Delete all sitemap files for a specific entity type
 * @param {string} entityType - The entity type (repositories, contributors, etc.)
 * @returns {Promise<number>} Number of files deleted
 */
export async function deleteSitemapFiles(entityType) {
  try {
    const files = await listSitemapFiles(entityType);
    
    for (const file of files) {
      await fs.unlink(path.join(SITEMAP_DIR, file));
    }
    
    logger.info(`Deleted ${files.length} sitemap files for ${entityType}`);
    return files.length;
  } catch (error) {
    logger.error(`Error deleting sitemap files for ${entityType}: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Read the content of a sitemap file
 * @param {string} filename - Name of the sitemap file
 * @returns {Promise<string>} Content of the sitemap file
 */
export async function readSitemapFile(filename) {
  try {
    const filePath = path.join(SITEMAP_DIR, filename);
    const content = await fs.readFile(filePath, 'utf8');
    
    logger.debug(`Read sitemap file: ${filePath}`);
    return content;
  } catch (error) {
    logger.error(`Error reading sitemap file ${filename}: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Check if the sitemap index file exists
 * @returns {Promise<boolean>} True if the sitemap index file exists
 */
export async function sitemapIndexExists() {
  try {
    await fs.access(SITEMAP_INDEX_PATH);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read the sitemap index file content
 * @returns {Promise<string>} Content of the sitemap index file
 */
export async function readSitemapIndex() {
  try {
    const exists = await sitemapIndexExists();
    
    if (!exists) {
      logger.warn('Sitemap index file does not exist');
      return null;
    }
    
    const content = await fs.readFile(SITEMAP_INDEX_PATH, 'utf8');
    logger.debug('Read sitemap index file');
    return content;
  } catch (error) {
    logger.error(`Error reading sitemap index: ${error.message}`, { error });
    throw error;
  }
}

export default {
  ensureSitemapDirExists,
  listSitemapFiles,
  listAllSitemapFiles,
  deleteSitemapFiles,
  readSitemapFile,
  sitemapIndexExists,
  readSitemapIndex
}; 