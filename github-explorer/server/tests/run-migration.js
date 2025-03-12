/**
 * Run Migration Script
 * 
 * This script runs a specific migration file using the SupabaseSchemaManager.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { logger } from '../src/utils/logger.js';
import { SupabaseSchemaManager } from '../src/services/supabase/supabase-schema-manager.js';

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
logger.info(`- SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined'}`);
logger.info(`- SUPABASE_ACCESS_TOKEN: ${process.env.SUPABASE_ACCESS_TOKEN ? 'defined' : 'undefined'}`);
logger.info(`- SUPABASE_PROJECT_ID: ${process.env.SUPABASE_PROJECT_ID ? 'defined' : 'undefined'}`);

// Extract environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID;
const MIGRATION_FILE = process.argv[2] || '../src/migrations/006_update_id_columns_for_github.sql';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('Required Supabase credentials are missing!');
  process.exit(1);
}

/**
 * Run the migration file
 */
async function runMigration() {
  logger.info(`=== Running Migration: ${MIGRATION_FILE} ===`);
  
  try {
    // Create schema manager
    const schemaManager = new SupabaseSchemaManager({
      supabaseUrl: SUPABASE_URL,
      supabaseServiceKey: SUPABASE_SERVICE_ROLE_KEY,
      accessToken: SUPABASE_ACCESS_TOKEN,
      projectId: SUPABASE_PROJECT_ID
    });
    
    // Initialize the manager
    logger.info('Initializing schema manager');
    await schemaManager.initialize();
    
    // Check if schema_migrations table exists, create if not
    const migrationTableExists = await schemaManager.tableExists('schema_migrations');
    
    if (!migrationTableExists) {
      logger.info('Creating schema_migrations table');
      await schemaManager.executeSql(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          migration_name TEXT NOT NULL UNIQUE,
          executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          checksum TEXT,
          execution_time INTEGER,
          success BOOLEAN NOT NULL DEFAULT TRUE
        );
      `);
    }
    
    // Read migration file
    const migrationPath = path.resolve(__dirname, MIGRATION_FILE);
    logger.info(`Reading migration file: ${migrationPath}`);
    const migrationSql = await fs.readFile(migrationPath, 'utf8');
    
    // Execute migration
    logger.info('Executing migration');
    const startTime = Date.now();
    await schemaManager.executeSql(migrationSql);
    const executionTime = Date.now() - startTime;
    
    // Log migration execution
    logger.info(`Migration executed successfully in ${executionTime}ms`);
    
    // Record the migration in schema_migrations if it's not already recorded
    const migrationRecorded = await schemaManager.migrationExists(path.basename(MIGRATION_FILE));
    
    if (!migrationRecorded) {
      logger.info('Recording migration in schema_migrations table');
      await schemaManager.recordMigration({
        migrationName: path.basename(MIGRATION_FILE),
        checksum: 'manual-execution',
        executionTime,
        success: true
      });
    }
    
    logger.info(`=== Migration Complete ===`);
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
runMigration()
  .then(() => {
    logger.info('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Migration failed:', error);
    process.exit(1);
  }); 