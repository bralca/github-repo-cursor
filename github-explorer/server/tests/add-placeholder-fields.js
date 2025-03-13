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

// Extract environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Required Supabase credentials are missing!');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

async function addPlaceholderFields() {
  console.log('Adding placeholder fields to contributors and commits tables...');
  
  try {
    // Check if the exec_sql function exists
    const { data: functionExists, error: functionCheckError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'exec_sql')
      .limit(1);
    
    if (functionCheckError) {
      console.log('Creating exec_sql function...');
      
      // Create the exec_sql function if it doesn't exist
      const { error: createFunctionError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
      });
      
      if (createFunctionError) {
        console.error('Error creating exec_sql function:', createFunctionError);
      }
    }
    
    // Add is_placeholder to contributors table
    console.log('Adding is_placeholder to contributors table...');
    const { error: contributorsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE contributors 
        ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT FALSE;
      `
    });
    
    if (contributorsError) {
      console.error('Error adding is_placeholder to contributors:', contributorsError);
      
      // Try direct SQL as fallback
      const { error: directError } = await supabase
        .from('contributors')
        .update({ is_placeholder: false })
        .eq('id', 'test-placeholder-field');
      
      if (directError && directError.message.includes('column "is_placeholder" does not exist')) {
        console.error('Failed to add is_placeholder field to contributors table');
        return false;
      }
    } else {
      console.log('Successfully added is_placeholder to contributors table');
    }
    
    // Add is_placeholder_author to commits table
    console.log('Adding is_placeholder_author to commits table...');
    const { error: commitsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE commits 
        ADD COLUMN IF NOT EXISTS is_placeholder_author BOOLEAN DEFAULT FALSE;
      `
    });
    
    if (commitsError) {
      console.error('Error adding is_placeholder_author to commits:', commitsError);
      
      // Try direct SQL as fallback
      const { error: directError } = await supabase
        .from('commits')
        .update({ is_placeholder_author: false })
        .eq('id', 'test-placeholder-field');
      
      if (directError && directError.message.includes('column "is_placeholder_author" does not exist')) {
        console.error('Failed to add is_placeholder_author field to commits table');
        return false;
      }
    } else {
      console.log('Successfully added is_placeholder_author to commits table');
    }
    
    console.log('Successfully added placeholder fields to database schema');
    return true;
  } catch (error) {
    console.error('Error adding placeholder fields:', error);
    return false;
  }
}

// Run the migration
async function runMigration() {
  try {
    // Add placeholder fields
    const placeholderFieldsAdded = await addPlaceholderFields();
    
    if (!placeholderFieldsAdded) {
      console.error('Failed to add placeholder fields');
      process.exit(1);
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 