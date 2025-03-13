/**
 * Script to delete all test data from the database
 * Removes all rows with source = 'pipeline-test' from relevant tables
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

async function deleteTestData() {
  console.log('Deleting test data from database...');
  
  try {
    // First, let's try to delete from contributor_repository junction table
    // This needs to be done first to avoid foreign key constraint issues
    console.log('Deleting from contributor_repository...');
    
    // Get IDs of test repositories and contributors
    const { data: testRepos } = await supabase
      .from('repositories')
      .select('id')
      .eq('source', 'pipeline-test');
    
    const { data: testContributors } = await supabase
      .from('contributors')
      .select('id')
      .eq('source', 'pipeline-test');
    
    const repoIds = testRepos ? testRepos.map(r => r.id) : [];
    const contributorIds = testContributors ? testContributors.map(c => c.id) : [];
    
    console.log(`Found ${repoIds.length} test repositories and ${contributorIds.length} test contributors`);
    
    // Delete from junction table if we have any IDs
    if (repoIds.length > 0) {
      const { error: junctionError1 } = await supabase
        .from('contributor_repository')
        .delete()
        .in('repository_id', repoIds);
      
      if (junctionError1) {
        console.error('Error deleting from contributor_repository by repo ID:', junctionError1.message);
      } else {
        console.log('Successfully deleted from contributor_repository by repo ID');
      }
      
      // Delete any commits associated with these repositories
      const { error: commitsError } = await supabase
        .from('commits')
        .delete()
        .in('repository_id', repoIds);
      
      if (commitsError) {
        console.error('Error deleting commits by repository ID:', commitsError.message);
      } else {
        console.log('Successfully deleted commits by repository ID');
      }
      
      // Delete any merge requests associated with these repositories
      const { error: mrError } = await supabase
        .from('merge_requests')
        .delete()
        .in('repository_id', repoIds);
      
      if (mrError) {
        console.error('Error deleting merge requests by repository ID:', mrError.message);
      } else {
        console.log('Successfully deleted merge requests by repository ID');
      }
    }
    
    if (contributorIds.length > 0) {
      const { error: junctionError2 } = await supabase
        .from('contributor_repository')
        .delete()
        .in('contributor_id', contributorIds);
      
      if (junctionError2) {
        console.error('Error deleting from contributor_repository by contributor ID:', junctionError2.message);
      } else {
        console.log('Successfully deleted from contributor_repository by contributor ID');
      }
    }
    
    // Now delete from the other tables in the correct order
    const tables = [
      'commits',
      'merge_requests',
      'github_raw_data',
      'contributors',
      'repositories'
    ];
    
    for (const table of tables) {
      console.log(`Deleting from ${table}...`);
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('source', 'pipeline-test');
        
      if (error) {
        console.error(`Error deleting from ${table}:`, error.message);
        
        // If we're having trouble with repositories, try one more approach
        if (table === 'repositories' && repoIds.length > 0) {
          console.log('Trying to delete repositories by ID...');
          const { error: repoError } = await supabase
            .from('repositories')
            .delete()
            .in('id', repoIds);
            
          if (repoError) {
            console.error('Error deleting repositories by ID:', repoError.message);
          } else {
            console.log('Successfully deleted repositories by ID');
          }
        }
      } else {
        console.log(`Successfully deleted rows from ${table}`);
      }
    }
    
    console.log('Test data deletion completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the deletion
deleteTestData()
  .then(() => {
    console.log('Cleanup completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }); 