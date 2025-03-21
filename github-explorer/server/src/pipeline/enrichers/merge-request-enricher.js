/**
 * MergeRequestEnricher
 * 
 * Enriches merge request data with additional details from GitHub API.
 * This includes fetching commit data and enriching both the merge request
 * and all its commits with their file-specific changes.
 */

import { v4 as uuidv4 } from 'uuid';
import { setupLogger } from '../../utils/logger.js';

class MergeRequestEnricher {
  constructor(db, githubClient) {
    this.db = db;
    this.githubClient = githubClient;
    this.logger = setupLogger('MergeRequestEnricher');
    
    // Stats tracking
    this.stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      commitsProcessed: 0,
      filesProcessed: 0
    };
  }
  
  /**
   * Enriches all unenriched merge requests in the database
   * 
   * @param {number} batchSize - Number of merge requests to process in each batch
   * @returns {object} Statistics about the enrichment run
   */
  async enrichAllMergeRequests(batchSize = 10) {
    this.logger.info('Starting enrichment of all unenriched merge requests');
    let offset = 0;
    let hasMore = true;
    
    this.resetStats();
    
    while (hasMore) {
      // Check for rate limits before processing batch
      await this.handleRateLimiting();
      
      // Get a batch of unenriched merge requests
      const mergeRequests = await this.getUnenrichedMergeRequests(batchSize, offset);
      this.logger.info(`Found ${mergeRequests.length} unenriched merge requests (offset: ${offset})`);
      
      if (mergeRequests.length === 0) {
        hasMore = false;
        break;
      }
      
      // Process this batch
      for (const mr of mergeRequests) {
        try {
          await this.enrichMergeRequest(mr);
          this.stats.processed++;
          this.stats.successful++;
        } catch (error) {
          this.stats.processed++;
          this.stats.failed++;
          this.logger.error(`Error enriching merge request ${mr.repository_full_name}#${mr.github_id}: ${error.message}`);
          
          // If it's a rate limit error, wait and try again
          if (error.message && error.message.includes('API rate limit exceeded')) {
            this.logger.warn('Rate limit reached, waiting before continuing');
            await this.handleRateLimiting(true);
            
            try {
              this.logger.info(`Retrying merge request ${mr.repository_full_name}#${mr.github_id}`);
              await this.enrichMergeRequest(mr);
              // Correct the stats since we successfully processed after retry
              this.stats.failed--;
              this.stats.successful++;
            } catch (retryError) {
              this.logger.error(`Retry failed for merge request ${mr.repository_full_name}#${mr.github_id}: ${retryError.message}`);
            }
          }
        }
      }
      
      offset += mergeRequests.length;
    }
    
    this.logger.info(`Completed enrichment of merge requests`);
    this.logger.info(`Processed: ${this.stats.processed}, Successful: ${this.stats.successful}, Failed: ${this.stats.failed}`);
    this.logger.info(`Commits processed: ${this.stats.commitsProcessed}, Files processed: ${this.stats.filesProcessed}`);
    
    return this.stats;
  }
  
  /**
   * Resets the statistics counters
   */
  resetStats() {
    this.stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      commitsProcessed: 0,
      filesProcessed: 0
    };
  }
  
  /**
   * Gets a batch of merge requests that haven't been enriched yet
   * 
   * @param {number} batchSize - Size of the batch to retrieve
   * @param {number} offset - Offset to start from
   * @returns {Array} Array of merge request objects
   */
  async getUnenrichedMergeRequests(batchSize = 10, offset = 0) {
    this.logger.info('Executing query to get unenriched merge requests');
    
    // First, check if this is a problem with GitHub's internal ID vs PR number
    const sampleMR = await this.db.get(`
      SELECT mr.id, mr.github_id, mr.title, r.full_name as repository_full_name, mr.enrichment_attempts
      FROM merge_requests mr
      JOIN repositories r ON mr.repository_id = r.id
      WHERE mr.is_enriched = 0
      LIMIT 1`);
      
    if (sampleMR) {
      this.logger.info(`Sample merge request: ID=${sampleMR.id}, github_id=${sampleMR.github_id}, repo=${sampleMR.repository_full_name}`);
      
      // If github_id is a large number (like 2394981353), it's probably GitHub's internal ID, not a PR number
      if (sampleMR.github_id > 1000000) {
        this.logger.warn(`github_id value (${sampleMR.github_id}) appears to be GitHub's internal ID, not a PR number. Setting enriched=1 to skip.`);
        
        // Mark these as enriched since we can't process them without the actual PR number
        await this.db.run(`
          UPDATE merge_requests
          SET is_enriched = 1, enrichment_attempts = 3
          WHERE id = ?`, [sampleMR.id]);
          
        this.logger.info(`Marked merge request ${sampleMR.id} as enriched to skip it.`);
      }
    }
    
    const query = `
      SELECT mr.id, mr.github_id, mr.title, r.full_name as repository_full_name, 
             r.id as repository_id, r.github_id as repository_github_id,
             mr.author_id, mr.author_github_id, mr.enrichment_attempts
      FROM merge_requests mr
      JOIN repositories r ON mr.repository_id = r.id
      WHERE mr.is_enriched = 0 AND mr.enrichment_attempts < 3
      ORDER BY mr.enrichment_attempts ASC, mr.github_id ASC
      LIMIT ? OFFSET ?`;
    
    return await this.db.all(query, [batchSize, offset]);
  }
  
  /**
   * Handles GitHub API rate limiting by checking limits and waiting if necessary
   * 
   * @param {boolean} forceWait - Whether to force waiting even if rate limit isn't reached yet
   */
  async handleRateLimiting(forceWait = false) {
    const rateLimitData = await this.githubClient.getRateLimits();
    const rateLimitInfo = rateLimitData.resources.core;
    
    // If rate limit is low or we're forcing a wait
    if (forceWait || rateLimitInfo.remaining < 20) {
      const resetDate = new Date(rateLimitInfo.reset * 1000);
      const waitTimeMs = (resetDate.getTime() - Date.now()) + 1000; // Add 1 second buffer
      
      if (waitTimeMs > 0) {
        this.logger.warn(`Rate limit at ${rateLimitInfo.remaining}/${rateLimitInfo.limit}. Waiting ${Math.ceil(waitTimeMs/1000)} seconds until ${resetDate.toISOString()}`);
        await new Promise(resolve => setTimeout(resolve, waitTimeMs));
        this.logger.info('Rate limit wait complete, continuing enrichment');
      }
    }
  }
  
  /**
   * Enriches a single merge request with data from GitHub API
   * 
   * @param {object} mergeRequest - Merge request object with basic data
   */
  async enrichMergeRequest(mergeRequest) {
    const { repository_full_name, id, github_id } = mergeRequest;
    this.logger.info(`Processing merge request ${repository_full_name} with ID ${id} and github_id ${github_id}`);
    
    // Split repository full name into owner and repo
    const [owner, repo] = repository_full_name.split('/');
    
    if (!owner || !repo) {
      throw new Error(`Invalid repository name format: ${repository_full_name}`);
    }
    
    // First, increment the attempt counter
    try {
      await this.db.run(
        'UPDATE merge_requests SET enrichment_attempts = enrichment_attempts + 1 WHERE id = ?',
        [id]
      );
      
      this.logger.info(`Incrementing enrichment attempt for merge request ${repository_full_name}#${github_id} (ID: ${id}), attempt #${mergeRequest.enrichment_attempts + 1}`);
    } catch (error) {
      this.logger.error(`Error updating enrichment attempt counter for merge request ${id}`, { error });
      // Continue with enrichment even if counter update fails
    }
    
    try {
      // First get the PR number from the raw data
      const rawData = await this.db.get(`
        SELECT data FROM closed_merge_requests_raw 
        WHERE JSON_EXTRACT(data, '$.pull_request.pr_number') = ? 
           OR JSON_EXTRACT(data, '$.pull_request.number') = ?`, [github_id, github_id]);
      
      if (!rawData) {
        this.logger.warn(`No raw data found for merge request with github_id ${github_id}. Setting enriched=1 to skip.`);
        await this.db.run(`UPDATE merge_requests SET is_enriched = 1 WHERE id = ?`, [id]);
        return false;
      }
      
      // Parse the raw data
      let prData;
      try {
        prData = JSON.parse(rawData.data);
        if (!prData || !prData.pull_request) {
          throw new Error('Invalid PR data structure');
        }
      } catch (parseError) {
        this.logger.error(`Error parsing raw PR data for ${github_id}`, { error: parseError });
        
        // Check if this is the third attempt
        if (mergeRequest.enrichment_attempts >= 2) {
          this.logger.warn(`Maximum enrichment attempts reached for merge request ${repository_full_name}#${github_id}, marking as enriched`);
          await this.db.run(`UPDATE merge_requests SET is_enriched = 1 WHERE id = ?`, [id]);
        }
        
        return false;
      }
      
      // Get PR number - try both fields since data structure might vary
      const prNumber = prData.pull_request.pr_number || prData.pull_request.number;
      
      if (!prNumber) {
        this.logger.error(`Could not determine PR number for ${github_id}`);
        
        // Check if this is the third attempt
        if (mergeRequest.enrichment_attempts >= 2) {
          this.logger.warn(`Maximum enrichment attempts reached for merge request ${repository_full_name}#${github_id}, marking as enriched`);
          await this.db.run(`UPDATE merge_requests SET is_enriched = 1 WHERE id = ?`, [id]);
        }
        
        return false;
      }
      
      this.logger.info(`Found PR number ${prNumber} for merge request with github_id ${github_id}`);
      
      // Get commits for the PR
      await this.handleRateLimiting();
      const commitsResponse = await this.githubClient.getPullRequestCommits(owner, repo, prNumber);
      
      // Extract commits array from the response
      const commits = commitsResponse && commitsResponse.data ? commitsResponse.data : null;
      
      this.logger.info(`Found ${commits ? commits.length : 'undefined'} commits for PR #${prNumber}`);
      
      // Check if commits is undefined or null
      if (!commits || !Array.isArray(commits)) {
        this.logger.warn(`No valid commits array returned for PR #${prNumber}. Marking as enriched with minimal data.`);
        await this.updateMergeRequest(id, {
          commits_count: 0,
          is_enriched: 1,
          updated_at: new Date().toISOString()
        });
        return true;
      }
      
      // Update merge request with commit count
      await this.updateMergeRequest(id, {
        commits_count: commits.length,
        is_enriched: 1, // Mark as enriched now that we have the data
        updated_at: new Date().toISOString()
      });
      
      // Process each commit
      let totalAdditions = 0;
      let totalDeletions = 0;
      
      for (const commit of commits) {
        await this.handleRateLimiting();
        
        // Process commit data
        try {
          // Get contributor information
          const contributorData = await this.processContributor(commit.author);
          
          // Process each file in the commit
          await this.processCommit(commit, mergeRequest);
          
          // Update additions/deletions totals from commit stats
          if (commit.stats) {
            totalAdditions += commit.stats.additions || 0;
            totalDeletions += commit.stats.deletions || 0;
          }
          
          this.stats.commitsProcessed++;
        } catch (commitError) {
          this.logger.error(`Error processing commit ${commit.sha} for PR #${prNumber}`, { error: commitError });
          // Continue with next commit
        }
      }
      
      // Update merge request with additions/deletions totals
      await this.updateMergeRequest(id, {
        additions: totalAdditions,
        deletions: totalDeletions,
        updated_at: new Date().toISOString()
      });
      
      this.logger.info(`Successfully enriched merge request ${repository_full_name}#${prNumber}`);
      this.stats.successful++;
      return true;
    } catch (error) {
      // Check if this is a rate limit error
      const isRateLimitError = error.status === 403 && 
        (error.message.includes('rate limit') || 
         (error.response && error.response.headers && 
          error.response.headers['x-ratelimit-remaining'] === '0'));
      
      if (isRateLimitError) {
        this.logger.warn(`Rate limit hit when enriching merge request ${repository_full_name}#${github_id}`, { error });
        
        // Don't increment the attempt counter for rate limit errors
        // Revert the attempt counter increment we did at the start
        try {
          await this.db.run(
            'UPDATE merge_requests SET enrichment_attempts = enrichment_attempts - 1 WHERE id = ?',
            [id]
          );
        } catch (counterError) {
          this.logger.error(`Error reverting enrichment attempt counter for merge request ${id}`, { counterError });
          // Continue even if counter update fails
        }
        
        throw error; // Re-throw to trigger rate limit handling
      }
      
      this.logger.error(`Error enriching merge request ${repository_full_name}#${github_id}`, { error });
      this.stats.failed++;
      
      // If this was the 3rd attempt, mark as enriched to prevent further attempts
      if (mergeRequest.enrichment_attempts >= 2) { // This is already the 3rd attempt (0-indexed)
        this.logger.warn(`Maximum enrichment attempts reached for merge request ${repository_full_name}#${github_id}, marking as failed but enriched`);
        
        try {
          await this.db.run(
            `UPDATE merge_requests SET 
             is_enriched = 1,
             updated_at = ? 
             WHERE id = ?`,
            [new Date().toISOString(), id]
          );
        } catch (updateError) {
          this.logger.error(`Error marking merge request ${id} as enriched after max attempts`, { updateError });
        }
      }
      
      return false;
    }
  }
  
  /**
   * Process a GitHub contributor and ensure they exist in our database
   * 
   * @param {object} userData - GitHub user data
   * @returns {string} Contributor UUID
   */
  async processContributor(userData) {
    if (!userData) return null;
    
    // Generate UUID for new contributors
    const contributorId = uuidv4();
    
    try {
      // Upsert the contributor
      await this.db.run(`
        INSERT INTO contributors 
        (id, github_id, username, name, avatar, is_enriched)
        VALUES (?, ?, ?, ?, ?, 0)
        ON CONFLICT (github_id) 
        DO UPDATE SET
          username = COALESCE(excluded.username, username),
          name = COALESCE(excluded.name, name),
          avatar = COALESCE(excluded.avatar, avatar),
          updated_at = CURRENT_TIMESTAMP`,
        [
          contributorId, 
          userData.id, 
          userData.login, 
          userData.name || userData.login, 
          userData.avatar_url
        ]
      );
      
      // Get the id of the existing or newly inserted contributor
      const contributor = await this.db.get(
        'SELECT id FROM contributors WHERE github_id = ?', [userData.id]
      );
      
      return contributor ? contributor.id : null;
    } catch (error) {
      this.logger.error(`Error upserting contributor ${userData.login}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Process a commit and all its files
   * 
   * @param {object} commit - GitHub commit object with files array
   * @param {object} mergeRequest - Merge request this commit belongs to
   */
  async processCommit(commit, mergeRequest) {
    // Get or create contributor for commit author
    let contributorId = null;
    let contributorGithubId = null;
    
    if (commit.author) {
      contributorId = await this.processContributor(commit.author);
      contributorGithubId = commit.author.id;
    }
    
    // Get repository details for the API call
    const [owner, repo] = mergeRequest.repository_full_name.split('/');
    
    // Fetch full commit details to get files information
    try {
      // Get full commit details from GitHub API which includes files
      await this.handleRateLimiting();
      const fullCommitDetails = await this.githubClient.getCommit(owner, repo, commit.sha);
      
      // Update commit with full details
      if (fullCommitDetails) {
        // Merge the commit objects, prioritizing fullCommitDetails
        Object.assign(commit, fullCommitDetails);
      }
    } catch (error) {
      this.logger.warn(`Could not fetch full commit details for ${commit.sha} in ${mergeRequest.repository_full_name}`, { error: error.message });
      // Continue with what we have
    }
    
    // We need to process each file separately since our schema has one row per file
    let files = commit.files || [];
    
    // Fallback strategy: If we still don't have files, try to get PR files
    if (files.length === 0 && mergeRequest.github_id) {
      try {
        this.logger.info(`No files found for commit ${commit.sha}, attempting to fetch PR files as fallback`);
        await this.handleRateLimiting();
        const prFilesResponse = await this.githubClient.getPullRequestFiles(owner, repo, mergeRequest.github_id);
        
        if (prFilesResponse && prFilesResponse.data && prFilesResponse.data.length > 0) {
          files = prFilesResponse.data;
          this.logger.info(`Found ${files.length} files from PR #${mergeRequest.github_id} to use as fallback`);
        }
      } catch (fallbackError) {
        this.logger.warn(`Failed to fetch PR files as fallback for commit ${commit.sha}`, { error: fallbackError.message });
      }
    }
    
    if (files.length === 0) {
      // No file data - create one commit record with null filename
      await this.createCommitRecord(
        commit, 
        mergeRequest, 
        contributorId, 
        contributorGithubId, 
        null, // No filename
        null, // No status
        0,    // No additions
        0,    // No deletions
        null  // No patch
      );
      this.stats.filesProcessed++;
      return;
    }
    
    // Create a commit record for each file
    for (const file of files) {
      await this.createCommitRecord(
        commit,
        mergeRequest,
        contributorId,
        contributorGithubId,
        file.filename,
        file.status,
        file.additions || 0,
        file.deletions || 0,
        file.patch || null
      );
      this.stats.filesProcessed++;
    }
  }
  
  /**
   * Creates or updates a commit record for a specific file
   * 
   * @param {object} commit - GitHub commit object
   * @param {object} mergeRequest - Merge request this commit belongs to
   * @param {string} contributorId - UUID of the contributor
   * @param {number} contributorGithubId - GitHub ID of the contributor
   * @param {string} filename - Name of the file
   * @param {string} status - Status of the file change (added, modified, removed)
   * @param {number} additions - Number of lines added
   * @param {number} deletions - Number of lines removed
   * @param {string} patch - Git patch content
   */
  async createCommitRecord(commit, mergeRequest, contributorId, contributorGithubId, filename, status, additions, deletions, patch) {
    const commitId = uuidv4();
    
    // Determine if this is a merge commit by checking parent count
    const isMergeCommit = commit.parents && commit.parents.length > 1 ? 1 : 0;
    
    // Prepare parents JSON
    const parents = JSON.stringify((commit.parents || []).map(p => p.sha || p));
    
    // Get commit message and date
    const message = commit.commit ? commit.commit.message : '';
    const committedAt = commit.commit && commit.commit.author ? commit.commit.author.date : null;
    
    // Log warning for missing filename
    if (!filename) {
      this.logger.warn(`Missing filename for commit ${commit.sha} in ${mergeRequest.repository_full_name}. This might indicate an issue with GitHub API response or a commit with no file changes.`);
    }
    
    try {
      // Upsert the commit record
      await this.db.run(`
        INSERT INTO commits (
          id, github_id, repository_id, repository_github_id,
          contributor_id, contributor_github_id,
          pull_request_id, pull_request_github_id,
          message, committed_at, parents,
          filename, status, additions, deletions, patch,
          is_merge_commit, is_enriched, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (github_id, repository_id, filename) 
        DO UPDATE SET
          contributor_id = COALESCE(excluded.contributor_id, contributor_id),
          contributor_github_id = COALESCE(excluded.contributor_github_id, contributor_github_id),
          pull_request_id = COALESCE(excluded.pull_request_id, pull_request_id),
          pull_request_github_id = COALESCE(excluded.pull_request_github_id, pull_request_github_id),
          message = COALESCE(excluded.message, message),
          committed_at = COALESCE(excluded.committed_at, committed_at),
          parents = COALESCE(excluded.parents, parents),
          status = COALESCE(excluded.status, status),
          additions = COALESCE(excluded.additions, additions),
          deletions = COALESCE(excluded.deletions, deletions),
          patch = COALESCE(excluded.patch, patch),
          is_merge_commit = COALESCE(excluded.is_merge_commit, is_merge_commit),
          is_enriched = 1,
          updated_at = CURRENT_TIMESTAMP`,
        [
          commitId,
          commit.sha,
          mergeRequest.repository_id,
          mergeRequest.repository_github_id,
          contributorId,
          contributorGithubId,
          mergeRequest.id,
          mergeRequest.github_id,
          message,
          committedAt,
          parents,
          filename,
          status,
          additions,
          deletions,
          patch,
          isMergeCommit
        ]
      );
    } catch (error) {
      this.logger.error(`Error upserting commit ${commit.sha} file ${filename}: ${error.message}`);
    }
  }
  
  /**
   * Updates a merge request with enriched data
   * 
   * @param {string} id - UUID of the merge request
   * @param {object} updateData - New data to update
   */
  async updateMergeRequest(id, updateData) {
    const queryParams = [];
    const updateFields = [];
    
    // Build update statement dynamically
    Object.keys(updateData).forEach(key => {
      updateFields.push(`${key} = ?`);
      queryParams.push(updateData[key]);
    });
    
    // Add the ID as the last parameter
    queryParams.push(id);
    
    const query = `UPDATE merge_requests SET ${updateFields.join(', ')} WHERE id = ?`;
    await this.db.run(query, queryParams);
  }
  
  /**
   * Close the database connection
   * Note: In this implementation, we don't actually close the DB connection
   * since it's passed in from the controller and closed there.
   * This method exists for API consistency with other enrichers.
   * 
   * @returns {Promise<void>}
   */
  async close() {
    // Don't close the connection here as it's managed by the controller
    this.logger.debug('MergeRequestEnricher close() called - connection managed by controller');
    return Promise.resolve();
  }
}

export default MergeRequestEnricher; 