/**
 * Database search script to find commits we can use for testing
 */

const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

async function findDatabase() {
  // Look for database in standard locations
  const potentialLocations = [
    './github_explorer.db',
    '../github_explorer.db',
    '../../github_explorer.db',
    './prisma/dev.db'
  ];
  
  for (const location of potentialLocations) {
    if (fs.existsSync(location)) {
      console.log(`Found database at: ${location}`);
      return location;
    }
  }
  
  console.log('Database not found in standard locations. Searching file system...');
  
  // Try to find by searching current directory
  const files = fs.readdirSync('.');
  console.log('Files in current directory:', files);
  
  return null;
}

async function main() {
  try {
    const dbLocation = await findDatabase();
    if (!dbLocation) {
      console.error('Could not find SQLite database file');
      process.exit(1);
    }
    
    // Open the database connection
    const db = await open({
      filename: dbLocation,
      driver: sqlite3.Database
    });
    
    console.log('=================================================');
    console.log('COMMITS FINDER');
    console.log('=================================================');
    
    // Get table info to confirm structure
    console.log('Checking database tables...');
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in database:', tables.map(t => t.name).join(', '));
    
    // Check if commits table exists
    const hasCommitsTable = tables.some(t => t.name === 'commits');
    if (!hasCommitsTable) {
      console.error('No commits table found in the database');
      await db.close();
      process.exit(1);
    }
    
    // Get table schema
    const schema = await db.all("PRAGMA table_info(commits)");
    console.log('\nCommits table schema:');
    schema.forEach(col => {
      console.log(`${col.name} (${col.type})`);
    });
    
    // Find repositories with merged PRs
    console.log('\nFinding repositories with merged PRs...');
    const repositoriesWithMergedPRs = await db.all(`
      SELECT DISTINCT r.id, r.github_id, r.name, r.full_name
      FROM repositories r
      JOIN pull_requests pr ON r.id = pr.repository_id
      WHERE pr.state = 'merged' OR pr.merged_at IS NOT NULL
      LIMIT 5
    `);
    
    if (repositoriesWithMergedPRs.length === 0) {
      console.log('No repositories with merged PRs found');
    } else {
      console.log(`Found ${repositoriesWithMergedPRs.length} repositories with merged PRs:`);
      repositoriesWithMergedPRs.forEach((repo, i) => {
        console.log(`${i+1}. ${repo.name} (ID: ${repo.github_id})`);
      });
      
      // Take the first repository and look for merged PRs
      const repo = repositoriesWithMergedPRs[0];
      console.log(`\nLooking for merged PRs in repository: ${repo.name}`);
      
      const mergedPRs = await db.all(`
        SELECT id, github_id, title, merged_at, author_id, author_github_id
        FROM pull_requests
        WHERE repository_id = ? AND (state = 'merged' OR merged_at IS NOT NULL)
        ORDER BY merged_at DESC
        LIMIT 5
      `, [repo.id]);
      
      if (mergedPRs.length === 0) {
        console.log('No merged PRs found for this repository');
      } else {
        console.log(`Found ${mergedPRs.length} merged PRs:`);
        mergedPRs.forEach((pr, i) => {
          console.log(`${i+1}. #${pr.github_id} - ${pr.title} (Merged: ${pr.merged_at})`);
        });
        
        // Take the first PR and look for commits
        const pr = mergedPRs[0];
        console.log(`\nLooking for commits in PR #${pr.github_id} - ${pr.title}`);
        
        // Get the author info
        const author = await db.get(`
          SELECT id, github_id, username, name
          FROM contributors
          WHERE id = ?
        `, [pr.author_id]);
        
        if (author) {
          console.log(`PR Author: ${author.name || author.username} (ID: ${author.github_id})`);
        }
        
        const commits = await db.all(`
          SELECT id, github_id, sha, message, filename, contributor_id, contributor_github_id, committed_at
          FROM commits
          WHERE pull_request_id = ? OR (repository_id = ? AND pull_request_github_id = ?)
          ORDER BY committed_at DESC
          LIMIT 10
        `, [pr.id, repo.id, pr.github_id]);
        
        if (commits.length === 0) {
          console.log('No commits found for this PR');
          
          // Try without PR filter
          console.log('\nLooking for any commits in this repository...');
          const anyCommits = await db.all(`
            SELECT id, github_id, sha, message, filename, contributor_id, contributor_github_id, committed_at
            FROM commits
            WHERE repository_id = ?
            ORDER BY committed_at DESC
            LIMIT 10
          `, [repo.id]);
          
          if (anyCommits.length === 0) {
            console.log('No commits found for this repository either');
          } else {
            console.log(`Found ${anyCommits.length} commits in the repository:`);
            anyCommits.forEach((commit, i) => {
              console.log(`\nCommit ${i+1}:`);
              console.log(`SHA: ${commit.sha || commit.github_id}`);
              console.log(`Message: ${commit.message}`);
              console.log(`File: ${commit.filename || 'N/A'}`);
              console.log(`Contributor ID: ${commit.contributor_github_id}`);
              console.log(`Date: ${commit.committed_at}`);
            });
            
            // Construct test URL for the first commit
            if (anyCommits.length > 0) {
              const testCommit = anyCommits[0];
              const fileName = testCommit.filename || 'unknown-file';
              const simplifiedFileName = fileName.split('/').pop().replace(/[^a-zA-Z0-9]/g, '-');
              
              console.log('\n=================================================');
              console.log('TEST URL CONSTRUCTION');
              console.log('=================================================');
              console.log('Repository:', repo.name, repo.github_id);
              console.log('PR:', pr.title, pr.github_id);
              console.log('Author:', author ? (author.name || author.username) : 'unknown', author ? author.github_id : 'unknown');
              console.log('Commit SHA:', testCommit.sha || testCommit.github_id);
              console.log('File:', simplifiedFileName);
              
              const repoSlug = `${repo.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-${repo.github_id}`;
              const prSlug = `${pr.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-${pr.github_id}`;
              const authorSlug = author ? 
                `${(author.name || author.username).toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-${author.github_id}` :
                `unknown-author-0`;
              const fileSlug = `${simplifiedFileName}-${testCommit.sha || testCommit.github_id}`;
              
              const testUrl = `/${repoSlug}/merge-requests/${prSlug}/commits/${authorSlug}/${fileSlug}`;
              console.log('\nTest URL:');
              console.log(testUrl);
              
              console.log('\nFull URL:');
              console.log(`http://localhost:3000${testUrl}`);
            }
          }
        } else {
          console.log(`Found ${commits.length} commits in the PR:`);
          commits.forEach((commit, i) => {
            console.log(`\nCommit ${i+1}:`);
            console.log(`SHA: ${commit.sha || commit.github_id}`);
            console.log(`Message: ${commit.message}`);
            console.log(`File: ${commit.filename || 'N/A'}`);
            console.log(`Contributor ID: ${commit.contributor_github_id}`);
            console.log(`Date: ${commit.committed_at}`);
          });
          
          // Construct test URL for the first commit
          if (commits.length > 0) {
            const testCommit = commits[0];
            const fileName = testCommit.filename || 'unknown-file';
            const simplifiedFileName = fileName.split('/').pop().replace(/[^a-zA-Z0-9]/g, '-');
            
            console.log('\n=================================================');
            console.log('TEST URL CONSTRUCTION');
            console.log('=================================================');
            console.log('Repository:', repo.name, repo.github_id);
            console.log('PR:', pr.title, pr.github_id);
            console.log('Author:', author ? (author.name || author.username) : 'unknown', author ? author.github_id : 'unknown');
            console.log('Commit SHA:', testCommit.sha || testCommit.github_id);
            console.log('File:', simplifiedFileName);
            
            const repoSlug = `${repo.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-${repo.github_id}`;
            const prSlug = `${pr.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-${pr.github_id}`;
            const authorSlug = author ? 
              `${(author.name || author.username).toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-${author.github_id}` :
              `unknown-author-0`;
            const fileSlug = `${simplifiedFileName}-${testCommit.sha || testCommit.github_id}`;
            
            const testUrl = `/${repoSlug}/merge-requests/${prSlug}/commits/${authorSlug}/${fileSlug}`;
            console.log('\nTest URL:');
            console.log(testUrl);
            
            console.log('\nFull URL:');
            console.log(`http://localhost:3000${testUrl}`);
          }
        }
      }
    }
    
    // Close the database connection
    await db.close();
    
    console.log('\n=================================================');
    console.log('SEARCH COMPLETE');
    console.log('=================================================');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 