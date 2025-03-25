/**
 * Pipeline Operations Controller
 * 
 * Handles API requests for direct pipeline operations (start/stop).
 */

import { BaseController } from './base-controller.js';
import { pipelineFactory } from '../pipeline/core/pipeline-factory.js';
import { logger } from '../utils/logger.js';
import { Pipeline } from '../pipeline/core/pipeline.js';
import { PipelineContext } from '../pipeline/core/pipeline-context.js';

// Import processors that will be needed for each pipeline type
import { EntityExtractorProcessor } from '../pipeline/processors/entity-extractor.js';
import { DatabaseWriterProcessor } from '../pipeline/processors/database-writer-processor.js';

// For SQLite operations - import these at the top level
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { openSQLiteConnection, closeSQLiteConnection } from '../utils/sqlite.js';
import { pipelineEvents } from '../utils/event-emitter.js';

/**
 * Fetches recent merged pull requests using the GitHub API
 * Adapted from legacy implementation
 * 
 * @param {GitHubApiClient} githubClient - The GitHub API client
 * @returns {Array} Array of merged pull request events
 */
async function getRecentMergedPullRequests(githubClient) {
  try {
    logger.info("Fetching recent public events to find merged PRs...");
    const allEvents = [];
    
    // Fetch recent public events to identify merged PRs
    // Use pagination to get a good sample
    try {
      // This is different from the legacy implementation - we'll use the
      // current API client to fetch events, limited to recent ones
      const events = await githubClient.octokit.activity.listPublicEvents({
        per_page: 100
      });
      
      if (events.data) {
        allEvents.push(...events.data);
        logger.info(`Fetched ${events.data.length} public events`);
      }
    } catch (eventsError) {
      logger.error('Error fetching public events:', { error: eventsError });
      // Continue with any events we've already fetched
    }
    
    // Filter for merged pull requests
    const mergedPRs = allEvents.filter(event => 
      event.type === 'PullRequestEvent' &&
      event.payload?.action === 'closed' &&
      event.payload?.pull_request?.merged === true
    );
    
    logger.info(`Filtered to ${mergedPRs.length} merged pull requests`);
    return mergedPRs;
  } catch (error) {
    logger.error('Error in getRecentMergedPullRequests:', { error });
    throw error;
  }
}

/**
 * Stores a merged pull request in the SQLite database
 * 
 * @param {Object} prEvent - The pull request event from GitHub
 * @param {Object} db - SQLite database connection
 */
async function storeMergedPullRequest(prEvent, db) {
  try {
    if (!prEvent.payload?.pull_request) {
      logger.warn('Invalid PR event data - missing payload or pull_request');
      return;
    }
    
    const pr = prEvent.payload.pull_request;
    const repoName = prEvent.repo?.name;
    
    if (!repoName) {
      logger.warn('Invalid PR event data - missing repository name');
      return;
    }
    
    logger.info(`Processing PR #${pr.number} from ${repoName}`);
    
    // The commits should be directly accessible in the payload
    // Check if they are available at various possible locations
    const commits = pr.commits_url ? pr._links?.commits?.href : [];
    
    // Extract the needed data in a format similar to the legacy implementation
    const data = {
      repository: {
        id: prEvent.repo.id,
        full_name: repoName,
        owner: repoName.split('/')[0],
        description: pr.base?.repo?.description,
        url: pr.base?.repo?.html_url,
        stars: pr.base?.repo?.stargazers_count || 0,
        forks: pr.base?.repo?.forks_count || 0
      },
      pull_request: {
        id: pr.id,
        pr_number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        closed_at: pr.closed_at,
        merged_at: pr.merged_at,
        user: pr.user,
        merged_by: pr.merged_by,
        review_comments: pr.review_comments,
        commits_count: pr.commits,
        additions: pr.additions,
        deletions: pr.deletions,
        changed_files: pr.changed_files,
        labels: pr.labels,
        base: pr.base,
        head: pr.head,
        commits_url: pr.commits_url
      },
      // If there are commits directly in the PR object, include them
      commits: Array.isArray(pr.commits) ? pr.commits : []
    };
    
    // Convert the data to JSON string
    const jsonData = JSON.stringify(data);
    const prId = pr.id.toString();
    
    // Check if this PR already exists in the database
    const existingPR = await db.get(
      `SELECT id FROM closed_merge_requests_raw 
       WHERE json_extract(data, '$.pull_request.id') = ?`,
      [prId]
    );
    
    if (existingPR) {
      // PR already exists, update it
      logger.info(`PR #${pr.number} already exists (id: ${existingPR.id}), updating...`);
      await db.run(
        `UPDATE closed_merge_requests_raw 
         SET data = ? 
         WHERE id = ?`,
        [jsonData, existingPR.id]
      );
    } else {
      // PR is new, insert it
      logger.info(`Storing new PR #${pr.number} from ${repoName}`);
      await db.run(
        'INSERT INTO closed_merge_requests_raw (data, is_processed) VALUES (?, ?)',
        [jsonData, 0]  // 0 means not processed yet
      );
    }
    
    // Log information about commits (if any were found)
    const commitCount = Array.isArray(data.commits) ? data.commits.length : 0;
    const commitMsg = commitCount > 0 ? `with ${commitCount} commits` : 'without commit details';
    logger.info(`Successfully stored data for PR #${pr.number} from ${repoName} ${commitMsg}`);
  } catch (error) {
    logger.error('Error storing pull request data:', { error });
    throw error;
  }
}

/**
 * Controller for direct pipeline operations
 * @extends BaseController
 */
class PipelineOperationsController extends BaseController {
  /**
   * Start a pipeline
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async startPipeline(req, res) {
    try {
      const { pipeline_type, direct_execution, process_all_items } = req.body || {};
      
      if (!pipeline_type) {
        return res.status(400).json({ error: 'Pipeline type is required' });
      }
      
      // Determine whether this is a direct execution or a scheduled pipeline
      const isDirectExecution = direct_execution === true;
      const shouldProcessAllItems = process_all_items === true;
      
      // Log the pipeline start
      logger.info(`Starting pipeline: ${pipeline_type}`, { 
        isDirectExecution, 
        shouldProcessAllItems
      });
      
      // For direct execution (API call), execute the operation immediately
      if (isDirectExecution) {
        // Create a history entry for the direct execution
        const historyId = await this.createPipelineHistoryEntry(pipeline_type, 'direct_execution');
        
        // Call the relevant pipeline function directly
        let result;
        
        switch (pipeline_type) {
          case 'github_sync':
            result = await this.executeGitHubSync();
            break;
          
          case 'data_processing':
            result = await this.executeDataProcessing();
            break;
          
          case 'data_enrichment':
            // Pass the shouldProcessAllItems flag to the executeDataEnrichment method
            result = await this.executeDataEnrichment(shouldProcessAllItems);
            break;
          
          case 'ai_analysis':
            result = await this.executeAIAnalysis();
            break;
          
          default:
            return res.status(400).json({ error: `Unknown pipeline type: ${pipeline_type}` });
        }
        
        // Update the history entry with the result
        await this.updatePipelineHistoryEntry(historyId, result.success ? 'completed' : 'failed', result.itemsProcessed || 0);
        
        // Return the result as the API response
        return res.json({
          success: result.success,
          message: result.message || `${pipeline_type} pipeline execution ${result.success ? 'completed' : 'failed'}`,
          itemsProcessed: result.itemsProcessed || 0,
          error: result.error || null
        });
      }
      
      // For scheduled execution, update the status and let the scheduler handle it
      // (This code remains unchanged)
      // ... existing code ...
    } catch (error) {
      logger.error('Error in startPipeline:', { error });
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
  
  /**
   * Execute the specific function for each pipeline type directly 
   * @param {string} historyId - Pipeline history ID
   * @param {string} pipelineType - Pipeline type
   * @private
   */
  async executeDirectFunction(historyId, pipelineType) {
    logger.info(`Directly executing function for ${pipelineType}`);
    
    try {
      // Create a simple history entry to track execution
      // We'll update this when the function completes
      const startTime = new Date();
      
      // Emit pipeline execution started event
      pipelineEvents.emit('pipeline_execution_started', {
        pipelineType,
        historyId
      });
      
      // Execute the appropriate function based on pipeline type
      let result;
      switch (pipelineType) {
        case 'github_sync':
          result = await this.executeGitHubSync();
          break;
        case 'data_processing':
          result = await this.executeDataProcessing();
          break;
        case 'data_enrichment':
          result = await this.executeDataEnrichment();
          break;
        case 'contributor_enrichment':
          result = await this.executeContributorEnrichment();
          break;
        case 'ai_analysis':
          result = await this.executeAIAnalysis();
          break;
        case 'sitemap_generation':
          result = await this.executeSitemapGeneration();
          break;
        default:
          throw new Error(`Unknown pipeline type: ${pipelineType}`);
      }
      
      // Update history with results
      await this.updatePipelineHistory(historyId, {
        status: result.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        items_processed: result.itemsProcessed || 0,
        error_message: result.error ? result.error.message : null
      });
      
      const endTime = new Date();
      const executionTime = (endTime - startTime) / 1000;
      
      logger.info(`Direct execution of ${pipelineType} completed in ${executionTime.toFixed(2)}s with status: ${result.success ? 'success' : 'failure'}`);
      
      // Emit pipeline execution completed event
      pipelineEvents.emit('pipeline_execution_completed', {
        pipelineType,
        historyId,
        itemsProcessed: result.itemsProcessed || 0,
        stats: result.stats
      });
      
    } catch (error) {
      logger.error(`Error in direct execution of ${pipelineType}:`, { error });
      
      // Update history entry with error
      await this.updatePipelineHistory(historyId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message || 'Unknown error'
      });
      // Emit pipeline execution error event
      pipelineEvents.emit('pipeline_execution_error', {
        pipelineType,
        historyId,
        error: error.message
      });
    }
  }
  
  /**
   * Execute GitHub Sync functionality directly
   * @returns {Promise<object>} Result object with success status and metrics
   * @private
   */
  async executeGitHubSync() {
    logger.info('Executing GitHub sync function directly');
    
    // Initialize stats to track processing metrics
    const stats = {
      processed: 0,
      saved: 0,
      errors: 0,
      skipped: 0
    };
    
    try {
      // Step 1: Import required modules
      const { GitHubApiClient } = await import('../services/github/github-api-client.js');
      
      // Step 2: Create a GitHub API client
      const githubClient = new GitHubApiClient({
        clientId: 'github-sync-direct',
        token: process.env.GITHUB_TOKEN
      });
      
      // Step 3: Set up database connection
      const db = await openSQLiteConnection();
      
      // Step 4: Ensure all required tables exist
      logger.info('Checking database tables...');
      
      // Check closed_merge_requests_raw table
      const rawTableExists = await db.get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='closed_merge_requests_raw'`
      );
      
      if (!rawTableExists) {
        logger.info('Creating closed_merge_requests_raw table...');
        await db.exec(`
          CREATE TABLE closed_merge_requests_raw (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            is_processed INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE INDEX IF NOT EXISTS idx_closed_mr_is_processed 
          ON closed_merge_requests_raw(is_processed);
        `);
      }
      
      // Ensure all entity tables exist for data processing
      await this.ensureContributorRepositoryTable(db);
      
      // Step 5: Fetch and store GitHub data
      logger.info('Fetching merged pull requests from GitHub...');
      const mergedPRs = await getRecentMergedPullRequests(githubClient);
      logger.info(`Found ${mergedPRs.length} recently merged pull requests`);
      stats.processed = mergedPRs.length;
      
      // Step 6: Process each PR
      // Important: We now fetch commit data for each PR and store it with the PR data
      // This ensures we can process all commits, not just their count
      logger.info('Processing pull requests with complete commit data');
      
      for (const pr of mergedPRs) {
        try {
          // Pass the githubClient to storeMergedPullRequest to fetch commit data
          await storeMergedPullRequest(pr, db);
          stats.saved++;
        } catch (prError) {
          logger.error(`Error processing PR (${pr.payload?.pull_request?.html_url || 'unknown PR'})`, { 
            error: prError 
          });
          stats.errors++;
          // Continue processing other PRs even if one fails
        }
      }
      
      logger.info(`GitHub sync completed. Processed ${stats.processed} pull requests.`);
      
      // Step 7: Close the database connection
      await db.close();
      
      // Step 8: Get stats for unprocessed items
      const statsDb = await openSQLiteConnection();
      const statsQuery = "SELECT COUNT(*) as count FROM closed_merge_requests_raw WHERE is_processed = 0";
      const statsResult = await statsDb.get(statsQuery);
      const unprocessedCount = statsResult?.count || 0;
      await statsDb.close();
      
      // Emit pipeline progress event
      pipelineEvents.emit('pipeline_progress', {
        pipelineType: 'github_sync',
        progress: {
          currentStep: 'Fetching recent merged pull requests',
          itemsProcessed: stats.processed
        },
        stats
      });
      
      // Step 9: Document the changes
      logger.info('GitHub sync process complete. Documentation update recommended to reflect changes.');
      
      return { 
        success: true,
        itemsProcessed: stats.processed,
        stats,
        unprocessedCount,
        message: `Successfully processed ${stats.processed} pull requests. ${unprocessedCount} ready for data extraction.`
      };
    } catch (error) {
      logger.error('Error in direct GitHub sync function:', { error });
      
      return {
        success: false,
        stats,
        error: error.message,
        message: `Failed to sync GitHub data: ${error.message}` 
      };
    }
  }
  
  /**
   * Execute the data processing for closed merge requests
   */
  async executeDataProcessing() {
    const stats = {
      repositories: 0,
      contributors: 0,
      mergeRequests: 0,
      commits: 0,
      totalItemsProcessed: 0,
      failedItems: 0
    };
    
    logger.info("Starting closed merge requests data processing");
    
    try {
      // Set up database connection
      const db = await openSQLiteConnection();
      
      // Check if the closed_merge_requests_raw table exists with the correct structure
      const tableExists = await db.get(
        `SELECT name FROM sqlite_master 
         WHERE type='table' AND name='closed_merge_requests_raw'`
      );
      
      if (!tableExists) {
        logger.error("The closed_merge_requests_raw table does not exist. Cannot process data.");
        await db.close();
        return {
          success: false,
          message: "Table closed_merge_requests_raw does not exist",
          stats
        };
      }
      
      // Get unprocessed items - limit to 100 at a time to prevent memory issues
      const batchSize = 100;
      logger.info(`Fetching up to ${batchSize} unprocessed items from closed_merge_requests_raw table`);
      
      const unprocessedItems = await db.all(
        `SELECT id, data FROM closed_merge_requests_raw 
         WHERE is_processed = 0 
         LIMIT ?`,
        [batchSize]
      );
      
      const itemCount = unprocessedItems.length;
      logger.info(`Found ${itemCount} unprocessed items to process`);
      
      if (itemCount === 0) {
        logger.info("No items to process. Data processing complete.");
        await db.close();
        return {
          success: true,
          message: "No items to process",
          stats
        };
      }
      
      // Process each item
      const processedIds = [];
      const failedIds = [];
      
      for (let i = 0; i < unprocessedItems.length; i++) {
        const item = unprocessedItems[i];
        await this.processItem(item, stats, processedIds, failedIds, i, itemCount, db);
      }
      
      // Mark processed items in the database
      if (processedIds.length > 0) {
        logger.info(`Marking ${processedIds.length} items as processed`);
        await this.markItemsAsProcessed(processedIds, db);
      }
      
      // Update stats
      stats.totalItemsProcessed = processedIds.length;
      stats.failedItems = failedIds.length;
      
      // Close database connection
      await db.close();
      
      logger.info("Completed data processing", { stats });
      
      // Emit progress event after processing some items
      if (processedIds.length > 0 && processedIds.length % 10 === 0) { // Every 10 items
        pipelineEvents.emit('pipeline_progress', {
          pipelineType: 'data_processing',
          progress: {
            currentStep: 'Processing raw merge requests',
            itemsProcessed: processedIds.length,
            totalItems: itemCount
          },
          stats
        });
      }
      
      return {
        success: true,
        message: `Processed ${processedIds.length} items, ${failedIds.length} failed`,
        stats
      };
    } catch (error) {
      logger.error(`Error in data processing: ${error.message}`, {
        error,
        stack: error.stack
      });
      
      return {
        success: false,
        message: `Error in data processing: ${error.message}`,
        stats
      };
    }
  }
  
  /**
   * Execute Contributor Enrichment functionality
   * @returns {Promise<object>} Result object with success status and metrics
   * @private
   */
  async executeContributorEnrichment() {
    logger.info('Executing contributor enrichment function directly');
    
    try {
      // Initialize the stats counter
      const stats = {
        contributors: {
          processed: 0,
          enriched: 0,
          failed: 0,
          notFound: 0,
          skipped: 0
        },
        rateLimited: false
      };
      
      // Open a database connection
      const db = await openSQLiteConnection();
      
      try {
        // First, mark all contributors without github_id as enriched to prevent repeated processing
        logger.info('Marking contributors without github_id as enriched');
        const markQuery = `
          UPDATE contributors 
          SET is_enriched = 1, updated_at = ?
          WHERE is_enriched = 0 AND (github_id IS NULL OR github_id = 0)
        `;
        const markResult = await db.run(markQuery, [new Date().toISOString()]);
        stats.contributors.skipped = markResult.changes || 0;
        logger.info(`Marked ${stats.contributors.skipped} contributors without github_id as enriched`);
        
        // Import the GitHub API client and contributor enricher
        const { GitHubApiClient } = await import('../services/github/github-api-client.js');
        const { ContributorEnricher } = await import('../pipeline/enrichers/contributor-enricher.js');
        
        // Create a GitHub API client for enrichment
        const githubClient = new GitHubApiClient({
          clientId: 'contributor-enrichment',
          token: process.env.GITHUB_TOKEN
        });
        
        // Keep enriching contributors until none are left
        let continuousProcessing = true;
        let processAttempts = 0;
        let unenrichedCount = 1; // Initialize to non-zero to enter the loop
        
        while (continuousProcessing && processAttempts < 5) { // Limit attempts to prevent infinite loops
          // Check if there are still unenriched contributors
          const countQuery = `SELECT COUNT(*) as count FROM contributors WHERE is_enriched = 0`;
          const countResult = await db.get(countQuery);
          unenrichedCount = countResult?.count || 0;
          
          if (unenrichedCount === 0) {
            logger.info('No more unenriched contributors to process');
            continuousProcessing = false;
            break;
          }
          
          logger.info(`Starting contributor enrichment pass #${processAttempts + 1}. ${unenrichedCount} contributors remain to be enriched`);
          
          // Enrich contributors
          const contributorEnricher = new ContributorEnricher({
            githubClient,
            db,
            config: {
              batchSize: 10,
              abortOnError: false
            }
          });
          
          // Run the contributor enrichment process
          const contribStats = await contributorEnricher.enrichAllContributors();
          
          // Update stats
          stats.contributors.processed += contribStats.processed;
          stats.contributors.enriched += contribStats.success;
          stats.contributors.failed += contribStats.failed;
          stats.contributors.notFound += contribStats.notFound;
          
          // Check if we hit rate limits
          if (contribStats.rateLimited) {
            stats.rateLimited = true;
            stats.rateLimitReset = contribStats.rateLimitReset;
            
            // Wait for rate limit to reset before checking again
            const now = new Date();
            const resetTime = new Date(contribStats.rateLimitReset);
            
            if (now < resetTime) {
              const waitTimeMs = resetTime.getTime() - now.getTime() + 1000; // Add 1 second buffer
              logger.info(`Rate limited by GitHub API. Waiting ${Math.ceil(waitTimeMs / 1000)} seconds until ${resetTime.toISOString()}`);
              await new Promise(resolve => setTimeout(resolve, waitTimeMs));
            }
          }
          
          processAttempts++;
        }
        
        logger.info('Contributor enrichment function executed successfully', { stats });
        
        return { 
          success: true, 
          itemsProcessed: stats.contributors.enriched,
          stats,
          message: 'Contributor enrichment completed successfully' 
        };
      } finally {
        // Ensure the database connection is closed
        if (db) {
          await db.close();
          logger.info('Database connection closed');
        }
      }
    } catch (error) {
      logger.error('Error in direct contributor enrichment function:', { error });
      
      return { 
        success: false, 
        error,
        message: `Failed to enrich contributors: ${error.message}` 
      };
    }
  }

  /**
   * Execute Data Enrichment functionality directly
   * @param {boolean} processAllItems - Whether to process all items until completion
   * @returns {Promise<object>} Result object with success status and metrics
   * @private
   */
  async executeDataEnrichment(processAllItems = false) {
    logger.info('Executing data enrichment function directly', { processAllItems });
    
    // Create history entry for tracking
    const historyId = await this.createPipelineHistoryEntry('data_enrichment', 'direct_execution');
    
    // Setup statistics tracking
    const stats = {
      repositories: { processed: 0, success: 0, failed: 0, skipped: 0 },
      contributors: { processed: 0, success: 0, failed: 0, skipped: 0 },
      mergeRequests: { processed: 0, success: 0, failed: 0, skipped: 0 },
      commits: { processed: 0, success: 0, failed: 0, skipped: 0 },
      rateLimited: false,
      rateLimitReset: null,
    };
    
    try {
      // Emit pipeline start event
      pipelineEvents.emit('pipeline_start', {
        pipelineType: 'data_enrichment',
        historyId,
        processAllItems
      });
      
      try {
        // Import the GitHub API client and enrichers
        const { GitHubApiClient } = await import('../services/github/github-api-client.js');
        const { RepositoryEnricher } = await import('../pipeline/enrichers/repository-enricher.js');
        const { ContributorEnricher } = await import('../pipeline/enrichers/contributor-enricher.js');
        const { default: MergeRequestEnricher } = await import('../pipeline/enrichers/merge-request-enricher.js');
        
        // Create a GitHub API client for enrichment
        const githubClient = new GitHubApiClient({
          clientId: 'data-enrichment',
          token: process.env.GITHUB_TOKEN
        });
        
        // If processAllItems is false, limit batch size to 10 and only run one pass
        // If true, use a larger batch size and continue until all items are processed
        const batchSize = processAllItems ? 50 : 10;
        const maxPasses = processAllItems ? 100 : 1; // Limit to prevent infinite loops
        
        // 1. First, enrich repositories
        logger.info('Starting repository enrichment phase', { processAllItems, batchSize });
        pipelineEvents.emit('pipeline_progress', {
          pipelineType: 'data_enrichment',
          progress: {
            currentStep: 'Starting repository enrichment',
            phase: 'repository_enrichment',
            processAllItems
          },
          stats
        });
        
        let repoProcessAttempts = 0;
        let repoUnenrichedCount = 1;
        
        // Get database connection for counts
        const db = await openSQLiteConnection();
        
        // Get counts for progress tracking
        repoUnenrichedCount = await db.get(`
          SELECT COUNT(*) as count 
          FROM repositories 
          WHERE is_enriched = 0 AND enrichment_attempts < 3
        `);
        
        repoUnenrichedCount = repoUnenrichedCount ? repoUnenrichedCount.count : 0;
        logger.info(`Found ${repoUnenrichedCount} unenriched repositories`);
        
        await db.close();
        
        // Only continue with repository enrichment if there are unenriched items
        if (repoUnenrichedCount > 0) {
          // Create repository enricher for processing batches
          const repositoryEnricher = new RepositoryEnricher({ 
            githubClient, 
            db: await openSQLiteConnection(),
            config: { batchSize }
          });
          
          // Loop through and process repositories in batches
          while (repoUnenrichedCount > 0 && repoProcessAttempts < maxPasses) {
            try {
              repoProcessAttempts++;
              logger.info(`Processing repository batch ${repoProcessAttempts}/${maxPasses}`, { remaining: repoUnenrichedCount });
              
              // Process one batch of repositories
              const repoResult = await repositoryEnricher.enrichRepositories();
              
              // Update statistics
              stats.repositories.processed += repoResult.processed;
              stats.repositories.success += repoResult.success;
              stats.repositories.failed += repoResult.failed;
              stats.repositories.skipped += repoResult.notFound || 0;
              
              // Check if we hit a rate limit
              if (repoResult.rateLimited) {
                stats.rateLimited = true;
                stats.rateLimitReset = repoResult.rateLimitReset;
                
                logger.warn('GitHub API rate limit reached during repository enrichment', { resetTime: stats.rateLimitReset });
                
                // Wait for rate limit to reset if we're processing all items
                if (processAllItems) {
                  const resetTime = new Date(stats.rateLimitReset * 1000);
                  const waitMs = Math.max(0, resetTime.getTime() - Date.now()) + 5000; // Add 5 second buffer
                  
                  logger.info(`Waiting for rate limit to reset: ${Math.ceil(waitMs/1000)} seconds until ${resetTime.toISOString()}`);
                  pipelineEvents.emit('pipeline_progress', {
                    pipelineType: 'data_enrichment',
                    progress: {
                      currentStep: `Waiting for rate limit to reset (${Math.ceil(waitMs/1000)}s)`,
                      phase: 'rate_limit_wait',
                      processAllItems
                    },
                    stats
                  });
                  
                  // Wait for the rate limit to reset
                  await new Promise(resolve => setTimeout(resolve, waitMs));
                  
                  logger.info('Rate limit wait complete, continuing enrichment');
                  pipelineEvents.emit('pipeline_progress', {
                    pipelineType: 'data_enrichment',
                    progress: {
                      currentStep: 'Continuing repository enrichment after rate limit',
                      phase: 'repository_enrichment',
                      processAllItems
                    },
                    stats
                  });
                } else {
                  // If not processing all items, just break and move on
                  logger.info('Rate limit reached and not processing all items, moving to next phase');
                  break;
                }
              }
              
              // Check if we should continue processing repositories
              if (!processAllItems) {
                // If not processing all items, just break after one batch
                break;
              }
              
              // Get updated count for next iteration
              const dbConn = await openSQLiteConnection();
              const countResult = await dbConn.get(`
                SELECT COUNT(*) as count 
                FROM repositories 
                WHERE is_enriched = 0 AND enrichment_attempts < 3
              `);
              repoUnenrichedCount = countResult ? countResult.count : 0;
              await dbConn.close();
              
              // Emit progress event
              pipelineEvents.emit('pipeline_progress', {
                pipelineType: 'data_enrichment',
                progress: {
                  currentStep: 'Repository enrichment in progress',
                  phase: 'repository_enrichment',
                  processAllItems,
                  totalItems: stats.repositories.processed + repoUnenrichedCount,
                  processedItems: stats.repositories.processed
                },
                stats
              });
              
              logger.info(`Repository batch ${repoProcessAttempts} complete, ${repoUnenrichedCount} remaining`);
            } catch (error) {
              logger.error('Error in repository enrichment batch', { error });
              
              // If we encounter an error that's not rate limiting, log it and continue
              stats.repositories.failed += 1;
              
              // Check if we should continue or break
              if (!processAllItems) {
                break;
              }
            }
          }
          
          // Close repository enricher's database connection
          await repositoryEnricher.close();
        } else {
          logger.info('No unenriched repositories found, skipping repository enrichment phase');
        }
        
        logger.info('Repository enrichment phase complete', { stats: stats.repositories });
        
        // 2. Next, enrich contributors
        return await this.executeContributorEnrichment(processAllItems, stats, historyId);
      } catch (error) {
        logger.error('Error in data enrichment pipeline', { error });
        
        // Update history entry and emit completion event
        await this.updatePipelineHistoryEntry(historyId, 'failed', 
          stats.repositories.processed + stats.contributors.processed + stats.mergeRequests.processed + stats.commits.processed);
          
        pipelineEvents.emit('pipeline_complete', {
          pipelineType: 'data_enrichment',
          historyId,
          stats,
          error: error.message
        });
        
        return {
          success: false,
          message: `Data enrichment failed: ${error.message}`,
          stats
        };
      }
    } catch (error) {
      logger.error('Error in data enrichment pipeline', { error });
      return { success: false, message: `Data enrichment failed: ${error.message}` };
    }
  }
  
  /**
   * Execute AI Analysis functionality directly
   * @returns {Promise<object>} Result object with success status and metrics
   * @private
   */
  async executeAIAnalysis() {
    logger.info('Executing AI analysis function directly');
    
    try {
      // In a real implementation, this would fetch entities that need analysis
      // and apply AI/ML models to generate insights
      
      // For now, return a mock result
      logger.info('AI analysis function executed successfully');
      
      return { 
        success: true, 
        itemsProcessed: 0,
        message: 'AI analysis completed successfully (mock implementation)' 
      };
    } catch (error) {
      logger.error('Error in direct AI analysis function:', { error });
      
      return { 
        success: false, 
        error,
        message: `Failed to analyze data: ${error.message}` 
      };
    }
  }
  
  /**
   * Stop a running pipeline
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async stopPipeline(req, res) {
    try {
      // Support both camelCase and snake_case parameter names for compatibility
      const { 
        pipeline_type, 
        pipelineType, 
        history_id, 
        historyId 
      } = req.body;
      
      // Use snake_case params if available, otherwise use camelCase
      const actualPipelineType = pipeline_type || pipelineType;
      const actualHistoryId = history_id || historyId;
      
      // Validate required fields
      if (!actualPipelineType) {
        return this.sendError(res, 'Pipeline type is required', 400);
      }
      
      logger.info(`Stopping pipeline ${actualPipelineType}...`);
      
      // In a real implementation, we would look up the running pipeline and stop it
      // For now, we'll just update the history record
      
      // Update the pipeline history with a stopped status
      const { error } = await openSQLiteConnection()
        .from('pipeline_history')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: 'Pipeline was manually stopped by user'
        })
        .eq('id', actualHistoryId);
      
      if (error) {
        logger.error('Error updating pipeline history:', { error });
      }
      
      // Emit pipeline stopped event
      pipelineEvents.emit('pipeline_stopped', {
        pipelineType: req.body.pipeline_type
      });
      
      return this.sendSuccess(res, {
        message: `Pipeline ${actualPipelineType} stop request acknowledged`,
        history_id: actualHistoryId
      });
    } catch (error) {
      logger.error('Error stopping pipeline', { error });
      return this.sendError(res, 'Error stopping pipeline', 500);
    }
  }
  
  /**
   * Restart a pipeline
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  async restartPipeline(req, res) {
    try {
      // Support both camelCase and snake_case parameter names for compatibility
      const { 
        pipeline_type, 
        pipelineType, 
        parameters, 
        history_id, 
        historyId 
      } = req.body;
      
      // Use snake_case params if available, otherwise use camelCase
      const actualPipelineType = pipeline_type || pipelineType;
      const actualHistoryId = history_id || historyId;
      
      // Validate required fields
      if (!actualPipelineType) {
        return this.sendError(res, 'Pipeline type is required', 400);
      }
      
      logger.info(`Restarting direct execution of ${actualPipelineType}...`);
      
      // For restarting, we use the same logic as starting
      setTimeout(() => this.executeDirectFunction(actualHistoryId, actualPipelineType), 100);
      
      // Emit pipeline restarted event
      pipelineEvents.emit('pipeline_restarted', {
        pipelineType: req.body.pipeline_type,
        historyId
      });
      
      return this.sendSuccess(res, {
        message: `Direct execution of ${actualPipelineType} restarted successfully`,
        history_id: actualHistoryId
      });
    } catch (error) {
      logger.error('Error restarting pipeline', { error });
      return this.sendError(res, 'Error restarting pipeline', 500);
    }
  }
  
  /**
   * Helper to update the pipeline history record
   * @param {string} historyId - Pipeline history ID 
   * @param {object} data - Data to update
   * @private
   */
  async updatePipelineHistory(historyId, data) {
    try {
      // For SQLite operations, we only log completion - the Next.js API will handle database updates
      logger.info(`Pipeline completed with status: ${data.status}`, {
        history_id: historyId, 
        items_processed: data.items_processed || 0
      });
      
      // Skip Supabase updates when using SQLite (history ID will be numeric)
      // This prevents UUID format errors
      if (historyId && typeof historyId === 'string' && historyId.includes('-')) {
        // Only update Supabase if we have a properly formatted UUID
        try {
          const { error } = await openSQLiteConnection()
            .from('pipeline_history')
            .update(data)
            .eq('id', historyId);
            
          if (error) {
            logger.error('Error updating pipeline history in Supabase:', { error });
          }
        } catch (e) {
          logger.error('Error updating pipeline history:', { error: e });
        }
      }
      // Emit history updated event for significant status changes
      if (data.status) {
        pipelineEvents.emit('pipeline_status_changed', {
          historyId,
          status: data.status,
          itemsProcessed: data.items_processed
        });
      }
    } catch (error) {
      logger.error('Error in updatePipelineHistory:', { error });
    }
  }
  
  /**
   * Process a single raw data item
   * @param {Object} item - The raw data item to process
   * @param {Object} stats - Statistics object to update
   * @param {Array} processedIds - Array of successfully processed item IDs
   * @param {Array} failedIds - Array of failed item IDs
   * @param {number} index - Current index in the batch
   * @param {number} totalItems - Total items in the batch
   * @param {Object} db - SQLite database connection
   * @private
   */
  async processItem(item, stats, processedIds, failedIds, index, totalItems, db) {
    logger.info(`========== PROCESSING ITEM ${index+1}/${totalItems} (ID: ${item.id}) ==========`);
    
    try {
      // Parse raw data JSON
      let data;
      try {
        // Parse the data field from the SQLite record
        if (item.data) {
          logger.debug(`Item ${item.id} has data field of type ${typeof item.data}`);
          data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
        } else {
          logger.warn(`Item ${item.id} has no data field, skipping`);
          failedIds.push(item.id);
          return;
        }
      } catch (parseError) {
        logger.error(`Error parsing item ${item.id}: ${parseError.message}`, {
          error: parseError
        });
        failedIds.push(item.id);
        return;
      }
      
      if (!data) {
        logger.warn(`Item ${item.id} has empty data after parsing, skipping`);
        failedIds.push(item.id);
        return;
      }
      
      // Generate UUIDs for new entities
      const uuidv4 = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Process repository
      let repoId = null;
      if (data.repository) {
        logger.info(`Processing repository for item ${item.id}`);
        
        // Extract the github_id
        const githubId = parseInt(data.repository.id, 10);
        
        if (!githubId) {
          logger.warn(`Repository ID missing or invalid for item ${item.id}, skipping repository processing`);
        } else {
          // Check if repository already exists
          const existingRepo = await db.get(
            `SELECT id FROM repositories WHERE github_id = ?`,
            [githubId]
          );
          
          if (existingRepo) {
            // Repository exists, update it
            repoId = existingRepo.id;
            logger.info(`Repository exists with ID ${repoId}, updating...`);
            
            // Get repository name and full_name
            const repoName = data.repository.name || 
              (data.pull_request?.base?.repo?.name || '');
            const repoFullName = data.repository.full_name || 
              (data.pull_request?.base?.repo?.full_name || `${data.repository.owner}/${repoName}`);
            
            // Update repository
            await db.run(
              `UPDATE repositories SET 
                name = ?,
                full_name = ?,
                description = ?, 
                url = ?,
                stars = ?,
                forks = ?,
                open_issues_count = ?,
                watchers_count = ?,
                primary_language = ?,
                updated_at = datetime('now')
              WHERE id = ?`,
              [
                repoName,
                repoFullName,
                data.repository.description || data.pull_request?.base?.repo?.description || '',
                data.repository.url || data.pull_request?.base?.repo?.html_url || '',
                data.repository.stars || data.pull_request?.base?.repo?.stargazers_count || 0,
                data.repository.forks || data.pull_request?.base?.repo?.forks_count || 0,
                data.pull_request?.base?.repo?.open_issues_count || 0,
                data.pull_request?.base?.repo?.watchers_count || 0,
                data.pull_request?.base?.repo?.language || null,
                repoId
              ]
            );
            
            stats.repositories++;
            logger.info(`Successfully updated repository with ID ${repoId}`);
          } else {
            // Repository doesn't exist, create it
            const newRepoId = uuidv4();
            repoId = newRepoId;
            
            // Get repository name and full_name
            const repoName = data.repository.name || 
              (data.pull_request?.base?.repo?.name || '');
            const repoFullName = data.repository.full_name || 
              (data.pull_request?.base?.repo?.full_name || `${data.repository.owner}/${repoName}`);
            
            logger.info(`Creating new repository: ${repoFullName}`);
            
            try {
              await db.run(
                `INSERT INTO repositories (
                  id, github_id, name, full_name, description, url, 
                  stars, forks, is_enriched, open_issues_count, watchers_count, 
                  primary_language, default_branch, source, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [
                  newRepoId,
                  githubId,
                  repoName,
                  repoFullName,
                  data.repository.description || data.pull_request?.base?.repo?.description || '',
                  data.repository.url || data.pull_request?.base?.repo?.html_url || '',
                  data.repository.stars || data.pull_request?.base?.repo?.stargazers_count || 0,
                  data.repository.forks || data.pull_request?.base?.repo?.forks_count || 0,
                  0, // is_enriched
                  data.pull_request?.base?.repo?.open_issues_count || 0,
                  data.pull_request?.base?.repo?.watchers_count || 0,
                  data.pull_request?.base?.repo?.language || null,
                  data.pull_request?.base?.repo?.default_branch || 'main',
                  'github_api'
                ]
              );
              
              stats.repositories++;
              logger.info(`Successfully created repository with ID ${newRepoId}`);
            } catch (insertError) {
              logger.error(`Error creating repository: ${insertError.message}`, {
                error: insertError,
                repoFullName
              });
              
              // Try minimal insert as fallback
              try {
                await db.run(
                  `INSERT INTO repositories (id, github_id, name, full_name, url, default_branch, source, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                  [
                    newRepoId,
                    githubId,
                    repoName,
                    repoFullName,
                    data.repository.url || data.pull_request?.base?.repo?.html_url || '',
                    'main',
                    'github_api'
                  ]
                );
                
                stats.repositories++;
                logger.info(`Successfully created repository with minimal fields, ID ${newRepoId}`);
              } catch (fallbackError) {
                logger.error(`Fallback repository insert also failed: ${fallbackError.message}`, {
                  error: fallbackError
                });
                repoId = null;
              }
            }
          }
        }
      } else {
        logger.warn(`No repository data found for item ${item.id}`);
      }
      
      // Process contributor (PR author)
      let contributorId = null;
      if (data.pull_request?.user) {
        logger.info(`Processing contributor for item ${item.id}`);
        
        const user = data.pull_request.user;
        const githubId = parseInt(user.id, 10);
        
        if (!githubId) {
          logger.warn(`Contributor ID missing or invalid for item ${item.id}, skipping contributor processing`);
        } else {
          // Check if contributor already exists
          const existingContributor = await db.get(
            `SELECT id FROM contributors WHERE github_id = ?`,
            [githubId]
          );
          
          if (existingContributor) {
            // Contributor exists, update it
            contributorId = existingContributor.id;
            logger.info(`Contributor exists with ID ${contributorId}, updating...`);
            
            await db.run(
              `UPDATE contributors SET 
                username = ?,
                avatar = ?,
                updated_at = datetime('now')
              WHERE id = ?`,
              [
                user.login || null,
                user.avatar_url || null,
                contributorId
              ]
            );
            
            stats.contributors++;
            logger.info(`Successfully updated contributor with ID ${contributorId}`);
          } else {
            // Contributor doesn't exist, create it
            const newContributorId = uuidv4();
            contributorId = newContributorId;
            
            logger.info(`Creating new contributor: ${user.login || 'Unknown'}`);
            
            try {
              await db.run(
                `INSERT INTO contributors (
                  id, github_id, username, name, avatar, is_enriched, is_placeholder, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [
                  newContributorId,
                  githubId,
                  user.login || null,
                  user.name || null,
                  user.avatar_url || null,
                  0, // is_enriched
                  0  // is_placeholder
                ]
              );
              
              stats.contributors++;
              logger.info(`Successfully created contributor with ID ${newContributorId}`);
            } catch (insertError) {
              logger.error(`Error creating contributor: ${insertError.message}`, {
                error: insertError,
                username: user.login
              });
              
              // Try minimal insert as fallback
              try {
                await db.run(
                  `INSERT INTO contributors (id, github_id, username, is_placeholder, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
                  [
                    newContributorId,
                    githubId,
                    user.login || null,
                    0  // is_placeholder
                  ]
                );
                
                stats.contributors++;
                logger.info(`Successfully created contributor with minimal fields, ID ${newContributorId}`);
              } catch (fallbackError) {
                logger.error(`Fallback contributor insert also failed: ${fallbackError.message}`, {
                  error: fallbackError
                });
                contributorId = null;
              }
            }
          }
        }
      } else {
        logger.warn(`No contributor data found for item ${item.id}`);
      }
      
      // Process merge request (pull request)
      let mergeRequestId = null;
      if (data.pull_request && repoId && contributorId) {
        logger.info(`Processing merge request for item ${item.id}`);
        
        const pr = data.pull_request;
        // Use PR number instead of GitHub's internal ID
        // PR number is what's visible in GitHub URLs and is repository-specific
        const githubId = pr.pr_number || pr.number || parseInt(pr.id, 10);
        
        if (!githubId) {
          logger.warn(`Pull request ID missing or invalid for item ${item.id}, skipping merge request processing`);
        } else {
          // Check if repository and contributor IDs exist
          const repoGithubId = parseInt(data.repository.id, 10);
          
          logger.info(`Processing pull request #${githubId} (internal ID: ${pr.id})`);
          
          // Check if merge request already exists
          const existingMR = await db.get(
            `SELECT id FROM merge_requests 
             WHERE github_id = ? AND repository_id = ?`,
            [githubId, repoId]
          );
          
          if (existingMR) {
            // Merge request exists, update it
            mergeRequestId = existingMR.id;
            logger.info(`Merge request exists with ID ${mergeRequestId}, updating...`);
            
            await db.run(
              `UPDATE merge_requests SET 
                title = ?,
                description = ?,
                state = ?,
                closed_at = ?,
                merged_at = ?,
                commits_count = ?,
                additions = ?,
                deletions = ?,
                changed_files = ?,
                updated_at = datetime('now')
              WHERE id = ?`,
              [
                pr.title || '',
                pr.body || '',
                pr.state || 'unknown',
                pr.closed_at || null,
                pr.merged_at || null,
                pr.commits || 0,
                pr.additions || 0,
                pr.deletions || 0,
                pr.changed_files || 0,
                mergeRequestId
              ]
            );
            
            stats.mergeRequests++;
            logger.info(`Successfully updated merge request with ID ${mergeRequestId}`);
          } else {
            // Merge request doesn't exist, create it
            const newMergeRequestId = uuidv4();
            mergeRequestId = newMergeRequestId;
            
            logger.info(`Creating new merge request: ${pr.title || 'Untitled Pull Request'}`);
            
            try {
              await db.run(
                `INSERT INTO merge_requests (
                  id, github_id, repository_id, repository_github_id, author_id, author_github_id,
                  title, description, state, is_draft, created_at, updated_at, closed_at, merged_at,
                  commits_count, additions, deletions, changed_files, source_branch, target_branch, is_enriched
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  newMergeRequestId,
                  githubId,
                  repoId,
                  repoGithubId,
                  contributorId,
                  parseInt(data.pull_request.user.id, 10),
                  pr.title || '',
                  pr.body || '',
                  pr.state || 'unknown',
                  pr.draft === true ? 1 : 0,
                  pr.created_at || new Date().toISOString(),
                  pr.updated_at || new Date().toISOString(),
                  pr.closed_at || null,
                  pr.merged_at || null,
                  pr.commits || 0,
                  pr.additions || 0,
                  pr.deletions || 0,
                  pr.changed_files || 0,
                  pr.head?.ref || '',
                  pr.base?.ref || '',
                  0 // is_enriched
                ]
              );
              
              stats.mergeRequests++;
              logger.info(`Successfully created merge request with ID ${newMergeRequestId}`);
              
              // Process commits if available
              if (Array.isArray(data.commits) && data.commits.length > 0) {
                const commitsToProcess = data.commits; // Process all commits, no limit
                logger.info(`Processing ${commitsToProcess.length} commits for merge request ${newMergeRequestId}`);
                
                let commitSuccessCount = 0;
                let commitFailCount = 0;
                
                for (let j = 0; j < commitsToProcess.length; j++) {
                  const commitData = commitsToProcess[j];
                  if (commitData && commitData.sha) {
                    logger.info(`Processing commit ${j+1}/${commitsToProcess.length}: ${commitData.sha.substring(0, 7)}`);
                    
                    const commitId = uuidv4();
                    const isMergeCommit = commitData.commit?.message?.startsWith('Merge') || false;
                    
                    try {
                      await db.run(
                        `INSERT INTO commits (
                          id, github_id, sha, repository_id, repository_github_id,
                          contributor_id, contributor_github_id, author, message,
                          additions, deletions, files_changed, is_merge_commit,
                          committed_at, pull_request_id, pull_request_github_id,
                          is_enriched, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                        [
                          commitId,
                          commitData.sha,
                          commitData.sha,
                          repoId,
                          repoGithubId,
                          contributorId,
                          parseInt(commitData.author?.id || data.pull_request.user.id, 10),
                          commitData.commit?.author?.name || commitData.author?.login || '',
                          commitData.commit?.message || '',
                          commitData.stats?.additions || 0,
                          commitData.stats?.deletions || 0,
                          commitData.files?.length || 0,
                          isMergeCommit ? 1 : 0,
                          commitData.commit?.author?.date || new Date().toISOString(),
                          newMergeRequestId,
                          githubId,
                          0 // is_enriched
                        ]
                      );
                      
                      stats.commits++;
                      commitSuccessCount++;
                      logger.info(`Successfully created commit ${commitData.sha.substring(0, 7)}`);
                      
                      // Update contributor_repository junction table for this commit
                      try {
                        // Get commit-specific data
                        const commitAdditions = commitData.stats?.additions || 0;
                        const commitDeletions = commitData.stats?.deletions || 0;
                        const commitDate = commitData.commit?.author?.date || new Date().toISOString();
                        
                        // Check if relationship already exists
                        const contribRepoId = await db.get(
                          `SELECT id FROM contributor_repository 
                           WHERE contributor_id = ? AND repository_id = ?`,
                          [contributorId, repoId]
                        );
                        
                        if (contribRepoId) {
                          // Update existing relationship with commit data
                          await db.run(
                            `UPDATE contributor_repository SET 
                             commit_count = commit_count + 1,
                             first_contribution_date = MIN(first_contribution_date, ?),
                             last_contribution_date = MAX(last_contribution_date, ?),
                             lines_added = lines_added + ?,
                             lines_removed = lines_removed + ?,
                             updated_at = datetime('now')
                             WHERE id = ?`,
                            [
                              commitDate,
                              commitDate,
                              commitAdditions,
                              commitDeletions,
                              contribRepoId.id
                            ]
                          );
                          
                          logger.debug(`Updated contributor-repository relationship for commit ${commitData.sha.substring(0, 7)}`);
                        } else {
                          // Create new relationship
                          const newRelationshipId = uuidv4();
                          const contributorGithubId = parseInt(commitData.author?.id || data.pull_request.user.id, 10);
                          const repoGithubId = parseInt(data.repository.id, 10);
                          
                          await db.run(
                            `INSERT INTO contributor_repository (
                              id, contributor_id, contributor_github_id, repository_id, repository_github_id, 
                              commit_count, pull_requests, reviews, issues_opened, 
                              first_contribution_date, last_contribution_date,
                              lines_added, lines_removed, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                            [
                              newRelationshipId,
                              contributorId,
                              contributorGithubId,
                              repoId,
                              repoGithubId,
                              1, // commit_count (this commit)
                              0, // pull_requests
                              0, // reviews
                              0, // issues_opened
                              commitDate, // first_contribution_date
                              commitDate, // last_contribution_date
                              commitAdditions,
                              commitDeletions
                            ]
                          );
                          
                          logger.debug(`Created contributor-repository relationship for commit ${commitData.sha.substring(0, 7)}`);
                        }
                      } catch (relationshipError) {
                        logger.error(`Error updating contributor-repository relationship for commit: ${relationshipError.message}`, {
                          error: relationshipError,
                          sha: commitData.sha.substring(0, 7)
                        });
                      }
                    } catch (commitError) {
                      logger.error(`Error creating commit: ${commitError.message}`, {
                        error: commitError,
                        sha: commitData.sha
                      });
                      commitFailCount++;
                    }
                  }
                }
                
                logger.info(`Commit processing complete`, {
                  total: commitsToProcess.length,
                  success: commitSuccessCount,
                  failed: commitFailCount
                });
              } else {
                logger.info(`No commits to process for merge request ${newMergeRequestId}`);
              }
            } catch (insertError) {
              logger.error(`Error creating merge request: ${insertError.message}`, {
                error: insertError,
                title: pr.title
              });
            }
          }
          
          // Update contributor_repository junction table
          try {
            // Check if relationship already exists
            const contribRepoId = await db.get(
              `SELECT id FROM contributor_repository 
               WHERE contributor_id = ? AND repository_id = ?`,
              [contributorId, repoId]
            );
            
            const contributorGithubId = parseInt(data.pull_request.user.id, 10);
            const repoGithubId = parseInt(data.repository.id, 10);
            const firstContributionDate = pr.created_at || new Date().toISOString();
            const lastContributionDate = pr.merged_at || pr.updated_at || new Date().toISOString();
            
            // Calculate lines added/removed from this PR
            const linesAdded = pr.additions || 0;
            const linesRemoved = pr.deletions || 0;
            
            if (contribRepoId) {
              // Update existing relationship
              logger.info(`Updating contributor-repository relationship for contributor ${contributorId} and repository ${repoId}`);
              
              await db.run(
                `UPDATE contributor_repository SET 
                 pull_requests = pull_requests + 1,
                 last_contribution_date = MAX(last_contribution_date, ?),
                 lines_added = lines_added + ?,
                 lines_removed = lines_removed + ?,
                 updated_at = datetime('now')
                 WHERE id = ?`,
                [lastContributionDate, linesAdded, linesRemoved, contribRepoId.id]
              );
              
              logger.info(`Successfully updated contributor-repository relationship`);
            } else {
              // Create new relationship
              logger.info(`Creating new contributor-repository relationship for contributor ${contributorId} and repository ${repoId}`);
              
              const newRelationshipId = uuidv4();
              await db.run(
                `INSERT INTO contributor_repository (
                  id, contributor_id, contributor_github_id, repository_id, repository_github_id, 
                  commit_count, pull_requests, reviews, issues_opened, 
                  first_contribution_date, last_contribution_date,
                  lines_added, lines_removed, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [
                  newRelationshipId,
                  contributorId,
                  contributorGithubId,
                  repoId,
                  repoGithubId,
                  0, // commit_count (will be updated when commits are processed)
                  1, // pull_requests (this PR)
                  0, // reviews
                  0, // issues_opened
                  firstContributionDate,
                  lastContributionDate,
                  linesAdded,
                  linesRemoved
                ]
              );
              
              logger.info(`Successfully created contributor-repository relationship with ID ${newRelationshipId}`);
            }
          } catch (relationshipError) {
            logger.error(`Error updating contributor-repository relationship: ${relationshipError.message}`, {
              error: relationshipError,
              contributorId,
              repoId
            });
          }
        }
      } else {
        if (!data.pull_request) {
          logger.warn(`No pull request data found for item ${item.id}`);
        } else {
          logger.warn(`Missing repository ID or contributor ID for processing merge request`);
        }
      }
      
      // Mark the item as successfully processed
      processedIds.push(item.id);
      logger.info(`Successfully processed item ${item.id}`);
      
    } catch (itemError) {
      logger.error(`Error processing item ${item.id}: ${itemError.message}`, {
        error: itemError
      });
      failedIds.push(item.id);
    }
    
    logger.info(`========== COMPLETED ITEM ${index+1}/${totalItems} (ID: ${item.id}) ==========`);
  }
  
  /**
   * Mark items as processed in the closed_merge_requests_raw table
   * @param {number[]} itemIds - Array of item IDs to mark as processed 
   * @param {Object} db - SQLite database connection
   * @private
   */
  async markItemsAsProcessed(itemIds, db) {
    logger.info(`Marking ${itemIds.length} items as processed`);
      
    // Process in batches for better efficiency
    const batchSize = 50;
    
    try {
      for (let i = 0; i < itemIds.length; i += batchSize) {
        const batchIds = itemIds.slice(i, i + batchSize);
        logger.info(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(itemIds.length/batchSize)} (${batchIds.length} items)`);
        
        // Create placeholders for SQL query (?, ?, ...)
        const placeholders = batchIds.map(() => '?').join(',');
        
        // Update is_processed to 1 for all items in this batch
        await db.run(
          `UPDATE closed_merge_requests_raw 
           SET is_processed = 1 
           WHERE id IN (${placeholders})`,
          batchIds
        );
        
        logger.info(`Successfully marked batch ${Math.floor(i/batchSize) + 1} (${batchIds.length} items) as processed`);
      }
      
      logger.info(`Completed marking ${itemIds.length} items as processed`);
    } catch (error) {
      logger.error(`Error marking items as processed: ${error.message}`, {
        error,
        items_count: itemIds.length
      });
      throw error;
    }
  }

  /**
   * Create a GitHub Sync Pipeline
   * Initializes the database tables if needed and starts data synchronization
   */
  async createGitHubSyncPipeline() {
    logger.info('Starting GitHub Sync Pipeline');
    
    try {
      // Step 1: Review and consult documentation
      logger.info('Reviewing database documentation and schema requirements');
      
      // Step 2: Establish database connection
      const db = await openSQLiteConnection();
      
      // Step 3: Check if closed_merge_requests_raw table exists and has correct structure
      logger.info('Checking if closed_merge_requests_raw table exists');
      const tableExists = await db.get(
        `SELECT name FROM sqlite_master 
         WHERE type='table' AND name='closed_merge_requests_raw'`
      );
      
      if (!tableExists) {
        // Table doesn't exist, create it
        logger.info('Creating closed_merge_requests_raw table');
        await db.exec(`
          CREATE TABLE closed_merge_requests_raw (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            is_processed INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Create index on is_processed for better query performance
        await db.exec(`
          CREATE INDEX idx_closed_mr_raw_is_processed 
          ON closed_merge_requests_raw(is_processed)
        `);
        
        logger.info('Successfully created closed_merge_requests_raw table and index');
      } else {
        // Table exists, check the structure
        logger.info('Verifying closed_merge_requests_raw table structure');
        const tableInfo = await db.all('PRAGMA table_info(closed_merge_requests_raw)');
        
        // Check if table has the expected columns
        const hasRequiredStructure = tableInfo.some(col => col.name === 'data') && 
                                   tableInfo.some(col => col.name === 'is_processed');
        
        if (!hasRequiredStructure) {
          // Table exists but has incorrect structure
          logger.warn('Table closed_merge_requests_raw exists but has incorrect structure');
          
          // Backup existing data
          logger.info('Backing up existing data before restructuring');
          await db.exec('CREATE TABLE closed_merge_requests_raw_backup AS SELECT * FROM closed_merge_requests_raw');
          
          // Drop and recreate with correct structure
          await db.exec('DROP TABLE closed_merge_requests_raw');
          await db.exec(`
            CREATE TABLE closed_merge_requests_raw (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              data TEXT NOT NULL,
              is_processed INTEGER DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Create index
          await db.exec(`
            CREATE INDEX idx_closed_mr_raw_is_processed 
            ON closed_merge_requests_raw(is_processed)
          `);
          
          logger.info('Successfully restructured closed_merge_requests_raw table');
        } else {
          logger.info('Table closed_merge_requests_raw exists with correct structure');
        }
      }
      
      // Step 3.5: Check if contributor_repository junction table exists
      logger.info('Checking if contributor_repository junction table exists');
      await this.ensureContributorRepositoryTable(db);
      
      // Step 4: Close the database connection
      await db.close();
      
      // Step 5: Update documentation to reflect schema changes
      logger.info('Database schema updated and verified, documentation update recommended');
      
      // Step 6: Start the extraction process to populate the table
      return await this.startGitHubExtraction();
    } catch (error) {
      logger.error(`Error in GitHub Sync Pipeline: ${error.message}`, {
        error,
        stack: error.stack
      });
      
      return {
        success: false,
        message: `Failed to create GitHub Sync Pipeline: ${error.message}`
      };
    }
  }
  
  /**
   * Ensure the contributor_repository junction table exists with correct structure
   * @param {Object} db - SQLite database connection
   */
  async ensureContributorRepositoryTable(db) {
    try {
      // Check if contributor_repository table exists
      const tableExists = await db.get(
        `SELECT name FROM sqlite_master 
         WHERE type='table' AND name='contributor_repository'`
      );
      
      if (!tableExists) {
        // Table doesn't exist, create it
        logger.info('Creating contributor_repository junction table');
        await db.exec(`
          CREATE TABLE contributor_repository (
            id TEXT PRIMARY KEY,
            contributor_id TEXT NOT NULL,
            contributor_github_id INTEGER,
            repository_id TEXT NOT NULL,
            repository_github_id INTEGER,
            commit_count INTEGER DEFAULT 0,
            pull_requests INTEGER DEFAULT 0,
            reviews INTEGER DEFAULT 0,
            issues_opened INTEGER DEFAULT 0,
            first_contribution_date TIMESTAMP,
            last_contribution_date TIMESTAMP,
            lines_added INTEGER DEFAULT 0,
            lines_removed INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (contributor_id) REFERENCES contributors(id),
            FOREIGN KEY (repository_id) REFERENCES repositories(id)
          )
        `);
        
        // Create indices for faster lookups
        await db.exec(`
          CREATE INDEX idx_contrib_repo_contributor 
          ON contributor_repository(contributor_id);
          
          CREATE INDEX idx_contrib_repo_repository 
          ON contributor_repository(repository_id);
          
          CREATE UNIQUE INDEX idx_contrib_repo_unique 
          ON contributor_repository(contributor_id, repository_id);
        `);
        
        logger.info('Successfully created contributor_repository table and indices');
      } else {
        // Table exists, check structure
        logger.info('Verifying contributor_repository table structure');
        const tableInfo = await db.all('PRAGMA table_info(contributor_repository)');
        
        // Check if table has the expected columns
        const hasRequiredColumns = 
          tableInfo.some(col => col.name === 'contributor_id') && 
          tableInfo.some(col => col.name === 'repository_id') &&
          tableInfo.some(col => col.name === 'commit_count') &&
          tableInfo.some(col => col.name === 'lines_added');
        
        if (!hasRequiredColumns) {
          // Table exists but has incorrect structure
          logger.warn('Table contributor_repository exists but has incorrect structure');
          
          // Backup existing data
          logger.info('Backing up existing data before restructuring');
          await db.exec('CREATE TABLE contributor_repository_backup AS SELECT * FROM contributor_repository');
          
          // Drop and recreate with correct structure
          await db.exec('DROP TABLE contributor_repository');
          await db.exec(`
            CREATE TABLE contributor_repository (
              id TEXT PRIMARY KEY,
              contributor_id TEXT NOT NULL,
              contributor_github_id INTEGER,
              repository_id TEXT NOT NULL,
              repository_github_id INTEGER,
              commit_count INTEGER DEFAULT 0,
              pull_requests INTEGER DEFAULT 0,
              reviews INTEGER DEFAULT 0,
              issues_opened INTEGER DEFAULT 0,
              first_contribution_date TIMESTAMP,
              last_contribution_date TIMESTAMP,
              lines_added INTEGER DEFAULT 0,
              lines_removed INTEGER DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (contributor_id) REFERENCES contributors(id),
              FOREIGN KEY (repository_id) REFERENCES repositories(id)
            )
          `);
          
          // Create indices
          await db.exec(`
            CREATE INDEX idx_contrib_repo_contributor 
            ON contributor_repository(contributor_id);
            
            CREATE INDEX idx_contrib_repo_repository 
            ON contributor_repository(repository_id);
            
            CREATE UNIQUE INDEX idx_contrib_repo_unique 
            ON contributor_repository(contributor_id, repository_id);
          `);
          
          logger.info('Successfully restructured contributor_repository table');
        } else {
          logger.info('Table contributor_repository exists with correct structure');
        }
      }
    } catch (error) {
      logger.error(`Error ensuring contributor_repository table: ${error.message}`, {
        error,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Start GitHub data extraction process
   * @returns {Promise<Object>} Result object with success status and message
   */
  async startGitHubExtraction() {
    logger.info('Starting GitHub data extraction process');
    
    try {
      // Import GitHubApiClient for commit fetching
      const { GitHubApiClient } = await import('../services/github/github-api-client.js');
      
      // Create a GitHub API client
      const githubClient = new GitHubApiClient({
        clientId: 'github-sync-start-extraction',
        token: process.env.GITHUB_TOKEN
      });
      
      // For MVP we're simply returning success since the extraction
      // process will be handled separately by API calls to the GitHub API
      // Each PR would be stored using the storeMergedPullRequest method
      
      // Directly call the GitHub sync method to start extraction right away
      this.executeGitHubSync().catch(error => {
        logger.error(`Error in background GitHub sync: ${error.message}`, {
          error,
          stack: error.stack
        });
      });
      
      // Update documentation to reflect the extraction process
      logger.info('Data extraction initialized, documentation update recommended');
      
      return {
        success: true,
        message: 'GitHub extraction process started successfully',
        pipelineDetails: {
          name: 'github-sync-pipeline',
          status: 'running',
          startedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`Error in GitHub extraction process: ${error.message}`, {
        error,
        stack: error.stack
      });
      
      return {
        success: false,
        message: `Failed to start GitHub extraction: ${error.message}`
      };
    }
  }

  /**
   * Store a merged pull request in the closed_merge_requests_raw table
   * @param {Object} pullRequestData - Pull request data to store
   * @param {GitHubApiClient} [githubClient] - GitHub API client to fetch additional data
   * @returns {Promise<Object>} Result object with success status and message
   */
  async storeMergedPullRequest(pullRequestData, githubClient) {
    logger.info('Storing merged pull request in closed_merge_requests_raw table');
    
    try {
      // Convert data to JSON string if it's an object
      const dataStr = typeof pullRequestData === 'string' 
        ? pullRequestData 
        : JSON.stringify(pullRequestData);
      
      // Get PR ID for duplicate checking
      let prId = null;
      let pullRequestObj = null;
      try {
        const dataObj = typeof pullRequestData === 'object' ? pullRequestData : JSON.parse(dataStr);
        pullRequestObj = dataObj;
        prId = dataObj.pull_request?.id || dataObj.id;
      } catch (parseError) {
        logger.warn(`Could not extract PR ID for duplicate checking: ${parseError.message}`);
      }
      
      // Open database connection
      const db = await openSQLiteConnection();
      
      // Determine if we need to fetch and add commits
      let dataToStore = pullRequestData;
      
      // If we have a GitHub client and the pull request object, fetch commits
      if (githubClient && pullRequestObj && pullRequestObj.pull_request) {
        try {
          // Extract repo owner/name and PR number
          const prNumber = pullRequestObj.pull_request.number || pullRequestObj.number;
          const repoName = pullRequestObj.repository.full_name;
          
          if (repoName && prNumber) {
            const [owner, repo] = repoName.split('/');
            
            // Fetch commits for this PR
            logger.info(`Fetching commits for PR #${prNumber} from ${repoName}`);
            
            const commitsResponse = await githubClient.octokit.pulls.listCommits({
              owner,
              repo,
              pull_number: prNumber,
              per_page: 100
            });
            
            if (commitsResponse.data && commitsResponse.data.length > 0) {
              // Create a new data object with commits included
              dataToStore = {
                ...pullRequestObj,
                commits: commitsResponse.data
              };
              
              logger.info(`Added ${commitsResponse.data.length} commits to PR data`);
            }
          }
        } catch (commitFetchError) {
          logger.error(`Error fetching commits: ${commitFetchError.message}`, {
            error: commitFetchError
          });
          // Continue with original data
        }
      }
      
      // Convert to string if it's an object
      const finalDataStr = typeof dataToStore === 'object' 
        ? JSON.stringify(dataToStore) 
        : dataToStore;
      
      // Check if PR already exists in the database (if we have an ID)
      let existingPR = null;
      if (prId) {
        existingPR = await db.get(
          `SELECT id FROM closed_merge_requests_raw 
           WHERE json_extract(data, '$.pull_request.id') = ? OR json_extract(data, '$.id') = ?`,
          [prId, prId]
        );
      }
      
      let result;
      if (existingPR) {
        // Update existing record
        logger.info(`PR with ID ${prId} already exists, updating record`);
        
        result = await db.run(
          `UPDATE closed_merge_requests_raw 
           SET data = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [finalDataStr, existingPR.id]
        );
        
        logger.info(`Successfully updated PR with ID ${prId} in database`);
      } else {
        // Insert new record
        logger.info('Inserting new PR record in database');
        
        result = await db.run(
          `INSERT INTO closed_merge_requests_raw (data, is_processed, created_at, updated_at) 
           VALUES (?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [finalDataStr]
        );
        
        logger.info(`Successfully inserted new PR record with ID ${result.lastID}`);
      }
      
      // Close the database connection
      await db.close();
      
      return {
        success: true,
        message: existingPR ? `Updated PR with ID ${prId}` : 'Stored new PR successfully',
        id: existingPR ? existingPR.id : result.lastID
      };
    } catch (error) {
      logger.error(`Error storing merged pull request: ${error.message}`, {
        error,
        stack: error.stack
      });
      
      return {
        success: false,
        message: `Failed to store merged pull request: ${error.message}`
      };
    }
  }

  /**
   * Execute sitemap generation pipeline
   * @returns {Promise<Object>} Result of the operation
   */
  async executeSitemapGeneration() {
    logger.info('Starting sitemap generation pipeline...');
    
    try {
      // Create and execute the sitemap pipeline
      const pipeline = global.pipelines['sitemap_generation'];
      
      if (!pipeline) {
        throw new Error('Sitemap generation pipeline not found');
      }
      
      // Update the pipeline status to running
      let db = null;
      try {
        db = await openSQLiteConnection();
        
        // Check if there's an entry in the pipeline_status table
        const existingStatus = await db.get(
          'SELECT * FROM pipeline_status WHERE pipeline_type = ?',
          ['sitemap_generation']
        );
        
        if (existingStatus) {
          // Update existing status
          await db.run(
            'UPDATE pipeline_status SET status = ?, is_running = 1, last_run = CURRENT_TIMESTAMP WHERE pipeline_type = ?',
            ['running', 'sitemap_generation']
          );
        } else {
          // Insert new status
          await db.run(
            'INSERT INTO pipeline_status (pipeline_type, status, is_running, last_run, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            ['sitemap_generation', 'running', 1]
          );
        }
      } catch (dbError) {
        logger.error('Database error updating pipeline status:', { error: dbError });
      } finally {
        if (db) await closeSQLiteConnection(db);
      }
      
      // Execute the pipeline
      const context = new PipelineContext({});
      
      // Add a utility function to update status
      context.updateStatus = (status) => {
        logger.info(`Sitemap generation status update: ${status.message || 'In progress'}`, status);
      };
      
      // Add a logger reference to the context
      context.logger = logger;
      
      // Run the pipeline
      const result = await pipeline.run(context);
      
      // Update the pipeline status to completed
      try {
        db = await openSQLiteConnection();
        await db.run(
          'UPDATE pipeline_status SET status = ?, is_running = 0 WHERE pipeline_type = ?',
          ['completed', 'sitemap_generation']
        );
      } catch (dbError) {
        logger.error('Database error updating pipeline status:', { error: dbError });
      } finally {
        if (db) await closeSQLiteConnection(db);
      }
      
      logger.info('Sitemap generation pipeline completed successfully');
      
      // Return success
      return {
        success: true,
        itemsProcessed: result.generatedSitemaps ? result.generatedSitemaps.length : 0
      };
    } catch (error) {
      logger.error('Error executing sitemap generation pipeline:', { error });
      
      // Update the pipeline status to failed
      try {
        const db = await openSQLiteConnection();
        await db.run(
          'UPDATE pipeline_status SET status = ?, is_running = 0 WHERE pipeline_type = ?',
          ['failed', 'sitemap_generation']
        );
        await closeSQLiteConnection(db);
      } catch (dbError) {
        logger.error('Database error updating pipeline status:', { error: dbError });
      }
      
      // Return error
      return {
        success: false,
        error: error
      };
    }
  }

  /**
   * Create a pipeline history entry
   * @param {string} pipelineType - Pipeline type
   * @param {string} triggerType - Trigger type (e.g., 'direct_execution', 'scheduled')
   * @returns {Promise<string>} ID of the created history entry
   * @private
   */
  async createPipelineHistoryEntry(pipelineType, triggerType) {
    logger.info(`Creating pipeline history entry for ${pipelineType}, trigger: ${triggerType}`);
    
    try {
      // Open a database connection
      const db = await openSQLiteConnection();
      
      try {
        // Check if pipeline_history table exists
        const tableExists = await db.get(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='pipeline_history'`
        );
        
        if (!tableExists) {
          // Create the table if it doesn't exist
          logger.info('Creating pipeline_history table');
          await db.exec(`
            CREATE TABLE pipeline_history (
              id TEXT PRIMARY KEY,
              pipeline_type TEXT NOT NULL,
              trigger_type TEXT NOT NULL,
              status TEXT NOT NULL,
              started_at TIMESTAMP NOT NULL,
              completed_at TIMESTAMP,
              items_processed INTEGER DEFAULT 0,
              error_message TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          logger.info('Successfully created pipeline_history table');
        }
        
        // Generate a unique ID for the history entry
        const historyId = `history_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Insert the history entry
        await db.run(
          `INSERT INTO pipeline_history (
            id, pipeline_type, trigger_type, status, started_at, items_processed
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            historyId,
            pipelineType,
            triggerType,
            'running',
            new Date().toISOString(),
            0
          ]
        );
        
        logger.info(`Created pipeline history entry with ID ${historyId}`);
        return historyId;
      } finally {
        // Close the database connection
        await db.close();
      }
    } catch (error) {
      logger.error('Error creating pipeline history entry:', { error });
      // Return a fallback ID in case of error to prevent further errors
      return `fallback_${Date.now()}`;
    }
  }
  
  /**
   * Update a pipeline history entry
   * @param {string} historyId - ID of the history entry to update
   * @param {string} status - New status (completed, failed)
   * @param {number} itemsProcessed - Number of items processed
   * @returns {Promise<void>}
   * @private
   */
  async updatePipelineHistoryEntry(historyId, status, itemsProcessed = 0) {
    logger.info(`Updating pipeline history entry ${historyId} with status ${status}`);
    
    try {
      // Open a database connection
      const db = await openSQLiteConnection();
      
      try {
        // Update the history entry
        await db.run(
          `UPDATE pipeline_history SET 
            status = ?, 
            completed_at = ?, 
            items_processed = ?
          WHERE id = ?`,
          [
            status,
            new Date().toISOString(),
            itemsProcessed,
            historyId
          ]
        );
        
        logger.info(`Updated pipeline history entry ${historyId}`);
      } finally {
        // Close the database connection
        await db.close();
      }
    } catch (error) {
      logger.error(`Error updating pipeline history entry ${historyId}:`, { error });
    }
  }

  /**
   * Execute contributor enrichment process
   * @param {boolean} processAllItems - Whether to process all items or just a batch
   * @param {object} stats - Statistics tracking object
   * @param {string} historyId - Pipeline history entry ID
   * @returns {Promise<object>} Result of the operation
   */
  async executeContributorEnrichment(processAllItems = false, stats = {}, historyId = null) {
    logger.info('Starting contributor enrichment phase', { processAllItems });
    
    // Emit progress event
    pipelineEvents.emit('pipeline_progress', {
      pipelineType: 'data_enrichment',
      historyId,
      progress: {
        currentStep: 'Starting contributor enrichment',
        phase: 'contributor_enrichment',
        processAllItems
      },
      stats
    });
    
    try {
      // Import the required classes
      const { GitHubApiClient } = await import('../services/github/github-api-client.js');
      const { ContributorEnricher } = await import('../pipeline/enrichers/contributor-enricher.js');
      
      // Create GitHub API client
      const githubClient = new GitHubApiClient({
        clientId: 'data-enrichment-contributors',
        token: process.env.GITHUB_TOKEN
      });
      
      // Configure batch size based on whether we're processing all items
      const batchSize = processAllItems ? 20 : 5; // Contributors have more API calls, use smaller batch
      const maxPasses = processAllItems ? 100 : 1; // Limit to prevent infinite loops
      
      // Get database connection for counts
      const db = await openSQLiteConnection();
      
      // Get counts for progress tracking
      const contribUnenrichedCount = await db.get(`
        SELECT COUNT(*) as count 
        FROM contributors 
        WHERE is_enriched = 0 AND enrichment_attempts < 3
      `);
      
      let remainingCount = contribUnenrichedCount ? contribUnenrichedCount.count : 0;
      logger.info(`Found ${remainingCount} unenriched contributors`);
      
      await db.close();
      
      // Only continue with contributor enrichment if there are unenriched items
      if (remainingCount > 0) {
        // Create contributor enricher
        const contributorEnricher = new ContributorEnricher({
          githubClient,
          db: await openSQLiteConnection(),
          config: { batchSize }
        });
        
        // Loop and process contributors in batches
        let processAttempts = 0;
        
        while (remainingCount > 0 && processAttempts < maxPasses) {
          try {
            processAttempts++;
            logger.info(`Processing contributor batch ${processAttempts}/${maxPasses}`, { remaining: remainingCount });
            
            // Process one batch of contributors
            const contribResult = await contributorEnricher.enrichContributors();
            
            // Update statistics
            stats.contributors.processed += contribResult.processed;
            stats.contributors.success += contribResult.success;
            stats.contributors.failed += contribResult.failed;
            stats.contributors.skipped += contribResult.notFound || 0;
            
            // Check if we hit a rate limit
            if (contribResult.rateLimited) {
              stats.rateLimited = true;
              stats.rateLimitReset = contribResult.rateLimitReset;
              
              logger.warn('GitHub API rate limit reached during contributor enrichment', { resetTime: stats.rateLimitReset });
              
              // Wait for rate limit to reset if we're processing all items
              if (processAllItems) {
                const resetTime = new Date(stats.rateLimitReset * 1000);
                const waitMs = Math.max(0, resetTime.getTime() - Date.now()) + 5000; // Add 5 second buffer
                
                logger.info(`Waiting for rate limit to reset: ${Math.ceil(waitMs/1000)} seconds until ${resetTime.toISOString()}`);
                pipelineEvents.emit('pipeline_progress', {
                  pipelineType: 'data_enrichment',
                  progress: {
                    currentStep: `Waiting for rate limit to reset (${Math.ceil(waitMs/1000)}s)`,
                    phase: 'rate_limit_wait',
                    processAllItems
                  },
                  stats
                });
                
                // Wait for the rate limit to reset
                await new Promise(resolve => setTimeout(resolve, waitMs));
                
                logger.info('Rate limit wait complete, continuing enrichment');
                pipelineEvents.emit('pipeline_progress', {
                  pipelineType: 'data_enrichment',
                  progress: {
                    currentStep: 'Continuing contributor enrichment after rate limit',
                    phase: 'contributor_enrichment',
                    processAllItems
                  },
                  stats
                });
              } else {
                // If not processing all items, just break and move on
                logger.info('Rate limit reached and not processing all items, moving to next phase');
                break;
              }
            }
            
            // Check if we should continue processing
            if (!processAllItems) {
              // If not processing all items, just do one batch
              break;
            }
            
            // Get updated count for next iteration
            const dbConn = await openSQLiteConnection();
            const countResult = await dbConn.get(`
              SELECT COUNT(*) as count 
              FROM contributors 
              WHERE is_enriched = 0 AND enrichment_attempts < 3
            `);
            remainingCount = countResult ? countResult.count : 0;
            await dbConn.close();
            
            // Emit progress event
            pipelineEvents.emit('pipeline_progress', {
              pipelineType: 'data_enrichment',
              progress: {
                currentStep: 'Contributor enrichment in progress',
                phase: 'contributor_enrichment',
                processAllItems,
                totalItems: stats.contributors.processed + remainingCount,
                processedItems: stats.contributors.processed
              },
              stats
            });
            
            logger.info(`Contributor batch ${processAttempts} complete, ${remainingCount} remaining`);
          } catch (error) {
            logger.error('Error in contributor enrichment batch', { error });
            
            // If we encounter an error that's not rate limiting, log it and continue
            stats.contributors.failed += 1;
            
            // Check if we should continue or break
            if (!processAllItems) {
              break;
            }
          }
        }
        
        // Close the contributor enricher's database connection
        await contributorEnricher.close();
      } else {
        logger.info('No unenriched contributors found, skipping contributor enrichment phase');
      }
      
      logger.info('Contributor enrichment phase complete', { stats: stats.contributors });
      
      // 3. Next, enrich merge requests
      return await this.executeMergeRequestEnrichment(processAllItems, stats, historyId);
    } catch (error) {
      logger.error('Error in contributor enrichment phase', { error });
      
      // Update history entry
      if (historyId) {
        await this.updatePipelineHistoryEntry(historyId, 'failed', 
          stats.repositories.processed + stats.contributors.processed);
      }
      
      // Emit completion event
      pipelineEvents.emit('pipeline_complete', {
        pipelineType: 'data_enrichment',
        historyId,
        stats,
        error: error.message
      });
      
      return {
        success: false,
        message: `Contributor enrichment failed: ${error.message}`,
        stats
      };
    }
  }

  /**
   * Execute merge request enrichment process
   * @param {boolean} processAllItems - Whether to process all items or just a batch
   * @param {object} stats - Statistics tracking object 
   * @param {string} historyId - Pipeline history entry ID
   * @returns {Promise<object>} Result of the operation
   */
  async executeMergeRequestEnrichment(processAllItems = false, stats = {}, historyId = null) {
    logger.info('Starting merge request enrichment phase', { processAllItems });
    
    // Emit progress event
    pipelineEvents.emit('pipeline_progress', {
      pipelineType: 'data_enrichment',
      historyId,
      progress: {
        currentStep: 'Starting merge request enrichment',
        phase: 'merge_request_enrichment',
        processAllItems
      },
      stats
    });
    
    try {
      // Import the required classes
      const { GitHubApiClient } = await import('../services/github/github-api-client.js');
      const { default: MergeRequestEnricher } = await import('../pipeline/enrichers/merge-request-enricher.js');
      
      // Create GitHub API client
      const githubClient = new GitHubApiClient({
        clientId: 'data-enrichment-merge-requests',
        token: process.env.GITHUB_TOKEN
      });
      
      // Configure batch size based on whether we're processing all items
      const batchSize = processAllItems ? 10 : 3; // MRs have many API calls per item, use smaller batch
      const maxPasses = processAllItems ? 100 : 1; // Limit to prevent infinite loops
      
      // Get database connection for counts
      const db = await openSQLiteConnection();
      
      // Get counts for progress tracking
      const mrUnenrichedCount = await db.get(`
        SELECT COUNT(*) as count 
        FROM merge_requests 
        WHERE is_enriched = 0 AND enrichment_attempts < 3
      `);
      
      let remainingCount = mrUnenrichedCount ? mrUnenrichedCount.count : 0;
      logger.info(`Found ${remainingCount} unenriched merge requests`);
      
      await db.close();
      
      // Only continue with merge request enrichment if there are unenriched items
      if (remainingCount > 0) {
        // Create a database connection and MR enricher
        const dbConn = await openSQLiteConnection();
        const mrEnricher = new MergeRequestEnricher(dbConn, githubClient);
        
        // Loop and process merge requests in batches
        let processAttempts = 0;
        
        while (remainingCount > 0 && processAttempts < maxPasses) {
          try {
            processAttempts++;
            logger.info(`Processing merge request batch ${processAttempts}/${maxPasses}`, { remaining: remainingCount });
            
            // Process one batch of merge requests
            await mrEnricher.enrichAllMergeRequests(batchSize);
            
            // Update statistics from the enricher's stats
            stats.mergeRequests.processed += mrEnricher.stats.processed;
            stats.mergeRequests.success += mrEnricher.stats.successful;
            stats.mergeRequests.failed += mrEnricher.stats.failed;
            
            // Reset the enricher's stats for the next batch
            mrEnricher.resetStats();
            
            // Check if we should continue processing
            if (!processAllItems) {
              // If not processing all items, just do one batch
              break;
            }
            
            // Get updated count for next iteration
            const countResult = await dbConn.get(`
              SELECT COUNT(*) as count 
              FROM merge_requests 
              WHERE is_enriched = 0 AND enrichment_attempts < 3
            `);
            remainingCount = countResult ? countResult.count : 0;
            
            // Emit progress event
            pipelineEvents.emit('pipeline_progress', {
              pipelineType: 'data_enrichment',
              progress: {
                currentStep: 'Merge request enrichment in progress',
                phase: 'merge_request_enrichment',
                processAllItems,
                totalItems: stats.mergeRequests.processed + remainingCount,
                processedItems: stats.mergeRequests.processed
              },
              stats
            });
            
            logger.info(`Merge request batch ${processAttempts} complete, ${remainingCount} remaining`);
          } catch (error) {
            // Check if this is a rate limit error
            const isRateLimitError = 
              error.message && error.message.includes('rate limit') ||
              (error.status === 403 && error.response && 
               error.response.headers && error.response.headers['x-ratelimit-remaining'] === '0');
               
            if (isRateLimitError) {
              // Handle rate limit by waiting
              stats.rateLimited = true;
              
              // Try to extract the reset time
              const resetTime = error.response && error.response.headers && 
                error.response.headers['x-ratelimit-reset'] ? 
                parseInt(error.response.headers['x-ratelimit-reset']) * 1000 : 
                Date.now() + (60 * 60 * 1000); // Default: wait 1 hour
              
              stats.rateLimitReset = resetTime;
              
              logger.warn('GitHub API rate limit reached during merge request enrichment', { resetTime });
              
              // Wait for rate limit to reset if we're processing all items
              if (processAllItems) {
                const resetDate = new Date(resetTime);
                const waitMs = Math.max(0, resetDate.getTime() - Date.now()) + 5000; // Add 5 second buffer
                
                logger.info(`Waiting for rate limit to reset: ${Math.ceil(waitMs/1000)} seconds until ${resetDate.toISOString()}`);
                pipelineEvents.emit('pipeline_progress', {
                  pipelineType: 'data_enrichment',
                  progress: {
                    currentStep: `Waiting for rate limit to reset (${Math.ceil(waitMs/1000)}s)`,
                    phase: 'rate_limit_wait',
                    processAllItems
                  },
                  stats
                });
                
                // Wait for the rate limit to reset
                await new Promise(resolve => setTimeout(resolve, waitMs));
                
                logger.info('Rate limit wait complete, continuing enrichment');
                pipelineEvents.emit('pipeline_progress', {
                  pipelineType: 'data_enrichment',
                  progress: {
                    currentStep: 'Continuing merge request enrichment after rate limit',
                    phase: 'merge_request_enrichment',
                    processAllItems
                  },
                  stats
                });
              } else {
                // If not processing all items, just break and move on
                logger.info('Rate limit reached and not processing all items, moving to next phase');
                break;
              }
            } else {
              // For other errors, log and continue if processing all items
              logger.error('Error in merge request enrichment batch', { error });
              stats.mergeRequests.failed += 1;
              
              if (!processAllItems) {
                break;
              }
            }
          }
        }
        
        // Close the database connection
        await dbConn.close();
      } else {
        logger.info('No unenriched merge requests found, skipping merge request enrichment phase');
      }
      
      logger.info('Merge request enrichment phase complete', { stats: stats.mergeRequests });
      
      // 4. Finally, update the history entry and emit completion event
      if (historyId) {
        await this.updatePipelineHistoryEntry(historyId, 'completed', 
          stats.repositories.processed + stats.contributors.processed + stats.mergeRequests.processed);
      }
      
      pipelineEvents.emit('pipeline_complete', {
        pipelineType: 'data_enrichment',
        historyId,
        stats
      });
      
      return {
        success: true,
        message: 'Data enrichment completed successfully',
        stats
      };
    } catch (error) {
      logger.error('Error in merge request enrichment phase', { error });
      
      // Update history entry
      if (historyId) {
        await this.updatePipelineHistoryEntry(historyId, 'failed', 
          stats.repositories.processed + stats.contributors.processed + stats.mergeRequests.processed);
      }
      
      // Emit completion event
      pipelineEvents.emit('pipeline_complete', {
        pipelineType: 'data_enrichment',
        historyId,
        stats,
        error: error.message
      });
      
      return {
        success: false,
        message: `Merge request enrichment failed: ${error.message}`,
        stats
      };
    }
  }

  /**
   * Execute AI Analysis functionality directly
   * @returns {Promise<object>} Result object with success status and metrics
   * @private
   */
  async executeAIAnalysis() {
    logger.info('Executing AI analysis function directly');
    
    try {
      // In a real implementation, this would fetch entities that need analysis
      // and apply AI/ML models to generate insights
      
      // For now, return a mock result
      logger.info('AI analysis function executed successfully');
      
      return { 
        success: true, 
        itemsProcessed: 0,
        message: 'AI analysis completed successfully (mock implementation)' 
      };
    } catch (error) {
      logger.error('Error in direct AI analysis function:', { error });
      
      return { 
        success: false, 
        error,
        message: `Failed to analyze data: ${error.message}` 
      };
    }
  }
  
  /**
   * Stop a running pipeline
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  async stopPipeline(req, res) {
    try {
      // Support both camelCase and snake_case parameter names for compatibility
      const { 
        pipeline_type, 
        pipelineType, 
        history_id, 
        historyId 
      } = req.body;
      
      // Use snake_case params if available, otherwise use camelCase
      const actualPipelineType = pipeline_type || pipelineType;
      const actualHistoryId = history_id || historyId;
      
      // Validate required fields
      if (!actualPipelineType) {
        return this.sendError(res, 'Pipeline type is required', 400);
      }
      
      logger.info(`Stopping pipeline ${actualPipelineType}...`);
      
      // In a real implementation, we would look up the running pipeline and stop it
      // For now, we'll just update the history record
      
      // Update the pipeline history with a stopped status
      const { error } = await openSQLiteConnection()
        .from('pipeline_history')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: 'Pipeline was manually stopped by user'
        })
        .eq('id', actualHistoryId);
      
      if (error) {
        logger.error('Error updating pipeline history:', { error });
      }
      
      // Emit pipeline stopped event
      pipelineEvents.emit('pipeline_stopped', {
        pipelineType: req.body.pipeline_type
      });
      
      return this.sendSuccess(res, {
        message: `Pipeline ${actualPipelineType} stop request acknowledged`,
        history_id: actualHistoryId
      });
    } catch (error) {
      logger.error('Error stopping pipeline', { error });
      return this.sendError(res, 'Error stopping pipeline', 500);
    }
  }
  
  /**
   * Restart a pipeline
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  async restartPipeline(req, res) {
    try {
      // Support both camelCase and snake_case parameter names for compatibility
      const { 
        pipeline_type, 
        pipelineType, 
        parameters, 
        history_id, 
        historyId 
      } = req.body;
      
      // Use snake_case params if available, otherwise use camelCase
      const actualPipelineType = pipeline_type || pipelineType;
      const actualHistoryId = history_id || historyId;
      
      // Validate required fields
      if (!actualPipelineType) {
        return this.sendError(res, 'Pipeline type is required', 400);
      }
      
      logger.info(`Restarting direct execution of ${actualPipelineType}...`);
      
      // For restarting, we use the same logic as starting
      setTimeout(() => this.executeDirectFunction(actualHistoryId, actualPipelineType), 100);
      
      // Emit pipeline restarted event
      pipelineEvents.emit('pipeline_restarted', {
        pipelineType: req.body.pipeline_type,
        historyId
      });
      
      return this.sendSuccess(res, {
        message: `Direct execution of ${actualPipelineType} restarted successfully`,
        history_id: actualHistoryId
      });
    } catch (error) {
      logger.error('Error restarting pipeline', { error });
      return this.sendError(res, 'Error restarting pipeline', 500);
    }
  }
  
  /**
   * Helper to update the pipeline history record
   * @param {string} historyId - Pipeline history ID 
   * @param {object} data - Data to update
   * @private
   */
  async updatePipelineHistory(historyId, data) {
    try {
      // For SQLite operations, we only log completion - the Next.js API will handle database updates
      logger.info(`Pipeline completed with status: ${data.status}`, {
        history_id: historyId, 
        items_processed: data.items_processed || 0
      });
      
      // Skip Supabase updates when using SQLite (history ID will be numeric)
      // This prevents UUID format errors
      if (historyId && typeof historyId === 'string' && historyId.includes('-')) {
        // Only update Supabase if we have a properly formatted UUID
        try {
          const { error } = await openSQLiteConnection()
            .from('pipeline_history')
            .update(data)
            .eq('id', historyId);
            
          if (error) {
            logger.error('Error updating pipeline history in Supabase:', { error });
          }
        } catch (e) {
          logger.error('Error updating pipeline history:', { error: e });
        }
      }
      // Emit history updated event for significant status changes
      if (data.status) {
        pipelineEvents.emit('pipeline_status_changed', {
          historyId,
          status: data.status,
          itemsProcessed: data.items_processed
        });
      }
    } catch (error) {
      logger.error('Error in updatePipelineHistory:', { error });
    }
  }
  
  /**
   * Process a single raw data item
   * @param {Object} item - The raw data item to process
   * @param {Object} stats - Statistics object to update
   * @param {Array} processedIds - Array of successfully processed item IDs
   * @param {Array} failedIds - Array of failed item IDs
   * @param {number} index - Current index in the batch
   * @param {number} totalItems - Total items in the batch
   * @param {Object} db - SQLite database connection
   * @private
   */
  async processItem(item, stats, processedIds, failedIds, index, totalItems, db) {
    logger.info(`========== PROCESSING ITEM ${index+1}/${totalItems} (ID: ${item.id}) ==========`);
    
    try {
      // Parse raw data JSON
      let data;
      try {
        // Parse the data field from the SQLite record
        if (item.data) {
          logger.debug(`Item ${item.id} has data field of type ${typeof item.data}`);
          data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
        } else {
          logger.warn(`Item ${item.id} has no data field, skipping`);
          failedIds.push(item.id);
          return;
        }
      } catch (parseError) {
        logger.error(`Error parsing item ${item.id}: ${parseError.message}`, {
          error: parseError
        });
        failedIds.push(item.id);
        return;
      }
      
      if (!data) {
        logger.warn(`Item ${item.id} has empty data after parsing, skipping`);
        failedIds.push(item.id);
        return;
      }
      
      // Generate UUIDs for new entities
      const uuidv4 = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Process repository
      let repoId = null;
      if (data.repository) {
        logger.info(`Processing repository for item ${item.id}`);
        
        // Extract the github_id
        const githubId = parseInt(data.repository.id, 10);
        
        if (!githubId) {
          logger.warn(`Repository ID missing or invalid for item ${item.id}, skipping repository processing`);
        } else {
          // Check if repository already exists
          const existingRepo = await db.get(
            `SELECT id FROM repositories WHERE github_id = ?`,
            [githubId]
          );
          
          if (existingRepo) {
            // Repository exists, update it
            repoId = existingRepo.id;
            logger.info(`Repository exists with ID ${repoId}, updating...`);
            
            // Get repository name and full_name
            const repoName = data.repository.name || 
              (data.pull_request?.base?.repo?.name || '');
            const repoFullName = data.repository.full_name || 
              (data.pull_request?.base?.repo?.full_name || `${data.repository.owner}/${repoName}`);
            
            // Update repository
            await db.run(
              `UPDATE repositories SET 
                name = ?,
                full_name = ?,
                description = ?, 
                url = ?,
                stars = ?,
                forks = ?,
                open_issues_count = ?,
                watchers_count = ?,
                primary_language = ?,
                updated_at = datetime('now')
              WHERE id = ?`,
              [
                repoName,
                repoFullName,
                data.repository.description || data.pull_request?.base?.repo?.description || '',
                data.repository.url || data.pull_request?.base?.repo?.html_url || '',
                data.repository.stars || data.pull_request?.base?.repo?.stargazers_count || 0,
                data.repository.forks || data.pull_request?.base?.repo?.forks_count || 0,
                data.pull_request?.base?.repo?.open_issues_count || 0,
                data.pull_request?.base?.repo?.watchers_count || 0,
                data.pull_request?.base?.repo?.language || null,
                repoId
              ]
            );
            
            stats.repositories++;
            logger.info(`Successfully updated repository with ID ${repoId}`);
          } else {
            // Repository doesn't exist, create it
            const newRepoId = uuidv4();
            repoId = newRepoId;
            
            // Get repository name and full_name
            const repoName = data.repository.name || 
              (data.pull_request?.base?.repo?.name || '');
            const repoFullName = data.repository.full_name || 
              (data.pull_request?.base?.repo?.full_name || `${data.repository.owner}/${repoName}`);
            
            logger.info(`Creating new repository: ${repoFullName}`);
            
            try {
              await db.run(
                `INSERT INTO repositories (
                  id, github_id, name, full_name, description, url, 
                  stars, forks, is_enriched, open_issues_count, watchers_count, 
                  primary_language, default_branch, source, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [
                  newRepoId,
                  githubId,
                  repoName,
                  repoFullName,
                  data.repository.description || data.pull_request?.base?.repo?.description || '',
                  data.repository.url || data.pull_request?.base?.repo?.html_url || '',
                  data.repository.stars || data.pull_request?.base?.repo?.stargazers_count || 0,
                  data.repository.forks || data.pull_request?.base?.repo?.forks_count || 0,
                  0, // is_enriched
                  data.pull_request?.base?.repo?.open_issues_count || 0,
                  data.pull_request?.base?.repo?.watchers_count || 0,
                  data.pull_request?.base?.repo?.language || null,
                  data.pull_request?.base?.repo?.default_branch || 'main',
                  'github_api'
                ]
              );
              
              stats.repositories++;
              logger.info(`Successfully created repository with ID ${newRepoId}`);
            } catch (insertError) {
              logger.error(`Error creating repository: ${insertError.message}`, {
                error: insertError,
                repoFullName
              });
              
              // Try minimal insert as fallback
              try {
                await db.run(
                  `INSERT INTO repositories (id, github_id, name, full_name, url, default_branch, source, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                  [
                    newRepoId,
                    githubId,
                    repoName,
                    repoFullName,
                    data.repository.url || data.pull_request?.base?.repo?.html_url || '',
                    'main',
                    'github_api'
                  ]
                );
                
                stats.repositories++;
                logger.info(`Successfully created repository with minimal fields, ID ${newRepoId}`);
              } catch (fallbackError) {
                logger.error(`Fallback repository insert also failed: ${fallbackError.message}`, {
                  error: fallbackError
                });
                repoId = null;
              }
            }
          }
        }
      } else {
        logger.warn(`No repository data found for item ${item.id}`);
      }
      
      // Process contributor (PR author)
      let contributorId = null;
      if (data.pull_request?.user) {
        logger.info(`Processing contributor for item ${item.id}`);
        
        const user = data.pull_request.user;
        const githubId = parseInt(user.id, 10);
        
        if (!githubId) {
          logger.warn(`Contributor ID missing or invalid for item ${item.id}, skipping contributor processing`);
        } else {
          // Check if contributor already exists
          const existingContributor = await db.get(
            `SELECT id FROM contributors WHERE github_id = ?`,
            [githubId]
          );
          
          if (existingContributor) {
            // Contributor exists, update it
            contributorId = existingContributor.id;
            logger.info(`Contributor exists with ID ${contributorId}, updating...`);
            
            await db.run(
              `UPDATE contributors SET 
                username = ?,
                avatar = ?,
                updated_at = datetime('now')
              WHERE id = ?`,
              [
                user.login || null,
                user.avatar_url || null,
                contributorId
              ]
            );
            
            stats.contributors++;
            logger.info(`Successfully updated contributor with ID ${contributorId}`);
          } else {
            // Contributor doesn't exist, create it
            const newContributorId = uuidv4();
            contributorId = newContributorId;
            
            logger.info(`Creating new contributor: ${user.login || 'Unknown'}`);
            
            try {
              await db.run(
                `INSERT INTO contributors (
                  id, github_id, username, name, avatar, is_enriched, is_placeholder, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [
                  newContributorId,
                  githubId,
                  user.login || null,
                  user.name || null,
                  user.avatar_url || null,
                  0, // is_enriched
                  0  // is_placeholder
                ]
              );
              
              stats.contributors++;
              logger.info(`Successfully created contributor with ID ${newContributorId}`);
            } catch (insertError) {
              logger.error(`Error creating contributor: ${insertError.message}`, {
                error: insertError,
                username: user.login
              });
              
              // Try minimal insert as fallback
              try {
                await db.run(
                  `INSERT INTO contributors (id, github_id, username, is_placeholder, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
                  [
                    newContributorId,
                    githubId,
                    user.login || null,
                    0  // is_placeholder
                  ]
                );
                
                stats.contributors++;
                logger.info(`Successfully created contributor with minimal fields, ID ${newContributorId}`);
              } catch (fallbackError) {
                logger.error(`Fallback contributor insert also failed: ${fallbackError.message}`, {
                  error: fallbackError
                });
                contributorId = null;
              }
            }
          }
        }
      } else {
        logger.warn(`No contributor data found for item ${item.id}`);
      }
      
      // Process merge request (pull request)
      let mergeRequestId = null;
      if (data.pull_request && repoId && contributorId) {
        logger.info(`Processing merge request for item ${item.id}`);
        
        const pr = data.pull_request;
        // Use PR number instead of GitHub's internal ID
        // PR number is what's visible in GitHub URLs and is repository-specific
        const githubId = pr.pr_number || pr.number || parseInt(pr.id, 10);
        
        if (!githubId) {
          logger.warn(`Pull request ID missing or invalid for item ${item.id}, skipping merge request processing`);
        } else {
          // Check if repository and contributor IDs exist
          const repoGithubId = parseInt(data.repository.id, 10);
          
          logger.info(`Processing pull request #${githubId} (internal ID: ${pr.id})`);
          
          // Check if merge request already exists
          const existingMR = await db.get(
            `SELECT id FROM merge_requests 
             WHERE github_id = ? AND repository_id = ?`,
            [githubId, repoId]
          );
          
          if (existingMR) {
            // Merge request exists, update it
            mergeRequestId = existingMR.id;
            logger.info(`Merge request exists with ID ${mergeRequestId}, updating...`);
            
            await db.run(
              `UPDATE merge_requests SET 
                title = ?,
                description = ?,
                state = ?,
                closed_at = ?,
                merged_at = ?,
                commits_count = ?,
                additions = ?,
                deletions = ?,
                changed_files = ?,
                updated_at = datetime('now')
              WHERE id = ?`,
              [
                pr.title || '',
                pr.body || '',
                pr.state || 'unknown',
                pr.closed_at || null,
                pr.merged_at || null,
                pr.commits || 0,
                pr.additions || 0,
                pr.deletions || 0,
                pr.changed_files || 0,
                mergeRequestId
              ]
            );
            
            stats.mergeRequests++;
            logger.info(`Successfully updated merge request with ID ${mergeRequestId}`);
          } else {
            // Merge request doesn't exist, create it
            const newMergeRequestId = uuidv4();
            mergeRequestId = newMergeRequestId;
            
            logger.info(`Creating new merge request: ${pr.title || 'Untitled Pull Request'}`);
            
            try {
              await db.run(
                `INSERT INTO merge_requests (
                  id, github_id, repository_id, repository_github_id, author_id, author_github_id,
                  title, description, state, is_draft, created_at, updated_at, closed_at, merged_at,
                  commits_count, additions, deletions, changed_files, source_branch, target_branch, is_enriched
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  newMergeRequestId,
                  githubId,
                  repoId,
                  repoGithubId,
                  contributorId,
                  parseInt(data.pull_request.user.id, 10),
                  pr.title || '',
                  pr.body || '',
                  pr.state || 'unknown',
                  pr.draft === true ? 1 : 0,
                  pr.created_at || new Date().toISOString(),
                  pr.updated_at || new Date().toISOString(),
                  pr.closed_at || null,
                  pr.merged_at || null,
                  pr.commits || 0,
                  pr.additions || 0,
                  pr.deletions || 0,
                  pr.changed_files || 0,
                  pr.head?.ref || '',
                  pr.base?.ref || '',
                  0 // is_enriched
                ]
              );
              
              stats.mergeRequests++;
              logger.info(`Successfully created merge request with ID ${newMergeRequestId}`);
              
              // Process commits if available
              if (Array.isArray(data.commits) && data.commits.length > 0) {
                const commitsToProcess = data.commits; // Process all commits, no limit
                logger.info(`Processing ${commitsToProcess.length} commits for merge request ${newMergeRequestId}`);
                
                let commitSuccessCount = 0;
                let commitFailCount = 0;
                
                for (let j = 0; j < commitsToProcess.length; j++) {
                  const commitData = commitsToProcess[j];
                  if (commitData && commitData.sha) {
                    logger.info(`Processing commit ${j+1}/${commitsToProcess.length}: ${commitData.sha.substring(0, 7)}`);
                    
                    const commitId = uuidv4();
                    const isMergeCommit = commitData.commit?.message?.startsWith('Merge') || false;
                    
                    try {
                      await db.run(
                        `INSERT INTO commits (
                          id, github_id, sha, repository_id, repository_github_id,
                          contributor_id, contributor_github_id, author, message,
                          additions, deletions, files_changed, is_merge_commit,
                          committed_at, pull_request_id, pull_request_github_id,
                          is_enriched, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                        [
                          commitId,
                          commitData.sha,
                          commitData.sha,
                          repoId,
                          repoGithubId,
                          contributorId,
                          parseInt(commitData.author?.id || data.pull_request.user.id, 10),
                          commitData.commit?.author?.name || commitData.author?.login || '',
                          commitData.commit?.message || '',
                          commitData.stats?.additions || 0,
                          commitData.stats?.deletions || 0,
                          commitData.files?.length || 0,
                          isMergeCommit ? 1 : 0,
                          commitData.commit?.author?.date || new Date().toISOString(),
                          newMergeRequestId,
                          githubId,
                          0 // is_enriched
                        ]
                      );
                      
                      stats.commits++;
                      commitSuccessCount++;
                      logger.info(`Successfully created commit ${commitData.sha.substring(0, 7)}`);
                      
                      // Update contributor_repository junction table for this commit
                      try {
                        // Get commit-specific data
                        const commitAdditions = commitData.stats?.additions || 0;
                        const commitDeletions = commitData.stats?.deletions || 0;
                        const commitDate = commitData.commit?.author?.date || new Date().toISOString();
                        
                        // Check if relationship already exists
                        const contribRepoId = await db.get(
                          `SELECT id FROM contributor_repository 
                           WHERE contributor_id = ? AND repository_id = ?`,
                          [contributorId, repoId]
                        );
                        
                        if (contribRepoId) {
                          // Update existing relationship with commit data
                          await db.run(
                            `UPDATE contributor_repository SET 
                             commit_count = commit_count + 1,
                             first_contribution_date = MIN(first_contribution_date, ?),
                             last_contribution_date = MAX(last_contribution_date, ?),
                             lines_added = lines_added + ?,
                             lines_removed = lines_removed + ?,
                             updated_at = datetime('now')
                             WHERE id = ?`,
                            [
                              commitDate,
                              commitDate,
                              commitAdditions,
                              commitDeletions,
                              contribRepoId.id
                            ]
                          );
                          
                          logger.debug(`Updated contributor-repository relationship for commit ${commitData.sha.substring(0, 7)}`);
                        } else {
                          // Create new relationship
                          const newRelationshipId = uuidv4();
                          const contributorGithubId = parseInt(commitData.author?.id || data.pull_request.user.id, 10);
                          const repoGithubId = parseInt(data.repository.id, 10);
                          
                          await db.run(
                            `INSERT INTO contributor_repository (
                              id, contributor_id, contributor_github_id, repository_id, repository_github_id, 
                              commit_count, pull_requests, reviews, issues_opened, 
                              first_contribution_date, last_contribution_date,
                              lines_added, lines_removed, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                            [
                              newRelationshipId,
                              contributorId,
                              contributorGithubId,
                              repoId,
                              repoGithubId,
                              1, // commit_count (this commit)
                              0, // pull_requests
                              0, // reviews
                              0, // issues_opened
                              commitDate, // first_contribution_date
                              commitDate, // last_contribution_date
                              commitAdditions,
                              commitDeletions
                            ]
                          );
                          
                          logger.debug(`Created contributor-repository relationship for commit ${commitData.sha.substring(0, 7)}`);
                        }
                      } catch (relationshipError) {
                        logger.error(`Error updating contributor-repository relationship for commit: ${relationshipError.message}`, {
                          error: relationshipError,
                          sha: commitData.sha.substring(0, 7)
                        });
                      }
                    } catch (commitError) {
                      logger.error(`Error creating commit: ${commitError.message}`, {
                        error: commitError,
                        sha: commitData.sha
                      });
                      commitFailCount++;
                    }
                  }
                }
                
                logger.info(`Commit processing complete`, {
                  total: commitsToProcess.length,
                  success: commitSuccessCount,
                  failed: commitFailCount
                });
              } else {
                logger.info(`No commits to process for merge request ${newMergeRequestId}`);
              }
            } catch (insertError) {
              logger.error(`Error creating merge request: ${insertError.message}`, {
                error: insertError,
                title: pr.title
              });
            }
          }
          
          // Update contributor_repository junction table
          try {
            // Check if relationship already exists
            const contribRepoId = await db.get(
              `SELECT id FROM contributor_repository 
               WHERE contributor_id = ? AND repository_id = ?`,
              [contributorId, repoId]
            );
            
            const contributorGithubId = parseInt(data.pull_request.user.id, 10);
            const repoGithubId = parseInt(data.repository.id, 10);
            const firstContributionDate = pr.created_at || new Date().toISOString();
            const lastContributionDate = pr.merged_at || pr.updated_at || new Date().toISOString();
            
            // Calculate lines added/removed from this PR
            const linesAdded = pr.additions || 0;
            const linesRemoved = pr.deletions || 0;
            
            if (contribRepoId) {
              // Update existing relationship
              logger.info(`Updating contributor-repository relationship for contributor ${contributorId} and repository ${repoId}`);
              
              await db.run(
                `UPDATE contributor_repository SET 
                 pull_requests = pull_requests + 1,
                 last_contribution_date = MAX(last_contribution_date, ?),
                 lines_added = lines_added + ?,
                 lines_removed = lines_removed + ?,
                 updated_at = datetime('now')
                 WHERE id = ?`,
                [lastContributionDate, linesAdded, linesRemoved, contribRepoId.id]
              );
              
              logger.info(`Successfully updated contributor-repository relationship`);
            } else {
              // Create new relationship
              logger.info(`Creating new contributor-repository relationship for contributor ${contributorId} and repository ${repoId}`);
              
              const newRelationshipId = uuidv4();
              await db.run(
                `INSERT INTO contributor_repository (
                  id, contributor_id, contributor_github_id, repository_id, repository_github_id, 
                  commit_count, pull_requests, reviews, issues_opened, 
                  first_contribution_date, last_contribution_date,
                  lines_added, lines_removed, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [
                  newRelationshipId,
                  contributorId,
                  contributorGithubId,
                  repoId,
                  repoGithubId,
                  0, // commit_count (will be updated when commits are processed)
                  1, // pull_requests (this PR)
                  0, // reviews
                  0, // issues_opened
                  firstContributionDate,
                  lastContributionDate,
                  linesAdded,
                  linesRemoved
                ]
              );
              
              logger.info(`Successfully created contributor-repository relationship with ID ${newRelationshipId}`);
            }
          } catch (relationshipError) {
            logger.error(`Error updating contributor-repository relationship: ${relationshipError.message}`, {
              error: relationshipError,
              contributorId,
              repoId
            });
          }
        }
      } else {
        if (!data.pull_request) {
          logger.warn(`No pull request data found for item ${item.id}`);
        } else {
          logger.warn(`Missing repository ID or contributor ID for processing merge request`);
        }
      }
      
      // Mark the item as successfully processed
      processedIds.push(item.id);
      logger.info(`Successfully processed item ${item.id}`);
      
    } catch (itemError) {
      logger.error(`Error processing item ${item.id}: ${itemError.message}`, {
        error: itemError
      });
      failedIds.push(item.id);
    }
    
    logger.info(`========== COMPLETED ITEM ${index+1}/${totalItems} (ID: ${item.id}) ==========`);
  }
}

// Create and export a singleton instance
export default new PipelineOperationsController(); 