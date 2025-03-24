# SEO-Optimized URL Architecture

## Overview

This document outlines the SEO-optimized URL architecture for the GitHub Explorer application. The architecture is designed to create human-readable, search-engine friendly URLs while maintaining unique identifiers for each entity.

## URL Structure

### Repository URLs
- **Pattern**: `/{repositorySlug}`
- **Example**: `/react-facebook-123456`
- **Components**:
  - Repository name in slug format
  - GitHub ID as a unique identifier

### Contributor URLs
- **Pattern**: `/contributors/{contributorSlug}`
- **Example**: `/contributors/john-doe-johnd-789012`
- **Components**:
  - Contributor's name in slug format
  - GitHub username in slug format
  - GitHub ID as a unique identifier

### Merge Request URLs
- **Pattern**: `/{repositorySlug}/merge-requests/{mergeRequestSlug}`
- **Example**: `/react-facebook-123456/merge-requests/add-new-feature-789012`
- **Components**:
  - Repository reference with name and GitHub ID
  - "merge-requests" path segment
  - Merge request title in slug format
  - GitHub ID of the merge request

### Commit URLs
- **Pattern**: `/{repositorySlug}/merge-requests/{mergeRequestSlug}/authors/{contributorSlug}/commits/{commitId}`
- **Example**: `/react-facebook-123456/merge-requests/add-new-feature-789012/authors/john-doe-johnd-789012/commits/a1b2c3d4`
- **Components**:
  - Repository reference ({repositorySlug})
  - Merge request reference ({mergeRequestSlug})
  - "authors" path segment
  - Contributor reference ({contributorSlug})
  - "commits" path segment
  - Commit ID (usually the GitHub commit SHA)

## URL Generation Rules

1. **Slug Generation**:
   - Convert spaces to hyphens
   - Remove special characters
   - Convert to lowercase
   - Truncate to reasonable length (e.g., 50 characters)

2. **Uniqueness**:
   - Always append GitHub IDs to ensure uniqueness
   - IDs should come after the human-readable part

3. **Hierarchy**:
   - URLs reflect the hierarchical relationship between entities
   - Each level includes enough information to be self-contained

## Database Field to URL Mapping

This section maps the database fields used to generate each slug component:

### Repository Slug (`{repositorySlug}`)
- **Database Fields**: 
  - `repositories.name` - Used for the human-readable portion
  - `repositories.github_id` - Used as the unique identifier
- **Generation Function**: `generateRepositorySlug(name, github_id)`
- **Example**: For a repository with name "React" and github_id "123456", the slug would be "react-123456"

### Contributor Slug (`{contributorSlug}`)
- **Database Fields**:
  - `contributors.name` - Used for the first part of the slug (if available)
  - `contributors.username` - Used for the username portion (if available)
  - `contributors.github_id` - Used as the unique identifier
- **Generation Function**: `generateContributorSlug(name, username, github_id)`
- **Example**: For a contributor with name "John Doe", username "johndoe", and github_id "789012", the slug would be "john-doe-johndoe-789012"

### Merge Request Slug (`{mergeRequestSlug}`)
- **Database Fields**:
  - `merge_requests.title` - Used for the human-readable portion
  - `merge_requests.github_id` - Used as the unique identifier
- **Generation Function**: `generateMergeRequestSlug(title, github_id)`
- **Example**: For a merge request with title "Add new feature" and github_id "456789", the slug would be "add-new-feature-456789"

### Commit ID (`{commitId}`)
- **Database Field**:
  - `commits.github_id` - The commit SHA hash used directly
- **Example**: For a commit with github_id "a1b2c3d4e5f6", the ID would be "a1b2c3d4e5f6"

## SEO Benefits

1. **Keyword-Rich URLs**:
   - Repository names contain relevant keywords
   - Contributor names provide personal branding
   - Merge request titles include feature keywords

2. **Semantic Structure**:
   - URLs clearly indicate content type
   - Hierarchical organization helps search engines understand relationships

3. **Crawlability**:
   - Logical path progression
   - Consistent patterns for similar content types

## Rendering Strategy

The URL architecture supports a hybrid rendering approach:

1. **Server-Side Rendering (SSR)**:
   - Page title, metadata, and SEO elements
   - Basic entity information for immediate display
   - Open Graph tags for social sharing

2. **Client-Side Rendering (CSR)**:
   - Detailed content and dynamic elements
   - Interactive components
   - Data that isn't critical for initial page display

## Implementation Considerations

1. **URL Parsing**:
   - Extract entity IDs from URL segments using parsing functions
   - Functions like `parseRepositorySlug`, `parseMergeRequestSlug`, and `parseContributorSlug` extract the necessary IDs
   - Use IDs for database queries

2. **Redirects**:
   - Handle legacy URL formats
   - Redirect to canonical URLs when slug format changes

3. **Edge Cases**:
   - Very long names should be truncated appropriately (maximum length: 50 characters)
   - Similar names with different IDs need clear visual differentiation
   - Missing name or username values are replaced with defaults

## Next.js App Router Implementation

The URL structure is implemented using Next.js App Router with dynamic route segments:

- `app/[repositorySlug]/page.tsx` - Repository details
- `app/contributors/[contributorSlug]/page.tsx` - Contributor details
- `app/[repositorySlug]/merge-requests/[mergeRequestSlug]/page.tsx` - Merge request details
- `app/[repositorySlug]/merge-requests/[mergeRequestSlug]/authors/[contributorSlug]/commits/[commitId]/page.tsx` - Commit details

This architecture balances SEO optimization with system requirements, creating a URL structure that is both user-friendly and technically sound. 