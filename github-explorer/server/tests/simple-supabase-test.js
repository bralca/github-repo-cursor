/**
 * Simple Supabase Connection Test
 * 
 * This script tests basic Supabase connection and operations:
 * 1. Loads environment variables correctly
 * 2. Initializes Supabase client
 * 3. Performs a basic query
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { supabaseClientFactory } from '../src/services/supabase/supabase-client.js';
import { SupabaseSchemaManager } from '../src/services/supabase/supabase-schema-manager.js';

// Get current directory and resolve path to .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

// Load environment variables from the correct path
dotenv.config({ path: envPath });

console.log(`Loading environment from: ${envPath}`);
console.log('Environment variables check:');
console.log(`- SUPABASE_URL: ${process.env.SUPABASE_URL ? 'defined' : 'undefined'}`);
console.log(`- SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? 'defined' : 'undefined'}`);
console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined'}`);

// Extract environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Required Supabase credentials are missing!');
  process.exit(1);
}

/**
 * Test direct client creation
 */
async function testDirectClient() {
  console.log('\n--- Testing Direct Client Creation ---');
  
  try {
    console.log('Creating Supabase client directly...');
    const directClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    
    console.log('Client created, testing basic query...');
    const { data, error } = await directClient
      .from('github_raw_data') // Using a table we expect to exist, adjust if needed
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('Query error:', error.message);
      return false;
    }
    
    console.log('Query successful:', data);
    return true;
  } catch (error) {
    console.error('Direct client error:', error.message);
    return false;
  }
}

/**
 * Test client factory
 */
async function testClientFactory() {
  console.log('\n--- Testing Client Factory ---');
  
  try {
    console.log('Creating Supabase client via factory...');
    const factoryClient = supabaseClientFactory.createClient({
      clientId: 'simple-test',
      authLevel: 'service_role',
      url: SUPABASE_URL,
      key: SUPABASE_SERVICE_ROLE_KEY
    });
    
    if (!factoryClient) {
      console.error('Factory returned null client');
      return false;
    }
    
    console.log('Client created, testing basic query...');
    const { data, error } = await factoryClient
      .from('github_raw_data') // Using a table we expect to exist, adjust if needed
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('Query error:', error.message);
      return false;
    }
    
    console.log('Query successful:', data);
    return true;
  } catch (error) {
    console.error('Factory client error:', error.message);
    return false;
  }
}

/**
 * Test schema manager
 */
async function testSchemaManager() {
  console.log('\n--- Testing Schema Manager ---');
  
  try {
    console.log('Creating schema manager...');
    const schemaManager = new SupabaseSchemaManager({
      clientId: 'simple-test',
      supabaseUrl: SUPABASE_URL,
      supabaseServiceKey: SUPABASE_SERVICE_ROLE_KEY
    });
    
    console.log('Initializing schema manager...');
    await schemaManager.initialize();
    
    console.log('Checking if a table exists...');
    const exists = await schemaManager.tableExists('github_raw_data');
    
    console.log(`Table exists: ${exists}`);
    return true;
  } catch (error) {
    console.error('Schema manager error:', error.message);
    console.error(error.stack);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('=== Starting Simple Supabase Test ===');
  
  try {
    // Test direct client
    const directResult = await testDirectClient();
    console.log(`Direct client test: ${directResult ? 'PASSED' : 'FAILED'}`);
    
    // Test client factory
    const factoryResult = await testClientFactory();
    console.log(`Client factory test: ${factoryResult ? 'PASSED' : 'FAILED'}`);
    
    // Test schema manager
    const schemaResult = await testSchemaManager();
    console.log(`Schema manager test: ${schemaResult ? 'PASSED' : 'FAILED'}`);
    
    console.log('\n=== Test Summary ===');
    console.log(`Direct client: ${directResult ? '✅' : '❌'}`);
    console.log(`Client factory: ${factoryResult ? '✅' : '❌'}`);
    console.log(`Schema manager: ${schemaResult ? '✅' : '❌'}`);
    
    // Overall result
    const overallResult = directResult && factoryResult && schemaResult;
    console.log(`\nOverall test result: ${overallResult ? 'PASSED' : 'FAILED'}`);
    
    return overallResult ? 0 : 1;
  } catch (error) {
    console.error('Test suite error:', error);
    return 1;
  }
}

// Run the tests and exit with appropriate code
runTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 