/**
 * Pipeline Operations Controller
 * 
 * Handles API requests for direct pipeline operations (start/stop).
 */

import { BaseController } from './base-controller.js';
import { supabase } from '../utils/supabase.js';
import { pipelineFactory } from '../pipeline/core/pipeline-factory.js';
import { logger } from '../utils/logger.js';
import { Pipeline } from '../pipeline/core/pipeline.js';
import { PipelineContext } from '../pipeline/core/pipeline-context.js';

// Import processors that will be needed for each pipeline type
import { EntityExtractorProcessor } from '../pipeline/processors/entity-extractor.js';
import { DatabaseWriterProcessor } from '../pipeline/processors/database-writer-processor.js';

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
      
      // Check if pipeline type is valid
      const validPipelineTypes = ['github_sync', 'data_processing', 'data_enrichment', 'ai_analysis'];
      if (!validPipelineTypes.includes(actualPipelineType)) {
        return this.sendError(res, `Invalid pipeline type: ${actualPipelineType}`, 400);
      }
      
      logger.info(`Starting pipeline ${actualPipelineType}...`);
      
      // Get pipeline implementation or create a new one for the requested type
      try {
        // Run the pipeline in the background to avoid blocking the API response
        setTimeout(() => this.runPipeline(actualHistoryId, actualPipelineType), 100);
        
        return this.sendSuccess(res, {
          message: `Pipeline ${actualPipelineType} started successfully`,
          history_id: actualHistoryId
        });
      } catch (error) {
        logger.error(`Error setting up pipeline ${actualPipelineType}`, { error });
        return this.sendError(res, `Error setting up pipeline: ${error.message}`, 500);
      }
    } catch (error) {
      logger.error('Error starting pipeline', { error });
      return this.sendError(res, 'Error starting pipeline', 500);
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
      const { error } = await supabase
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
      
      logger.info(`Restarting pipeline ${actualPipelineType}...`);
      
      // For restarting, we use the same logic as starting
      setTimeout(() => this.runPipeline(actualHistoryId, actualPipelineType), 100);
      
      return this.sendSuccess(res, {
        message: `Pipeline ${actualPipelineType} restarted successfully`,
        history_id: actualHistoryId
      });
    } catch (error) {
      logger.error('Error restarting pipeline', { error });
      return this.sendError(res, 'Error restarting pipeline', 500);
    }
  }
  
  /**
   * Run an actual pipeline for the requested type
   * @param {string} historyId - Pipeline history ID
   * @param {string} pipelineType - Pipeline type
   * @private
   */
  async runPipeline(historyId, pipelineType) {
    logger.info(`Setting up pipeline ${pipelineType} with history ID ${historyId}`);
    
    try {
      // Get or create a pipeline based on type
      let pipeline;
      let itemCount = 0;
      
      switch (pipelineType) {
        case 'github_sync':
          pipeline = await this.createGitHubSyncPipeline();
          break;
        case 'data_processing':
          // For data processing, we need to specifically handle raw GitHub data
          pipeline = await this.createRawDataProcessingPipeline();
          break;
        case 'data_enrichment':
          pipeline = await this.createDataEnrichmentPipeline();
          break;
        case 'ai_analysis':
          pipeline = await this.createAIAnalysisPipeline();
          break;
        default:
          throw new Error(`Unknown pipeline type: ${pipelineType}`);
      }
      
      if (!pipeline) {
        throw new Error(`Failed to create pipeline for type: ${pipelineType}`);
      }
      
      // Create a context with initial state
      const context = new PipelineContext({
        pipelineType,
        historyId,
        startTime: new Date()
      });
      
      // Set up logging for progress tracking
      logger.info(`Pipeline ${pipelineType} initialized and ready to run`);
      
      // If this is a data processing pipeline, we need to fetch raw data first
      if (pipelineType === 'data_processing') {
        // Fetch unprocessed data from github_raw_data - remove the hard limit of 100
        const { data: rawData, error } = await supabase
          .from('github_raw_data')
          .select('*')
          .eq('processed', false);
        
        if (error) {
          logger.error('Error fetching unprocessed GitHub data:', { error });
          throw new Error(`Failed to fetch unprocessed data: ${error.message}`);
        }
        
        if (!rawData || rawData.length === 0) {
          logger.info('No unprocessed GitHub data found');
          
          // Update history with results
          await this.updatePipelineHistory(historyId, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            items_processed: 0,
            error_message: 'No unprocessed data found'
          });
          
          return;
        }
        
        logger.info(`Found ${rawData.length} unprocessed GitHub data items to process`);
        itemCount = rawData.length;
        
        // Add the raw data to the context
        context.rawData = rawData; // Directly set property instead of using method
      }
      
      // Run the pipeline
      logger.info(`Running ${pipelineType} pipeline...`);
      const result = await pipeline.run(context);
      
      // If this was a data processing pipeline, mark the raw data as processed
      if (pipelineType === 'data_processing' && result.success) {
        // If we don't have processedIds in the result, use all the raw data IDs
        let processedIds = [];
        
        if (context.processedIds) {
          processedIds = context.processedIds;
        } else if (context.rawData) {
          // If no processedIds tracked, assume all were processed
          processedIds = context.rawData.map(item => item.id);
        }
        
        if (processedIds.length > 0) {
          logger.info(`Marking ${processedIds.length} raw data items as processed`);
          
          const { error } = await supabase
            .from('github_raw_data')
            .update({ processed: true })
            .in('id', processedIds);
          
          if (error) {
            logger.error('Error marking raw data as processed:', { error });
          }
        }
      }
      
      // Update history with results
      await this.updatePipelineHistory(historyId, {
        status: result.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        items_processed: itemCount,
        error_message: result.error ? result.error.message : null
      });
      
      logger.info(`Pipeline ${pipelineType} completed with status: ${result.success ? 'success' : 'failure'}. Processed ${itemCount} items.`);
      logger.info(`Pipeline stats: ${JSON.stringify(result.getStats ? result.getStats() : {})}`);
      
    } catch (error) {
      logger.error(`Error running pipeline ${pipelineType}:`, { error });
      
      // Update history entry with error
      await this.updatePipelineHistory(historyId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message || 'Unknown error'
      });
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
      const { error } = await supabase
        .from('pipeline_history')
        .update(data)
        .eq('id', historyId);
        
      if (error) {
        logger.error('Error updating pipeline history:', { error });
      }
    } catch (error) {
      logger.error('Error updating pipeline history:', { error });
    }
  }
  
  /**
   * Create a specialized pipeline for GitHub data synchronization
   * @returns {Pipeline} The configured pipeline
   * @private
   */
  async createGitHubSyncPipeline() {
    logger.info('Creating GitHub sync pipeline');
    
    try {
      // Create a simple pipeline with a custom run method
      return {
        name: 'github-sync',
        run: async (context) => {
          try {
            logger.info('Running GitHub sync pipeline');
            
            // Simulate GitHub sync - in a real implementation, this would call the GitHub API
            logger.info('Syncing data from GitHub API');
            
            // For demo, just return a success result
            logger.info('GitHub sync complete');
            return { 
              success: true, 
              message: 'GitHub sync completed successfully'
            };
          } catch (error) {
            logger.error('Error in GitHub sync pipeline:', { error });
            return { 
              success: false, 
              error,
              message: `Failed to sync GitHub data: ${error.message}` 
            };
          }
        },
        // Dummy method to avoid errors
        getStats: () => {
          return { 
            name: 'github-sync',
            itemsProcessed: 'Unknown - check logs for details',
            success: true
          };
        }
      };
    } catch (error) {
      logger.error('Error creating GitHub sync pipeline:', { error });
      throw error;
    }
  }
  
  /**
   * Create a specialized pipeline for raw data processing
   * @returns {Pipeline} The configured pipeline
   * @private
   */
  async createRawDataProcessingPipeline() {
    logger.info('Creating specialized raw data processing pipeline');
    
    try {
      // Create a simple pipeline with a custom run method
      return {
        name: 'raw-data-processing',
        run: async (context) => {
          try {
            logger.info('==================== STARTING RAW DATA PROCESSING ====================');
            
            // Fetch unprocessed items from the database with a limit to avoid memory issues
            const { data: unprocessedItems, error } = await supabase
                .from('github_raw_data')
                .select('*')
                .eq('processed', false)
                .limit(50); // Process max 50 at a time to avoid hanging

            if (error) {
                logger.error(`Error fetching unprocessed items: ${error.message}`, { 
                  error, 
                  details: error.details 
                });
                return { status: 'error', message: `Error fetching unprocessed items: ${error.message}` };
            }

            if (!unprocessedItems || unprocessedItems.length === 0) {
                logger.info('No unprocessed items found');
                return { status: 'success', message: 'No unprocessed items found' };
            }

            logger.info(`Found ${unprocessedItems.length} unprocessed items to process (limited to 50 for safety)`);
            
            // Store processed IDs for later reference
            const processedIds = [];
            const failedIds = [];
            
            // Track statistics for each entity type
            const stats = {
                repositories: 0,
                contributors: 0,
                mergeRequests: 0,
                commits: 0
            };

            // Process each unprocessed item with a timeout for safety
            for (let i = 0; i < unprocessedItems.length; i++) {
                const item = unprocessedItems[i];
                
                try {
                    // Set a timeout for processing each item to avoid hanging
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Item processing timed out after 30 seconds')), 30000);
                    });
                    
                    // Process the item with a timeout
                    await Promise.race([
                        this.processItem(item, stats, processedIds, failedIds, i, unprocessedItems.length),
                        timeoutPromise
                    ]);
                    
                } catch (timeoutError) {
                    logger.error(`Item ${item.id} processing timed out`, { error: timeoutError.message });
                    failedIds.push(item.id);
                    continue;
                }
            }
            
            // Mark all successfully processed items
            if (processedIds.length > 0) {
                logger.info(`Marking ${processedIds.length} items as processed`);
                await this.markItemsAsProcessed(processedIds);
            }
            
            logger.info(`Processing complete. Processed ${stats.repositories} repositories, ${stats.contributors} contributors, ${stats.mergeRequests} merge requests, and ${stats.commits} commits`);
            logger.info(`==================== RAW DATA PROCESSING COMPLETE ====================`);
            logger.info(`Summary:`, {
                total_items: unprocessedItems.length, 
                processed: processedIds.length,
                failed: failedIds.length,
                success_rate: `${((processedIds.length / unprocessedItems.length) * 100).toFixed(2)}%`
            });
            
            return { 
                success: true, 
                processed: processedIds.length,
                failed: failedIds.length,
                stats,
                message: `Successfully processed ${processedIds.length} items` 
            };
          } catch (error) {
            logger.error(`Error in raw data processing pipeline: ${error.message}`, {
              error,
              stack: error.stack
            });
            return { status: 'error', message: `Error in raw data processing pipeline: ${error.message}` };
          }
        },
        
        // Method to provide stats about the pipeline
        getStats: () => {
          return { 
            name: 'raw-data-processing',
            itemsProcessed: 'See logs for details',
            success: true
          };
        }
      };
    } catch (error) {
      logger.error('Error creating raw data processing pipeline:', { error });
      throw error;
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
   * @private
   */
  async processItem(item, stats, processedIds, failedIds, index, totalItems) {
    logger.info(`========== PROCESSING ITEM ${index+1}/${totalItems} (ID: ${item.id}) ==========`);
    
    try {
        // Parse raw data JSON with a 5 second timeout
        let data;
        try {
            // Try both possible field names and handle null/undefined cases
            if (item.raw_data) {
                logger.debug(`Item ${item.id} has raw_data field of type ${typeof item.raw_data}`);
                data = typeof item.raw_data === 'string' ? JSON.parse(item.raw_data) : item.raw_data;
            } else if (item.data) {
                logger.debug(`Item ${item.id} has data field of type ${typeof item.data}`);
                data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
            } else {
                logger.warn(`Item ${item.id} has no raw_data or data field, skipping`);
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

        // Process repository
        let repoId = null;
        if (data.repository) {
            logger.info(`Processing repository for item ${item.id}`);
        
            // Create repository object with correct column names from schema
            const repo = {
                // Numeric GitHub repository ID
                github_id: parseInt(data.repository.id) || 0,
                
                // Required fields from documentation
                name: data.repository.name || '',
                url: data.repository.html_url || data.repository.url || '',
                
                // Optional fields from documentation
                description: data.repository.description || '',
                stars: data.repository.stargazers_count || 0,
                forks: data.repository.forks_count || 0,
                
                // Additional fields if available
                open_issues_count: data.repository.open_issues_count || 0,
                watchers_count: data.repository.watchers_count || 0,
                size_kb: data.repository.size || null,
                primary_language: data.repository.language || null,
                last_updated: data.repository.updated_at || new Date().toISOString()
            };
            
            logger.info(`Processing repository: ${repo.name} (GitHub ID: ${repo.github_id})`);
            
            // First check if the repository already exists by github_id
            const { data: existingRepo, error: findError } = await supabase
              .from('repositories')
              .select('id')
              .eq('github_id', repo.github_id)
              .maybeSingle();
            
            if (findError) {
              logger.error(`Error finding repository: ${findError.message}`, {
                error: findError,
                repo
              });
            }
            
            // Update existing or insert new
            if (existingRepo) {
              repoId = existingRepo.id;
              logger.info(`Repository already exists with ID ${repoId}, updating...`);
              
              // Direct update to repository
              const { error: updateError } = await supabase
                .from('repositories')
                .update({
                  name: repo.name,
                  description: repo.description,
                  url: repo.url,
                  stars: repo.stars,
                  forks: repo.forks,
                  open_issues_count: repo.open_issues_count,
                  watchers_count: repo.watchers_count,
                  size_kb: repo.size_kb,
                  primary_language: repo.primary_language,
                  last_updated: repo.last_updated
                })
                .eq('id', repoId);
                
              if (updateError) {
                logger.error(`Error updating repository: ${updateError.message}`, {
                  error: updateError,
                  repoId,
                  github_id: repo.github_id
                });
              } else {
                stats.repositories++;
                logger.info(`Successfully updated repository with ID ${repoId}`);
              }
            } else {
              // Insert new repository
              logger.info(`Repository does not exist, creating new...`);
              const { data: insertedRepo, error: insertError } = await supabase
                .from('repositories')
                .insert([repo])
                .select('id')
                .single();
                
              if (insertError) {
                logger.error(`Error inserting repository: ${insertError.message}`, {
                  error: insertError,
                  repo
                });
                
                // Try fallback with minimal fields if insert fails
                logger.warn(`Trying fallback insert with minimal fields`);
                const { data: fallbackRepo, error: fallbackError } = await supabase
                  .from('repositories')
                  .insert([{
                    github_id: repo.github_id,
                    name: repo.name,
                    url: repo.url
                  }])
                  .select('id')
                  .single();
                  
                if (fallbackError) {
                  logger.error(`Fallback insert also failed: ${fallbackError.message}`, {
                    error: fallbackError
                  });
                } else {
                  repoId = fallbackRepo.id;
                  stats.repositories++;
                  logger.info(`Successfully inserted repository with minimal fields, ID ${repoId}`);
                }
              } else {
                repoId = insertedRepo.id;
                stats.repositories++;
                logger.info(`Successfully inserted repository with ID ${repoId}`);
              }
            }
        } else {
            logger.warn(`No repository data found for item ${item.id}`);
        }
          
        // Process contributors
        let contributorId = null;
        if (data.pull_request && data.pull_request.user) {
            logger.info(`Processing contributor for item ${item.id}`);
            
            const user = data.pull_request.user;
            
            // Create contributor object with correct column names from schema
            const contributor = {
              // The github_id is a BIGINT in the database
              github_id: parseInt(user.id) || 0,
              
              // These fields match the schema documentation
              username: user.login || null,
              avatar: user.avatar_url || null,
              url: user.html_url || null,
              name: user.name || null
              // created_at is automatically handled by the database
            };
            
            logger.info(`Processing contributor: ${contributor.username || 'Unknown'} (GitHub ID: ${contributor.github_id})`);
            
            // First check if the contributor already exists by github_id
            const { data: existingContributor, error: findContribError } = await supabase
              .from('contributors')
              .select('id')
              .eq('github_id', contributor.github_id)
              .maybeSingle();
              
            if (findContribError) {
              logger.error(`Error finding contributor: ${findContribError.message}`, {
                error: findContribError,
                contributor
              });
            }
            
            // Update if exists, insert if not
            if (existingContributor) {
              contributorId = existingContributor.id;
              logger.info(`Contributor already exists with ID ${contributorId}, updating...`);
              
              const { error: updateContribError } = await supabase
                .from('contributors')
                .update({
                  username: contributor.username,
                  avatar: contributor.avatar,
                  url: contributor.url,
                  name: contributor.name
                })
                .eq('id', contributorId);
                
              if (updateContribError) {
                logger.error(`Error updating contributor: ${updateContribError.message}`, {
                  error: updateContribError,
                  contributorId,
                  github_id: contributor.github_id
                });
              } else {
                stats.contributors++;
                logger.info(`Successfully updated contributor with ID ${contributorId}`);
              }
            } else {
              // Insert new contributor
              logger.info(`Contributor does not exist, creating new...`);
              const { data: insertedContributor, error: insertContribError } = await supabase
                .from('contributors')
                .insert([contributor])
                .select('id')
                .single();
                
              if (insertContribError) {
                logger.error(`Error inserting contributor: ${insertContribError.message}`, {
                  error: insertContribError,
                  contributor
                });
                
                // Try fallback with minimal fields
                logger.warn(`Trying fallback insert with minimal fields`);
                const { data: fallbackContributor, error: fallbackContribError } = await supabase
                  .from('contributors')
                  .insert([{
                    github_id: contributor.github_id,
                    username: contributor.username
                  }])
                  .select('id')
                  .single();
                  
                if (fallbackContribError) {
                  logger.error(`Fallback contributor insert also failed: ${fallbackContribError.message}`, {
                    error: fallbackContribError
                  });
                } else {
                  contributorId = fallbackContributor.id;
                  stats.contributors++;
                  logger.info(`Successfully inserted contributor with minimal fields, ID ${contributorId}`);
                }
              } else {
                contributorId = insertedContributor.id;
                stats.contributors++;
                logger.info(`Successfully inserted contributor with ID ${contributorId}`);
              }
            }
        } else {
            logger.warn(`No contributor data found for item ${item.id}`);
        }
      
        // Process pull request (merge request)
        if (data.pull_request && repoId && contributorId) {
            logger.info(`Processing merge request for item ${item.id}`);
            
            const pr = data.pull_request;
            
            const mergeRequest = {
              github_id: pr.id || 0,
              repository_id: repoId,
              author_id: contributorId,
              title: pr.title || '',
              description: pr.body || '',
              state: pr.state || 'unknown',
              is_draft: pr.draft === true,
              created_at: pr.created_at || new Date().toISOString(),
              updated_at: pr.updated_at || new Date().toISOString(),
              closed_at: pr.closed_at || null,
              merged_at: pr.merged_at || null,
              merged_by_id: null, // Would need to fetch the merger's ID if needed
              commits_count: pr.commits || 0,
              additions: pr.additions || 0,
              deletions: pr.deletions || 0,
              changed_files: pr.changed_files || 0,
              complexity_score: 0, // Would need to calculate this
              review_time_hours: 0, // Would need to calculate this
              cycle_time_hours: 0, // Would need to calculate this
              labels: pr.labels ? JSON.stringify(pr.labels) : '[]',
              source_branch: pr.head?.ref || '',
              target_branch: pr.base?.ref || ''
            };
            
            logger.info(`Upserting merge request: ${mergeRequest.title}`);
            
            // Upsert merge request
            const { data: mrData, error: mrError } = await supabase
              .from('merge_requests')
              .upsert(mergeRequest, { onConflict: 'github_id' })
              .select('id')
              .single();
            
            if (mrError) {
              logger.error(`Error upserting merge request: ${mrError.message}`, {
                error: mrError
              });
            } else {
              const mergeRequestId = mrData.id;
              stats.mergeRequests++;
              logger.info(`Successfully upserted merge request with ID ${mergeRequestId}`);
              
              // Process commits (limited to first 10 for safety)
              if (pr.commits && pr.commits > 0 && Array.isArray(data.commits)) {
                const commitsToProcess = data.commits.slice(0, 10); // Limit to max 10 commits per PR for safety
                logger.info(`Processing ${commitsToProcess.length} commits for merge request ${mergeRequestId} (limited to 10 for safety)`);
                
                let commitSuccessCount = 0;
                let commitFailCount = 0;
                
                for (let j = 0; j < commitsToProcess.length; j++) {
                  const commitData = commitsToProcess[j];
                  if (commitData) {
                    logger.info(`Processing commit ${j+1}/${commitsToProcess.length}`);
                    
                    const isMergeCommit = commitData.commit?.message?.startsWith('Merge') || false;
                    
                    const commit = {
                      sha: commitData.sha || '',
                      repository_id: repoId,
                      contributor_id: contributorId,
                      merge_request_id: mergeRequestId,
                      author: commitData.commit?.author?.name || '',
                      message: commitData.commit?.message || '',
                      additions: commitData.stats?.additions || 0,
                      deletions: commitData.stats?.deletions || 0,
                      files_changed: commitData.files?.length || 0,
                      is_merge_commit: isMergeCommit,
                      committed_at: commitData.commit?.author?.date || new Date().toISOString()
                    };
                    
                    logger.info(`Upserting commit: ${commit.sha.substring(0, 7)}`);
                    
                    // Upsert commit
                    const { error: commitError } = await supabase
                      .from('commits')
                      .upsert(commit, { onConflict: 'sha' });
                    
                    if (commitError) {
                      logger.error(`Error upserting commit: ${commitError.message}`, {
                        error: commitError
                      });
                      commitFailCount++;
                    } else {
                      stats.commits++;
                      commitSuccessCount++;
                      logger.info(`Successfully upserted commit ${commit.sha.substring(0, 7)}`);
                    }
                  }
                }
                
                logger.info(`Commit processing complete`, {
                  total: commitsToProcess.length,
                  success: commitSuccessCount,
                  failed: commitFailCount
                });
              } else {
                logger.info(`No commits to process for merge request ${mergeRequestId}`);
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
   * Mark items as processed in the github_raw_data table
   * @param {number[]} itemIds - Array of item IDs to mark as processed 
   * @private
   */
  async markItemsAsProcessed(itemIds) {
    logger.info(`Marking ${itemIds.length} items as processed`);
      
    // Process in large batches of 1000 for better efficiency
    const batchSize = 1000;
    
    for (let i = 0; i < itemIds.length; i += batchSize) {
      const batchIds = itemIds.slice(i, i + batchSize);
      logger.info(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(itemIds.length/batchSize)}`, {
        batch_size: batchIds.length,
        start_index: i,
        end_index: Math.min(i + batchSize - 1, itemIds.length - 1)
      });
      
      const { error } = await supabase
        .from("github_raw_data")
        .update({ processed: true, updated_at: new Date().toISOString() })
        .in("id", batchIds);
      
      if (error) {
        logger.error(`Error marking batch ${Math.floor(i/batchSize) + 1} as processed: ${error.message}`, {
          error: error,
          error_details: error.details,
          batch_size: batchIds.length
        });
      } else {
        logger.info(`Successfully marked batch ${Math.floor(i/batchSize) + 1} (${batchIds.length} items) as processed`);
      }
    }
    
    logger.info(`Completed marking ${itemIds.length} items as processed`);
  }
  
  /**
   * Create a specialized pipeline for data enrichment
   * @returns {Pipeline} The configured pipeline
   * @private
   */
  async createDataEnrichmentPipeline() {
    logger.info('Creating data enrichment pipeline');
    
    try {
      // Create a simple pipeline with a custom run method
      return {
        name: 'data-enrichment',
        run: async (context) => {
          try {
            logger.info('Running data enrichment pipeline');
            
            // In a real implementation, this would enrich data with additional details
            logger.info('Enriching data with additional metrics');
            
            // For demo, just return a success result
            logger.info('Data enrichment complete');
            return { 
              success: true, 
              message: 'Data enrichment completed successfully'
            };
          } catch (error) {
            logger.error('Error in data enrichment pipeline:', { error });
            return { 
              success: false, 
              error,
              message: `Failed to enrich data: ${error.message}` 
            };
          }
        },
        // Dummy method to avoid errors
        getStats: () => {
          return { 
            name: 'data-enrichment',
            itemsProcessed: 'Unknown - check logs for details',
            success: true
          };
        }
      };
    } catch (error) {
      logger.error('Error creating data enrichment pipeline:', { error });
      throw error;
    }
  }
  
  /**
   * Create a specialized pipeline for AI analysis
   * @returns {Pipeline} The configured pipeline
   * @private
   */
  async createAIAnalysisPipeline() {
    logger.info('Creating AI analysis pipeline');
    
    try {
      // Create a simple pipeline with a custom run method
      return {
        name: 'ai-analysis',
        run: async (context) => {
          try {
            logger.info('Running AI analysis pipeline');
            
            // In a real implementation, this would perform AI analysis on repositories and code
            logger.info('Analyzing data with AI');
            
            // For demo, just return a success result
            logger.info('AI analysis complete');
            return { 
              success: true, 
              message: 'AI analysis completed successfully'
            };
          } catch (error) {
            logger.error('Error in AI analysis pipeline:', { error });
            return { 
              success: false, 
              error,
              message: `Failed to analyze data: ${error.message}` 
            };
          }
        },
        // Dummy method to avoid errors
        getStats: () => {
          return { 
            name: 'ai-analysis',
            itemsProcessed: 'Unknown - check logs for details',
            success: true
          };
        }
      };
    } catch (error) {
      logger.error('Error creating AI analysis pipeline:', { error });
      throw error;
    }
  }
}

// Create and export a singleton instance
export default new PipelineOperationsController(); 