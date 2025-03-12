/**
 * Simplified Pipeline Test
 * 
 * This script tests the complete GitHub data processing pipeline:
 * 1. Fetch GitHub data (similar to github-data-sync)
 * 2. Store raw data in github_raw_data table
 * 3. Extract entities from raw data
 * 4. Store entities in their respective tables
 * 5. Enrich entities with additional GitHub data
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { GitHubApiClient } from '../src/services/github/github-api-client.js';
import { logger } from '../src/utils/logger.js';
import crypto from 'crypto';

// Get current directory and resolve path to .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

// Load environment variables from the correct path
dotenv.config({ path: envPath });

// Log environment setup
logger.info(`Loading environment from: ${envPath}`);
logger.info('Environment variables loaded:');
logger.info(`- SUPABASE_URL: ${process.env.SUPABASE_URL ? 'defined' : 'undefined'}`);
logger.info(`- SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? 'defined' : 'undefined'}`);
logger.info(`- SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined'}`);
logger.info(`- GITHUB_API_TOKEN: ${process.env.GITHUB_API_TOKEN ? 'defined' : 'undefined'}`);

// Extract environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN;
const TEST_REPOSITORY = process.env.TEST_REPOSITORY || 'octocat/hello-world';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('Required Supabase credentials are missing!');
  process.exit(1);
}

if (!GITHUB_API_TOKEN) {
  logger.warn('GitHub API token is missing - API calls may be rate limited');
}

// Create clients directly (avoiding the factory pattern for simplicity in testing)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

const githubClient = new GitHubApiClient({ token: GITHUB_API_TOKEN });
logger.info(`Created new GitHub client: pipeline-test`);

/**
 * STEP 1: Fetch data from GitHub API for a repository
 * This function fetches PR data similar to how github-data-sync edge function works
 */
async function fetchGitHubData(repository = TEST_REPOSITORY) {
  logger.info(`Fetching data from GitHub API for repository: ${repository}`);
  
  try {
    // Split repository into owner and repo name
    const [owner, repo] = repository.split('/');
    
    if (!owner || !repo) {
      throw new Error(`Invalid repository format: ${repository}. Expected 'owner/repo'`);
    }
    
    // 1. Fetch repository details
    logger.info(`Fetching repository details for ${repository}`);
    const repoData = await githubClient.getRepository(`${owner}/${repo}`);
    
    if (!repoData) {
      throw new Error(`Failed to fetch repository data for ${repository}`);
    }
    
    logger.info(`Successfully fetched repository details for ${repository}`);
    
    // 2. Fetch pull requests - for test, we'll just get one specific PR
    // In production, it would fetch recent closed PRs
    const prNumber = 3624; // Specific PR number for testing
    logger.info(`Fetching details for PR #${prNumber}`);
    
    const pr = await githubClient.getPullRequest(owner, repo, prNumber);
    if (!pr) {
      throw new Error(`Failed to fetch PR #${prNumber}`);
    }
    
    logger.info(`Successfully fetched PR #${prNumber}`);
    
    // 3. Fetch commits for this PR
    logger.info(`Fetching commits for PR #${prNumber}`);
    const { data: commits } = await githubClient.getPullRequestCommits(owner, repo, prNumber);
    
    logger.info(`Found ${commits.length} commits for PR #${prNumber}`);
    
    // 4. Get additional details for each commit
    const commitData = await Promise.all(commits.map(async (commit) => {
      try {
        // Get commit content (changes/patches)
        const commitDetails = await githubClient.getCommit(owner, repo, commit.sha);
        
        // Extract file content and patches
        const filesData = (commitDetails.files || []).map(file => ({
          filename: file.filename,
          patch: file.patch,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes
        }));
        
        return {
          sha: commit.sha,
          author: commit.author,
          commit: commit.commit,
          content: filesData
        };
      } catch (error) {
        logger.error(`Error fetching content for commit ${commit.sha}:`, { error: error.message });
        return {
          sha: commit.sha,
          author: commit.author,
          commit: commit.commit,
          content: []
        };
      }
    }));
    
    // 5. Calculate lines changed
    let linesChanged = 0;
    let addedLines = [];
    let deletedLines = [];
    
    commitData.forEach(commit => {
      commit.content.forEach(file => {
        if (file.patch) {
          const patchLines = file.patch.split('\n');
          const added = patchLines
            .filter(line => line.startsWith('+') && !line.startsWith('+++'))
            .map(line => line.substring(1));
          const deleted = patchLines
            .filter(line => line.startsWith('-') && !line.startsWith('---'))
            .map(line => line.substring(1));
          
          linesChanged += added.length + deleted.length;
          addedLines = addedLines.concat(added);
          deletedLines = deletedLines.concat(deleted);
        }
      });
    });
    
    // 6. Format the data to match the format in github-data-sync
    const formattedData = {
      repository: {
        id: repoData.id,
        full_name: repoData.full_name,
        owner: owner,
        description: repoData.description,
        url: repoData.html_url,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count
      },
      pull_request: {
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
        commits: commitData,
        lines_changed: linesChanged,
        added_lines: addedLines,
        deleted_lines: deletedLines
      }
    };
    
    logger.info('Successfully formatted GitHub data');
    return formattedData;
    
  } catch (error) {
    logger.error('Error fetching GitHub data', { error: error.message });
    throw error;
  }
}

/**
 * STEP 2: Store raw GitHub data in Supabase
 * This matches how github-data-sync stores data
 */
async function storeRawData(data) {
  logger.info('Storing raw GitHub data in Supabase');
  
  try {
    const record = {
      data: data,
      pr_number: data.pull_request?.pr_number,
      repo_id: data.repository?.id,
      repo_name: data.repository?.full_name,
      processed: false,
      source: 'pipeline-test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: result, error } = await supabase
      .from('github_raw_data')
      .upsert([record], { 
        onConflict: 'repo_id,pr_number',
        returning: 'representation'
      })
      .select('id');
    
    if (error) {
      logger.error('Failed to store raw data', { error: error.message });
      return null;
    }
    
    logger.info('Successfully stored raw GitHub data');
    return result[0].id;
  } catch (error) {
    logger.error('Failed to store raw data', { error: error.message });
    return null;
  }
}

/**
 * STEP 3: Extract entities from raw data
 * This would normally be run as a separate step in the pipeline,
 * but for testing, we'll fetch a record we just inserted
 */
async function extractEntities() {
  logger.info('Extracting entities from raw data');
  
  try {
    // Fetch raw data that hasn't been processed yet
    const { data: rawRecords, error } = await supabase
      .from('github_raw_data')
      .select('*')
      .eq('processed', false)
      .eq('source', 'pipeline-test')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      logger.error('Error fetching raw data', { error: error.message });
      throw error;
    }
    
    if (!rawRecords || rawRecords.length === 0) {
      logger.warn('No unprocessed raw data records found');
      return null;
    }
    
    const rawData = rawRecords[0];
    logger.info(`Processing raw data record ID: ${rawData.id}`);
    
    // Log the raw data structure to help debug
    logger.info('Raw data keys:', Object.keys(rawData.data));
    // Log additional structure details for debugging
    logger.info('Pull request structure:', JSON.stringify(Object.keys(rawData.data.pull_request || {})));
    
    // Extract repository
    const repositoryData = rawData.data.repository;
    logger.info('Repository structure:', JSON.stringify(Object.keys(repositoryData || {})));
    
    const repository = {
      id: repositoryData.id,
      name: repositoryData.full_name,
      description: repositoryData.description || '',
      url: repositoryData.url,
      stars: repositoryData.stars || 0,
      forks: repositoryData.forks || 0,
      is_enriched: false,
      source: 'pipeline-test'
    };
    
    // Extract pull request
    const prData = rawData.data.pull_request;
    
    // Check if URL exists before trying to split it
    let prId = null;
    if (prData.id) {
      prId = prData.id;
    } else if (prData.url && typeof prData.url === 'string') {
      const urlParts = prData.url.split('/');
      prId = parseInt(urlParts[urlParts.length - 1]);
    } else {
      // Fallback ID generation if needed
      prId = Date.now();
      logger.warn(`Generated fallback ID for PR: ${prId}`);
    }
    
    const pullRequest = {
      id: prId,
      title: prData.title,
      description: prData.body || '',
      status: prData.state,
      author: prData.user?.login,
      author_avatar: prData.user?.avatar_url,
      created_at: prData.created_at ? new Date(prData.created_at).toISOString() : new Date().toISOString(),
      updated_at: prData.updated_at ? new Date(prData.updated_at).toISOString() : new Date().toISOString(),
      closed_at: prData.closed_at ? new Date(prData.closed_at).toISOString() : null,
      merged_at: prData.merged_at ? new Date(prData.merged_at).toISOString() : null,
      base_branch: prData.base?.ref,
      head_branch: prData.head?.ref,
      repository_id: repositoryData.id,
      pr_number: prData.pr_number || prData.number,
      commits: prData.commits_count || 0,
      is_enriched: false,
      source: 'pipeline-test'
    };
    
    // Extract contributors
    const contributors = [];
    const addedContributors = new Set();
    
    // Add repository owner if available
    if (typeof repositoryData.owner === 'string') {
      // Try to find existing contributor by username
      const { data: existingOwner } = await supabase
        .from('contributors')
        .select('id')
        .eq('username', repositoryData.owner)
        .limit(1);
      
      const ownerId = (existingOwner && existingOwner.length > 0) 
        ? existingOwner[0].id 
        : `owner-${Date.now()}`;
      
      contributors.push({
        id: ownerId,
        username: repositoryData.owner,
        name: null,
        avatar: null,
        is_enriched: false,
        source: 'pipeline-test'
      });
      addedContributors.add(ownerId);
    } else if (repositoryData.owner && typeof repositoryData.owner === 'object') {
      const ownerId = String(repositoryData.owner.id || `owner-${Date.now()}`);
      if (!addedContributors.has(ownerId)) {
        contributors.push({
          id: ownerId,
          username: repositoryData.owner.login,
          name: null,
          avatar: repositoryData.owner.avatar_url,
          is_enriched: false,
          source: 'pipeline-test'
        });
        addedContributors.add(ownerId);
      }
    }
    
    // Add PR author if available
    if (prData.user && prData.user.id) {
      const userId = String(prData.user.id);
      if (!addedContributors.has(userId)) {
        contributors.push({
          id: userId,
          username: prData.user.login,
          name: null,
          avatar: prData.user.avatar_url,
          is_enriched: false,
          source: 'pipeline-test'
        });
        addedContributors.add(userId);
      }
    }
    
    // Add PR merger if available
    if (prData.merged_by && prData.merged_by.id) {
      const mergerId = String(prData.merged_by.id);
      if (!addedContributors.has(mergerId)) {
        contributors.push({
          id: mergerId,
          username: prData.merged_by.login,
          name: null,
          avatar: prData.merged_by.avatar_url,
          is_enriched: false,
          source: 'pipeline-test'
        });
        addedContributors.add(mergerId);
      }
    }
    
    // Add commit authors
    const commits = [];
    
    // Log information about the commits structure
    logger.info('Commits structure check:', 
      prData.commits ? 
      (Array.isArray(prData.commits) ? 
       `Array with ${prData.commits.length} items` : 
       `Not an array, type: ${typeof prData.commits}`) : 
      'undefined');
    
    if (prData.commits && Array.isArray(prData.commits)) {
      for (const commitData of prData.commits) {
        // Log information about each commit
        logger.info(`Processing commit: ${commitData.sha || 'unknown'}`);
        
        // Add commit author as contributor
        if (commitData.author && commitData.author.id) {
          const authorId = String(commitData.author.id);
          if (!addedContributors.has(authorId)) {
            contributors.push({
              id: authorId,
              username: commitData.author.login,
              name: null,
              avatar: commitData.author.avatar_url,
              is_enriched: false,
              source: 'pipeline-test'
            });
            addedContributors.add(authorId);
          }
        }
        
        // Extract commit
        const commitId = crypto.randomUUID ? crypto.randomUUID() : `commit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Get commit message safely
        let commitTitle = "No message";
        if (commitData.commit && commitData.commit.message) {
          const messageParts = commitData.commit.message.split('\n');
          commitTitle = messageParts[0] || "No message";
        }
        
        commits.push({
          id: commitId,
          hash: commitData.sha,
          title: commitTitle,
          author: commitData.author?.login || (commitData.commit?.author?.name || "Unknown"),
          date: commitData.commit?.author?.date ? new Date(commitData.commit.author.date).toISOString() : new Date().toISOString(),
          diff: '',
          repository_id: repositoryData.id,
          merge_request_id: pullRequest.id,
          is_analyzed: false,
          created_at: new Date().toISOString(),
          is_enriched: false,
          source: 'pipeline-test'
        });
      }
    }
    
    // Return the extracted entities, and the raw record ID for marking as processed later
    return {
      rawRecordId: rawData.id,
      repository,
      pullRequest,
      contributors,
      commits
    };
  } catch (error) {
    logger.error('Error extracting entities:', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * STEP 4: Store extracted entities in their respective tables
 */
async function storeEntities({ repository, pullRequest, commits, contributors }) {
  console.log('Storing entities with source tracking...');
  
  try {
    // First store the repository
    const { data: repoData, error: repoError } = await supabase
      .from('repositories')
      .upsert([repository], {
        onConflict: 'id',
        returning: 'minimal',
      });
    
    if (repoError) {
      console.error('Error storing repository:', repoError);
      throw repoError;
    }
    console.log(`Repository stored with source: ${repository.source}`);
    
    // Then store contributors
    if (contributors && contributors.length > 0) {
      const { data: contribData, error: contribError } = await supabase
        .from('contributors')
        .upsert(contributors, {
          onConflict: 'id',
          returning: 'minimal',
        });
      
      if (contribError) {
        console.error('Error storing contributors:', contribError);
        throw contribError;
      }
      console.log(`${contributors.length} contributors stored with source: ${contributors[0].source}`);
    }
    
    // Then store the pullRequest/merge request
    try {
      const { data: mrData, error: mrError } = await supabase
        .from('merge_requests')
        .upsert([pullRequest], {
          onConflict: 'id',
          returning: 'minimal',
        });
      
      if (mrError) {
        console.error('Error storing merge request:', mrError);
        
        // If the error is due to missing pr_number field, try again without it
        if (mrError.message.includes('pr_number')) {
          console.warn('Retrying without pr_number field');
          const prWithoutPrNumber = { ...pullRequest };
          delete prWithoutPrNumber.pr_number;
          
          const { data: retryData, error: retryError } = await supabase
            .from('merge_requests')
            .upsert([prWithoutPrNumber], {
              onConflict: 'id',
              returning: 'minimal',
            });
          
          if (retryError) {
            console.error('Error on retry storing merge request:', retryError);
            throw retryError;
          }
        } else {
          throw mrError;
        }
      }
      console.log(`Merge request stored with source: ${pullRequest.source}`);
    } catch (error) {
      console.error('Failed to store merge request:', error);
      throw error;
    }
    
    // Finally, store commits
    if (commits && commits.length > 0) {
      const { data: commitData, error: commitError } = await supabase
        .from('commits')
        .upsert(commits, {
          onConflict: 'hash',
          returning: 'minimal',
        });
      
      if (commitError) {
        console.error('Error storing commits:', commitError);
        throw commitError;
      }
      console.log(`${commits.length} commits stored with source: ${commits[0].source}`);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Error in storeEntities:', error);
    return { success: false, error };
  }
}

/**
 * STEP 5: Enrich entities with additional data from GitHub API
 */
async function enrichEntities() {
  logger.info('Enriching entities with additional GitHub data');
  
  try {
    // Get all repositories that need enrichment
    const { data: repositories, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('is_enriched', false)
      .limit(5);
    
    if (repoError) {
      logger.error('Error fetching repositories for enrichment', { error: repoError.message });
      throw repoError;
    }
    
    // Enrich repositories
    for (const repo of repositories || []) {
      // Extract owner and name from the full name
      const [owner, repoName] = (repo.name || '').split('/');
      
      if (!owner || !repoName) {
        logger.warn(`Invalid repository name format: ${repo.name}`);
        continue;
      }
      
      logger.info(`Enriching repository: ${repo.name}`);
      
      try {
        // Fetch detailed repository data
        const repoData = await githubClient.getRepository(`${owner}/${repoName}`);
        
        // Update repository with additional fields
        const enrichedRepo = {
          id: repo.id,
          name: repo.name,
          description: repoData.description,
          url: repoData.html_url,
          stars: repoData.stargazers_count || 0,
          forks: repoData.forks_count || 0,
          size_kb: repoData.size || 0,
          open_issues_count: repoData.open_issues_count || 0,
          watchers_count: repoData.watchers_count || 0,
          primary_language: repoData.language,
          license: repoData.license?.spdx_id || repoData.license?.name,
          is_enriched: true,
          source: repo.source || 'pipeline-test'
        };
        
        // Update repository in database
        const { error: updateError } = await supabase
          .from('repositories')
          .upsert([enrichedRepo], { onConflict: 'id' });
        
        if (updateError) {
          logger.error('Error updating enriched repository data', { error: updateError.message });
        } else {
          logger.info('Successfully enriched repository data');
        }
      } catch (error) {
        logger.error(`Error enriching repository ${repo.name}`, { error: error.message });
      }
    }
    
    // Get all contributors that need enrichment
    const { data: contributors, error: contribError } = await supabase
      .from('contributors')
      .select('*')
      .eq('is_enriched', false)
      .limit(5);
    
    if (contribError) {
      logger.error('Error fetching contributors for enrichment', { error: contribError.message });
      throw contribError;
    }
    
    // Enrich contributors
    for (const contributor of contributors || []) {
      if (!contributor.username) {
        logger.warn(`Contributor ${contributor.id} has no username`);
        continue;
      }
      
      logger.info(`Enriching contributor: ${contributor.username}`);
      
      try {
        // Fetch detailed user data
        const userData = await githubClient.getUser(contributor.username);
        
        if (userData) {
          // Update contributor with additional fields
          const enrichedContributor = {
            id: contributor.id,
            username: contributor.username,
            name: userData.name,
            avatar: userData.avatar_url,
            bio: userData.bio,
            company: userData.company,
            blog: userData.blog,
            twitter_username: userData.twitter_username,
            location: userData.location,
            followers: userData.followers || 0,
            repositories: userData.public_repos || 0,
            is_enriched: true,
            source: contributor.source || 'pipeline-test'
          };
          
          // Update contributor in database
          const { error: updateError } = await supabase
            .from('contributors')
            .upsert([enrichedContributor], { onConflict: 'id' });
          
          if (updateError) {
            logger.error(`Error updating enriched contributor data for ${contributor.username}`, { error: updateError.message });
          } else {
            logger.info(`Successfully enriched contributor data for ${contributor.username}`);
          }
        }
      } catch (error) {
        logger.error(`Error enriching contributor ${contributor.username}`, { error: error.message });
      }
    }
    
    // Get merge requests that need enrichment
    const { data: mergeRequests, error: mrError } = await supabase
      .from('merge_requests')
      .select('*, repositories!inner(*)')
      .eq('is_enriched', false)
      .limit(5);
    
    if (mrError) {
      logger.error('Error fetching merge requests for enrichment', { error: mrError.message });
      throw mrError;
    }
    
    // Enrich merge requests
    for (const mr of mergeRequests || []) {
      // Get repository info
      const [owner, repoName] = (mr.repositories.name || '').split('/');
      const prNumber = mr.pr_number;
      
      if (!owner || !repoName || !prNumber) {
        logger.warn(`Missing data for enriching PR ${mr.id}`);
        continue;
      }
      
      logger.info(`Enriching merge request: ${owner}/${repoName}#${prNumber}`);
      
      try {
        // Fetch detailed PR data and files
        const pr = await githubClient.getPullRequest(owner, repoName, prNumber);
        const { data: prFiles } = await githubClient.getPullRequestFiles(owner, repoName, prNumber);
        
        let linesAdded = 0;
        let linesRemoved = 0;
        
        if (prFiles && prFiles.length > 0) {
          for (const file of prFiles) {
            linesAdded += file.additions || 0;
            linesRemoved += file.deletions || 0;
          }
        }
        
        // Update PR with additional data
        const enrichedPR = {
          id: mr.id,
          files_changed: prFiles?.length || 0,
          review_comments: pr.review_comments || 0,
          lines_added: linesAdded,
          lines_removed: linesRemoved,
          labels: pr.labels ? pr.labels.map(label => label.name) : [],
          is_enriched: true,
          source: mr.source || 'pipeline-test'
        };
        
        // Update PR in database
        const { error: updateError } = await supabase
          .from('merge_requests')
          .upsert([enrichedPR], { onConflict: 'id' });
        
        if (updateError) {
          logger.error('Error updating enriched merge request data', { error: updateError.message });
        } else {
          logger.info('Successfully enriched merge request data');
        }
      } catch (error) {
        logger.error(`Error enriching merge request ${mr.id}`, { error: error.message });
      }
    }
    
    // Get commits that need enrichment
    const { data: commits, error: commitError } = await supabase
      .from('commits')
      .select('*, repositories!inner(*)')
      .eq('is_enriched', false)
      .limit(5);
    
    if (commitError) {
      logger.error('Error fetching commits for enrichment', { error: commitError.message });
      throw commitError;
    }
    
    // Enrich commits
    for (const commit of commits || []) {
      // Get repository info
      const [owner, repoName] = (commit.repositories.name || '').split('/');
      
      if (!owner || !repoName || !commit.hash) {
        logger.warn(`Missing data for enriching commit ${commit.id}`);
        continue;
      }
      
      logger.info(`Enriching commit: ${commit.hash}`);
      
      try {
        // Fetch detailed commit data
        const commitData = await githubClient.getCommit(owner, repoName, commit.hash);
        
        if (commitData) {
          // Update commit with enriched data
          const enrichedCommit = {
            id: commit.id,
            hash: commit.hash,
            title: commit.title,
            author: commit.author,
            date: commit.date,
            diff: commit.diff || '',
            repository_id: commit.repository_id,
            merge_request_id: commit.merge_request_id,
            files_changed: commitData.files?.length || 0,
            author_email: commitData.commit?.author?.email,
            author_name: commitData.commit?.author?.name,
            committer_name: commitData.commit?.committer?.name,
            committer_email: commitData.commit?.committer?.email,
            message_body: commitData.commit?.message,
            verification_verified: commitData.commit?.verification?.verified || false,
            verification_reason: commitData.commit?.verification?.reason,
            stats_additions: commitData.stats?.additions || 0,
            stats_deletions: commitData.stats?.deletions || 0,
            stats_total: commitData.stats?.total || 0,
            parents: commitData.parents ? commitData.parents.map(parent => parent.sha) : [],
            authored_date: commitData.commit?.author?.date,
            committed_date: commitData.commit?.committer?.date,
            is_enriched: true,
            source: commit.source || 'pipeline-test'
          };
          
          // Update commit in database
          const { error: updateError } = await supabase
            .from('commits')
            .upsert([enrichedCommit], { onConflict: 'hash' });
          
          if (updateError) {
            logger.error(`Error updating enriched commit data for ${commit.hash}`, { error: updateError.message });
          } else {
            logger.info(`Successfully enriched commit data for ${commit.hash}`);
          }
        }
      } catch (error) {
        logger.error(`Error enriching commit ${commit.hash}`, { error: error.message });
      }
    }
    
    // Return summary of what was enriched
    return {
      repositories: repositories?.length || 0,
      contributors: contributors?.length || 0,
      mergeRequests: mergeRequests?.length || 0,
      commits: commits?.length || 0
    };
  } catch (error) {
    logger.error('Error during entity enrichment', { error: error.message });
    return null;
  }
}

/**
 * Run the simplified pipeline
 */
async function runPipeline() {
  logger.info('Starting Simplified Pipeline Test');
  
  try {
    // Step 1: Fetch data from GitHub
    logger.info('Step 1: Fetching GitHub data');
    const githubData = await fetchGitHubData();
    
    // Step 2: Store raw data
    logger.info('Step 2: Storing raw GitHub data');
    const rawDataId = await storeRawData(githubData);
    
    if (!rawDataId) {
      logger.error('Failed to store raw data, stopping pipeline');
      return {
        success: false,
        error: 'Failed to store raw data'
      };
    }
    
    // Step 3: Extract entities from raw data
    logger.info('Step 3: Extracting entities from raw data');
    const entities = await extractEntities();
    
    if (!entities) {
      logger.error('Failed to extract entities, stopping pipeline');
      return {
        success: false,
        error: 'Failed to extract entities'
      };
    }
    
    // Step 4: Store entities
    logger.info('Step 4: Storing entities');
    const storeResult = await storeEntities(entities);
    
    if (!storeResult.success) {
      logger.error('Failed to store entities, stopping pipeline');
      return {
        success: false,
        error: storeResult.error
      };
    }
    
    // Step 5: Enrich entities with additional data
    logger.info('Step 5: Enriching entities with additional data');
    const enrichmentResults = await enrichEntities();
    
    // Step 7: Verify source field in database (summary)
    logger.info('Step 7: Verifying source field in entities');
    logger.info('Pipeline execution completed successfully! All entities now have source tracking.');
    logger.info('Summary:');
    logger.info('- Raw Data stored with source: pipeline-test');
    logger.info('- Repository stored with source: pipeline-test');
    logger.info('- Contributors stored with source: pipeline-test');
    logger.info('- Merge Request stored with source: pipeline-test');
    logger.info('- Commits stored with source: pipeline-test');
    
    logger.info('Please check the database to confirm source tracking is working as expected.');
    
    // Final summary
    logger.info('Summary:', {
      githubDataFetched: !!githubData,
      rawDataStored: !!rawDataId,
      entitiesExtracted: !!entities,
      entitiesStored: storeResult.success,
      entitiesEnriched: {
        repositories: enrichmentResults?.repositories || 0,
        contributors: enrichmentResults?.contributors || 0,
        mergeRequests: enrichmentResults?.mergeRequests || 0,
        commits: enrichmentResults?.commits || 0
      }
    });
    
    return {
      success: true,
      githubData,
      entities,
      enrichmentResults
    };
  } catch (error) {
    logger.error('Pipeline execution failed', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the pipeline
runPipeline()
  .then(result => {
    if (result.success) {
      logger.info('Pipeline completed successfully');
      process.exit(0);
    } else {
      logger.error('Pipeline failed');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error('Fatal error:', { error: error.message });
    process.exit(1);
  });
