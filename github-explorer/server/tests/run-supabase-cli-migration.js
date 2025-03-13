/**
 * Run Supabase CLI Migration Script
 * 
 * This script applies our SQL migration for adding placeholder fields
 * using the Supabase CLI with environment variables from .env file.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import fs from 'fs';

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

// Extract environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

// Check if required variables are set
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Required Supabase credentials are missing!');
  process.exit(1);
}

// Path to the migration file
const migrationFilePath = path.resolve(__dirname, '../../../supabase/migrations/20250313_add_placeholder_fields.sql');
const projectConfigPath = path.resolve(__dirname, '../../../supabase/config.toml');

/**
 * Update the Supabase config file with environment variables
 */
function updateSupabaseConfig() {
  try {
    console.log('Updating Supabase config with environment variables...');
    
    // Extract the project URL parts
    const url = new URL(SUPABASE_URL);
    const projectRef = url.hostname.split('.')[0];
    
    console.log(`Detected project reference: ${projectRef}`);
    
    // Read the existing config file
    let configContent = fs.readFileSync(projectConfigPath, 'utf8');
    
    // Update project_id
    configContent = configContent.replace(/project_id = ".*"/, `project_id = "${projectRef}"`);
    
    // Save the updated config
    fs.writeFileSync(projectConfigPath, configContent);
    
    console.log('Supabase config updated successfully');
    return true;
  } catch (error) {
    console.error(`Error updating Supabase config: ${error.message}`);
    throw error;
  }
}

/**
 * Run the Supabase CLI command to execute a SQL migration
 */
function executeCliMigration() {
  try {
    console.log('Executing SQL migration via Supabase CLI...');
    
    // Set up environment variables for the CLI
    const env = {
      ...process.env,
      SUPABASE_ACCESS_TOKEN: SUPABASE_ACCESS_TOKEN,
      PGPASSWORD: SUPABASE_SERVICE_KEY
    };
    
    // First, verify the migration file exists
    if (!fs.existsSync(migrationFilePath)) {
      throw new Error(`Migration file not found: ${migrationFilePath}`);
    }
    
    console.log(`Using migration file: ${migrationFilePath}`);
    
    // We need to extract database URL from SUPABASE_URL
    const url = new URL(SUPABASE_URL);
    const host = url.hostname;
    const projectRef = host.split('.')[0];
    
    // Get the DB URL from the REST URL
    const dbUrl = `postgresql://postgres:${SUPABASE_SERVICE_KEY}@db.${projectRef}.supabase.co:5432/postgres`;
    
    console.log('Applying migration directly with psql...');
    
    // Execute the SQL directly using npx
    const command = `npx supabase db execute --db-url=${dbUrl} --file ${migrationFilePath}`;
    
    console.log(`Executing command: ${command.replace(SUPABASE_SERVICE_KEY, '***')}`);
    
    // Execute the command
    const output = execSync(command, { 
      env,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('Supabase CLI command output:');
    console.log(output);
    
    console.log('Migration execution completed via Supabase CLI');
    return true;
  } catch (error) {
    console.error(`Error executing migration via CLI: ${error.message}`);
    if (error.stdout) console.error('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
    throw error;
  }
}

/**
 * Verify the changes were applied by querying the database
 */
function verifyChanges() {
  try {
    console.log('Verifying changes by querying the database...');
    
    // We need to extract database URL from SUPABASE_URL
    const url = new URL(SUPABASE_URL);
    const host = url.hostname;
    const projectRef = host.split('.')[0];
    
    // Get the DB URL from the REST URL
    const dbUrl = `postgresql://postgres:${SUPABASE_SERVICE_KEY}@db.${projectRef}.supabase.co:5432/postgres`;
    
    // Check if columns exist using psql
    const verifyContributorsCmd = `npx supabase db execute --db-url=${dbUrl} --command="SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='contributors' AND column_name='is_placeholder'"`;
    const verifyCommitsCmd = `npx supabase db execute --db-url=${dbUrl} --command="SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='commits' AND column_name='is_placeholder_author'"`;
    
    console.log('Checking contributors.is_placeholder column...');
    let contributorsColumnExists = false;
    try {
      const contributorsOutput = execSync(verifyContributorsCmd, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      contributorsColumnExists = contributorsOutput.includes('is_placeholder');
      console.log(`Contributors column check result: ${contributorsColumnExists ? 'exists' : 'missing'}`);
    } catch (error) {
      console.error('Error checking contributors column:', error.message);
    }
    
    console.log('Checking commits.is_placeholder_author column...');
    let commitsColumnExists = false;
    try {
      const commitsOutput = execSync(verifyCommitsCmd, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      commitsColumnExists = commitsOutput.includes('is_placeholder_author');
      console.log(`Commits column check result: ${commitsColumnExists ? 'exists' : 'missing'}`);
    } catch (error) {
      console.error('Error checking commits column:', error.message);
    }
    
    return {
      contributorsColumnExists,
      commitsColumnExists
    };
  } catch (error) {
    console.error('Error during verification:', error.message);
    return {
      contributorsColumnExists: false,
      commitsColumnExists: false
    };
  }
}

/**
 * Main function to run the migration
 */
function runMigration() {
  console.log('=== Running Supabase Migration via CLI: Add Placeholder Fields ===');
  
  try {
    // Update Supabase config
    updateSupabaseConfig();
    
    // Execute migration using CLI
    executeCliMigration();
    
    // Verify changes
    const verificationResult = verifyChanges();
    
    if (verificationResult.contributorsColumnExists && verificationResult.commitsColumnExists) {
      console.log('Migration completed successfully and changes verified');
      return true;
    } else {
      console.log('Migration executed but changes could not be fully verified');
      return false;
    }
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Run the migration
try {
  const success = runMigration();
  if (success) {
    console.log('Migration process completed');
    process.exit(0);
  } else {
    console.error('Migration process failed or could not be verified');
    process.exit(1);
  }
} catch (error) {
  console.error('Error during migration:', error);
  process.exit(1);
} 