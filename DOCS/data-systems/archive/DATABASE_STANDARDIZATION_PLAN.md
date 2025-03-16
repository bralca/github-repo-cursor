# Database Schema Standardization Plan

## Overview

This document outlines the plan to standardize all entity tables in the GitHub Explorer database with a consistent approach to identifiers. The current schema has inconsistencies in how GitHub entity IDs are stored and referenced, which can lead to confusion and potential issues with data integrity.

This document serves as the definitive reference for all database operations in the GitHub Explorer application.

## Current Schema Observations

Based on the screenshot and database documentation, we've identified several issues:

1. **Inconsistent Primary Keys**: 
   - Contributors table uses GitHub username as the `id` (primary key)
   - Some tables use Supabase-generated IDs while others use GitHub IDs
   - The `github_id` field exists in some tables but not others

2. **Foreign Key Inconsistencies**:
   - References between tables use different ID formats
   - Some relationships use GitHub usernames, others use numeric IDs

3. **Data Integrity Risks**:
   - Using GitHub usernames as primary keys is problematic since usernames can change
   - Mixing identifier types makes joins and relationships complex

## Standardized Schema Approach

We propose a consistent approach for all entity tables:

1. **Primary Keys**: All tables will use Supabase-generated UUIDs as the `id` field (primary key)
2. **GitHub Identifiers**: All entities will have a `github_id` field that stores the original GitHub identifier
3. **Foreign Keys**: All relationships will use Supabase UUIDs consistently
4. **Ghost Foreign Keys**: All relevant entities will include GitHub ID reference fields for simplified querying
5. **Nullable Usernames**: Username fields will be nullable to properly handle unknown contributors

## Common Fields Across All Entities

These fields should be present in all entity tables:

| Field | Type | Description | Required | Notes |
|-------|------|-------------|----------|-------|
| id | uuid | Supabase UUID primary key | Yes | Auto-generated, never manually set |
| github_id | varies | GitHub's unique ID for this entity | Yes | Must be unique within entity type |
| created_at | timestamp | Record creation time | Yes | Default to current timestamp |
| updated_at | timestamp | Last update time | Yes | Default to current timestamp, update on changes |
| is_enriched | boolean | Whether entity has been enriched with additional data | Yes | Default to false |

## Detailed Entity Specifications

### 1. Contributors Table

The Contributors table stores information about GitHub users who have contributed to repositories.

**Current Schema**:

| Field | Type | Description | Issue |
|-------|------|-------------|-------|
| id | text | Primary key (GitHub username) | Using username as ID is problematic |
| username | text | GitHub username | Redundant with ID |
| github_id | BIGINT | GitHub numeric ID | Nullable, not primary identifier |

**Standardized Schema**:

| Field | Type | Description | Source in API | Validation Rules |
|-------|------|-------------|--------------|------------------|
| id | uuid | Supabase UUID primary key | Auto-generated | Must be unique |
| github_id | bigint | GitHub's numeric user ID | contributor.id | Must be unique, not null |
| username | text | GitHub username | contributor.login | Can be null for unknown users |
| name | text | Display name | contributor.name | Can be null |
| avatar | text | URL to avatar image | contributor.avatar_url | Should be a valid URL |
| is_enriched | boolean | Has profile been enriched with additional data | false initially | true/false |
| bio | text | User bio | contributor.bio | Can be null |
| company | text | Company affiliation | contributor.company | Can be null |
| blog | text | Blog URL | contributor.blog | Should be a valid URL if present |
| twitter_username | text | Twitter username | contributor.twitter_username | Can be null |
| location | text | User location | contributor.location | Can be null |
| followers | integer | Follower count | contributor.followers | Should be ≥ 0 |
| repositories | integer | Number of public repositories | contributor.public_repos | Should be ≥ 0 |
| impact_score | integer | Calculated impact score | Derived metric | Should be ≥ 0 |
| role_classification | text | Classified contributor role | Derived classification | Can be null |
| top_languages | text[] | Array of most used languages | From user's repos | Can be null |
| organizations | text[] | Array of organization memberships | From user's orgs | Can be null |
| first_contribution | timestamp | Date of first contribution | Derived from activity | Can be null |
| last_contribution | timestamp | Date of most recent contribution | Derived from activity | Can be null |
| direct_commits | integer | Number of direct commits | Count from commits table | Should be ≥ 0 |
| pull_requests_merged | integer | Number of merged PRs | Count from PRs | Should be ≥ 0 |
| pull_requests_rejected | integer | Number of rejected PRs | Count from PRs | Should be ≥ 0 |
| code_reviews | integer | Number of code reviews | Count from reviews | Should be ≥ 0 |
| is_placeholder | boolean | Whether this is a placeholder | false (normally) | true for unknown contributors |
| created_at | timestamp | Creation timestamp | Now() | Not null |
| updated_at | timestamp | Last update timestamp | Now() | Not null |

**Querying By**:
- Primary lookups: `github_id` (most reliable)
- Secondary lookups: `username` (less reliable as usernames can change)

**Indexing**:
- Primary index on `id` (UUID)
- Unique index on `github_id`
- Regular index on `username`

### 2. Repositories Table

The Repositories table stores information about GitHub repositories being tracked in the system.

**Current Schema**:

| Field | Type | Description | Issue |
|-------|------|-------------|-------|
| id | integer | Primary key (GitHub repo ID) | Using GitHub ID as primary key |
| name | text | Repository name | |
| ... | ... | (other fields) | ... |

**Standardized Schema**:

| Field | Type | Description | Source in API | Validation Rules |
|-------|------|-------------|--------------|------------------|
| id | uuid | Supabase UUID primary key | Auto-generated | Must be unique |
| github_id | bigint | GitHub repository ID | repository.id | Must be unique, not null |
| name | text | Repository name | repository.name | Not null |
| full_name | text | Full repository name (owner/repo) | repository.full_name | Not null, format: "owner/repo" |
| description | text | Repository description | repository.description | Can be null |
| url | text | Repository URL | repository.html_url | Not null, valid URL |
| api_url | text | GitHub API URL for repo | repository.url | Not null, valid URL |
| stars | integer | Star count | repository.stargazers_count | Default 0, not null |
| forks | integer | Fork count | repository.forks_count | Default 0, not null |
| is_enriched | boolean | Has repo been enriched | false initially | true/false |
| health_percentage | integer | Repository health score (0-100) | Calculated metric | 0-100 range if present |
| open_issues_count | integer | Count of open issues | repository.open_issues_count | Default 0, not null |
| last_updated | timestamp | Last update timestamp | repository.updated_at | Can be null |
| size_kb | integer | Repository size in KB | repository.size | Can be null |
| watchers_count | integer | Number of watchers | repository.watchers_count | Default 0, not null |
| primary_language | text | Primary programming language | repository.language | Can be null |
| license | text | License information | repository.license?.name | Can be null |
| is_fork | boolean | Whether repo is a fork | repository.fork | Default false, not null |
| is_archived | boolean | Whether repo is archived | repository.archived | Default false, not null |
| default_branch | text | Default branch name | repository.default_branch | Default "main", not null |
| source | text | Data source identifier | "github_api" | Not null |
| owner_id | uuid | UUID reference to contributor | From contributor lookup | Can be null |
| owner_github_id | bigint | GitHub ID of repository owner | repository.owner.id | For querying, not a foreign key |
| created_at | timestamp | Creation timestamp | Now() | Not null |
| updated_at | timestamp | Last update timestamp | Now() | Not null |

**Querying By**:
- Primary lookups: `github_id` (unique repository ID)
- Secondary lookups: `full_name` (owner/repo format)
- Owner lookups: `owner_github_id` (for all repos by owner)

**Indexing**:
- Primary index on `id` (UUID)
- Unique index on `github_id`
- Index on `full_name`
- Index on `owner_github_id`

### 3. Merge Requests Table

The Merge Requests table stores information about pull requests (PRs) submitted to repositories.

**Current Schema**:

| Field | Type | Description | Issue |
|-------|------|-------------|-------|
| id | integer | Auto-generated primary key | |
| github_id | integer | GitHub PR number | |
| repository_id | integer | Repository reference | References GitHub ID |
| author_id | text | Contributor reference | References GitHub username |
| ... | ... | (other fields) | ... |

**Standardized Schema**:

| Field | Type | Description | Source in API | Validation Rules |
|-------|------|-------------|--------------|------------------|
| id | uuid | Supabase UUID primary key | Auto-generated | Must be unique |
| github_id | integer | GitHub PR number | pull_request.number | Part of composite unique constraint |
| repository_id | uuid | UUID reference to repositories | From repository lookup | Not null, foreign key |
| repository_github_id | bigint | GitHub repository ID | repository.id | For querying, not a foreign key |
| author_id | uuid | UUID reference to contributors | From contributor lookup | Not null, foreign key |
| author_github_id | bigint | GitHub user ID | pull_request.user.id | For querying, not a foreign key |
| title | text | PR title | pull_request.title | Not null |
| description | text | PR description | pull_request.body | Can be null |
| state | text | Current state | pull_request.state or "merged" | Values: "open", "closed", "merged" |
| is_draft | boolean | Whether PR is a draft | pull_request.draft | Default false, not null |
| created_at | timestamp | Creation timestamp | pull_request.created_at | Not null |
| updated_at | timestamp | Last update timestamp | pull_request.updated_at | Not null |
| closed_at | timestamp | Closure timestamp | pull_request.closed_at | Can be null |
| merged_at | timestamp | Merge timestamp | pull_request.merged_at | Can be null |
| merged_by_id | uuid | UUID reference to contributors | From contributor lookup | Can be null, foreign key |
| merged_by_github_id | bigint | GitHub user ID of merger | pull_request.merged_by?.id | For querying, not a foreign key |
| commits_count | integer | Number of commits in PR | pull_request.commits.length | Default 0, not null |
| additions | integer | Lines added | Calculate from commits | Default 0, not null |
| deletions | integer | Lines removed | Calculate from commits | Default 0, not null |
| changed_files | integer | Files modified | Calculate from commits | Default 0, not null |
| complexity_score | integer | Calculated complexity | Derived metric | Can be null |
| review_time_hours | integer | Time in review | Calculate from timestamps | Can be null |
| cycle_time_hours | integer | Total PR lifecycle time | Calculate from timestamps | Can be null |
| labels | text[] | Array of PR labels | pull_request.labels | Can be null |
| source_branch | text | Source branch name | pull_request.head.ref | Can be null |
| target_branch | text | Target branch name | pull_request.base.ref | Can be null |
| is_enriched | boolean | Has PR been enriched | false initially | true/false |
| review_count | integer | Number of reviews | Count from reviews | Default 0, not null |
| comment_count | integer | Number of comments | Count from comments | Default 0, not null |

**Querying By**:
- Repository + PR number: `repository_github_id` + `github_id` (GitHub's natural key)
- Author lookups: `author_github_id` (for all PRs by author)
- State filtering: `state` + `repository_github_id` (e.g., all open PRs in a repo)

**Indexing**:
- Primary index on `id` (UUID)
- Unique composite index on (`repository_id`, `github_id`) 
- Index on `repository_github_id`
- Index on `author_github_id`
- Index on `state`

### 4. Commits Table

The Commits table stores information about commits made to repositories.

**Current Schema**:

| Field | Type | Description | Issue |
|-------|------|-------------|-------|
| id | integer | Auto-generated primary key | |
| sha | text | Commit SHA hash | Could be used as github_id |
| repository_id | integer | Repository reference | References GitHub ID |
| contributor_id | text | Contributor reference | References GitHub username |
| ... | ... | (other fields) | ... |

**Standardized Schema**:

| Field | Type | Description | Source in API | Validation Rules |
|-------|------|-------------|--------------|------------------|
| id | uuid | Supabase UUID primary key | Auto-generated | Must be unique |
| github_id | text | Commit SHA hash | commit.sha | Must be unique within a repository |
| sha | text | Commit SHA hash (for compatibility) | commit.sha | Same as github_id |
| repository_id | uuid | UUID reference to repositories | From repository lookup | Not null, foreign key |
| repository_github_id | bigint | GitHub repository ID | repository.id | For querying, not a foreign key |
| contributor_id | uuid | UUID reference to contributors | From contributor lookup | Can be null, foreign key |
| contributor_github_id | bigint | GitHub user ID | commit.author?.id | For querying, not a foreign key |
| author | text | Author name (deprecated) | commit.author?.login | For backward compatibility |
| message | text | Commit message | commit.message | Not null |
| additions | integer | Lines added | Calculate from patches | Default 0, not null |
| deletions | integer | Lines removed | Calculate from patches | Default 0, not null |
| files_changed | integer | Files modified | commit.content?.length | Default 0, not null |
| is_merge_commit | boolean | Whether it's a merge commit | Check message | Default false, not null |
| committed_at | timestamp | Timestamp of the commit | commit.timestamp | Not null |
| pull_request_id | uuid | UUID reference to merge_requests | From PR lookup | Can be null, foreign key |
| pull_request_github_id | integer | GitHub PR number | From PR | For querying, not a foreign key |
| complexity_score | integer | Calculated complexity | Derived metric | Can be null |
| is_placeholder_author | boolean | Whether author is unknown | !commit.author | Default false, not null |
| parents | text[] | Array of parent commit SHAs | commit.parents | Can be null |
| is_enriched | boolean | Has commit been enriched | false initially | true/false |
| created_at | timestamp | Creation timestamp | Now() | Not null |
| updated_at | timestamp | Last update timestamp | Now() | Not null |

**Querying By**:
- Repository + SHA: `repository_github_id` + `github_id` (for specific commit)
- Contributor in repo: `repository_github_id` + `contributor_github_id` (all commits by user in repo)
- PR commits: `repository_github_id` + `pull_request_github_id` (all commits in a PR)

**Indexing**:
- Primary index on `id` (UUID)
- Unique composite index on (`repository_id`, `github_id`) 
- Index on `repository_github_id`
- Index on `contributor_github_id`
- Composite index on (`repository_github_id`, `contributor_github_id`)
- Index on `committed_at` (for time-based queries)

### 5. Contributor_Repository Table

The Contributor_Repository table manages the many-to-many relationship between contributors and repositories.

**Current Schema**:

| Field | Type | Description | Issue |
|-------|------|-------------|-------|
| id | integer | Auto-generated primary key | |
| contributor_id | text | Contributor reference | References GitHub username |
| repository_id | integer | Repository reference | References GitHub ID |
| ... | ... | (other fields) | ... |

**Standardized Schema**:

| Field | Type | Description | Source | Validation Rules |
|-------|------|-------------|--------|------------------|
| id | uuid | Supabase UUID primary key | Auto-generated | Must be unique |
| contributor_id | uuid | UUID reference to contributors | From contributor lookup | Not null, foreign key |
| contributor_github_id | bigint | GitHub user ID | contributor.github_id | For querying, not a foreign key |
| repository_id | uuid | UUID reference to repositories | From repository lookup | Not null, foreign key |
| repository_github_id | bigint | GitHub repository ID | repository.github_id | For querying, not a foreign key |
| commit_count | integer | Number of commits made | Count from commits | Default 0, not null |
| pull_requests | integer | Number of PRs submitted | Count from PRs | Default 0, not null |
| reviews | integer | Number of reviews performed | Count from reviews | Default 0, not null |
| issues_opened | integer | Number of issues opened | Count from issues | Default 0, not null |
| first_contribution_date | timestamp | Date of first contribution | Min date from activities | Can be null |
| last_contribution_date | timestamp | Date of most recent contribution | Max date from activities | Can be null |
| lines_added | integer | Total lines of code added | Sum from commits | Default 0 |
| lines_removed | integer | Total lines of code removed | Sum from commits | Default 0 |
| created_at | timestamp | Creation timestamp | Now() | Not null |
| updated_at | timestamp | Last update timestamp | Now() | Not null |

**Querying By**:
- Contributor in repo: `contributor_github_id` + `repository_github_id` (relationship existence)
- Repository contributions: `repository_github_id` (all contributors to a repo)
- Contributor activity: `contributor_github_id` (all repos a contributor works on)

**Indexing**:
- Primary index on `id` (UUID)
- Unique composite index on (`contributor_id`, `repository_id`)
- Composite index on (`contributor_github_id`, `repository_github_id`)
- Index on `repository_github_id`
- Index on `contributor_github_id`

## Querying Patterns

While our database schema will use UUIDs as primary keys, we can optimize querying patterns to simplify common operations:

### 1. Common Query Patterns by Entity

#### Contributors

```javascript
// Get a contributor by GitHub ID (most common)
const getContributorByGitHubId = async (githubId) => {
  const { data, error } = await supabase
    .from('contributors')
    .select('*')
    .eq('github_id', githubId)
    .maybeSingle();
    
  return { data, error };
};

// Get a contributor by username (less reliable as usernames can change)
const getContributorByUsername = async (username) => {
  const { data, error } = await supabase
    .from('contributors')
    .select('*')
    .eq('username', username)
    .maybeSingle();
    
  return { data, error };
};

// Get all repositories contributed to by a contributor
const getReposByContributorGitHubId = async (contributorGitHubId) => {
  const { data, error } = await supabase
    .from('contributor_repository')
    .select(`
      *,
      repositories:repository_id(*)
    `)
    .eq('contributor_github_id', contributorGitHubId);
    
  return { data, error };
};
```

#### Repositories

```javascript
// Get a repository by GitHub ID
const getRepositoryByGitHubId = async (githubId) => {
  const { data, error } = await supabase
    .from('repositories')
    .select('*')
    .eq('github_id', githubId)
    .maybeSingle();
    
  return { data, error };
};

// Get a repository by full name (owner/repo)
const getRepositoryByFullName = async (fullName) => {
  const { data, error } = await supabase
    .from('repositories')
    .select('*')
    .eq('full_name', fullName)
    .maybeSingle();
    
  return { data, error };
};

// Get all repositories owned by a specific contributor
const getReposByOwnerGitHubId = async (ownerGitHubId) => {
  const { data, error } = await supabase
    .from('repositories')
    .select('*')
    .eq('owner_github_id', ownerGitHubId);
    
  return { data, error };
};
```

#### Merge Requests

```javascript
// Get a specific PR by repo GitHub ID and PR number
const getPullRequestByNumber = async (repoGitHubId, prNumber) => {
  const { data, error } = await supabase
    .from('merge_requests')
    .select('*')
    .eq('repository_github_id', repoGitHubId)
    .eq('github_id', prNumber)
    .maybeSingle();
    
  return { data, error };
};

// Get all PRs in a repository
const getPullRequestsByRepo = async (repoGitHubId) => {
  const { data, error } = await supabase
    .from('merge_requests')
    .select('*')
    .eq('repository_github_id', repoGitHubId);
    
  return { data, error };
};

// Get all PRs authored by a contributor
const getPullRequestsByAuthor = async (authorGitHubId) => {
  const { data, error } = await supabase
    .from('merge_requests')
    .select('*')
    .eq('author_github_id', authorGitHubId);
    
  return { data, error };
};
```

#### Commits

```javascript
// Get a specific commit by repo GitHub ID and commit SHA
const getCommitBySHA = async (repoGitHubId, sha) => {
  const { data, error } = await supabase
    .from('commits')
    .select('*')
    .eq('repository_github_id', repoGitHubId)
    .eq('github_id', sha)
    .maybeSingle();
    
  return { data, error };
};

// Get all commits by a contributor in a repository
const getCommitsByContributorInRepo = async (repoGitHubId, contributorGitHubId) => {
  const { data, error } = await supabase
    .from('commits')
    .select('*')
    .eq('repository_github_id', repoGitHubId)
    .eq('contributor_github_id', contributorGitHubId);
    
  return { data, error };
};

// Get all commits in a pull request
const getCommitsByPullRequest = async (repoGitHubId, prNumber) => {
  const { data, error } = await supabase
    .from('commits')
    .select('*')
    .eq('repository_github_id', repoGitHubId)
    .eq('pull_request_github_id', prNumber);
    
  return { data, error };
};
```

### 2. Data Insertion and Update Patterns

#### Two-Step Entity Resolution + Upsert

For all entities, follow this pattern:

```javascript
// Example for contributors
async function resolveAndUpsertContributor(apiContributor) {
  // 1. Map the API data to our schema
  const contributorData = {
    github_id: apiContributor.id,
    username: apiContributor.login || null,
    avatar: apiContributor.avatar_url,
    is_enriched: false,
    // Other fields...
    updated_at: new Date().toISOString()
  };
  
  // 2. Check if entity exists
  const { data: existing } = await supabase
    .from('contributors')
    .select('id, github_id')
    .eq('github_id', contributorData.github_id)
    .maybeSingle();
    
  // 3. Insert or update based on existence
  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from('contributors')
      .update(contributorData)
      .eq('id', existing.id)
      .select('id')
      .single();
      
    if (error) throw error;
    return data.id; // Return UUID
  } else {
    // Insert new record
    const { data, error } = await supabase
      .from('contributors')
      .insert(contributorData)
      .select('id')
      .single();
      
    if (error) throw error;
    return data.id; // Return UUID
  }
}
```

### 3. Relationship Management

When creating or updating relationships between entities:

```javascript
// Example for creating/updating contributor-repository relationship
async function upsertContributorRepositoryRelationship(contributorGitHubId, repoGitHubId, stats = {}) {
  // 1. Resolve both entities to get their UUIDs
  const contributorId = await resolveContributorIdByGitHubId(contributorGitHubId);
  const repositoryId = await resolveRepositoryIdByGitHubId(repoGitHubId);
  
  if (!contributorId || !repositoryId) {
    throw new Error('Could not resolve entities');
  }
  
  // 2. Create relationship data with both UUID and GitHub ID fields
  const relationshipData = {
    contributor_id: contributorId,
    contributor_github_id: contributorGitHubId,
    repository_id: repositoryId,
    repository_github_id: repoGitHubId,
    commit_count: stats.commit_count || 0,
    pull_requests: stats.pull_requests || 0,
    // Other fields...
    updated_at: new Date().toISOString()
  };
  
  // 3. Check if relationship exists
  const { data: existing } = await supabase
    .from('contributor_repository')
    .select('id')
    .eq('contributor_id', contributorId)
    .eq('repository_id', repositoryId)
    .maybeSingle();
    
  // 4. Insert or update based on existence
  if (existing) {
    const { data, error } = await supabase
      .from('contributor_repository')
      .update(relationshipData)
      .eq('id', existing.id)
      .select('id')
      .single();
      
    if (error) throw error;
    return data.id;
  } else {
    const { data, error } = await supabase
      .from('contributor_repository')
      .insert(relationshipData)
      .select('id')
      .single();
      
    if (error) throw error;
    return data.id;
  }
}
```

### 4. Bulk Operations

For efficient batch processing:

```javascript
// Example for bulk upserting contributors
async function bulkUpsertContributors(apiContributors) {
  // 1. Map all API data to our schema
  const contributorsData = apiContributors.map(c => ({
    github_id: c.id,
    username: c.login || null,
    avatar: c.avatar_url,
    // Other fields...
    updated_at: new Date().toISOString()
  }));
  
  // 2. Get all existing records in one query
  const { data: existing } = await supabase
    .from('contributors')
    .select('id, github_id')
    .in('github_id', contributorsData.map(c => c.github_id));
    
  // 3. Split into updates and inserts
  const existingMap = new Map(existing?.map(e => [e.github_id, e.id]) || []);
  
  const toUpdate = [];
  const toInsert = [];
  
  contributorsData.forEach(c => {
    if (existingMap.has(c.github_id)) {
      toUpdate.push({
        ...c,
        id: existingMap.get(c.github_id)
      });
    } else {
      toInsert.push(c);
    }
  });
  
  // 4. Process in batches
  const results = { inserted: [], updated: [], errors: [] };
  
  // Handle inserts
  if (toInsert.length > 0) {
    const { data, error } = await supabase
      .from('contributors')
      .insert(toInsert)
      .select('id, github_id');
      
    if (error) results.errors.push(error);
    else results.inserted = data;
  }
  
  // Handle updates (in smaller batches if needed)
  const BATCH_SIZE = 100;
  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const batch = toUpdate.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('contributors')
      .upsert(batch)
      .select('id, github_id');
      
    if (error) results.errors.push(error);
    else results.updated = [...(results.updated || []), ...data];
  }
  
  return results;
}
```

## Implementation Process

### Phase 1: Data Extraction and ID Resolution

When extracting data from the GitHub API, we'll need to:

1. **Map GitHub Entities to Database Entities**:

```javascript
// Pseudo code for the mapping process
function mapContributor(apiContributor) {
  return {
    github_id: apiContributor.id,
    username: apiContributor.login || null,
    avatar: apiContributor.avatar_url,
    // Other fields...
  };
}

function mapRepository(apiRepository) {
  return {
    github_id: apiRepository.id,
    name: apiRepository.name,
    description: apiRepository.description,
    // Other fields...
  };
}

// Similar mapping functions for other entities
```

2. **Entity Resolution Process**:

```javascript
// Pseudo code for entity resolution
async function resolveContributor(apiContributor) {
  // Check if contributor exists by github_id
  const existingContributor = await findContributorByGitHubId(apiContributor.id);
  
  if (existingContributor) {
    // Return existing UUID
    return existingContributor.id;
  } else {
    // Create new contributor and return UUID
    const mappedData = mapContributor(apiContributor);
    return await insertContributor(mappedData);
  }
}

// Similar functions for other entities
```

### Phase 2: Entity Relationship Handling

For relationships between entities:

```javascript
// Pseudo code for creating relationships
async function createPullRequest(apiPullRequest, apiRepository) {
  // Resolve entities to get their Supabase UUIDs
  const repositoryId = await resolveRepository(apiRepository);
  const authorId = await resolveContributor(apiPullRequest.user);
  const mergedById = apiPullRequest.merged_by 
    ? await resolveContributor(apiPullRequest.merged_by)
    : null;
    
  // Map and create the pull request with resolved UUIDs
  const pullRequestData = {
    github_id: apiPullRequest.number,
    repository_id: repositoryId,  // UUID reference
    repository_github_id: apiRepository.id,  // GitHub ID for easy querying
    author_id: authorId,          // UUID reference
    author_github_id: apiPullRequest.user.id,  // GitHub ID for easy querying
    merged_by_id: mergedById,     // UUID reference
    merged_by_github_id: apiPullRequest.merged_by?.id,  // GitHub ID for easy querying
    // Other fields...
  };
  
  return await insertOrUpdatePullRequest(pullRequestData);
}
```

## Migration Strategy

To migrate existing data to the new schema:

1. **Add New Columns**:
   - Add UUID columns to existing tables
   - Add github_id columns where missing
   - Add ghost foreign key columns for GitHub IDs

2. **Data Migration**:
   - Copy existing GitHub IDs to the github_id columns
   - Generate UUIDs for all entities
   - Create a mapping table of old IDs to new UUIDs

3. **Update References**:
   - Use the mapping table to update all foreign key references
   - Validate referential integrity

4. **Schema Finalization**:
   - Update constraints and indices
   - Remove deprecated columns or mark them as such

## Operational Considerations

1. **API Data Extraction**:
   - Update all data extraction functions to use the standardized mapping
   - Ensure all GitHub IDs are properly captured
   - Handle cases where GitHub entities don't have all required data

2. **Error Handling**:
   - Implement robust error handling for entity resolution failures
   - Create logging for debugging ID resolution issues
   - Add validation for data integrity

3. **Performance Optimization**:
   - Create appropriate indices on github_id fields
   - Consider caching frequently used entity resolutions
   - Batch operations for efficiency

## Recommendations

1. **Implementation Sequence**:
   - Start with the contributors table as it's the most critical
   - Then update repositories
   - Finally, update the relationship tables and dependent entities

2. **Testing Strategy**:
   - Create a test environment with a copy of production data
   - Test the migration on a sample of real data
   - Validate all relationships and queries

3. **Code Updates**:
   - Update data pipeline code to use the new schema
   - Create helper functions for entity resolution
   - Document the new approach thoroughly

## Conclusion

This standardization will significantly improve the database schema by:
- Creating consistent identifier handling across all entities
- Improving data integrity through proper primary and foreign keys
- Supporting more robust entity resolution
- Making the schema more maintainable and understandable
- Providing flexible querying patterns using both UUIDs and GitHub IDs

By implementing this plan, we'll resolve the current issues with inconsistent ID handling and create a more robust foundation for the GitHub Explorer application. 