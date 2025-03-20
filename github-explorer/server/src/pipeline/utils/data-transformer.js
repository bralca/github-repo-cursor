/**
 * DataTransformer - Utilities for transforming GitHub API data
 * 
 * This module provides functions to transform raw GitHub API data into
 * the correct format for storage in the database, following the expected schema.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Transform a GitHub repository object
 * @param {Object} rawRepo - Raw repository data from GitHub API
 * @returns {Object} Transformed repository object ready for database storage
 */
export function transformRepository(rawRepo) {
  if (!rawRepo) return null;
  
  return {
    id: rawRepo.id,
    name: rawRepo.name,
    full_name: rawRepo.full_name,
    owner_id: rawRepo.owner?.id,
    owner_login: rawRepo.owner?.login,
    owner_avatar_url: rawRepo.owner?.avatar_url,
    description: rawRepo.description,
    html_url: rawRepo.html_url,
    api_url: rawRepo.url,
    git_url: rawRepo.git_url,
    clone_url: rawRepo.clone_url,
    default_branch: rawRepo.default_branch,
    homepage: rawRepo.homepage,
    size: rawRepo.size,
    stargazers_count: rawRepo.stargazers_count,
    watchers_count: rawRepo.watchers_count,
    forks_count: rawRepo.forks_count,
    open_issues_count: rawRepo.open_issues_count,
    language: rawRepo.language,
    is_fork: rawRepo.fork,
    is_archived: rawRepo.archived,
    is_disabled: rawRepo.disabled,
    is_private: rawRepo.private,
    has_issues: rawRepo.has_issues,
    has_projects: rawRepo.has_projects,
    has_wiki: rawRepo.has_wiki,
    has_pages: rawRepo.has_pages,
    has_downloads: rawRepo.has_downloads,
    license_key: rawRepo.license?.key,
    license_name: rawRepo.license?.name,
    created_at: rawRepo.created_at,
    updated_at: rawRepo.updated_at,
    pushed_at: rawRepo.pushed_at,
    last_fetched_at: new Date().toISOString(),
    metadata: {
      topics: rawRepo.topics || [],
      network_count: rawRepo.network_count,
      subscribers_count: rawRepo.subscribers_count
    }
  };
}

/**
 * Transform a GitHub contributor object
 * @param {Object} rawContributor - Raw contributor data from GitHub API
 * @param {number} repositoryId - ID of the repository this contributor belongs to
 * @returns {Object} Transformed contributor object ready for database storage
 */
export function transformContributor(rawContributor, repositoryId) {
  if (!rawContributor) return null;
  
  return {
    id: rawContributor.id,
    login: rawContributor.login,
    type: rawContributor.type,
    avatar_url: rawContributor.avatar_url,
    html_url: rawContributor.html_url,
    api_url: rawContributor.url,
    site_admin: rawContributor.site_admin,
    name: rawContributor.name,
    company: rawContributor.company,
    blog: rawContributor.blog,
    location: rawContributor.location,
    email: rawContributor.email,
    bio: rawContributor.bio,
    hireable: rawContributor.hireable,
    twitter_username: rawContributor.twitter_username,
    public_repos: rawContributor.public_repos,
    public_gists: rawContributor.public_gists,
    followers: rawContributor.followers,
    following: rawContributor.following,
    created_at: rawContributor.created_at,
    updated_at: rawContributor.updated_at,
    last_fetched_at: new Date().toISOString()
  };
}

/**
 * Create a repository-contributor relationship
 * @param {number} repositoryId - Repository ID
 * @param {number} contributorId - Contributor ID
 * @param {Object} stats - Contribution statistics
 * @returns {Object} Repository-contributor relationship record
 */
export function createRepositoryContributor(repositoryId, contributorId, stats = {}) {
  return {
    repository_id: repositoryId,
    contributor_id: contributorId,
    contributions_count: stats.contributions || 0,
    additions: stats.additions || 0,
    deletions: stats.deletions || 0,
    commit_count: stats.commit_count || 0,
    pull_request_count: stats.pull_request_count || 0,
    review_count: stats.review_count || 0,
    last_contribution_at: stats.last_contribution_at,
    first_contribution_at: stats.first_contribution_at,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Transform a GitHub pull request object
 * @param {Object} rawPullRequest - Raw pull request data from GitHub API
 * @param {number} repositoryId - ID of the repository this PR belongs to
 * @returns {Object} Transformed pull request object ready for database storage
 */
export function transformMergeRequest(rawPullRequest, repositoryId) {
  if (!rawPullRequest) return null;
  
  // Use the repository-specific PR number (pr_number) as github_id instead of the internal GitHub ID (id)
  // If pr_number is not available, fall back to number (which should be the PR number in the repo)
  const prNumber = rawPullRequest.pr_number || rawPullRequest.number;
  
  return {
    id: uuidv4(), // Generate a UUID for our database PK
    github_id: prNumber, // Use PR number as the github_id (for API calls)
    repository_id: repositoryId,
    repository_github_id: rawPullRequest.base?.repo?.id,
    author_id: null, // Will be linked later after contributor is created
    author_github_id: rawPullRequest.user?.id,
    title: rawPullRequest.title,
    description: rawPullRequest.body || '',
    state: rawPullRequest.state,
    is_draft: rawPullRequest.draft || false,
    created_at: rawPullRequest.created_at,
    updated_at: rawPullRequest.updated_at,
    closed_at: rawPullRequest.closed_at || null,
    merged_at: rawPullRequest.merged_at || null,
    merged_by_id: null, // Will be linked later after contributor is created
    merged_by_github_id: rawPullRequest.merged_by?.id || null,
    commits_count: rawPullRequest.commits || 0,
    additions: rawPullRequest.additions || 0,
    deletions: rawPullRequest.deletions || 0,
    changed_files: rawPullRequest.changed_files || 0,
    labels: JSON.stringify((rawPullRequest.labels || []).map(label => label.name)),
    source_branch: rawPullRequest.head?.ref,
    target_branch: rawPullRequest.base?.ref,
    is_enriched: false
  };
}

/**
 * Transform a GitHub commit object
 * @param {Object} rawCommit - Raw commit data from GitHub API
 * @param {number} repositoryId - ID of the repository this commit belongs to
 * @param {number} pullRequestId - Optional ID of the pull request this commit belongs to
 * @returns {Object} Transformed commit object ready for database storage
 */
export function transformCommit(rawCommit, repositoryId, pullRequestId = null) {
  if (!rawCommit) return null;
  
  return {
    sha: rawCommit.sha,
    repository_id: repositoryId,
    pull_request_id: pullRequestId,
    author_id: rawCommit.author?.id,
    author_login: rawCommit.author?.login,
    author_name: rawCommit.commit?.author?.name,
    author_email: rawCommit.commit?.author?.email,
    committer_id: rawCommit.committer?.id,
    committer_login: rawCommit.committer?.login,
    committer_name: rawCommit.commit?.committer?.name,
    committer_email: rawCommit.commit?.committer?.email,
    message: rawCommit.commit?.message,
    html_url: rawCommit.html_url,
    api_url: rawCommit.url,
    commit_url: rawCommit.commit?.url,
    comments_url: rawCommit.comments_url,
    comments_count: rawCommit.commit?.comment_count,
    additions: rawCommit.stats?.additions,
    deletions: rawCommit.stats?.deletions,
    total_changes: rawCommit.stats?.total,
    authored_at: rawCommit.commit?.author?.date,
    committed_at: rawCommit.commit?.committer?.date,
    last_fetched_at: new Date().toISOString(),
    files: (rawCommit.files || []).map(file => ({
      filename: file.filename,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      status: file.status,
      blob_url: file.blob_url,
      raw_url: file.raw_url,
      patch: file.patch
    })),
    metadata: {
      tree_url: rawCommit.commit?.tree?.url,
      verification: rawCommit.commit?.verification
    }
  };
}

/**
 * Extract and transform GitHub data from the raw webhook payload
 * @param {Object} rawData - Raw webhook data from GitHub
 * @returns {Object} Transformed entities
 */
export function extractEntitiesFromWebhook(rawData) {
  // Extract data from webhook payload
  const { repository, pull_request } = rawData;
  
  // Transform repository
  const transformedRepo = repository ? transformRepository(repository) : null;
  
  // Transform pull request if available
  const transformedPullRequest = pull_request && transformedRepo ? 
    transformMergeRequest(pull_request, transformedRepo.id) : null;
  
  // Transform contributor (PR author)
  const contributor = pull_request?.user ? 
    transformContributor(pull_request.user) : null;
  
  // Create repo-contributor relationship if both exist
  const repoContributor = transformedRepo && contributor ? 
    createRepositoryContributor(transformedRepo.id, contributor.id) : null;
  
  // Extract and transform commits if available
  const commits = [];
  if (pull_request?.commits && Array.isArray(pull_request.commits) && transformedRepo) {
    for (const rawCommit of pull_request.commits) {
      if (rawCommit) {
        const transformedCommit = transformCommit(
          rawCommit, 
          transformedRepo.id,
          transformedPullRequest?.id
        );
        if (transformedCommit) {
          commits.push(transformedCommit);
        }
      }
    }
  }
  
  return {
    repository: transformedRepo,
    mergeRequest: transformedPullRequest,
    contributor,
    repoContributor,
    commits: commits.length > 0 ? commits : null
  };
}

// Export all transformation functions
export const DataTransformer = {
  transformRepository,
  transformContributor,
  createRepositoryContributor,
  transformMergeRequest,
  transformCommit,
  extractEntitiesFromWebhook
}; 