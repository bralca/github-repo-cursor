/**
 * Add Placeholder Fields Migration Script
 * 
 * This script uses the new DatabaseSchemaManager to apply Migration 012
 * which adds placeholder fields to the contributors and commits tables.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { logger } from '../src/utils/logger.js';
import { DatabaseSchemaManager } from '../src/utils/database-schema-manager.js';

// Get current directory and resolve path to .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

// Load environment variables from the correct path
dotenv.config({ path: envPath });

// Log environment setup
logger.info(`Loading environment from: ${envPath}`);
logger.info('Environment variables loaded:');
logger.info(`- SUPABASE_URL: ${process.env.SUPABASE_URL ? 'defined' : 'undefined'}`);
logger.info(`- SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? 'defined' : 'undefined'}`);
logger.info(`- SUPABASE_ACCESS_TOKEN: ${process.env.SUPABASE_ACCESS_TOKEN ? 'defined' : 'undefined'}`);
logger.info(`- SUPABASE_PROJECT_ID: ${process.env.SUPABASE_PROJECT_ID ? 'defined' : 'undefined'}`);

// Extract environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID;

// Check if required variables are set
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  logger.error('Required Supabase credentials are missing!');
  process.exit(1);
}

if (!SUPABASE_ACCESS_TOKEN) {
  logger.error('SUPABASE_ACCESS_TOKEN (Personal Access Token) is required for schema operations!');
  process.exit(1);
}

if (!SUPABASE_PROJECT_ID) {
  logger.error('SUPABASE_PROJECT_ID is required for management API operations!');
  process.exit(1);
}

// Migration SQL content
const migrationSQL = `
-- Migration: 012_add_placeholder_fields.sql
-- Description: Adds placeholder flags to contributors and commits tables

-- Add is_placeholder to contributors table
ALTER TABLE contributors 
ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN contributors.is_placeholder IS 'Indicates if this is a placeholder contributor with unknown GitHub username';

-- Add is_placeholder_author to commits table
ALTER TABLE commits 
ADD COLUMN IF NOT EXISTS is_placeholder_author BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN commits.is_placeholder_author IS 'Indicates if the author is a placeholder with unknown GitHub username';

-- Update existing placeholder records if applicable
UPDATE contributors
SET is_placeholder = TRUE
WHERE username = 'unknown' OR username = 'placeholder' OR username LIKE 'placeholder-%';

-- Update existing commits with placeholder authors if applicable
UPDATE commits
SET is_placeholder_author = TRUE
WHERE author = 'unknown' OR author = 'placeholder' OR author LIKE 'placeholder-%';
`;

/**
 * Run the placeholder fields migration
 */
async function runPlaceholderMigration() {
  logger.info('=== Running Migration 012: Add Placeholder Fields ===');
  
  try {
    // Create schema manager
    const schemaManager = new DatabaseSchemaManager({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_SERVICE_KEY,
      personalAccessToken: SUPABASE_ACCESS_TOKEN,
      projectId: SUPABASE_PROJECT_ID
    });
    
    // Initialize the manager
    logger.info('Initializing schema manager');
    await schemaManager.initialize();
    
    // Run the migration
    logger.info('Executing placeholder fields migration');
    await schemaManager.runMigration('012_add_placeholder_fields.sql', migrationSQL);
    
    // Refresh schema cache to ensure changes are visible to clients
    logger.info('Refreshing schema cache');
    await schemaManager.refreshSchemaCache();
    
    logger.info('Migration completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
}

// Run the placeholder fields migration
runPlaceholderMigration()
  .then(() => {
    logger.info('Migration process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Migration process failed:', error);
    process.exit(1);
  }); 