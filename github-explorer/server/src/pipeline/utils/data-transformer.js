/**
 * DataTransformer - Utilities for transforming GitHub API data
 * 
 * This module provides functions to transform raw GitHub API data into
 * the correct format for storage in the database, following the expected schema.
 */

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
  
  return {
    id: rawPullRequest.id,
    repository_id: repositoryId,
    number: rawPullRequest.number,
    state: rawPullRequest.state,
    title: rawPullRequest.title,
    body: rawPullRequest.body,
    user_id: rawPullRequest.user?.id,
    user_login: rawPullRequest.user?.login,
    html_url: rawPullRequest.html_url,
    api_url: rawPullRequest.url,
    diff_url: rawPullRequest.diff_url,
    patch_url: rawPullRequest.patch_url,
    issue_url: rawPullRequest.issue_url,
    merged: rawPullRequest.merged,
    mergeable: rawPullRequest.mergeable,
    mergeable_state: rawPullRequest.mergeable_state,
    merged_by_id: rawPullRequest.merged_by?.id,
    merged_by_login: rawPullRequest.merged_by?.login,
    merged_at: rawPullRequest.merged_at,
    comments_count: rawPullRequest.comments,
    review_comments_count: rawPullRequest.review_comments,
    commits_count: rawPullRequest.commits,
    additions: rawPullRequest.additions,
    deletions: rawPullRequest.deletions,
    changed_files: rawPullRequest.changed_files,
    base_ref: rawPullRequest.base?.ref,
    base_sha: rawPullRequest.base?.sha,
    head_ref: rawPullRequest.head?.ref,
    head_sha: rawPullRequest.head?.sha,
    head_repo_id: rawPullRequest.head?.repo?.id,
    head_repo_full_name: rawPullRequest.head?.repo?.full_name,
    created_at: rawPullRequest.created_at,
    updated_at: rawPullRequest.updated_at,
    closed_at: rawPullRequest.closed_at,
    last_fetched_at: new Date().toISOString(),
    labels: (rawPullRequest.labels || []).map(label => ({
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description
    })),
    requested_reviewers: (rawPullRequest.requested_reviewers || []).map(reviewer => ({
      id: reviewer.id,
      login: reviewer.login
    })),
    metadata: {
      author_association: rawPullRequest.author_association,
      draft: rawPullRequest.draft,
      rebaseable: rawPullRequest.rebaseable,
      maintainer_can_modify: rawPullRequest.maintainer_can_modify
    }
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