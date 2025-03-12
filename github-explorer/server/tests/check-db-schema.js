/**
 * Check Database Schema
 * 
 * This script checks the existing Supabase database schema to verify
 * what tables and columns exist.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Get current directory and resolve path to .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

// Load environment variables from the correct path
dotenv.config({ path: envPath });

console.log(`Loading environment from: ${envPath}`);

// Extract environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Required Supabase credentials are missing!');
  process.exit(1);
}

// Create Supabase client directly
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

/**
 * Get list of tables in the public schema
 */
async function getTables() {
  try {
    console.log('Fetching tables...');
    
    // Try using RPC first
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `
      });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (rpcError) {
      console.warn('RPC method failed, trying direct query:', rpcError.message);
      
      // Fall back to direct query
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');
      
      if (error) {
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.error('Error fetching tables:', error.message);
    return [];
  }
}

/**
 * Get columns for a specific table
 */
async function getTableColumns(tableName) {
  try {
    console.log(`Fetching columns for table: ${tableName}`);
    
    // Try using RPC first
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = '${tableName}'
          ORDER BY ordinal_position;
        `
      });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (rpcError) {
      console.warn('RPC method failed, trying direct query:', rpcError.message);
      
      // Fall back to direct query
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      
      if (error) {
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.error(`Error fetching columns for ${tableName}:`, error.message);
    return [];
  }
}

/**
 * Try a simple query on a table to see if it exists
 */
async function checkTableExists(tableName) {
  try {
    console.log(`Checking if table exists: ${tableName}`);
    
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.message.includes('does not exist')) {
      console.log(`Table does not exist: ${tableName}`);
      return false;
    }
    
    console.log(`Table exists: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error.message);
    return false;
  }
}

/**
 * Try a direct query to see the data
 */
async function checkTableData(tableName) {
  try {
    console.log(`Checking data in table: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (error) {
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log(`Found ${data.length} rows in ${tableName}`);
      console.log('First row sample (partial):', JSON.stringify(data[0]).substring(0, 200) + '...');
    } else {
      console.log(`No data found in ${tableName}`);
    }
  } catch (error) {
    console.error(`Error checking data in ${tableName}:`, error.message);
  }
}

/**
 * Run the schema check
 */
async function checkSchema() {
  console.log('=== Starting Database Schema Check ===');
  
  // Check for common tables we expect to find
  const expectedTables = [
    'repositories',
    'contributors',
    'merge_requests',
    'commits',
    'github_raw_data'
  ];
  
  console.log('\n=== Checking Expected Tables ===');
  for (const table of expectedTables) {
    const exists = await checkTableExists(table);
    if (exists) {
      // Check sample data
      await checkTableData(table);
      
      // If exists, get columns
      const columns = await getTableColumns(table);
      if (columns && columns.length > 0) {
        console.log(`\nColumns for ${table}:`);
        columns.forEach(col => {
          console.log(`- ${col.column_name} (${col.data_type})${col.column_default ? ' DEFAULT: ' + col.column_default : ''}`);
        });
      }
    }
  }
  
  // Try to get all tables
  console.log('\n=== All Public Schema Tables ===');
  const tables = await getTables();
  if (tables && tables.length > 0) {
    console.log(`Found ${tables.length} tables in public schema:`);
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
  } else {
    console.log('Could not retrieve table list');
  }
  
  console.log('\n=== Database Schema Check Complete ===');
}

// Run the schema check
checkSchema()
  .then(() => {
    console.log('Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 