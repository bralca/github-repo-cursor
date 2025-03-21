/**
 * Sitemap Module Entry Point
 * 
 * Exports all sitemap-related functionality for use throughout the application.
 */

import sitemapGenerator from './generator.js';
import { initSitemapTable, resetSitemapMetadata } from '../utils/db-init-sitemap.js';

// Re-export everything from generator
export const {
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
} = sitemapGenerator;

// Export the initialization functions
export { initSitemapTable, resetSitemapMetadata };

// Default export for convenience
export default {
  ...sitemapGenerator,
  initSitemapTable,
  resetSitemapMetadata
}; 