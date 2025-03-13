/**
 * Script to verify database schema changes have been applied correctly
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

/**
 * Check database schema changes
 */
async function checkDatabaseSchema() {
  console.log('Checking database schema changes...');
  
  try {
    // 1. Check contributors.username is nullable
    const { data: contributorsData, error: contributorsError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT column_name, is_nullable, data_type, column_default 
          FROM information_schema.columns 
          WHERE table_name = 'contributors' AND column_name = 'username'
        `
      });
    
    if (contributorsError) {
      console.error('Error checking contributors table:', contributorsError);
    } else {
      console.log('\n=== Contributors Table Schema ===');
      console.table(contributorsData);
    }
    
    // 2. Check is_placeholder fields
    const { data: placeholderData, error: placeholderError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT 
            table_name, 
            column_name, 
            data_type, 
            column_default 
          FROM information_schema.columns 
          WHERE column_name LIKE '%placeholder%'
          ORDER BY table_name
        `
      });
    
    if (placeholderError) {
      console.error('Error checking placeholder fields:', placeholderError);
    } else {
      console.log('\n=== Placeholder Fields ===');
      console.table(placeholderData);
    }
    
    // 3. Check commits.contributor_id
    const { data: commitsData, error: commitsError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT column_name, is_nullable, data_type, column_default
          FROM information_schema.columns 
          WHERE table_name = 'commits' AND column_name = 'contributor_id'
        `
      });
    
    if (commitsError) {
      console.error('Error checking commits table:', commitsError);
    } else {
      console.log('\n=== Commits Table Schema ===');
      console.table(commitsData);
    }
    
    // 4. Check foreign key constraints
    const { data: fkData, error: fkError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS referenced_table,
            ccu.column_name AS referenced_column
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND (kcu.column_name = 'contributor_id' OR ccu.column_name = 'id' AND ccu.table_name = 'contributors')
        `
      });
    
    if (fkError) {
      console.error('Error checking foreign key constraints:', fkError);
    } else {
      console.log('\n=== Foreign Key Constraints ===');
      console.table(fkData);
    }
    
    // 5. Check indexes
    const { data: indexData, error: indexError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT
            t.relname AS table_name,
            i.relname AS index_name,
            a.attname AS column_name
          FROM pg_class t
          JOIN pg_index ix ON t.oid = ix.indrelid
          JOIN pg_class i ON i.oid = ix.indexrelid
          JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
          WHERE t.relkind = 'r'
            AND t.relname IN ('commits', 'contributors', 'repository_contributors')
            AND a.attname IN ('contributor_id', 'id', 'username')
          ORDER BY t.relname, i.relname
        `
      });
    
    if (indexError) {
      console.error('Error checking indexes:', indexError);
    } else {
      console.log('\n=== Indexes ===');
      console.table(indexData);
    }
    
    // 6. Check migrations
    const { data: migrationsData, error: migrationsError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT migration_name, executed_at, success
          FROM schema_migrations
          ORDER BY executed_at DESC
          LIMIT 5
        `
      });
    
    if (migrationsError) {
      console.error('Error checking schema migrations:', migrationsError);
    } else {
      console.log('\n=== Recent Migrations ===');
      console.table(migrationsData);
    }
    
  } catch (error) {
    console.error('Failed to check database schema:', error);
  }
}

// Run the check function
checkDatabaseSchema()
  .then(() => {
    console.log('\nDatabase schema check completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 