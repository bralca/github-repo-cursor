/**
 * Test script for commit lookup
 * This script tests the functionality of querying commits from the database
 */

const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function main() {
  // Open the database connection
  const db = await open({
    filename: './prisma/dev.db',
    driver: sqlite3.Database
  });

  console.log('=================================================');
  console.log('COMMIT LOOKUP TESTING');
  console.log('=================================================');
  
  // Test: Get commits by SHA - test with full SHA
  const sha = '7ab835c9bac675a177c81b400d2e76cd5501e6d9';
  const repoGithubId = '61964757'; // shouldersurfing
  
  try {
    console.log(`Looking for commit with SHA '${sha}' in repository '${repoGithubId}'...`);
    
    // Try the exact query from the getCommitSEODataBySha function
    const commit = await db.get(
      `SELECT id, github_id, sha, repository_id, repository_github_id,
              contributor_id, contributor_github_id, message, committed_at,
              additions, deletions, files_changed, complexity_score
       FROM commits 
       WHERE (sha = ? OR github_id = ?) AND repository_github_id = ?`,
      [sha, sha, repoGithubId]
    );
    
    if (commit) {
      console.log('✅ Found commit:');
      console.log(JSON.stringify(commit, null, 2));
    } else {
      console.log('❌ Commit not found with exact SHA');
      
      // Try with a prefix of the SHA to see if that works
      console.log('Trying with SHA prefix...');
      const shaPrefix = sha.substring(0, 7);
      
      const prefixCommit = await db.get(
        `SELECT id, github_id, sha, repository_id, repository_github_id,
                contributor_id, contributor_github_id, message, committed_at
         FROM commits 
         WHERE sha LIKE ? AND repository_github_id = ?`,
        [`${shaPrefix}%`, repoGithubId]
      );
      
      if (prefixCommit) {
        console.log('✅ Found commit with SHA prefix:');
        console.log(JSON.stringify(prefixCommit, null, 2));
      } else {
        console.log('❌ Commit not found with SHA prefix');
      }
    }
  } catch (error) {
    console.error('Error during commit lookup:', error.message);
  }
  
  // Look for any commits in the repository
  try {
    console.log('\nLooking for any commits in the repository...');
    
    const commits = await db.all(
      `SELECT id, github_id, sha, message 
       FROM commits 
       WHERE repository_github_id = ? 
       LIMIT 5`,
      [repoGithubId]
    );
    
    if (commits && commits.length > 0) {
      console.log(`✅ Found ${commits.length} commits in the repository:`);
      commits.forEach((commit, index) => {
        console.log(`\nCommit ${index + 1}:`);
        console.log(JSON.stringify(commit, null, 2));
      });
    } else {
      console.log('❌ No commits found in the repository');
    }
  } catch (error) {
    console.error('Error during repository commits lookup:', error.message);
  }
  
  // Look in the database for recent pull requests
  try {
    console.log('\nLooking for recent pull requests...');
    
    const prs = await db.all(
      `SELECT id, github_id, repository_github_id, title
       FROM pull_requests
       ORDER BY created_at DESC
       LIMIT 5`
    );
    
    if (prs && prs.length > 0) {
      console.log(`✅ Found ${prs.length} recent pull requests:`);
      prs.forEach((pr, index) => {
        console.log(`\nPull Request ${index + 1}:`);
        console.log(JSON.stringify(pr, null, 2));
      });
    } else {
      console.log('❌ No pull requests found');
    }
  } catch (error) {
    console.error('Error during pull requests lookup:', error.message);
  }
  
  // Close the database connection
  await db.close();
  
  console.log('\n=================================================');
  console.log('TESTING COMPLETE');
  console.log('=================================================');
}

main().catch(console.error); 