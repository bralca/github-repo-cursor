/**
 * Database Writer Processor
 * 
 * This processor handles storing processed data from pipeline stages in the Supabase database.
 * It supports batch operations, error handling, and retry logic for robust database persistence.
 */

import { BaseStage } from '../core/base-stage.js';
import { logger } from '../../utils/logger.js';
import { supabaseClientFactory } from '../../services/supabase/supabase-client.js';

/**
 * DatabaseWriterProcessor - Processor for writing processed data to the Supabase database
 */
export class DatabaseWriterProcessor extends BaseStage {
  /**
   * Create a new database writer processor
   * @param {Object} options - Processor options
   */
  constructor(options = {}) {
    super({
      name: 'database-writer',
      abortOnError: options.abortOnError ?? false,
      config: {
        batchSize: 50, // Default batch size for database operations
        maxRetries: 3, // Maximum number of retries for failed operations
        retryDelay: 1000, // Delay between retries in milliseconds
        ...options.config
      }
    });

    // Initialize Supabase client
    this.supabase = options.supabase || supabaseClientFactory.getClient();
  }

  /**
   * Execute the database writer processor
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} pipelineConfig - Pipeline configuration
   * @returns {Promise<PipelineContext>} Updated pipeline context
   */
  async execute(context, pipelineConfig) {
    this.log('info', 'Starting database writer processor');

    // Merge configuration from pipeline and processor
    const config = { ...this.config, ...pipelineConfig };

    try {
      // Process different types of entities if they exist in the context
      if (context.repositories?.length > 0) {
        await this.storeRepositories(context.repositories, context, config);
      }

      if (context.contributors?.length > 0) {
        await this.storeContributors(context.contributors, context, config);
      }

      if (context.mergeRequests?.length > 0) {
        await this.storeMergeRequests(context.mergeRequests, context, config);
      }

      if (context.commits?.length > 0) {
        await this.storeCommits(context.commits, context, config);
      }

      // Process entity relationships if they exist
      if (context.contributorRepositoryRelationships?.length > 0) {
        await this.storeContributorRepositoryRelationships(
          context.contributorRepositoryRelationships, 
          context, 
          config
        );
      }

      // Store statistics if they exist
      if (context.commitStatistics && Object.keys(context.commitStatistics).length > 0) {
        await this.storeCommitStatistics(context.commitStatistics, context, config);
      }

      if (context.mergeRequestStatistics && Object.keys(context.mergeRequestStatistics).length > 0) {
        await this.storeMergeRequestStatistics(context.mergeRequestStatistics, context, config);
      }

      this.log('info', 'Database writer processor completed successfully');
      return context;
    } catch (error) {
      this.log('error', 'Database writer processor failed', { error });
      context.recordError('database-writer', error);
      
      if (this.config.abortOnError) {
        throw error;
      }
      
      return context;
    }
  }

  /**
   * Store repositories in batches using upsert
   * @param {Array<Object>} repositories - Repositories to store
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async storeRepositories(repositories, context, config) {
    this.log('info', `Storing ${repositories.length} repositories`);
    
    // Process in batches for better efficiency
    const batches = this.createBatches(repositories, config.batchSize);
    let processedCount = 0;
    
    for (const batch of batches) {
      try {
        const repoData = batch.map(repo => ({
          id: repo.id,
          name: repo.name,
          description: repo.description,
          url: repo.url,
          stars: repo.stars || 0,
          forks: repo.forks || 0,
          is_enriched: repo.is_enriched || false,
          health_percentage: repo.health_percentage,
          open_issues_count: repo.open_issues_count || 0,
          last_updated: new Date().toISOString(),
          size_kb: repo.size_kb,
          watchers_count: repo.watchers_count || 0,
          primary_language: repo.primary_language,
          license: repo.license
        }));
        
        // Use upsert to insert or update repositories
        const { error, count } = await this.supabase
          .from('repositories')
          .upsert(repoData, { 
            onConflict: 'id', // Use the GitHub repository ID as the conflict resolution key
            returning: 'minimal' // Don't return the full records to improve performance
          });
        
        if (error) {
          this.log('error', 'Error upserting repositories', { error });
          context.recordError('database-writer-repository-upsert', error);
        } else {
          processedCount += batch.length;
          this.log('debug', `Upserted ${batch.length} repositories`);
        }
      } catch (error) {
        this.log('error', 'Error processing repository batch', { error });
        context.recordError('database-writer-repository-batch', error);
      }
    }
    
    this.log('info', `Processed ${processedCount} repositories with upsert operations`);
  }

  /**
   * Store contributors in batches using upsert
   * @param {Array<Object>} contributors - Contributors to store
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async storeContributors(contributors, context, config) {
    this.log('info', `Storing ${contributors.length} contributors`);
    
    // Process in batches for better efficiency
    const batches = this.createBatches(contributors, config.batchSize);
    let processedCount = 0;
    
    for (const batch of batches) {
      try {
        const contributorData = batch.map(contributor => ({
          id: contributor.id,
          username: contributor.username,
          name: contributor.name,
          avatar: contributor.avatar,
          is_enriched: contributor.is_enriched || false,
          bio: contributor.bio,
          company: contributor.company,
          blog: contributor.blog,
          twitter_username: contributor.twitter_username,
          location: contributor.location,
          followers: contributor.followers || 0,
          repositories: contributor.repositories || 0,
          impact_score: contributor.impact_score || 0,
          role_classification: contributor.role_classification,
          top_languages: contributor.top_languages || [],
          organizations: contributor.organizations || [],
          first_contribution: contributor.first_contribution,
          last_contribution: contributor.last_contribution,
          direct_commits: contributor.direct_commits || 0,
          pull_requests_merged: contributor.pull_requests_merged || 0,
          pull_requests_rejected: contributor.pull_requests_rejected || 0,
          code_reviews: contributor.code_reviews || 0,
          issues_opened: contributor.issues_opened || 0,
          issues_resolved: contributor.issues_resolved || 0
        }));
        
        // Use upsert to insert or update contributors
        const { error } = await this.supabase
          .from('contributors')
          .upsert(contributorData, { 
            onConflict: 'id', // Use the GitHub contributor ID (username) as the conflict resolution key
            returning: 'minimal' // Don't return the full records to improve performance
          });
        
        if (error) {
          this.log('error', 'Error upserting contributors', { error });
          context.recordError('database-writer-contributor-upsert', error);
        } else {
          processedCount += batch.length;
          this.log('debug', `Upserted ${batch.length} contributors`);
        }
      } catch (error) {
        this.log('error', 'Error processing contributor batch', { error });
        context.recordError('database-writer-contributor-batch', error);
      }
    }
    
    this.log('info', `Processed ${processedCount} contributors with upsert operations`);
  }

  /**
   * Store merge requests in batches using upsert
   * @param {Array<Object>} mergeRequests - Merge requests to store
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async storeMergeRequests(mergeRequests, context, config) {
    this.log('info', `Storing ${mergeRequests.length} merge requests`);
    
    // Process in batches for better efficiency
    const batches = this.createBatches(mergeRequests, config.batchSize);
    let processedCount = 0;
    
    for (const batch of batches) {
      try {
        const mrData = batch.map(mergeRequest => ({
          id: mergeRequest.id,
          title: mergeRequest.title,
          description: mergeRequest.description,
          status: mergeRequest.status,
          author: mergeRequest.author,
          author_avatar: mergeRequest.author_avatar,
          created_at: mergeRequest.created_at,
          updated_at: mergeRequest.updated_at,
          closed_at: mergeRequest.closed_at,
          merged_at: mergeRequest.merged_at,
          base_branch: mergeRequest.base_branch,
          head_branch: mergeRequest.head_branch,
          repository_id: mergeRequest.repository_id,
          commits: mergeRequest.commits || 0,
          files_changed: mergeRequest.files_changed || 0,
          review_comments: mergeRequest.review_comments || 0,
          lines_added: mergeRequest.lines_added || 0,
          lines_removed: mergeRequest.lines_removed || 0,
          cycle_time_hours: mergeRequest.cycle_time_hours,
          review_time_hours: mergeRequest.review_time_hours,
          complexity_score: mergeRequest.complexity_score,
          is_enriched: mergeRequest.is_enriched || false,
          github_link: mergeRequest.github_link,
          labels: mergeRequest.labels || []
        }));
        
        // Use upsert to insert or update merge requests
        const { error } = await this.supabase
          .from('merge_requests')
          .upsert(mrData, { 
            onConflict: 'id', // Use the GitHub PR ID as the conflict resolution key
            returning: 'minimal' // Don't return the full records to improve performance
          });
        
        if (error) {
          this.log('error', 'Error upserting merge requests', { error });
          context.recordError('database-writer-merge-request-upsert', error);
        } else {
          processedCount += batch.length;
          this.log('debug', `Upserted ${batch.length} merge requests`);
        }
      } catch (error) {
        this.log('error', 'Error processing merge request batch', { error });
        context.recordError('database-writer-merge-request-batch', error);
      }
    }
    
    this.log('info', `Processed ${processedCount} merge requests with upsert operations`);
  }

  /**
   * Store commits in batches using upsert
   * @param {Array<Object>} commits - Commits to store
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async storeCommits(commits, context, config) {
    this.log('info', `Storing ${commits.length} commits`);
    
    // Process in batches for better efficiency
    const batches = this.createBatches(commits, config.batchSize);
    let processedCount = 0;
    let hashes = []; // Keep track of processed commit hashes for statistics
    
    for (const batch of batches) {
      try {
        // First, fetch existing commits to check which ones we already have
        // This is needed because we need to know the UUID for existing commits
        const commitHashes = batch.map(commit => commit.hash);
        const { data: existingCommits, error: queryError } = await this.supabase
          .from('commits')
          .select('id, hash')
          .in('hash', commitHashes);
        
        if (queryError) {
          this.log('error', 'Error checking existing commits', { error: queryError });
          context.recordError('database-writer-commit-query', queryError);
          continue;
        }
        
        // Create a map of hash to id for existing commits
        const hashToIdMap = {};
        if (existingCommits) {
          existingCommits.forEach(commit => {
            hashToIdMap[commit.hash] = commit.id;
          });
        }
        
        // Process each commit in the batch
        for (const commit of batch) {
          // Store the hash for statistics processing
          hashes.push(commit.hash);
          
          const commitData = {
            hash: commit.hash, // Hash is our conflict key
            title: commit.title,
            author: commit.author,
            date: commit.date,
            diff: commit.diff,
            repository_id: commit.repository_id,
            merge_request_id: commit.merge_request_id,
            is_analyzed: commit.is_analyzed || context.commitStatistics?.[commit.hash] ? true : false,
            is_enriched: commit.is_enriched || false,
            files_changed: commit.files_changed,
            author_email: commit.author_email,
            author_name: commit.author_name,
            committer_name: commit.committer_name,
            committer_email: commit.committer_email,
            message_body: commit.message_body,
            verification_verified: commit.verification_verified,
            verification_reason: commit.verification_reason,
            stats_additions: commit.stats_additions,
            stats_deletions: commit.stats_deletions,
            stats_total: commit.stats_total,
            parents: commit.parents,
            authored_date: commit.authored_date || commit.date,
            committed_date: commit.committed_date || commit.date
          };
          
          // If we already have an ID for this commit, include it
          if (hashToIdMap[commit.hash]) {
            commitData.id = hashToIdMap[commit.hash];
          }
          
          // Use upsert to insert or update the commit
          const { error: upsertError } = await this.supabase
            .from('commits')
            .upsert([commitData], { 
              onConflict: 'hash', // Use the commit hash as the conflict resolution key
              returning: 'minimal' // Don't return the full records to improve performance
            });
          
          if (upsertError) {
            this.log('error', `Error upserting commit: ${commit.hash}`, { error: upsertError });
            context.recordError('database-writer-commit-upsert', upsertError);
          } else {
            processedCount++;
          }
        }
        
        this.log('debug', `Upserted ${batch.length} commits`);
      } catch (error) {
        this.log('error', 'Error processing commit batch', { error });
        context.recordError('database-writer-commit-batch', error);
      }
    }
    
    this.log('info', `Processed ${processedCount} commits with upsert operations`);
    
    // Store the processed commit hashes in the context for statistics lookup
    context.processedCommitHashes = hashes;
  }

  /**
   * Store contributor-repository relationships using upsert
   * @param {Array<Object>} relationships - Relationships to store
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async storeContributorRepositoryRelationships(relationships, context, config) {
    this.log('info', `Storing ${relationships.length} contributor-repository relationships`);
    
    // Process in batches for better efficiency
    const batches = this.createBatches(relationships, config.batchSize);
    let processedCount = 0;
    
    for (const batch of batches) {
      try {
        // To handle updates for existing relationships, we need to first fetch them
        // Get unique combinations of contributor_id and repository_id
        const relationshipKeys = batch.map(rel => ({
          contributor_id: rel.contributor_id,
          repository_id: rel.repository_id
        }));
        
        // Fetch existing relationships to check contribution counts
        const { data: existingRelationships, error: queryError } = await this.supabase
          .from('contributor_repository')
          .select('contributor_id, repository_id, contribution_count')
          .in('contributor_id', batch.map(rel => rel.contributor_id))
          .in('repository_id', batch.map(rel => rel.repository_id));
        
        if (queryError) {
          this.log('error', 'Error checking existing relationships', { error: queryError });
          context.recordError('database-writer-relationship-query', queryError);
          continue;
        }
        
        // Create a map for quick lookup of existing relationships
        const existingRelMap = {};
        if (existingRelationships) {
          existingRelationships.forEach(rel => {
            const key = `${rel.contributor_id}:${rel.repository_id}`;
            existingRelMap[key] = rel.contribution_count;
          });
        }
        
        // Prepare data for upsert
        const relData = batch.map(rel => {
          const key = `${rel.contributor_id}:${rel.repository_id}`;
          const existingCount = existingRelMap[key] || 0;
          
          return {
            contributor_id: rel.contributor_id,
            repository_id: rel.repository_id,
            // If a specific count is provided, use it, otherwise increment the existing count
            contribution_count: rel.contribution_count || (existingCount + 1)
          };
        });
        
        // Use upsert to insert or update relationships
        const { error } = await this.supabase
          .from('contributor_repository')
          .upsert(relData, { 
            onConflict: 'contributor_id,repository_id', // Composite conflict key
            returning: 'minimal' // Don't return the full records to improve performance
          });
        
        if (error) {
          this.log('error', 'Error upserting contributor-repository relationships', { error });
          context.recordError('database-writer-relationship-upsert', error);
        } else {
          processedCount += batch.length;
          this.log('debug', `Upserted ${batch.length} contributor-repository relationships`);
        }
      } catch (error) {
        this.log('error', 'Error processing relationship batch', { error });
        context.recordError('database-writer-relationship-batch', error);
      }
    }
    
    this.log('info', `Processed ${processedCount} contributor-repository relationships with upsert operations`);
  }

  /**
   * Store commit statistics
   * @param {Object} commitStatistics - Commit statistics to store
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async storeCommitStatistics(commitStatistics, context, config) {
    this.log('info', `Storing commit statistics for ${Object.keys(commitStatistics).length} commits`);
    
    // First check if analysis_prompts table has records (required for storing analyses)
    try {
      const { data: analysisPrompts, error } = await this.supabase
        .from('analysis_prompts')
        .select('id')
        .limit(1);
      
      if (error) {
        this.log('error', 'Error checking analysis_prompts table', { error });
        context.recordError('database-writer-commit-stats-prompts-check', error);
        return;
      }
      
      if (!analysisPrompts || analysisPrompts.length === 0) {
        this.log('warn', 'No analysis prompts found in database, skipping commit statistics');
        return;
      }
    } catch (error) {
      this.log('error', 'Exception checking analysis_prompts table', { error });
      context.recordError('database-writer-commit-stats-prompts-exception', error);
      return;
    }
    
    // We need to first fetch all commits by hash to get their IDs
    const commitHashes = Object.keys(commitStatistics);
    let storedCount = 0;
    
    // Process in batches to avoid overloading with too many hashes in a single query
    const hashBatches = this.createBatches(commitHashes, config.batchSize);
    
    for (const hashBatch of hashBatches) {
      try {
        // Get commit IDs for this batch of hashes
        const { data: commits, error: queryError } = await this.supabase
          .from('commits')
          .select('id, hash')
          .in('hash', hashBatch);
        
        if (queryError) {
          this.log('error', 'Error fetching commits for statistics', { error: queryError });
          context.recordError('database-writer-commit-stats-query', queryError);
          continue;
        }
        
        if (!commits || commits.length === 0) {
          this.log('warn', 'No matching commits found for statistics batch');
          continue;
        }
        
        // Create a hash-to-id mapping
        const hashToIdMap = {};
        commits.forEach(commit => {
          hashToIdMap[commit.hash] = commit.id;
        });
        
        // Process each commit separately to avoid batch issues
        for (const hash of hashBatch) {
          const commitId = hashToIdMap[hash];
          if (!commitId) {
            this.log('warn', `Commit not found for statistics: ${hash}`);
            continue;
          }
          
          const stats = commitStatistics[hash];
          
          // Process each analysis type separately
          try {
            // Add code impact analysis if available
            if (stats.code_impact) {
              // Convert the 0-100 score to a 1-10 range
              // First ensure it's between 0-100
              const rawScore = Math.min(Math.max(Math.round(stats.code_impact.score || 0), 0), 100);
              // Then convert to 1-10 scale
              const score = Math.max(1, Math.min(10, Math.ceil(rawScore / 10)));
              
              // Skip analysis insertion if it doesn't have a prompt_id
              if (!stats.code_impact.prompt_id) {
                this.log('warn', `Skipping code impact analysis for ${hash}: missing prompt_id`);
              } else {
                this.log('debug', `Inserting code impact analysis with score: ${score} (from ${rawScore})`, { hash });
                
                try {
                  const { error } = await this.supabase
                    .from('commit_analyses')
                    .insert({
                      commit_id: commitId,
                      title: 'Code Impact Analysis',
                      content: JSON.stringify(stats.code_impact),
                      icon: 'chart-line',
                      score,
                      prompt_id: stats.code_impact.prompt_id
                    });
                  
                  if (error) {
                    this.log('error', `Error storing code impact analysis for ${hash}`, { error, score });
                    context.recordError('database-writer-commit-analyses-code-impact', error);
                  }
                } catch (error) {
                  this.log('error', `Exception storing code impact analysis for ${hash}`, { error });
                  context.recordError('database-writer-commit-analyses-code-impact-exception', error);
                }
              }
            }
            
            // Add complexity analysis if available
            if (stats.complexity) {
              // Convert the 0-100 score to a 1-10 range
              // First ensure it's between 0-100
              const rawScore = Math.min(Math.max(Math.round(stats.complexity.score || 0), 0), 100);
              // Then convert to 1-10 scale
              const score = Math.max(1, Math.min(10, Math.ceil(rawScore / 10)));
              
              // Skip analysis insertion if it doesn't have a prompt_id
              if (!stats.complexity.prompt_id) {
                this.log('warn', `Skipping complexity analysis for ${hash}: missing prompt_id`);
              } else {
                this.log('debug', `Inserting complexity analysis with score: ${score} (from ${rawScore})`, { hash });
                
                try {
                  const { error } = await this.supabase
                    .from('commit_analyses')
                    .insert({
                      commit_id: commitId,
                      title: 'Complexity Analysis',
                      content: JSON.stringify(stats.complexity),
                      icon: 'chart-network',
                      score,
                      prompt_id: stats.complexity.prompt_id
                    });
                  
                  if (error) {
                    this.log('error', `Error storing complexity analysis for ${hash}`, { error, score });
                    context.recordError('database-writer-commit-analyses-complexity', error);
                  }
                } catch (error) {
                  this.log('error', `Exception storing complexity analysis for ${hash}`, { error });
                  context.recordError('database-writer-commit-analyses-complexity-exception', error);
                }
              }
            }
            
            // Add classification analysis if available
            if (stats.classification) {
              // Convert the 0-1 confidence to a 1-10 score
              // First convert to 0-100 percentage
              const rawScore = Math.min(Math.max(Math.round(stats.classification.confidence * 100 || 0), 0), 100);
              // Then convert to 1-10 scale
              const score = Math.max(1, Math.min(10, Math.ceil(rawScore / 10)));
              
              // Skip analysis insertion if it doesn't have a prompt_id
              if (!stats.classification.prompt_id) {
                this.log('warn', `Skipping classification analysis for ${hash}: missing prompt_id`);
              } else {
                this.log('debug', `Inserting classification analysis with score: ${score} (from ${rawScore})`, { hash });
                
                try {
                  const { error } = await this.supabase
                    .from('commit_analyses')
                    .insert({
                      commit_id: commitId,
                      title: 'Commit Classification',
                      content: JSON.stringify(stats.classification),
                      icon: 'tag',
                      score,
                      prompt_id: stats.classification.prompt_id
                    });
                  
                  if (error) {
                    this.log('error', `Error storing classification analysis for ${hash}`, { error, score });
                    context.recordError('database-writer-commit-analyses-classification', error);
                  }
                } catch (error) {
                  this.log('error', `Exception storing classification analysis for ${hash}`, { error });
                  context.recordError('database-writer-commit-analyses-classification-exception', error);
                }
              }
            }
            
            storedCount++;
          } catch (error) {
            this.log('error', `Error processing statistics for commit: ${hash}`, { error });
            context.recordError('database-writer-commit-stats-process', error);
          }
        }
      } catch (error) {
        this.log('error', 'Error processing statistics batch', { error });
        context.recordError('database-writer-commit-stats-batch', error);
      }
    }
    
    this.log('info', `Stored statistics for ${storedCount} commits`);
  }

  /**
   * Store merge request statistics
   * @param {Object} mergeRequestStatistics - Merge request statistics to store
   * @param {PipelineContext} context - Pipeline context
   * @param {Object} config - Configuration
   * @returns {Promise<void>}
   */
  async storeMergeRequestStatistics(mergeRequestStatistics, context, config) {
    this.log('info', `Storing merge request statistics for ${Object.keys(mergeRequestStatistics).length} merge requests`);
    
    // Not implemented yet, will be added in future updates
    this.log('warn', 'Merge request statistics storage not implemented yet');
  }

  /**
   * Create batch arrays from a larger array for efficient processing
   * @param {Array<any>} items - Items to batch
   * @param {number} batchSize - Size of each batch
   * @returns {Array<Array<any>>} Array of batches
   */
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Helper method for logging with context
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  log(level, message, meta = {}) {
    logger[level](message, {
      stage: this.name,
      ...meta
    });
  }
} 