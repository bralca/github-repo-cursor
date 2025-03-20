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
      SELECT mr.id, mr.github_id, mr.title, r.full_name as repository_full_name
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
          SET is_enriched = 1
          WHERE id = ?`, [sampleMR.id]);
          
        this.logger.info(`Marked merge request ${sampleMR.id} as enriched to skip it.`);
      }
    }
    
    const query = `
      SELECT mr.id, mr.github_id, mr.title, r.full_name as repository_full_name, 
             r.id as repository_id, r.github_id as repository_github_id,
             mr.author_id, mr.author_github_id
      FROM merge_requests mr
      JOIN repositories r ON mr.repository_id = r.id
      WHERE mr.is_enriched = 0
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
    
    try {
      // First get the PR number from the raw data
      const rawData = await this.db.get(`
        SELECT data FROM closed_merge_requests_raw 
        WHERE JSON_EXTRACT(data, '$.pull_request.pr_number') = ? 
           OR JSON_EXTRACT(data, '$.pull_request.number') = ?`, [github_id, github_id]);
      
      if (!rawData) {
        this.logger.warn(`No raw data found for merge request with github_id ${github_id}. Setting enriched=1 to skip.`);
        await this.db.run(`UPDATE merge_requests SET is_enriched = 1 WHERE id = ?`, [id]);
        return;
      }
      
      // Parse the JSON data
      const pullRequestData = JSON.parse(rawData.data);
      // Since we now store the PR number directly in github_id, use it directly
      const prNumber = github_id;
      
      this.logger.info(`Using PR number ${prNumber} for merge request with github_id ${github_id}`);
      
      // Fetch PR data from GitHub API using the correct PR number
      this.logger.info(`Fetching PR data: owner=${owner}, repo=${repo}, pr_number=${prNumber}`);
      const prData = await this.githubClient.getPullRequest(owner, repo, prNumber);
      
      // Process the PR author to ensure we have a contributor record
      if (prData.user) {
        await this.processContributor(prData.user);
      }
      
      // Process merged_by user if PR was merged
      let mergedById = null;
      if (prData.merged_by) {
        mergedById = await this.processContributor(prData.merged_by);
      }
      
      // Get additional data - reviews and comments
      this.logger.info(`Fetching reviews for PR: owner=${owner}, repo=${repo}, pr_number=${prNumber}`);
      const reviews = await this.githubClient.getPullRequestReviews(owner, repo, prNumber);
      this.logger.info(`Fetching comments for PR: owner=${owner}, repo=${repo}, pr_number=${prNumber}`);
      const comments = await this.githubClient.getPullRequestComments(owner, repo, prNumber);
      
      // Prepare the merge request update with enriched data
      const mergeRequestUpdate = {
        title: prData.title,
        description: prData.body || '',
        state: prData.state,
        is_draft: prData.draft || false,
        closed_at: prData.closed_at || null,
        merged_at: prData.merged_at || null,
        merged_by_id: mergedById,
        merged_by_github_id: prData.merged_by ? prData.merged_by.id : null,
        commits_count: prData.commits,
        additions: prData.additions,
        deletions: prData.deletions,
        changed_files: prData.changed_files,
        labels: JSON.stringify(prData.labels.map(label => label.name)),
        source_branch: prData.head.ref,
        target_branch: prData.base.ref,
        review_count: reviews.length,
        comment_count: comments.length,
        is_enriched: 1,
        updated_at: new Date().toISOString()
      };
      
      // Update the merge request record
      await this.updateMergeRequest(mergeRequest.id, mergeRequestUpdate);
      
      // Fetch and process all commits for this PR
      this.logger.info(`Fetching commits for PR: owner=${owner}, repo=${repo}, pr_number=${prNumber}`);
      const commitsResponse = await this.githubClient.getPullRequestCommits(owner, repo, prNumber);
      const commits = commitsResponse.data;
      this.logger.info(`Processing ${commits.length} commits for PR ${repository_full_name}#${prNumber}`);
      
      for (const commit of commits) {
        try {
          // For each commit, get its files
          this.logger.debug(`Fetching files for commit: ${commit.sha.substring(0, 7)}`);
          const commitWithFiles = await this.githubClient.getCommit(owner, repo, commit.sha);
          await this.processCommit(commitWithFiles, mergeRequest);
          this.stats.commitsProcessed++;
        } catch (error) {
          this.logger.error(`Error processing commit ${commit.sha} for PR ${repository_full_name}#${prNumber}: ${error.message}`);
        }
      }
      
      this.logger.info(`Successfully enriched merge request ${repository_full_name}#${prNumber}`);
    } catch (error) {
      this.logger.error(`Failed to enrich merge request ${repository_full_name} with ID ${id}`, {
        error: error.message,
        repository: repository_full_name,
        owner: owner,
        repo: repo,
        id: id,
        github_id: github_id
      });
      throw error;
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
    
    // We need to process each file separately since our schema has one row per file
    const files = commit.files || [];
    
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
    try {
      // Get the existing merge request data
      const mergeRequest = await this.db.get('SELECT * FROM merge_requests WHERE id = ?', [id]);
      
      if (!mergeRequest) {
        this.logger.error(`Merge request with ID ${id} not found for update`);
        return;
      }
      
      // Prepare the fields to update
      const fields = Object.keys(updateData)
        .map(field => `${field} = ?`)
        .join(', ');
      
      // Prepare the values to update
      const values = Object.values(updateData);
      values.push(id);
      
      // Update the merge request
      await this.db.run(`UPDATE merge_requests SET ${fields} WHERE id = ?`, values);
      
      this.logger.debug(`Updated merge request ${mergeRequest.github_id} with enriched data`);
    } catch (error) {
      this.logger.error(`Error updating merge request ${id}: ${error.message}`);
      throw error;
    }
  }
}

export default MergeRequestEnricher; 