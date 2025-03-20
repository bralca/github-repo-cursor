# SEO-Optimized URL Architecture

## Overview

This document outlines the SEO-optimized URL architecture for the GitHub Explorer application. The architecture is designed to create human-readable, search-engine friendly URLs while maintaining unique identifiers for each entity.

## URL Structure

### Repository URLs
- **Pattern**: `/repository-name-githubID`
- **Example**: `/react-facebook-123456`
- **Components**:
  - Repository name in slug format
  - GitHub ID as a unique identifier

### Contributor URLs
- **Pattern**: `/name-username-githubID`
- **Example**: `/john-doe-johnd-789012`
- **Components**:
  - Contributor's name in slug format
  - GitHub username in slug format
  - GitHub ID as a unique identifier

### Merge Request URLs
- **Pattern**: `/repository-name-githubID/merge-requests/merge_request-title-githubid`
- **Example**: `/react-facebook-123456/merge-requests/add-new-feature-789012`
- **Components**:
  - Repository reference with name and GitHub ID
  - "merge-requests" path segment
  - Merge request title in slug format
  - GitHub ID of the merge request

### Commit URLs
- **Pattern**: `/repository-name-githubID/merge-requests/merge_request-title-githubid/commits/name-username-githubID/filename-githubID`
- **Example**: `/react-facebook-123456/merge-requests/add-new-feature-789012/commits/john-doe-johnd-789012/src-component-file-345678`
- **Components**:
  - Repository reference
  - Merge request reference
  - "commits" path segment
  - Contributor reference
  - File name in slug format
  - GitHub ID of the file

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
   - Extract entity IDs from URL segments
   - Use IDs for database queries
   - Fall back to search when exact matches fail

2. **Redirects**:
   - Handle legacy URL formats
   - Redirect to canonical URLs when slug format changes

3. **Edge Cases**:
   - Very long names should be truncated appropriately
   - Similar names with different IDs need clear visual differentiation

This architecture balances SEO optimization with system requirements, creating a URL structure that is both user-friendly and technically sound. 