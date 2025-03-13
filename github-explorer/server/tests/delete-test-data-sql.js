/**
 * Script to delete test data using direct SQL
 * This bypasses foreign key constraints to clean up test data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory and resolve path to .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

// Load environment variables from the correct path
dotenv.config({ path: envPath });
console.log(`Loading environment from: ${envPath}`);

// Extract Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Required Supabase credentials are missing!');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runSql(sql) {
  try {
    console.log('Executing SQL...');
    
    // Use the Supabase REST API to execute SQL directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SQL execution failed: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('SQL executed successfully');
    return result;
  } catch (error) {
    console.error('Error executing SQL:', error.message);
    throw error;
  }
}

async function main() {
  // SQL to delete test data by disabling foreign key constraints
  const sql = `
    -- Disable foreign key constraints temporarily
    SET session_replication_role = 'replica';
    
    -- Delete test data from all tables
    DELETE FROM commits WHERE source = 'pipeline-test';
    DELETE FROM merge_requests WHERE source = 'pipeline-test';
    DELETE FROM contributor_repository 
    WHERE repository_id IN (SELECT id FROM repositories WHERE source = 'pipeline-test')
    OR contributor_id IN (SELECT id FROM contributors WHERE source = 'pipeline-test');
    DELETE FROM github_raw_data WHERE source = 'pipeline-test';
    DELETE FROM contributors WHERE source = 'pipeline-test';
    DELETE FROM repositories WHERE source = 'pipeline-test';
    
    -- Re-enable foreign key constraints
    SET session_replication_role = 'origin';
  `;
  
  console.log('Using SQL to delete test data with foreign key constraints disabled');
  
  try {
    await runSql(sql);
    console.log('Test data deletion completed successfully');
  } catch (error) {
    console.error('Test data deletion failed:', error.message);
    process.exit(1);
  }
}

main(); 