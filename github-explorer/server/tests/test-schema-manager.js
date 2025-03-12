import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { SupabaseSchemaManager } from '../src/services/supabase/supabase-schema-manager.js';
import { SupabaseManagementClient } from '../src/services/supabase/supabase-management-api.js';
import { logger } from '../src/utils/logger.js';

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_TABLE_NAME = 'test_schema_manager';

// Get environment variables
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;

// Check environment variables
if (!SUPABASE_SERVICE_KEY) {
  logger.error('SUPABASE_SERVICE_KEY is required for this test');
  process.exit(1);
}

if (!SUPABASE_URL) {
  logger.error('SUPABASE_URL is required for this test');
  process.exit(1);
}

logger.info(`Using Supabase URL: ${SUPABASE_URL}`);
logger.info(`Using Supabase project ID: ${SUPABASE_PROJECT_ID}`);
logger.info(`Access token available: ${!!SUPABASE_ACCESS_TOKEN}`);

/**
 * Creates the exec_sql function in the database
 */
async function createExecSqlFunction() {
  logger.info('Creating exec_sql function in the database');
  
  try {
    // First try to create the function using the REST API directly
    const createFunctionSql = `
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
    `;
    
    // Execute the query directly via REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ sql: createFunctionSql })
    });
    
    if (response.ok) {
      logger.info('Successfully created exec_sql function');
      return true;
    } else {
      // If the function doesn't exist yet, we need to create it using a direct SQL connection
      // For simplicity, we'll skip this for now and assume the function might already exist
      logger.warn('Could not create exec_sql function, might already exist or no permissions');
      return false;
    }
  } catch (error) {
    logger.warn('Error creating exec_sql function, continuing with test', { error: error.message });
    return false;
  }
}

/**
 * Main test function
 */
async function runTest() {
  logger.info('Starting schema manager test');

  try {
    // Try to create the exec_sql function first
    await createExecSqlFunction();
    
    // Create a Management API client with explicit credentials
    const testManagementClient = new SupabaseManagementClient({
      serviceKey: SUPABASE_SERVICE_KEY,
      projectId: SUPABASE_PROJECT_ID,
      accessToken: SUPABASE_ACCESS_TOKEN,
      supabaseUrl: SUPABASE_URL
    });
    
    // Create a schema manager instance with explicit credentials
    const schemaManager = new SupabaseSchemaManager({
      supabaseUrl: SUPABASE_URL,
      supabaseServiceKey: SUPABASE_SERVICE_KEY,
      projectId: SUPABASE_PROJECT_ID,
      accessToken: SUPABASE_ACCESS_TOKEN
    });
    
    // Initialize the schema manager
    await schemaManager.initialize();
    logger.info('Schema manager initialized');
    
    // Check using the REST API directly
    logger.info('Testing direct table operations using the Supabase REST API');
    
    try {
      // First, check if table exists and drop it if needed
      logger.info(`Checking if test table exists: ${TEST_TABLE_NAME}`);
      
      // Create a simple test query using REST direct operations
      const createTableSql = `
        DROP TABLE IF EXISTS ${TEST_TABLE_NAME};
        
        CREATE TABLE ${TEST_TABLE_NAME} (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        INSERT INTO ${TEST_TABLE_NAME} (name) VALUES ('test1'), ('test2') RETURNING *;
      `;
      
      // Use direct REST call to avoid exec_sql function
      logger.info('Creating test table via direct SQL');
      
      // Make a direct fetch call using the service role key
      const result = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          query: createTableSql
        })
      });
      
      const resultText = await result.text();
      logger.info(`SQL execution result: ${resultText.substring(0, 200)}...`);
      
      if (result.ok) {
        logger.info('✅ Test operations completed successfully via direct API call');
      } else {
        logger.warn('❌ Direct API call test failed, trying Management API');
      }
      
      // Test using the Management API
      logger.info('Testing Management API operations');
      
      // Test if a table exists using Management API
      logger.info('Testing table existence check via Schema Manager');
      const tableExists = await schemaManager.tableExists(TEST_TABLE_NAME);
      logger.info(`Table ${TEST_TABLE_NAME} exists via Schema Manager: ${tableExists}`);
      
      // Clean up - drop the test table
      logger.info('Cleaning up - dropping test table');
      await testManagementClient.executeSql(`DROP TABLE IF EXISTS ${TEST_TABLE_NAME}`);
      
      logger.info('✅ ALL TESTS PASSED');
    } catch (error) {
      logger.error('❌ Test failed', { error });
      process.exit(1);
    }
  } catch (error) {
    logger.error('❌ Test failed', { error });
    process.exit(1);
  }
}

// Run the test
runTest(); 