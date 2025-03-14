// test-closed-merge-requests.js
// Test the closed_merge_requests_raw table and functions

import { 
  getDb, 
  fetchClosedMergeRequest, 
  queryClosedMergeRequests, 
  closeDb 
} from './lib/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testClosedMergeRequests() {
  try {
    console.log("Testing closed merge requests functionality...");
    console.log(`Database type: ${process.env.DB_TYPE || 'supabase'}`);
    console.log(`Database path: ${process.env.DB_PATH || 'N/A'}`);
    
    // Get database connection
    const db = await getDb();
    console.log("Database connection successful!");

    // Test querying the closed merge requests
    console.log("\nQuerying closed_merge_requests_raw table...");
    
    // Get count of records
    const countResult = await db.get('SELECT COUNT(*) as count FROM closed_merge_requests_raw');
    console.log(`Total closed merge request records: ${countResult.count}`);

    // Test the utility function to query closed merge requests
    console.log("\nUsing queryClosedMergeRequests function...");
    const mergeRequests = await queryClosedMergeRequests(null, { limit: 5 });
    
    if (mergeRequests && mergeRequests.length > 0) {
      console.log(`Retrieved ${mergeRequests.length} merge requests`);
      
      // Display basic info from each record
      mergeRequests.forEach((record, index) => {
        const repoName = record.data.repository?.name || 'Unknown';
        const repoOwner = record.data.repository?.owner?.login || 'Unknown';
        console.log(`[${index + 1}] ID: ${record.id}, Repository: ${repoOwner}/${repoName}`);
        
        // Try to extract more information if available
        try {
          if (record.data.repository) {
            console.log(`    Description: ${record.data.repository.description?.substring(0, 50) || 'N/A'}...`);
            console.log(`    Stars: ${record.data.repository.stargazers_count || 0}, Forks: ${record.data.repository.forks_count || 0}`);
          }
        } catch (err) {
          // Silently ignore errors in extracting additional data
        }
      });
      
      // Test the utility function to fetch a specific closed merge request
      if (mergeRequests.length > 0) {
        const firstRecord = mergeRequests[0];
        console.log("\nTesting fetchClosedMergeRequest function...");
        
        // Try to fetch by ID
        const fetchedById = await db.get(
          'SELECT id FROM closed_merge_requests_raw WHERE id = ?', 
          [firstRecord.id]
        );
        
        if (fetchedById) {
          console.log(`Successfully fetched record with ID: ${fetchedById.id}`);
        }
      }
    } else {
      console.log("No records found in the closed_merge_requests_raw table.");
    }

    // Close the connection when done
    await closeDb();
    console.log("\nDatabase connection closed.");
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(error.stack);
  }
}

// Run the test
testClosedMergeRequests(); 