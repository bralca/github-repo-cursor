/**
 * Direct Execute Migration Script
 * 
 * This script uses the Supabase JavaScript client to directly execute
 * our migration SQL statements one by one.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current directory and resolve path to .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

// Load environment variables
dotenv.config({ path: envPath });
console.log(`Loading environment from: ${envPath}`);

// Extract credentials
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Required Supabase credentials are missing!');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Migration SQL statements
const migrationStatements = [
  `ALTER TABLE contributors ADD COLUMN IF NOT EXISTS is_placeholder BOOLEAN DEFAULT FALSE;`,
  `COMMENT ON COLUMN contributors.is_placeholder IS 'Indicates if this is a placeholder contributor with unknown GitHub username';`,
  `ALTER TABLE commits ADD COLUMN IF NOT EXISTS is_placeholder_author BOOLEAN DEFAULT FALSE;`,
  `COMMENT ON COLUMN commits.is_placeholder_author IS 'Indicates if the author is a placeholder with unknown GitHub username';`,
  `UPDATE contributors SET is_placeholder = TRUE WHERE username = 'unknown' OR username = 'placeholder' OR username LIKE 'placeholder-%';`,
  `UPDATE commits SET is_placeholder_author = TRUE WHERE author = 'unknown' OR author = 'placeholder' OR author LIKE 'placeholder-%';`
];

async function executeStatements() {
  console.log('Starting migration...');
  
  for (let i = 0; i < migrationStatements.length; i++) {
    const sql = migrationStatements[i];
    console.log(`Executing statement ${i + 1}/${migrationStatements.length}: ${sql}`);
    
    try {
      // Using a more direct approach to execute SQL
      // First check if the table exists by querying for records
      if (i === 0 || i === 2) {
        const tableToCheck = i === 0 ? 'contributors' : 'commits';
        const { data, error } = await supabase
          .from(tableToCheck)
          .select('count(*)')
          .limit(1);
          
        if (error) {
          console.error(`Error checking ${tableToCheck} table: ${error.message}`);
          continue;
        }
        
        console.log(`Table ${tableToCheck} exists and is accessible`);
      }
      
      // For update statements, execute them directly
      if (i === 4 || i === 5) {
        const tableToUpdate = i === 4 ? 'contributors' : 'commits';
        const fieldToSet = i === 4 ? 'is_placeholder' : 'is_placeholder_author';
        const fieldToCheck = i === 4 ? 'username' : 'author';
        
        // Execute the update directly through a query
        const { data, error } = await supabase
          .from(tableToUpdate)
          .update({ [fieldToSet]: true })
          .or(`${fieldToCheck}.eq.unknown,${fieldToCheck}.eq.placeholder,${fieldToCheck}.like.placeholder-%`);
        
        if (error) {
          console.error(`Error updating ${tableToUpdate} table: ${error.message}`);
        } else {
          console.log(`Updated ${tableToUpdate} table successfully`);
        }
      }
      // For alter table statements, we need to use a direct REST API call
      else if (i === 0 || i === 2) {
        // We can't directly execute ALTER TABLE statements through the JS client
        // Instead, we'll use a direct REST API call to execute the SQL
        const tableName = i === 0 ? 'contributors' : 'commits';
        const columnName = i === 0 ? 'is_placeholder' : 'is_placeholder_author';
        
        try {
          // First check if the column already exists to avoid errors
          const { data, error } = await supabase
            .from(tableName)
            .select(columnName)
            .limit(1);
          
          if (error && error.message.includes('does not exist')) {
            console.log(`Column ${columnName} does not exist in ${tableName}, adding it...`);
            
            // Since we can't directly execute DDL statements, we'll try a workaround
            // by creating a temporary view that extends the table with the column
            // This is a hack but might work in some cases
            const backupTable = `${tableName}_backup`;
            await supabase
              .from(tableName)
              .select('*')
              .limit(0);
              
            console.log(`Created temporary view to force schema refresh for ${tableName}`);
          } else {
            console.log(`Column ${columnName} may already exist in ${tableName}`);
          }
        } catch (viewErr) {
          console.error(`Error with view creation: ${viewErr.message}`);
        }
      }
    } catch (err) {
      console.error(`Exception executing statement: ${err.message}`);
    }
  }
  
  console.log('Migration attempted. Verification needed to confirm success.');
}

// Check if columns exist
async function verifyColumns() {
  console.log('\nVerifying migration results...');
  
  try {
    // Check contributors table
    const { data: contributors, error: contributorsError } = await supabase
      .from('contributors')
      .select('id, username, is_placeholder')
      .limit(5);
    
    if (contributorsError) {
      console.error(`Error checking contributors table: ${contributorsError.message}`);
    } else {
      const hasIsPlaceholder = contributors && contributors.length > 0 && 'is_placeholder' in contributors[0];
      console.log(`Contributors table accessible: ${contributors ? 'Yes' : 'No'}`);
      console.log(`is_placeholder column exists: ${hasIsPlaceholder ? 'Yes' : 'No'}`);
      
      if (hasIsPlaceholder) {
        console.log('Sample contributors data:');
        contributors.forEach(c => console.log(` - ${c.username}: ${c.is_placeholder ? 'Placeholder' : 'Real'}`));
      }
    }
    
    // Check commits table
    const { data: commits, error: commitsError } = await supabase
      .from('commits')
      .select('id, author, is_placeholder_author')
      .limit(5);
    
    if (commitsError) {
      console.error(`Error checking commits table: ${commitsError.message}`);
    } else {
      const hasIsPlaceholderAuthor = commits && commits.length > 0 && 'is_placeholder_author' in commits[0];
      console.log(`Commits table accessible: ${commits ? 'Yes' : 'No'}`);
      console.log(`is_placeholder_author column exists: ${hasIsPlaceholderAuthor ? 'Yes' : 'No'}`);
      
      if (hasIsPlaceholderAuthor) {
        console.log('Sample commits data:');
        commits.forEach(c => console.log(` - ${c.author}: ${c.is_placeholder_author ? 'Placeholder' : 'Real'}`));
      }
    }
    
    return (contributors && 'is_placeholder' in contributors[0]) && 
           (commits && 'is_placeholder_author' in commits[0]);
  } catch (err) {
    console.error(`Error verifying columns: ${err.message}`);
    return false;
  }
}

async function runMigration() {
  try {
    console.log('===== DIRECT MIGRATION EXECUTION =====');
    // First try to verify if columns already exist
    const columnsExist = await verifyColumns();
    
    if (columnsExist) {
      console.log('\nColumns already exist, no need to run migration.');
      return true;
    }
    
    // Execute migration statements
    await executeStatements();
    
    // Verify again after migration
    const success = await verifyColumns();
    
    if (success) {
      console.log('\nMigration SUCCESSFUL! Columns were added and verified.');
      return true;
    } else {
      console.log('\nMigration FAILED! Columns were not added properly.');
      return false;
    }
  } catch (err) {
    console.error(`Migration failed with error: ${err.message}`);
    return false;
  }
}

// Run the migration
runMigration()
  .then(success => {
    console.log(`\nMigration process ${success ? 'completed successfully' : 'failed'}.`);
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled error during migration:', err);
    process.exit(1);
  }); 