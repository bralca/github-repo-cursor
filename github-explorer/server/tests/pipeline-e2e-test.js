/**
 * End-to-End Pipeline Test
 * 
 * This script tests the complete GitHub data processing pipeline:
 * 1. Reads raw GitHub data from Supabase
 * 2. Extracts entities (repositories, merge requests, contributors, commits)
 * 3. Stores extracted entities in the database
 * 4. Enriches entities with additional data from GitHub API
 * 5. Updates relationships between entities
 * 6. Creates a summary report of all processed data
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../src/utils/logger.js';
import { SupabaseSchemaManager } from '../src/services/supabase/supabase-schema-manager.js';
import { supabaseClientFactory } from '../src/services/supabase/supabase-client.js';
import { GitHubApiClient } from '../src/services/github/github-api-client.js';

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

// Constants and configuration
const TEST_NAME = 'E2E Pipeline Test';
const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN || process.env.GITHUB_TOKEN;
const DEFAULT_TEST_REPOSITORY = process.env.TEST_REPOSITORY || 'octocat/hello-world'; // Default test repo if none specified

// Initialize clients with explicit environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

logger.info(`Initializing Supabase client with URL: ${SUPABASE_URL ? 'defined' : 'undefined'}, Service Key: ${SUPABASE_SERVICE_ROLE_KEY ? 'defined' : 'undefined'}`);

// Only create clients if we have the necessary credentials
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('Required Supabase credentials are missing. Please check your .env file.');
  process.exit(1);
}

const supabase = supabaseClientFactory.createClient({
  clientId: 'e2e-test',
  authLevel: 'service_role',
  url: SUPABASE_URL,
  key: SUPABASE_SERVICE_ROLE_KEY
});

const schemaManager = new SupabaseSchemaManager({
  clientId: 'e2e-test',
  supabaseUrl: SUPABASE_URL,
  supabaseServiceKey: SUPABASE_SERVICE_ROLE_KEY
});

const githubClient = new GitHubApiClient({ token: GITHUB_API_TOKEN });

// Summary statistics
const stats = {
  rawDataFetched: 0, // New stat for initial GitHub API fetching
  rawDataProcessed: 0,
  entitiesExtracted: {
    repositories: 0,
    contributors: 0,
    mergeRequests: 0,
    commits: 0
  },
  entitiesEnriched: {
    repositories: 0,
    contributors: 0,
    mergeRequests: 0,
    commits: 0
  },
  relationshipsCreated: 0,
  apiCallsMade: 0,
  errors: []
};

/**
 * Handles GitHub API rate limiting by checking response headers
 * and waiting if necessary
 */
async function handleRateLimits(response) {
  if (!response || !response.headers) return;
  
  const remaining = parseInt(response.headers.get('x-ratelimit-remaining') || '1000');
  const resetTime = parseInt(response.headers.get('x-ratelimit-reset') || '0') * 1000;
  
  logger.info(`GitHub API rate limit remaining: ${remaining}`);
  
  if (remaining < 5) {
    const now = Date.now();
    const waitTime = Math.max(0, resetTime - now) + 1000; // Add 1 second buffer
    
    logger.warn(`Rate limit nearly exhausted. Waiting ${waitTime/1000} seconds until reset`);
    
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Fetch data from GitHub API and store in github_raw_data table
 * Following the pattern from the github-data-sync edge function
 */
async function fetchGitHubData(repository = DEFAULT_TEST_REPOSITORY) {
  logger.info(`Fetching data from GitHub API for repository: ${repository}`);
  
  try {
    // Split repository into owner and repo name
    const [owner, repo] = repository.split('/');
    
    if (!owner || !repo) {
      throw new Error(`Invalid repository format: ${repository}. Expected 'owner/repo'`);
    }
    
    // Fetch repository details first
    logger.info(`Fetching repository details for ${repository}`);
    const repoData = await githubClient.getRepository(`${owner}/${repo}`);
    stats.apiCallsMade += 1;
    
    if (!repoData) {
      throw new Error(`Failed to fetch repository data for ${repository}`);
    }
    
    // Store basic repository info for reference
    const repoInfo = {
      id: repoData.id,
      name: repoData.name,
      full_name: repoData.full_name,
      description: repoData.description,
      owner: {
        id: repoData.owner.id,
        login: repoData.owner.login,
        avatar_url: repoData.owner.avatar_url
      }
    };
    
    // Fetch pull requests
    logger.info(`Fetching pull requests for ${repository}`);
    const pullRequests = await githubClient.getPullRequests(owner, repo, 'all', { per_page: 5, page: 1 });
    stats.apiCallsMade += 1;
    
    // Handle rate limits if applicable
    await handleRateLimits(pullRequests.headers);
    
    if (!pullRequests || !pullRequests.data) {
      throw new Error(`Failed to fetch pull requests for ${repository}`);
    }
    
    logger.info(`Found ${pullRequests.data.length} pull requests for ${repository}`);
    
    // Process only one PR for the test
    const targetPR = pullRequests.data[0];
    
    if (!targetPR) {
      throw new Error(`No pull requests found for ${repository}`);
    }
    
    // Fetch additional PR details including commits
    logger.info(`Fetching details for PR #${targetPR.number}`);
    const prDetails = await githubClient.getPullRequest(owner, repo, targetPR.number);
    stats.apiCallsMade += 1;
    
    // Handle rate limits if applicable
    await handleRateLimits(prDetails.headers);
    
    // Fetch commits for this PR
    logger.info(`Fetching commits for PR #${targetPR.number}`);
    const prCommits = await githubClient.getPullRequestCommits(owner, repo, targetPR.number);
    stats.apiCallsMade += 1;
    
    // Handle rate limits if applicable
    await handleRateLimits(prCommits.headers);
    
    // Prepare data for storage
    const rawData = {
      repository: repoInfo,
      pull_request: {
        ...targetPR,
        // Add more detailed data from prDetails
        additions: prDetails.additions,
        deletions: prDetails.deletions,
        changed_files: prDetails.changed_files,
        // Add commits data
        commits: prCommits.data.map(commit => ({
          sha: commit.sha,
          author: commit.author,
          message: commit.commit.message,
          timestamp: commit.commit.author.date,
          content: [] // We'd need additional API calls to get file content
        }))
      }
    };
    
    // Store raw data in the github_raw_data table
    logger.info('Storing raw GitHub data in the database');
    const { data, error } = await supabase
      .from('github_raw_data')
      .insert([{
        id: Date.now(), // Simple unique ID for testing
        data: rawData,
        pr_number: targetPR.number,
        repo_id: repoInfo.id,
        repo_name: repoInfo.full_name,
        processed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (error) {
      throw error;
    }
    
    stats.rawDataFetched += 1;
    logger.info('Successfully stored raw GitHub data');
    
    return { success: true, message: `Successfully fetched and stored data for PR #${targetPR.number}` };
  } catch (error) {
    logger.error('Error fetching GitHub data', { error });
    stats.errors.push({
      step: 'fetchGitHubData',
      error: error.message
    });
    
    // Check if this is a rate limit error
    if (error.status === 403 && error.message.includes('API rate limit exceeded')) {
      logger.warn('GitHub API rate limit exceeded. Consider using existing data.');
    }
    
    return null;
  }
}

/**
 * Check if there are any missing contributors and create minimal records for them
 * Following the pattern from the check-contributors edge function
 */
async function checkContributors() {
  logger.info('Checking for missing contributors');
  
  try {
    // Get all contributor_id references from commits
    const { data: commitContributors, error: commitError } = await supabase
      .from('commits')
      .select('contributor_github_id')
      .not('contributor_github_id', 'is', null);
    
    if (commitError) {
      throw commitError;
    }
    
    if (!commitContributors || commitContributors.length === 0) {
      logger.info('No commit contributors found to check');
      return { created: 0, errors: 0 };
    }
    
    // Extract unique contributor IDs
    const contributorIds = [...new Set(commitContributors.map(c => c.contributor_github_id))];
    
    // Get existing contributors
    const { data: existingContributors, error: existingError } = await supabase
      .from('contributors')
      .select('github_id')
      .in('github_id', contributorIds);
    
    if (existingError) {
      throw existingError;
    }
    
    // Find missing contributors
    const existingIds = new Set(existingContributors.map(c => c.github_id));
    const missingIds = contributorIds.filter(id => !existingIds.has(id));
    
    logger.info(`Found ${missingIds.length} missing contributors`);
    
    let created = 0;
    let errors = 0;
    
    // Create minimal records for missing contributors
    for (const id of missingIds) {
      try {
        // Try to get username from GitHub using the ID
        let username = `unknown_${id}`;
        let avatar_url = null;
        
        try {
          // This would need to be replaced with an actual API call to get user by ID
          // For now, we'll create a placeholder
          username = `user_${id}`;
          avatar_url = `https://avatars.githubusercontent.com/u/${id}`;
        } catch (apiError) {
          logger.warn(`Could not fetch user details for ID ${id}`, { error: apiError });
        }
        
        // Create minimal contributor record
        const { error: insertError } = await supabase
          .from('contributors')
          .insert([{
            github_id: id,
            username: username,
            avatar_url: avatar_url,
            is_enriched: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        
        if (insertError) {
          throw insertError;
        }
        
        created++;
      } catch (error) {
        logger.error(`Error creating contributor record for ID ${id}`, { error });
        errors++;
      }
    }
    
    logger.info(`Created ${created} missing contributor records with ${errors} errors`);
    return { created, errors };
  } catch (error) {
    logger.error('Error checking contributors', { error });
    stats.errors.push({
      step: 'checkContributors',
      error: error.message
    });
    return { created: 0, errors: 1 };
  }
}

/**
 * Fetch one unprocessed row from the github_raw_data table
 */
async function fetchUnprocessedRawData() {
  logger.info('Fetching unprocessed GitHub raw data');
  
  try {
    const { data, error } = await supabase
      .from('github_raw_data')
      .select('*')
      .eq('processed', false)
      .limit(1)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      logger.warn('No unprocessed GitHub raw data found');
      return null;
    }
    
    logger.info(`Found unprocessed raw data with ID: ${data.id}`);
    return data;
  } catch (error) {
    logger.error('Error fetching unprocessed raw data', { error });
    stats.errors.push({
      step: 'fetchUnprocessedRawData',
      error: error.message
    });
    return null;
  }
}

/**
 * Extract entities from raw data
 */
async function extractEntities(rawData) {
  logger.info('Extracting entities from raw data');
  
  try {
    const data = typeof rawData.data === 'string' 
      ? JSON.parse(rawData.data) 
      : rawData.data;
    
    // Extract repository data
    const repository = {
      github_id: data.repository?.id || data.pull_request?.base?.repo?.id,
      name: data.repository?.name || data.pull_request?.base?.repo?.name,
      owner: data.repository?.owner || data.pull_request?.base?.repo?.owner?.login,
      full_name: data.repository?.full_name || data.pull_request?.base?.repo?.full_name,
      description: data.repository?.description || data.pull_request?.base?.repo?.description,
      url: data.repository?.url || data.pull_request?.base?.repo?.url,
      is_enriched: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Extract pull request data
    const pullRequest = data.pull_request ? {
      github_id: data.pull_request.id,
      repository_id: repository.github_id, // Reference to the repository
      number: data.pull_request.number,
      title: data.pull_request.title,
      body: data.pull_request.body,
      state: data.pull_request.state,
      is_merged: data.pull_request.merged_at !== null,
      created_at: data.pull_request.created_at,
      updated_at: data.pull_request.updated_at,
      closed_at: data.pull_request.closed_at,
      merged_at: data.pull_request.merged_at,
      creator_github_id: data.pull_request.user?.id,
      merged_by_github_id: data.pull_request.merged_by?.id,
      is_enriched: false
    } : null;
    
    // Extract contributors
    const contributors = new Map();
    
    // Add PR author if exists
    if (data.pull_request?.user) {
      contributors.set(data.pull_request.user.id, {
        github_id: data.pull_request.user.id,
        username: data.pull_request.user.login,
        avatar_url: data.pull_request.user.avatar_url,
        is_enriched: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // Add PR merger if exists
    if (data.pull_request?.merged_by) {
      contributors.set(data.pull_request.merged_by.id, {
        github_id: data.pull_request.merged_by.id,
        username: data.pull_request.merged_by.login,
        avatar_url: data.pull_request.merged_by.avatar_url,
        is_enriched: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // Extract commits
    const commits = [];
    
    if (data.pull_request?.commits) {
      for (const commit of data.pull_request.commits) {
        // Add commit author to contributors
        if (commit.author) {
          contributors.set(commit.author.id, {
            github_id: commit.author.id,
            username: commit.author.login || 'unknown',
            avatar_url: commit.author.avatar_url,
            is_enriched: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        commits.push({
          sha: commit.sha,
          repository_id: repository.github_id,
          contributor_github_id: commit.author?.id,
          message: commit.message,
          additions: commit.additions || 0,
          deletions: commit.deletions || 0,
          files_changed: commit.content?.length || 0,
          committed_at: commit.timestamp || new Date().toISOString(),
          is_enriched: false,
          created_at: new Date().toISOString()
        });
      }
    }
    
    // Update statistics
    stats.entitiesExtracted.repositories += 1;
    stats.entitiesExtracted.contributors += contributors.size;
    stats.entitiesExtracted.mergeRequests += pullRequest ? 1 : 0;
    stats.entitiesExtracted.commits += commits.length;
    
    return {
      repository,
      pullRequest,
      contributors: Array.from(contributors.values()),
      commits
    };
  } catch (error) {
    logger.error('Error extracting entities from raw data', { error });
    stats.errors.push({
      step: 'extractEntities',
      error: error.message
    });
    return null;
  }
}

/**
 * Store extracted entities in the database
 */
async function storeEntities(entities) {
  logger.info('Storing extracted entities in the database');
  
  try {
    // Store repository
    logger.info('Storing repository');
    await supabase
      .from('repositories')
      .upsert([entities.repository], { 
        onConflict: 'github_id',
        returning: 'minimal'
      });
    
    // Store contributors
    if (entities.contributors.length > 0) {
      logger.info(`Storing ${entities.contributors.length} contributors`);
      await supabase
        .from('contributors')
        .upsert(entities.contributors, { 
          onConflict: 'github_id',
          returning: 'minimal'
        });
    }
    
    // Store pull request
    if (entities.pullRequest) {
      logger.info('Storing pull request');
      await supabase
        .from('pull_requests')
        .upsert([entities.pullRequest], { 
          onConflict: 'github_id',
          returning: 'minimal'
        });
    }
    
    // Store commits
    if (entities.commits.length > 0) {
      logger.info(`Storing ${entities.commits.length} commits`);
      await supabase
        .from('commits')
        .upsert(entities.commits, { 
          onConflict: 'sha',
          returning: 'minimal'
        });
    }
    
    logger.info('Successfully stored all extracted entities');
    return true;
  } catch (error) {
    logger.error('Error storing entities', { error });
    stats.errors.push({
      step: 'storeEntities',
      error: error.message
    });
    return false;
  }
}

/**
 * Mark raw data as processed
 */
async function markRawDataAsProcessed(rawDataId) {
  logger.info(`Marking raw data ${rawDataId} as processed`);
  
  try {
    const { error } = await supabase
      .from('github_raw_data')
      .update({ 
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('id', rawDataId);
    
    if (error) {
      throw error;
    }
    
    stats.rawDataProcessed += 1;
    logger.info(`Successfully marked raw data ${rawDataId} as processed`);
    return true;
  } catch (error) {
    logger.error(`Error marking raw data ${rawDataId} as processed`, { error });
    stats.errors.push({
      step: 'markRawDataAsProcessed',
      error: error.message
    });
    return false;
  }
}

/**
 * Fetch entities that need enrichment
 */
async function fetchEntitiesToEnrich() {
  logger.info('Fetching entities that need enrichment');
  
  const entitiesToEnrich = {
    repository: null,
    contributors: [],
    pullRequest: null,
    commits: []
  };
  
  try {
    // Fetch one repository to enrich
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('is_enriched', false)
      .limit(1)
      .single();
    
    if (repoError && !repoError.message.includes('No rows found')) {
      throw repoError;
    }
    
    if (repository) {
      logger.info(`Found repository to enrich: ${repository.name}`);
      entitiesToEnrich.repository = repository;
    }
    
    // Fetch one contributor to enrich
    const { data: contributor, error: contribError } = await supabase
      .from('contributors')
      .select('*')
      .eq('is_enriched', false)
      .limit(1)
      .single();
    
    if (contribError && !contribError.message.includes('No rows found')) {
      throw contribError;
    }
    
    if (contributor) {
      logger.info(`Found contributor to enrich: ${contributor.username}`);
      entitiesToEnrich.contributors.push(contributor);
    }
    
    // Fetch one pull request to enrich
    const { data: pullRequest, error: prError } = await supabase
      .from('pull_requests')
      .select('*')
      .eq('is_enriched', false)
      .limit(1)
      .single();
    
    if (prError && !prError.message.includes('No rows found')) {
      throw prError;
    }
    
    if (pullRequest) {
      logger.info(`Found pull request to enrich: #${pullRequest.number}`);
      entitiesToEnrich.pullRequest = pullRequest;
    }
    
    // Fetch one commit to enrich
    const { data: commit, error: commitError } = await supabase
      .from('commits')
      .select('*')
      .eq('is_enriched', false)
      .limit(1)
      .single();
    
    if (commitError && !commitError.message.includes('No rows found')) {
      throw commitError;
    }
    
    if (commit) {
      logger.info(`Found commit to enrich: ${commit.sha.substring(0, 7)}`);
      entitiesToEnrich.commits.push(commit);
    }
    
    return entitiesToEnrich;
  } catch (error) {
    logger.error('Error fetching entities to enrich', { error });
    stats.errors.push({
      step: 'fetchEntitiesToEnrich',
      error: error.message
    });
    return entitiesToEnrich;
  }
}

/**
 * Enrich repository data
 */
async function enrichRepository(repository) {
  logger.info(`Enriching repository: ${repository.full_name || repository.name}`);
  
  try {
    // Fields to enrich:
    // - language breakdown
    // - star count
    // - fork count
    // - open issues count
    // - topics
    // - license
    // - updated_at (latest activity)
    
    // Call GitHub API to get detailed repository info
    const repoFullName = repository.full_name || `${repository.owner}/${repository.name}`;
    const repoData = await githubClient.getRepository(repoFullName);
    stats.apiCallsMade += 1;
    
    if (!repoData) {
      throw new Error(`Failed to fetch repository data for ${repoFullName}`);
    }
    
    // Enrich with additional data
    const enrichedRepo = {
      ...repository,
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      open_issues: repoData.open_issues_count || 0,
      language: repoData.language,
      topics: repoData.topics || [],
      license: repoData.license?.spdx_id || null,
      is_fork: repoData.fork || false,
      is_archived: repoData.archived || false,
      homepage: repoData.homepage,
      default_branch: repoData.default_branch,
      has_wiki: repoData.has_wiki,
      has_issues: repoData.has_issues,
      updated_at: new Date().toISOString(),
      is_enriched: true
    };
    
    // Get language breakdown
    try {
      const languages = await githubClient.getRepositoryLanguages(repoFullName);
      stats.apiCallsMade += 1;
      
      if (languages) {
        enrichedRepo.language_breakdown = languages;
      }
    } catch (langError) {
      logger.warn(`Error fetching language breakdown for ${repoFullName}`, { error: langError });
    }
    
    // Update the repository in Supabase
    const { error } = await supabase
      .from('repositories')
      .upsert([enrichedRepo], { 
        onConflict: 'github_id',
        returning: 'minimal'
      });
    
    if (error) {
      throw error;
    }
    
    stats.entitiesEnriched.repositories += 1;
    logger.info(`Successfully enriched repository: ${repoFullName}`);
    return enrichedRepo;
  } catch (error) {
    logger.error(`Error enriching repository ${repository.name}`, { error });
    stats.errors.push({
      step: 'enrichRepository',
      error: error.message,
      repository: repository.name
    });
    return null;
  }
}

/**
 * Enrich contributor data
 */
async function enrichContributor(contributor) {
  logger.info(`Enriching contributor: ${contributor.username}`);
  
  try {
    // Fields to enrich:
    // - name (full name)
    // - bio
    // - location
    // - email
    // - company
    // - blog
    // - twitter_username
    // - followers
    // - following
    
    // Call GitHub API to get detailed user info
    const userData = await githubClient.getUser(contributor.username);
    stats.apiCallsMade += 1;
    
    if (!userData) {
      throw new Error(`Failed to fetch user data for ${contributor.username}`);
    }
    
    // Enrich with additional data
    const enrichedContributor = {
      ...contributor,
      name: userData.name,
      bio: userData.bio,
      location: userData.location,
      email: userData.email,
      company: userData.company,
      blog: userData.blog,
      twitter_username: userData.twitter_username,
      followers: userData.followers,
      following: userData.following,
      public_repos: userData.public_repos,
      created_at_github: userData.created_at,
      updated_at: new Date().toISOString(),
      is_enriched: true
    };
    
    // Update the contributor in Supabase
    const { error } = await supabase
      .from('contributors')
      .upsert([enrichedContributor], { 
        onConflict: 'github_id',
        returning: 'minimal'
      });
    
    if (error) {
      throw error;
    }
    
    stats.entitiesEnriched.contributors += 1;
    logger.info(`Successfully enriched contributor: ${contributor.username}`);
    return enrichedContributor;
  } catch (error) {
    logger.error(`Error enriching contributor ${contributor.username}`, { error });
    stats.errors.push({
      step: 'enrichContributor',
      error: error.message,
      contributor: contributor.username
    });
    return null;
  }
}

/**
 * Enrich pull request data
 */
async function enrichPullRequest(pullRequest, repositoryFullName) {
  logger.info(`Enriching pull request #${pullRequest.number}`);
  
  try {
    // Fields to enrich:
    // - comment_count
    // - review_count
    // - additions
    // - deletions
    // - changed_files
    // - labels
    // - complexity score
    // - review time (time between creation and first review)
    // - cycle time (time between creation and merge)
    
    // Parse full repository name from database or input
    let repoFullName = repositoryFullName;
    
    if (!repoFullName) {
      // Try to get repository info from the database
      const { data: repo, error } = await supabase
        .from('repositories')
        .select('owner, name, full_name')
        .eq('github_id', pullRequest.repository_id)
        .single();
      
      if (error) {
        throw new Error(`Failed to find repository for PR: ${error.message}`);
      }
      
      repoFullName = repo.full_name || `${repo.owner}/${repo.name}`;
    }
    
    // Call GitHub API to get PR details
    const [owner, repo] = repoFullName.split('/');
    const prData = await githubClient.getPullRequest(owner, repo, pullRequest.number);
    stats.apiCallsMade += 1;
    
    if (!prData) {
      throw new Error(`Failed to fetch PR data for ${repoFullName}#${pullRequest.number}`);
    }
    
    // Enrich with additional data
    const enrichedPR = {
      ...pullRequest,
      additions: prData.additions || 0,
      deletions: prData.deletions || 0,
      changed_files: prData.changed_files || 0,
      comment_count: prData.comments || 0,
      review_comment_count: prData.review_comments || 0,
      labels: prData.labels?.map(label => label.name) || [],
      updated_at: new Date().toISOString(),
      is_enriched: true
    };
    
    // Calculate complexity score
    // Simple formula based on changes, files, and comments
    const linesChanged = (enrichedPR.additions + enrichedPR.deletions);
    const filesChanged = enrichedPR.changed_files;
    const commentActivity = enrichedPR.comment_count + enrichedPR.review_comment_count;
    
    enrichedPR.complexity_score = Math.min(
      100,
      Math.round(
        (linesChanged / 100) * 0.5 +
        (filesChanged * 2) * 0.3 +
        (commentActivity * 3) * 0.2
      )
    );
    
    // Calculate cycle time if merged
    if (enrichedPR.created_at && enrichedPR.merged_at) {
      const createdDate = new Date(enrichedPR.created_at);
      const mergedDate = new Date(enrichedPR.merged_at);
      enrichedPR.cycle_time_hours = Math.round((mergedDate - createdDate) / (1000 * 60 * 60));
    }
    
    // Try to get review data for review time calculation
    try {
      const reviews = await githubClient.getPullRequestReviews(owner, repo, pullRequest.number);
      stats.apiCallsMade += 1;
      
      if (reviews && reviews.length > 0) {
        // Sort by submitted_at
        reviews.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
        
        // Get the earliest review
        const firstReview = reviews[0];
        
        if (firstReview && firstReview.submitted_at) {
          const createdDate = new Date(enrichedPR.created_at);
          const reviewDate = new Date(firstReview.submitted_at);
          enrichedPR.first_review_time_hours = Math.round((reviewDate - createdDate) / (1000 * 60 * 60));
        }
        
        enrichedPR.review_count = reviews.length;
      }
    } catch (reviewError) {
      logger.warn(`Error fetching PR reviews for ${repoFullName}#${pullRequest.number}`, { error: reviewError });
    }
    
    // Update the pull request in Supabase
    const { error } = await supabase
      .from('pull_requests')
      .upsert([enrichedPR], { 
        onConflict: 'github_id',
        returning: 'minimal'
      });
    
    if (error) {
      throw error;
    }
    
    stats.entitiesEnriched.mergeRequests += 1;
    logger.info(`Successfully enriched pull request: ${repoFullName}#${pullRequest.number}`);
    return enrichedPR;
  } catch (error) {
    logger.error(`Error enriching pull request #${pullRequest.number}`, { error });
    stats.errors.push({
      step: 'enrichPullRequest',
      error: error.message,
      pullRequest: pullRequest.number
    });
    return null;
  }
}

/**
 * Enrich commit data
 */
async function enrichCommit(commit, repositoryFullName) {
  logger.info(`Enriching commit: ${commit.sha.substring(0, 7)}`);
  
  try {
    // Fields to enrich:
    // - detailed info about files changed
    // - commit date with author details
    // - whether it's a merge commit
    // - whether it contains code vs. docs/other
    // - impact score
    
    // Parse full repository name from database or input
    let repoFullName = repositoryFullName;
    
    if (!repoFullName) {
      // Try to get repository info from the database
      const { data: repo, error } = await supabase
        .from('repositories')
        .select('owner, name, full_name')
        .eq('github_id', commit.repository_id)
        .single();
      
      if (error) {
        throw new Error(`Failed to find repository for commit: ${error.message}`);
      }
      
      repoFullName = repo.full_name || `${repo.owner}/${repo.name}`;
    }
    
    // Call GitHub API to get commit details
    const [owner, repo] = repoFullName.split('/');
    const commitData = await githubClient.getCommit(owner, repo, commit.sha);
    stats.apiCallsMade += 1;
    
    if (!commitData) {
      throw new Error(`Failed to fetch commit data for ${commit.sha}`);
    }
    
    // Prepare file changes analysis
    const fileTypes = {
      code: 0,
      docs: 0,
      config: 0,
      other: 0
    };
    
    // Analyze files
    if (commitData.files) {
      commitData.files.forEach(file => {
        const extension = file.filename.split('.').pop().toLowerCase();
        
        // Categorize files by type
        if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'rb', 'php', 'c', 'cpp', 'cs', 'go', 'rs', 'swift'].includes(extension)) {
          fileTypes.code++;
        } else if (['md', 'txt', 'rst', 'adoc', 'pdf', 'doc', 'docx'].includes(extension)) {
          fileTypes.docs++;
        } else if (['json', 'yml', 'yaml', 'toml', 'ini', 'xml', 'config', 'env'].includes(extension)) {
          fileTypes.config++;
        } else {
          fileTypes.other++;
        }
      });
    }
    
    // Enrich with additional data
    const enrichedCommit = {
      ...commit,
      additions: commitData.stats?.additions || commit.additions || 0,
      deletions: commitData.stats?.deletions || commit.deletions || 0,
      files_changed: commitData.files?.length || commit.files_changed || 0,
      committed_at: commitData.commit?.author?.date || commit.committed_at,
      file_types: fileTypes,
      is_merge_commit: commitData.parents?.length > 1 || false,
      updated_at: new Date().toISOString(),
      is_enriched: true
    };
    
    // Calculate impact score
    // Simple formula based on changes and file count
    const linesChanged = (enrichedCommit.additions + enrichedCommit.deletions);
    const filesChanged = enrichedCommit.files_changed;
    const isCode = fileTypes.code > 0;
    
    enrichedCommit.impact_score = Math.min(
      100,
      Math.round(
        (linesChanged / 50) * 0.6 +
        (filesChanged * 5) * 0.3 +
        (isCode ? 10 : 0) * 0.1
      )
    );
    
    // Update the commit in Supabase
    const { error } = await supabase
      .from('commits')
      .upsert([enrichedCommit], { 
        onConflict: 'sha',
        returning: 'minimal'
      });
    
    if (error) {
      throw error;
    }
    
    stats.entitiesEnriched.commits += 1;
    logger.info(`Successfully enriched commit: ${commit.sha.substring(0, 7)}`);
    return enrichedCommit;
  } catch (error) {
    logger.error(`Error enriching commit ${commit.sha.substring(0, 7)}`, { error });
    stats.errors.push({
      step: 'enrichCommit',
      error: error.message,
      commit: commit.sha.substring(0, 7)
    });
    return null;
  }
}

/**
 * Update contributor-repository relationships
 */
async function updateRepositoryContributorRelationships(repositoryId, contributorIds) {
  logger.info(`Updating repository-contributor relationships for repo ${repositoryId}`);
  
  try {
    if (!repositoryId || !contributorIds || contributorIds.length === 0) {
      logger.warn('Missing repository ID or contributor IDs');
      return false;
    }
    
    // Prepare relationships data
    const relationships = contributorIds.map(contributorId => ({
      repository_id: repositoryId,
      contributor_id: contributorId,
      contributions: 1, // Will be updated with actual counts later
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Insert relationships
    const { error } = await supabase
      .from('repository_contributors')
      .upsert(relationships, {
        onConflict: 'repository_id,contributor_id',
        returning: 'minimal'
      });
    
    if (error) {
      throw error;
    }
    
    stats.relationshipsCreated += relationships.length;
    logger.info(`Successfully updated ${relationships.length} repository-contributor relationships`);
    return true;
  } catch (error) {
    logger.error(`Error updating repository-contributor relationships`, { error });
    stats.errors.push({
      step: 'updateRepositoryContributorRelationships',
      error: error.message
    });
    return false;
  }
}

/**
 * Create a final summary of the pipeline execution
 */
function createSummary() {
  logger.info('Creating summary of pipeline execution');
  
  const summary = {
    testName: TEST_NAME,
    executionTime: new Date().toISOString(),
    stats: {
      ...stats,
      totalEntitiesExtracted: 
        stats.entitiesExtracted.repositories +
        stats.entitiesExtracted.contributors +
        stats.entitiesExtracted.mergeRequests +
        stats.entitiesExtracted.commits,
      totalEntitiesEnriched:
        stats.entitiesEnriched.repositories +
        stats.entitiesEnriched.contributors +
        stats.entitiesEnriched.mergeRequests +
        stats.entitiesEnriched.commits,
      errorCount: stats.errors.length
    },
    success: stats.errors.length === 0,
    fields: {
      repository: [
        'stars', 'forks', 'open_issues', 'language', 'topics',
        'license', 'is_fork', 'is_archived', 'language_breakdown',
        'homepage', 'default_branch', 'has_wiki', 'has_issues'
      ],
      contributor: [
        'name', 'bio', 'location', 'email', 'company', 'blog',
        'twitter_username', 'followers', 'following', 'public_repos',
        'created_at_github'
      ],
      pullRequest: [
        'additions', 'deletions', 'changed_files', 'comment_count',
        'review_comment_count', 'labels', 'complexity_score',
        'cycle_time_hours', 'first_review_time_hours', 'review_count'
      ],
      commit: [
        'additions', 'deletions', 'files_changed', 'committed_at',
        'file_types', 'is_merge_commit', 'impact_score'
      ]
    }
  };
  
  logger.info('Pipeline execution summary', { summary });
  return summary;
}

/**
 * Run the complete pipeline process
 */
async function runPipeline() {
  logger.info(`Starting ${TEST_NAME}`);
  
  try {
    // Initialize schema manager
    await schemaManager.initialize();
    
    // NEW STEP 0: Fetch data from GitHub and store in github_raw_data
    // This will be conditional - check if we need to fetch new data or use existing
    const { data: existingData, error: existingError } = await supabase
      .from('github_raw_data')
      .select('count')
      .eq('processed', false);
    
    if (existingError) {
      throw existingError;
    }
    
    // If no unprocessed data exists, fetch new data
    if (!existingData || existingData.length === 0 || existingData[0].count === 0) {
      logger.info('No unprocessed data found in github_raw_data, fetching new data...');
      const fetchResult = await fetchGitHubData();
      if (!fetchResult) {
        logger.warn('Failed to fetch new data from GitHub, proceeding with existing data if available');
      }
    } else {
      logger.info(`Found existing unprocessed data, skipping GitHub API fetch`);
    }
    
    // STEP 1: Fetch unprocessed raw data
    const rawData = await fetchUnprocessedRawData();
    if (!rawData) {
      logger.warn('No unprocessed raw data found, skipping extraction phase');
    } else {
      // STEP 2: Extract entities
      const entities = await extractEntities(rawData);
      if (!entities) {
        throw new Error('Failed to extract entities from raw data');
      }
      
      // STEP 3: Store entities
      const stored = await storeEntities(entities);
      if (!stored) {
        throw new Error('Failed to store extracted entities');
      }
      
      // STEP 4: Mark raw data as processed
      await markRawDataAsProcessed(rawData.id);
      
      // NEW STEP 4.5: Check for missing contributors
      await checkContributors();
    }
    
    // STEP 5: Fetch entities to enrich
    const entitiesToEnrich = await fetchEntitiesToEnrich();
    
    // STEP 6: Enrich entities
    if (entitiesToEnrich.repository) {
      const enrichedRepo = await enrichRepository(entitiesToEnrich.repository);
      
      // Add contributor relationships for this repository
      if (enrichedRepo && entitiesToEnrich.contributors.length > 0) {
        const contributorIds = entitiesToEnrich.contributors.map(c => c.github_id);
        await updateRepositoryContributorRelationships(enrichedRepo.github_id, contributorIds);
      }
    }
    
    for (const contributor of entitiesToEnrich.contributors) {
      await enrichContributor(contributor);
    }
    
    if (entitiesToEnrich.pullRequest) {
      await enrichPullRequest(entitiesToEnrich.pullRequest);
    }
    
    for (const commit of entitiesToEnrich.commits) {
      await enrichCommit(commit);
    }
    
    // STEP 7: Create summary
    const summary = createSummary();
    
    return summary;
  } catch (error) {
    logger.error('Pipeline execution failed', { error });
    stats.errors.push({
      step: 'runPipeline',
      error: error.message
    });
    
    return {
      testName: TEST_NAME,
      executionTime: new Date().toISOString(),
      stats,
      success: false,
      error: error.message
    };
  }
}

// Run the pipeline
runPipeline()
  .then(summary => {
    if (summary.success) {
      logger.info('Pipeline execution completed successfully');
    } else {
      logger.error('Pipeline execution completed with errors');
    }
    
    // Exit with appropriate code
    process.exit(summary.success ? 0 : 1);
  })
  .catch(error => {
    logger.error('Fatal error in pipeline execution', { error });
    process.exit(1);
  }); 