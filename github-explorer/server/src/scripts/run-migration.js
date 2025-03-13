/**
 * Standardized Database Migration Runner
 * 
 * This script provides a standardized way to run database migrations using
 * the DatabaseSchemaManager, which leverages the Supabase Management API 
 * with Personal Access Token (PAT) for reliable schema operations.
 * 
 * Usage:
 * node run-migration.js <path-to-migration-file-or-directory>
 * 
 * Environment variables required:
 * - SUPABASE_URL: The URL of your Supabase project
 * - SUPABASE_SERVICE_KEY: Service role key for regular operations
 * - SUPABASE_ACCESS_TOKEN: Personal Access Token (PAT) for management API
 * - SUPABASE_PROJECT_ID: Your Supabase project ID
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { DatabaseSchemaManager } from '../utils/database-schema-manager.js';

// Get current directory and resolve path to .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');

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

// Get migration file path from command line arguments or use default value
const MIGRATION_PATH = process.argv[2] || '../migrations';

/**
 * Run a specific migration file
 */
async function runMigrationFile(filePath) {
  logger.info(`=== Running Migration: ${filePath} ===`);
  
  try {
    // Read migration file
    const migrationContent = await fs.readFile(filePath, 'utf8');
    const migrationName = path.basename(filePath);
    
    // Create schema manager
    const schemaManager = new DatabaseSchemaManager({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_SERVICE_KEY,
      personalAccessToken: SUPABASE_ACCESS_TOKEN,
      projectId: SUPABASE_PROJECT_ID
    });
    
    // Initialize the manager
    await schemaManager.initialize();
    
    // Run the migration
    const success = await schemaManager.runMigration(migrationName, migrationContent);
    
    if (success) {
      logger.info(`Migration ${migrationName} completed successfully`);
      
      // Refresh schema cache to ensure changes are visible to clients
      logger.info('Refreshing schema cache');
      await schemaManager.refreshSchemaCache();
    }
    
    return success;
  } catch (error) {
    logger.error(`Migration ${path.basename(filePath)} failed:`, error);
    throw error;
  }
}

/**
 * Run all migrations in a directory
 */
async function runMigrationDirectory(dirPath) {
  logger.info(`=== Running Migrations from Directory: ${dirPath} ===`);
  
  try {
    // List all files in the directory
    const files = await fs.readdir(dirPath);
    
    // Filter for SQL files and sort them
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (sqlFiles.length === 0) {
      logger.warn(`No SQL migration files found in ${dirPath}`);
      return true;
    }
    
    logger.info(`Found ${sqlFiles.length} migration files`);
    
    // Create schema manager
    const schemaManager = new DatabaseSchemaManager({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_SERVICE_KEY,
      personalAccessToken: SUPABASE_ACCESS_TOKEN,
      projectId: SUPABASE_PROJECT_ID
    });
    
    // Initialize the manager
    await schemaManager.initialize();
    
    // Get list of already executed migrations
    const executedMigrations = await schemaManager.getExecutedMigrations();
    const executedMigrationNames = new Set(executedMigrations.map(m => m.migration_name));
    
    // Execute migrations that haven't been run yet
    let successCount = 0;
    let failureCount = 0;
    
    for (const file of sqlFiles) {
      const migrationName = file;
      const filePath = path.join(dirPath, file);
      
      if (executedMigrationNames.has(migrationName) && executedMigrations.find(m => m.migration_name === migrationName)?.success) {
        logger.info(`Skipping already executed migration: ${migrationName}`);
        continue;
      }
      
      try {
        // Read migration file
        const migrationContent = await fs.readFile(filePath, 'utf8');
        
        // Run the migration
        logger.info(`Executing migration: ${migrationName}`);
        const success = await schemaManager.runMigration(migrationName, migrationContent);
        
        if (success) {
          successCount++;
          logger.info(`Migration ${migrationName} completed successfully`);
        } else {
          failureCount++;
          logger.error(`Migration ${migrationName} failed`);
        }
      } catch (error) {
        failureCount++;
        logger.error(`Error executing migration ${migrationName}:`, error);
      }
    }
    
    // Refresh schema cache if any migrations were executed
    if (successCount > 0) {
      logger.info('Refreshing schema cache');
      await schemaManager.refreshSchemaCache();
    }
    
    logger.info(`=== Migration Summary: ${successCount} succeeded, ${failureCount} failed ===`);
    return failureCount === 0;
  } catch (error) {
    logger.error(`Error running migrations from directory ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Add a single column to a table
 */
async function addColumnToTable(tableName, columnName, columnDefinition) {
  logger.info(`=== Adding column ${columnName} to table ${tableName} ===`);
  
  try {
    // Create schema manager
    const schemaManager = new DatabaseSchemaManager({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_SERVICE_KEY,
      personalAccessToken: SUPABASE_ACCESS_TOKEN,
      projectId: SUPABASE_PROJECT_ID
    });
    
    // Initialize the manager
    await schemaManager.initialize();
    
    // Add the column
    const success = await schemaManager.addColumnIfNotExists(tableName, columnName, columnDefinition);
    
    if (success) {
      logger.info(`Column ${columnName} added successfully to table ${tableName}`);
      
      // Refresh schema cache
      logger.info('Refreshing schema cache');
      await schemaManager.refreshSchemaCache();
    }
    
    return success;
  } catch (error) {
    logger.error(`Error adding column ${columnName} to table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Main function to determine what to run based on the path
 */
async function main() {
  const resolvedPath = path.resolve(__dirname, MIGRATION_PATH);
  
  try {
    // Check if path exists
    const stats = await fs.stat(resolvedPath);
    
    if (stats.isDirectory()) {
      // Run all migrations in directory
      return await runMigrationDirectory(resolvedPath);
    } else if (stats.isFile()) {
      // Run single migration file
      return await runMigrationFile(resolvedPath);
    } else {
      logger.error(`Invalid path: ${resolvedPath}`);
      return false;
    }
  } catch (error) {
    // Check if path contains a table and column definition (for addColumnToTable)
    const pathParts = MIGRATION_PATH.split(':');
    if (pathParts.length === 3) {
      const [tableName, columnName, columnDefinition] = pathParts;
      return await addColumnToTable(tableName, columnName, columnDefinition);
    }
    
    logger.error(`Path does not exist or is invalid: ${resolvedPath}`);
    logger.error('Error details:', error);
    return false;
  }
}

// Run the main function
main()
  .then(success => {
    if (success) {
      logger.info('Operation completed successfully');
      process.exit(0);
    } else {
      logger.error('Operation failed');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error('An error occurred:', error);
    process.exit(1);
  }); 