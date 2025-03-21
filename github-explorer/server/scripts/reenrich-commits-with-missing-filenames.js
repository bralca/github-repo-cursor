/**
 * Script to re-enrich commits with missing filenames
 * 
 * This script:
 * 1. Identifies commits in the database with missing filenames
 * 2. Groups them by their associated merge request
 * 3. Uses the MergeRequestEnricher to re-enrich these commits
 */

import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { GitHubApiClient } from '../src/services/github/github-api-client.js';
import MergeRequestEnricher from '../src/pipeline/enrichers/merge-request-enricher.js';
import dotenv from 'dotenv';
import winston from 'winston';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'commit-reenrichment' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'commit-reenrichment.log' })
  ]
});

async function main() {
  logger.info('Starting commit re-enrichment process');
  
  // Initialize the database connection
  const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, '../../github_explorer.db');
  logger.info(`Connecting to database at ${dbPath}`);
  
  let db;
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Failed to connect to the database', { error });
    process.exit(1);
  }
  
  // Initialize GitHub client
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    logger.error('GitHub token not found in environment variables');
    process.exit(1);
  }
  
  const githubClient = new GitHubApiClient({
    auth: githubToken,
    token: githubToken
  });
  
  // Initialize the enricher
  const enricher = new MergeRequestEnricher(db, githubClient);
  
  try {
    // Find commits with missing filenames that are part of a merge request
    logger.info('Finding commits with missing filenames...');
    const commitsWithMissingFilenames = await db.all(`
      SELECT c.id, c.github_id, c.repository_id, c.pull_request_id, 
             r.full_name as repository_full_name, mr.github_id as mr_github_id
      FROM commits c
      JOIN repositories r ON c.repository_id = r.id
      JOIN merge_requests mr ON c.pull_request_id = mr.id
      WHERE c.filename IS NULL
      LIMIT 500
    `);
    
    logger.info(`Found ${commitsWithMissingFilenames.length} commits with missing filenames`);
    
    if (commitsWithMissingFilenames.length === 0) {
      logger.info('No commits with missing filenames found. Exiting.');
      await db.close();
      return;
    }
    
    // Group commits by merge request for efficient processing
    const commitsByMergeRequest = {};
    for (const commit of commitsWithMissingFilenames) {
      if (!commitsByMergeRequest[commit.pull_request_id]) {
        commitsByMergeRequest[commit.pull_request_id] = {
          mergeRequestId: commit.pull_request_id,
          mrGithubId: commit.mr_github_id,
          repositoryFullName: commit.repository_full_name,
          commits: []
        };
      }
      commitsByMergeRequest[commit.pull_request_id].commits.push(commit);
    }
    
    // Process each merge request
    const mergeRequests = Object.values(commitsByMergeRequest);
    logger.info(`Grouped commits into ${mergeRequests.length} merge requests for processing`);
    
    let totalUpdated = 0;
    
    for (const [index, mrData] of mergeRequests.entries()) {
      logger.info(`Processing merge request ${index + 1}/${mergeRequests.length}: ${mrData.repositoryFullName}#${mrData.mrGithubId}`);
      
      try {
        // Get full merge request data
        const mergeRequest = await db.get(`
          SELECT * FROM merge_requests WHERE id = ?
        `, [mrData.mergeRequestId]);
        
        if (!mergeRequest) {
          logger.warn(`Merge request with ID ${mrData.mergeRequestId} not found in database`);
          continue;
        }
        
        // Re-enrich the merge request which will update its commits
        const result = await enricher.enrichMergeRequest(mergeRequest);
        
        if (result) {
          // Count how many commits were updated
          const updatedCount = await db.get(`
            SELECT COUNT(*) as count FROM commits 
            WHERE pull_request_id = ? AND filename IS NOT NULL AND id IN (${mrData.commits.map(() => '?').join(',')})
          `, [mrData.mergeRequestId, ...mrData.commits.map(c => c.id)]);
          
          totalUpdated += updatedCount.count;
          logger.info(`Updated ${updatedCount.count}/${mrData.commits.length} commits for merge request ${mrData.repositoryFullName}#${mrData.mrGithubId}`);
        } else {
          logger.warn(`Failed to enrich merge request ${mrData.repositoryFullName}#${mrData.mrGithubId}`);
        }
      } catch (error) {
        logger.error(`Error processing merge request ${mrData.repositoryFullName}#${mrData.mrGithubId}`, { error });
        // Continue with next merge request
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.info(`Re-enrichment process completed. Updated ${totalUpdated} commits with missing filenames.`);
  } catch (error) {
    logger.error('Error in re-enrichment process', { error });
  } finally {
    // Clean up resources
    await enricher.close();
    await db.close();
    logger.info('Database connection closed');
  }
}

main().catch(error => {
  logger.error('Unhandled error in main process', { error });
  process.exit(1);
}); 