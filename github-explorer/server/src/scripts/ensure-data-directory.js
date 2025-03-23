#!/usr/bin/env node

/**
 * Ensure Data Directory Script
 * 
 * This script ensures that the data directory exists before the application starts.
 * It can be run directly or imported and used in application startup.
 */

import fs from 'fs';
import path from 'path';

// Get the data directory from environment variable or use default
const DATA_DIR = process.env.DATA_DIR || '/var/data/github_explorer';

/**
 * Ensures the data directory exists
 * @returns {boolean} True if directory exists or was created, false otherwise
 */
export function ensureDataDirectory() {
  try {
    // Check if data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      console.log(`Data directory doesn't exist, creating: ${DATA_DIR}`);
      // Create directory recursively
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`Successfully created data directory: ${DATA_DIR}`);
    } else {
      console.log(`Data directory already exists: ${DATA_DIR}`);
    }
    
    // Verify we can write to the directory
    const testFile = path.join(DATA_DIR, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('Data directory is writable');
    
    return true;
  } catch (error) {
    console.error(`Error ensuring data directory: ${error.message}`);
    console.error('This may be due to insufficient permissions.');
    console.error('If running on Render.com, make sure the disk is properly mounted.');
    
    // Provide helpful debug info
    if (process.env.RENDER) {
      console.log('Running on Render.com environment');
      console.log('RENDER_SERVICE_ID:', process.env.RENDER_SERVICE_ID);
      console.log('RENDER_SERVICE_TYPE:', process.env.RENDER_SERVICE_TYPE);
    }
    
    return false;
  }
}

// If this script is run directly
if (process.argv[1] === import.meta.url) {
  const success = ensureDataDirectory();
  if (!success) {
    console.error('Failed to ensure data directory exists');
    process.exit(1);
  }
  console.log('Data directory ready');
}

export default ensureDataDirectory; 