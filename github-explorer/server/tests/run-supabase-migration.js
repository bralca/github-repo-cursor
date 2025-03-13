/**
 * Run Supabase Migration Script
 * 
 * This script applies our SQL migration for adding placeholder fields
 * using the Supabase JavaScript client.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
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

// Extract environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if required variables are set
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Required Supabase credentials are missing!');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Path to the migration file
const migrationFilePath = path.resolve(__dirname, '../../../supabase/migrations/20250313_add_placeholder_fields.sql');

/**
 * Read the migration file
 */
async function readMigrationFile() {
  try {
    console.log(`Reading migration file: ${migrationFilePath}`);
    const content = await fs.readFile(migrationFilePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`Error reading migration file: ${error.message}`);
    throw error;
  }
}

/**
 * Execute SQL statements
 */
async function executeSql(sql) {
  try {
    console.log('Executing SQL statements...');
    
    // Split the SQL statements by semicolon
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use the RPCM method if available
        console.log(`Trying RPC method...`);
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.warn(`RPC method failed: ${error.message}`);
          
          // Fallback to direct query
          console.log(`Trying direct query method...`);
          const { data: queryData, error: queryError } = await supabase.from('_exec_sql').select('*').or(`sql.eq.${statement}`);
          
          if (queryError) {
            console.warn(`Direct query failed: ${queryError.message}`);
            
            // Try one more fallback approach
            console.log(`Trying direct SQL execution...`);
            const { data: directData, error: directError } = await supabase.from('_custom').select('*').limit(1).rpc('sql', { query: statement });
            
            if (directError) {
              throw new Error(`All execution methods failed for statement: ${statement.substring(0, 100)}... - Error: ${directError.message}`);
            }
          }
        }
      } catch (statementError) {
        console.error(`Error executing statement ${i + 1}: ${statementError.message}`);
        throw statementError;
      }
    }
    
    console.log('All SQL statements executed successfully');
    return true;
  } catch (error) {
    console.error(`Error executing SQL: ${error.message}`);
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
 * Main function to run the migration
 */
async function runMigration() {
  console.log('=== Running Supabase Migration: Add Placeholder Fields ===');
  
  try {
    // Read the migration SQL
    const migrationSql = await readMigrationFile();
    
    // Execute the SQL
    await executeSql(migrationSql);
    
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