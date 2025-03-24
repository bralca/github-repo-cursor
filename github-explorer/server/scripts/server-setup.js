// Script to perform server setup tasks before starting
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../src/utils/logger.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Ensures that sitemaps are accessible from both /api/sitemap.xml and /sitemap.xml
 */
function ensureSitemapAccess() {
  const publicDir = path.join(rootDir, 'public');
  const apiDir = path.join(publicDir, 'api');
  
  // Check if the public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    logger.info(`Created public directory at ${publicDir}`);
  }
  
  // Check if we need to create api subdirectory
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
    logger.info(`Created API directory at ${apiDir}`);
  }
  
  // Create a copy of the sitemap at the api path if it exists at the root
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  const apiSitemapPath = path.join(apiDir, 'sitemap.xml');
  
  if (fs.existsSync(sitemapPath)) {
    fs.copyFileSync(sitemapPath, apiSitemapPath);
    logger.info(`Copied sitemap.xml to ${apiSitemapPath}`);
  } else {
    logger.warn(`Sitemap not found at ${sitemapPath}, copy to API path skipped`);
  }
  
  // Copy individual sitemap files to api/sitemaps directory
  const sitemapsDir = path.join(publicDir, 'sitemaps');
  const apiSitemapsDir = path.join(apiDir, 'sitemaps');
  
  if (fs.existsSync(sitemapsDir)) {
    // Create the api/sitemaps directory if it doesn't exist
    if (!fs.existsSync(apiSitemapsDir)) {
      fs.mkdirSync(apiSitemapsDir, { recursive: true });
      logger.info(`Created API sitemaps directory at ${apiSitemapsDir}`);
    }
    
    // Copy all files from sitemaps to api/sitemaps
    const sitemapFiles = fs.readdirSync(sitemapsDir);
    for (const file of sitemapFiles) {
      const sourcePath = path.join(sitemapsDir, file);
      const destPath = path.join(apiSitemapsDir, file);
      
      if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, destPath);
        logger.info(`Copied ${file} to ${destPath}`);
      }
    }
  } else {
    logger.warn(`Sitemaps directory not found at ${sitemapsDir}, copy to API path skipped`);
  }
}

try {
  logger.info("Running server setup tasks...");
  ensureSitemapAccess();
  logger.info("Server setup tasks completed successfully");
} catch (error) {
  logger.error("Error during server setup:", error);
  process.exit(1);
} 