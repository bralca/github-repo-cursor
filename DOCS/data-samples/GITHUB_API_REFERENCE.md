# GitHub API Raw Data Reference Document

This document provides a simplified overview of the raw data structure returned by the GitHub API for merged pull requests. It serves as a reference for the pipeline implementation that extracts entities for storage in the database.

## Top-Level Structure

The raw data received from GitHub contains two main sections:

```javascript
{
  "repository": { /* Repository data */ },
  "pull_request": { /* Pull request data with nested information */ }
}
```

## Key Entities and Their Structure

### 1. Repository Entity

```javascript
{
  "id": 874985677,                                // Repository ID (numeric)
  "url": "https://github.com/sorokinvj/lingvo-monkeys", // Repository URL
  "forks": 0,                                     // Number of forks
  "owner": "sorokinvj",                           // Repository owner username
  "stars": 0,                                     // Number of stars
  "full_name": "sorokinvj/lingvo-monkeys",        // Full repository name (owner/repo)
  "description": null                             // Repository description
}
```

Additional repository data is available in the pull_request.base.repo and pull_request.head.repo objects, which include:

```javascript
{
  "id": 874985677,
  "name": "lingvo-monkeys",
  "size": 82842,
  "fork": false,
  "owner": { /* Owner data (see Contributor) */ },
  "language": "TypeScript",
  "created_at": "2024-10-18T20:51:05Z",
  "updated_at": "2025-02-13T11:36:18Z",
  "pushed_at": "2025-02-23T21:21:33Z",
  "default_branch": "main",
  "visibility": "public",
  "forks_count": 0,
  "watchers_count": 0,
  "open_issues_count": 0,
  "license": null,
  "topics": []
}
```

### 2. Contributor Entity (User)

Found in multiple locations (pull_request.user, pull_request.base.repo.owner, pull_request.head.repo.owner, commits[].author):

```javascript
{
  "id": 4914235,                               // GitHub user ID (numeric)
  "login": "sorokinvj",                        // GitHub username
  "type": "User",                              // Account type (User or Organization)
  "avatar_url": "https://avatars.githubusercontent.com/u/4914235?v=4", // Avatar image URL
  "html_url": "https://github.com/sorokinvj", // User profile URL
  "user_view_type": "public"                   // Visibility type
}
```

### 3. Pull Request (Merge Request) Entity

```javascript
{
  "base": {
    "ref": "main",                   // Target branch
    "sha": "d25da165093f11efaab3f31ad0860a1deb26d50d", // Base commit SHA
    "repo": { /* Repository data */ },
    "user": { /* Contributor data */ },
    "label": "sorokinvj:main"        // Label in format "owner:branch"
  },
  "head": {
    "ref": "detect-lang",           // Source branch
    "sha": "dfbc86c912f849c1ce6d7aae8f069c6b917add22", // Head commit SHA
    "repo": { /* Repository data */ },
    "user": { /* Contributor data */ },
    "label": "sorokinvj:detect-lang" // Label in format "owner:branch"
  },
  "user": { /* Contributor data (PR author) */ },
  "state": "closed",                // PR status (open, closed)
  "title": "Detect lang",           // PR title
  "body": null,                     // PR description
  "labels": [],                     // Array of PR labels
  "created_at": "2025-02-17T21:22:23Z", // Creation timestamp
  "updated_at": "2025-02-23T21:23:03Z", // Last update timestamp
  "closed_at": "2025-02-23T21:23:02Z",  // Closing timestamp
  "merged_at": "2025-02-23T21:23:02Z",  // Merging timestamp
  "merged_by": { /* Contributor data */ }, // User who merged the PR
  "commits": [ /* Array of commits */ ]    // Commits in this PR
}
```

### 4. Commit Entity

Found in the pull_request.commits array:

```javascript
{
  "sha": "b05d5346f26fe652c27b098caba13ca293cb75f8", // Commit hash
  "author": {
    "id": 4914235,                            // Author GitHub ID
    "email": null,                            // Author email (may be null)
    "avatar_url": "https://avatars.githubusercontent.com/u/4914235?v=4" // Author avatar
  },
  "message": "feat: not land in route",       // Commit message
  "content": [                                // Changed files
    {
      "patch": "@@ -107,7 +107,6 @@ export async function POST(request: NextRequest) {\n             {\n               punctuate: true,\n               model: 'nova-3',\n-              language: 'en-US',\n               paragraphs: true,\n               smart_format: true,\n             }", // Diff patch
      "status": "modified",                   // File status (modified, added, deleted, renamed)
      "filename": "app/api/upload/route.ts",  // File path
      "full_content": null                    // Full file content (usually null)
    }
  ]
}
```

## Additional Properties

- **PR Statistics**:
  - `additions`: Total number of lines added
  - `deletions`: Total number of lines deleted
  - `changed_files`: Number of files changed
  - `commits_count`: Number of commits in the PR

- **Commit Details**:
  - `added_lines`: Array of lines added in the commit
  - `deleted_lines`: Array of lines deleted in the commit
  - `lines_changed`: Total number of lines changed

## Entity Relationships

1. **Repository → Contributor**: Many-to-many
   - A repository has multiple contributors
   - A contributor can contribute to multiple repositories

2. **Repository → Pull Request**: One-to-many
   - A repository has multiple pull requests
   - A pull request belongs to one repository

3. **Contributor → Pull Request**: One-to-many
   - A contributor authors multiple pull requests
   - A pull request has one author (but can involve multiple contributors)

4. **Pull Request → Commit**: One-to-many
   - A pull request contains multiple commits
   - A commit belongs to one pull request

5. **Contributor → Commit**: One-to-many
   - A contributor authors multiple commits
   - A commit has one author

## Pipeline Processing Requirements

1. **Extract Repository Data**:
   - Basic information from the repository object
   - Enrich with additional details from pull_request.base.repo

2. **Extract Contributor Data**:
   - From pull_request.user (PR author)
   - From pull_request.merged_by (PR merger)
   - From commits[].author (commit authors)

3. **Extract Pull Request Data**:
   - Basic information from the pull_request object
   - Calculate statistics from commits and file changes

4. **Extract Commit Data**:
   - From the commits array
   - Parse patch information to calculate lines added/removed
   - Associate with corresponding repository and pull request

5. **Process Relationships**:
   - Maintain contributor-repository relationships
   - Link commits to their respective pull requests and repositories

## Notes for Pipeline Implementation

- Handle missing or null values appropriately
- De-duplicate entities (especially contributors who appear in multiple contexts)
- Calculate derived metrics such as complexity scores
- Implement proper error handling for malformed or unexpected data
- Use batch processing for efficient database operations 