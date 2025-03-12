/**
 * Inspect current data in github_raw_data table
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../src/utils/logger.js';

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
  logger.error('Required Supabase credentials are missing!');
  process.exit(1);
}

// Create client directly
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

async function inspectData() {
  // Fetch records from github_raw_data where source is 'cursor'
  const { data: cursorData, error: cursorError } = await supabase
    .from('github_raw_data')
    .select('*')
    .eq('source', 'cursor')
    .limit(1);
  
  if (cursorError) {
    logger.error('Error fetching cursor data:', cursorError);
    return;
  }
  
  logger.info(`Found ${cursorData.length} records with source 'cursor'`);
  
  if (cursorData.length > 0) {
    const record = cursorData[0];
    logger.info('Record structure:', {
      id: record.id,
      pr_number: record.pr_number,
      repo_id: record.repo_id,
      repo_name: record.repo_name,
      processed: record.processed,
      source: record.source,
      created_at: record.created_at,
      updated_at: record.updated_at
    });
    
    logger.info('Data object keys:', Object.keys(record.data));
    
    // Fetch a sample record from the edge function (non-cursor source)
    const { data: edgeData, error: edgeError } = await supabase
      .from('github_raw_data')
      .select('*')
      .not('source', 'eq', 'cursor')
      .limit(1);
    
    if (edgeError) {
      logger.error('Error fetching edge function data:', edgeError);
      return;
    }
    
    if (edgeData.length > 0) {
      logger.info(`Found edge function data with source: ${edgeData[0].source || 'undefined'}`);
      logger.info('Edge function data keys:', Object.keys(edgeData[0].data));
      
      // Compare structures
      const cursorKeys = Object.keys(cursorData[0].data).sort();
      const edgeKeys = Object.keys(edgeData[0].data).sort();
      
      logger.info('Structure comparison:');
      logger.info(`Cursor data keys: ${cursorKeys.join(', ')}`);
      logger.info(`Edge data keys: ${edgeKeys.join(', ')}`);
      
      // Find differences
      const missingInCursor = edgeKeys.filter(key => !cursorKeys.includes(key));
      const missingInEdge = cursorKeys.filter(key => !edgeKeys.includes(key));
      
      if (missingInCursor.length > 0) {
        logger.warn(`Keys missing in cursor data: ${missingInCursor.join(', ')}`);
      }
      
      if (missingInEdge.length > 0) {
        logger.warn(`Keys missing in edge data: ${missingInEdge.join(', ')}`);
      }
    } else {
      logger.warn('No edge function data found for comparison');
    }
  }
}

// Run the inspection
inspectData()
  .then(() => {
    logger.info('Inspection complete');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Error during inspection:', error);
    process.exit(1);
  }); 