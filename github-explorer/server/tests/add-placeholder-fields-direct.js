/**
 * Add Placeholder Fields - Direct Approach
 * 
 * This script uses the Supabase Management API to directly apply
 * the SQL changes for adding placeholder fields to the contributors and commits tables.
 */

import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Get current directory and resolve path to .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

// Load environment variables from the correct path
dotenv.config({ path: envPath });

// Log environment setup
console.log(`Loading environment from: ${envPath}`);
console.log('Environment variables loaded:');
console.log(`- SUPABASE_URL: ${process.env.SUPABASE_URL ? 'defined' : 'undefined'}`);
console.log(`- SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? 'defined' : 'undefined'}`);
console.log(`- SUPABASE_ACCESS_TOKEN: ${process.env.SUPABASE_ACCESS_TOKEN ? 'defined' : 'undefined'}`);
console.log(`- SUPABASE_PROJECT_ID: ${process.env.SUPABASE_PROJECT_ID ? 'defined' : 'undefined'}`);

// Extract environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID;
const MANAGEMENT_API_URL = 'https://api.supabase.com';

// Check if required variables are set
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Required Supabase credentials are missing!');
  process.exit(1);
}

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN (Personal Access Token) is required for schema operations!');
  process.exit(1);
}

if (!SUPABASE_PROJECT_ID) {
  console.error('SUPABASE_PROJECT_ID is required for management API operations!');
  process.exit(1);
}

// Migration SQL content
const migrationSQL = `
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

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * Execute SQL using the Management API
 */
async function executeSQLWithManagementAPI(sql) {
  try {
    console.log('Executing SQL using Management API...');
    
    const response = await axios.post(
      `${MANAGEMENT_API_URL}/v1/projects/${SUPABASE_PROJECT_ID}/sql`,
      { query: sql },
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('SQL executed successfully');
    return response.data;
  } catch (error) {
    console.error('Failed to execute SQL:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Refresh the database schema cache
 */
async function refreshSchemaCache() {
  try {
    console.log('Refreshing schema cache...');
    
    const response = await axios.post(
      `${MANAGEMENT_API_URL}/v1/projects/${SUPABASE_PROJECT_ID}/database/refresh-schema-cache`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Schema cache refreshed successfully');
    return response.data;
  } catch (error) {
    console.error('Failed to refresh schema cache:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Verify the changes were applied
 */
async function verifyChanges() {
  try {
    console.log('Verifying changes...');
    
    // Check if is_placeholder column exists in contributors table
    const { data: contributorColumns, error: contributorError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'contributors')
      .eq('column_name', 'is_placeholder');
    
    if (contributorError) {
      console.error('Error checking contributors table:', contributorError.message);
    } else {
      console.log(`is_placeholder column in contributors table: ${contributorColumns && contributorColumns.length > 0 ? 'exists' : 'missing'}`);
    }
    
    // Check if is_placeholder_author column exists in commits table
    const { data: commitColumns, error: commitError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'commits')
      .eq('column_name', 'is_placeholder_author');
    
    if (commitError) {
      console.error('Error checking commits table:', commitError.message);
    } else {
      console.log(`is_placeholder_author column in commits table: ${commitColumns && commitColumns.length > 0 ? 'exists' : 'missing'}`);
    }
    
    return {
      contributorsColumnExists: contributorColumns && contributorColumns.length > 0,
      commitsColumnExists: commitColumns && commitColumns.length > 0
    };
  } catch (error) {
    console.error('Error verifying changes:', error);
    return {
      contributorsColumnExists: false,
      commitsColumnExists: false
    };
  }
}

/**
 * Run the migration
 */
async function runMigration() {
  console.log('=== Running Migration: Add Placeholder Fields ===');
  
  try {
    // Execute migration SQL
    await executeSQLWithManagementAPI(migrationSQL);
    
    // Refresh schema cache
    await refreshSchemaCache();
    
    // Verify changes
    const verificationResult = await verifyChanges();
    
    if (verificationResult.contributorsColumnExists && verificationResult.commitsColumnExists) {
      console.log('Migration completed successfully and changes verified');
    } else {
      console.log('Migration executed but changes could not be fully verified');
    }
    
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Run the migration
runMigration()
  .then(success => {
    if (success) {
      console.log('Migration process completed');
      process.exit(0);
    } else {
      console.error('Migration process failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error during migration:', error);
    process.exit(1);
  }); 