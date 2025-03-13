/**
 * Script to update the contributor_id field in the commits table
 * This updates data in smaller batches to avoid timeouts
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

// Configuration
const BATCH_SIZE = 100; // Number of records to process in each batch

/**
 * Update contributor_id in the commits table in batches
 */
async function updateContributorIds() {
  console.log('Starting batch updates of contributor_id in commits table...');
  
  let totalUpdated = 0;
  let hasMore = true;
  let lastId = 0;
  
  // Process regular commits (non-placeholder authors)
  while (hasMore) {
    // Get the next batch of commits
    const { data: commits, error } = await supabase
      .from('commits')
      .select('id, author')
      .gt('id', lastId)
      .is('contributor_id', null)
      .not('author', 'is', null)
      .eq('is_placeholder_author', false)
      .order('id')
      .limit(BATCH_SIZE);
    
    if (error) {
      console.error('Error fetching commits:', error);
      break;
    }
    
    if (!commits || commits.length === 0) {
      console.log('No more commits to process with regular authors.');
      hasMore = false;
      break;
    }
    
    console.log(`Processing batch of ${commits.length} commits...`);
    
    // Update each commit
    for (const commit of commits) {
      // Find the contributor with matching username
      const { data: contributors, error: contributorError } = await supabase
        .from('contributors')
        .select('id')
        .eq('username', commit.author)
        .limit(1);
      
      if (contributorError) {
        console.error(`Error finding contributor for commit ${commit.id}:`, contributorError);
        continue;
      }
      
      if (contributors && contributors.length > 0) {
        // Update the commit with the contributor_id
        const { error: updateError } = await supabase
          .from('commits')
          .update({ contributor_id: contributors[0].id })
          .eq('id', commit.id);
        
        if (updateError) {
          console.error(`Error updating commit ${commit.id}:`, updateError);
        } else {
          totalUpdated++;
          if (totalUpdated % 10 === 0) {
            console.log(`Updated ${totalUpdated} commits so far...`);
          }
        }
      }
      
      // Save the last ID for pagination
      lastId = commit.id;
    }
  }
  
  // Reset for processing placeholder commits
  hasMore = true;
  lastId = 0;
  
  // Process placeholder commits (using author_name)
  while (hasMore) {
    // Get the next batch of placeholder commits
    const { data: commits, error } = await supabase
      .from('commits')
      .select('id, author_name')
      .gt('id', lastId)
      .is('contributor_id', null)
      .eq('is_placeholder_author', true)
      .not('author_name', 'is', null)
      .order('id')
      .limit(BATCH_SIZE);
    
    if (error) {
      console.error('Error fetching placeholder commits:', error);
      break;
    }
    
    if (!commits || commits.length === 0) {
      console.log('No more placeholder commits to process.');
      hasMore = false;
      break;
    }
    
    console.log(`Processing batch of ${commits.length} placeholder commits...`);
    
    // Update each placeholder commit
    for (const commit of commits) {
      // Find the contributor with matching name
      const { data: contributors, error: contributorError } = await supabase
        .from('contributors')
        .select('id')
        .eq('name', commit.author_name)
        .limit(1);
      
      if (contributorError) {
        console.error(`Error finding contributor for placeholder commit ${commit.id}:`, contributorError);
        continue;
      }
      
      if (contributors && contributors.length > 0) {
        // Update the commit with the contributor_id
        const { error: updateError } = await supabase
          .from('commits')
          .update({ contributor_id: contributors[0].id })
          .eq('id', commit.id);
        
        if (updateError) {
          console.error(`Error updating placeholder commit ${commit.id}:`, updateError);
        } else {
          totalUpdated++;
          if (totalUpdated % 10 === 0) {
            console.log(`Updated ${totalUpdated} commits so far...`);
          }
        }
      }
      
      // Save the last ID for pagination
      lastId = commit.id;
    }
  }
  
  console.log(`Batch updates completed. Updated ${totalUpdated} commits in total.`);
}

// Run the update function
updateContributorIds()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 