// Simple script to re-enrich commits with missing filenames
import MergeRequestEnricher from '../src/pipeline/enrichers/merge-request-enricher.js';
import { GitHubApiClient } from '../src/services/github/github-api-client.js';
import dbPath from '../src/utils/db-path.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from the root .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../../.env') });

// Get GitHub token from environment
const githubToken = process.env.GITHUB_TOKEN;
if (!githubToken) {
  console.error('GITHUB_TOKEN not found in environment');
  process.exit(1);
}

async function main() {
  console.log('Starting commit re-enrichment process');
  console.log(`Using database at: ${dbPath}`);
  
  // Open database connection
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  console.log('Database connection established');
  
  // Initialize GitHub client
  const githubClient = new GitHubApiClient({
    auth: githubToken
  });
  console.log('GitHub client initialized');
  
  // Initialize enricher
  const enricher = new MergeRequestEnricher(db, githubClient);
  
  try {
    // Find commits with missing filenames
    console.log('Finding commits with missing filenames...');
    const commitsWithMissingFilenames = await db.all(`
      SELECT c.id, c.github_id, c.repository_id, c.pull_request_id, 
             r.full_name as repository_full_name, mr.github_id as mr_github_id
      FROM commits c
      JOIN repositories r ON c.repository_id = r.id
      JOIN merge_requests mr ON c.pull_request_id = mr.id
      WHERE c.filename IS NULL
      LIMIT 100
    `);
    
    console.log(`Found ${commitsWithMissingFilenames.length} commits with missing filenames`);
    
    if (commitsWithMissingFilenames.length === 0) {
      console.log('No commits with missing filenames. Exiting.');
      await db.close();
      return;
    }
    
    // Group by merge request
    const commitsByMR = {};
    commitsWithMissingFilenames.forEach(commit => {
      if (!commitsByMR[commit.pull_request_id]) {
        commitsByMR[commit.pull_request_id] = {
          mergeRequestId: commit.pull_request_id,
          mrGithubId: commit.mr_github_id,
          repositoryFullName: commit.repository_full_name,
          commits: []
        };
      }
      commitsByMR[commit.pull_request_id].commits.push(commit);
    });
    
    const mergeRequests = Object.values(commitsByMR);
    console.log(`Grouped into ${mergeRequests.length} merge requests`);
    
    // Process each merge request
    let totalProcessed = 0;
    let totalFixed = 0;
    
    for (const [index, mrData] of mergeRequests.entries()) {
      console.log(`[${index+1}/${mergeRequests.length}] Processing ${mrData.repositoryFullName}#${mrData.mrGithubId} (${mrData.commits.length} commits)`);
      
      try {
        // Get full merge request data
        const mergeRequest = await db.get(`SELECT * FROM merge_requests WHERE id = ?`, [mrData.mergeRequestId]);
        
        if (!mergeRequest) {
          console.warn(`  Merge request with ID ${mrData.mergeRequestId} not found`);
          continue;
        }
        
        // Re-enrich merge request
        const success = await enricher.enrichMergeRequest(mergeRequest);
        
        if (success) {
          // Check how many commits now have filenames
          const fixedCommits = await db.get(`
            SELECT COUNT(*) as count FROM commits 
            WHERE pull_request_id = ? AND filename IS NOT NULL AND id IN (${mrData.commits.map(() => '?').join(',')})
          `, [mrData.mergeRequestId, ...mrData.commits.map(c => c.id)]);
          
          console.log(`  Success: Fixed ${fixedCommits.count}/${mrData.commits.length} commits`);
          totalProcessed += mrData.commits.length;
          totalFixed += fixedCommits.count;
        } else {
          console.warn(`  Failed to enrich merge request`);
        }
      } catch (error) {
        console.error(`  Error processing merge request: ${error.message}`);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Re-enrichment completed: Fixed ${totalFixed}/${totalProcessed} commits`);
  } catch (error) {
    console.error(`Error in re-enrichment process: ${error.message}`);
  } finally {
    await db.close();
    console.log('Finished.');
  }
}

main().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 