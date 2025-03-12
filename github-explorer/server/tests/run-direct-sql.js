/**
 * Run Direct SQL Script
 * 
 * This script runs SQL directly against the Supabase database using the Management API
 * Usage: node run-direct-sql.js <sql-file-path>
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { logger } from '../src/utils/logger.js';
import fetch from 'node-fetch';

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
const SQL_FILE = process.argv[2];

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('Required Supabase credentials are missing!');
  process.exit(1);
}

if (!SQL_FILE) {
  logger.error('Please provide a SQL file path as an argument');
  process.exit(1);
}

/**
 * Execute SQL directly against Supabase using the Management API
 */
async function executeSql(sql) {
  try {
    // Properly define our headers
    const directHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': SUPABASE_SERVICE_ROLE_KEY
    };
    
    const managementHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`
    };
    
    // First try using the Management API with project ID
    if (SUPABASE_PROJECT_ID && SUPABASE_ACCESS_TOKEN) {
      logger.info('Attempting to execute SQL via Management API');
      
      // Use the correct API URL for Supabase Management API
      const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/sql`, {
        method: 'POST',
        headers: managementHeaders,
        body: JSON.stringify({
          query: sql
        })
      });
      
      if (mgmtResponse.ok) {
        const result = await mgmtResponse.json();
        logger.info('SQL executed successfully via Management API');
        return { success: true, data: result };
      } else {
        const errorText = await mgmtResponse.text();
        logger.warn(`Management API SQL execution failed: ${errorText}`);
      }
    }
    
    // Fallback to direct SQL execution via REST API
    logger.info('Attempting to execute SQL via direct REST API');
    
    // Try to execute SQL directly
    const directResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: directHeaders,
      body: JSON.stringify({ query: sql })
    });
    
    if (directResponse.ok) {
      const result = await directResponse.text();
      logger.info('SQL executed successfully via direct API');
      return { success: true, data: result };
    } else {
      const errorText = await directResponse.text();
      logger.warn(`Direct SQL execution failed: ${errorText}`);
    }
    
    // Try to create the exec_sql function as a last resort
    try {
      logger.info('Attempting to create exec_sql function');
      const createFnResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: directHeaders,
        body: JSON.stringify({
          sql: `
            CREATE OR REPLACE FUNCTION exec_sql(sql text)
            RETURNS json
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
              EXECUTE sql;
              RETURN json_build_object('success', true);
            EXCEPTION WHEN OTHERS THEN
              RETURN json_build_object('success', false, 'error', SQLERRM);
            END;
            $$;
          `
        })
      });
      
      if (createFnResponse.ok) {
        logger.info('exec_sql function created successfully');
        
        // Now try to use the function
        const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: directHeaders,
          body: JSON.stringify({
            sql
          })
        });
        
        if (rpcResponse.ok) {
          const result = await rpcResponse.json();
          logger.info('SQL executed successfully via RPC');
          return { success: true, data: result };
        } else {
          const errorText = await rpcResponse.text();
          throw new Error(`SQL execution failed: ${errorText}`);
        }
      } else {
        const errorText = await createFnResponse.text();
        logger.warn(`Failed to create exec_sql function: ${errorText}`);
      }
    } catch (fnError) {
      logger.warn('Failed to create/use exec_sql function', { error: fnError.message });
    }
    
    throw new Error('All SQL execution methods failed');
  } catch (error) {
    logger.error('SQL execution error', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Run the SQL file
 */
async function runSqlFile() {
  logger.info(`=== Running SQL File: ${SQL_FILE} ===`);
  
  try {
    // Read the SQL file
    const sqlContent = await fs.readFile(SQL_FILE, 'utf8');
    logger.info(`SQL file read successfully, contents (${sqlContent.length} bytes)`);
    
    // Execute the SQL
    logger.info('Executing SQL...');
    const startTime = Date.now();
    const result = await executeSql(sqlContent);
    const executionTime = Date.now() - startTime;
    
    if (result.success) {
      logger.info(`SQL executed successfully in ${executionTime}ms`);
      
      // Log to schema_migrations if it's a migration file
      if (path.basename(SQL_FILE).match(/^\d+_.*\.sql$/)) {
        const migrationName = path.basename(SQL_FILE);
        
        logger.info(`Recording migration execution: ${migrationName}`);
        
        // Insert into schema_migrations
        const insertResult = await executeSql(`
          INSERT INTO schema_migrations (migration_name, checksum, execution_time, success)
          VALUES ('${migrationName}', 'manual-execution', ${executionTime}, TRUE)
          ON CONFLICT (migration_name) DO UPDATE
          SET execution_time = ${executionTime}, success = TRUE, executed_at = NOW()
        `);
        
        if (insertResult.success) {
          logger.info('Migration recorded successfully');
        } else {
          logger.warn('Failed to record migration', { error: insertResult.error });
        }
      }
    } else {
      logger.error('SQL execution failed', { error: result.error });
      throw new Error(result.error);
    }
    
    logger.info(`=== SQL Execution Complete ===`);
  } catch (error) {
    logger.error('SQL execution failed', { error });
    throw error;
  }
}

// Run the SQL file
runSqlFile()
  .then(() => {
    logger.info('SQL execution completed successfully');
    process.exit(0);
  })
  .catch(error => {
    logger.error('SQL execution failed', { error: error.message });
    process.exit(1);
  }); 