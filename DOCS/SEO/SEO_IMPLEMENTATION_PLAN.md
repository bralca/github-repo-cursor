# SEO Implementation Plan

This document outlines the implementation plan for the SEO-optimized URL architecture in GitHub Explorer. It is structured as epics, stories, tasks, and AI prompts to facilitate development by AI agents.

## Epic 1: URL Infrastructure and Core Components

### Story 1.1: URL Utility Framework

**Description**: Create a shared URL utility module to standardize URL generation and parsing across the application.

#### Task 1.1.1: Create Base URL Utility Module

**Prompt**: "Create a URL utility module in `github-explorer/lib/url-utils.ts` that provides functions for generating and parsing SEO-friendly URLs. The module should include functions for:
1. Converting names to slugs (removing special characters, replacing spaces with hyphens, etc.)
2. Generating entity-specific URLs following our URL architecture
3. Extracting entity IDs from URL segments
4. Validating URL format

Use TypeScript interfaces to ensure type safety for all utility functions. Make sure to handle edge cases like long names, special characters, and non-Latin characters.

REMEMBER: 
- Follow the MVP approach - implement a solution that is simple but complete
- Maintain consistency with existing code patterns in the lib directory
- Focus on writing clean, maintainable code that solves the immediate need
- Refresh your memory by reviewing the URL architecture in `DOCS/SEO/URL_ARCHITECTURE.md`
- Adhere to the error handling practices established in the codebase"

#### Task 1.1.2: Implement Repository URL Functions

**Prompt**: "Extend the URL utility module in `github-explorer/lib/url-utils.ts` to add repository-specific URL functions:
1. `generateRepositorySlug(name: string, githubId: string): string` - Generates a slug for repository URLs
2. `parseRepositorySlug(slug: string): { name: string, githubId: string }` - Extracts information from a repository slug
3. `buildRepositoryUrl(repository: Repository): string` - Builds a complete URL for a repository

Use the pattern `/repository-name-githubID` as defined in our URL architecture. Test with various repository names to ensure correct slug generation.

REMEMBER: 
- Maintain consistency with the functions created in Task 1.1.1
- Follow the simple, deterministic approach outlined in our rules
- Ensure the code handles edge cases appropriately
- Reference the repository entity structure in `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md`
- Apply error handling for cases where input data might be incomplete"

#### Task 1.1.3: Implement Contributor URL Functions

**Prompt**: "Extend the URL utility module to add contributor-specific URL functions:
1. `generateContributorSlug(name: string, username: string, githubId: string): string` - Generates a slug for contributor URLs
2. `parseContributorSlug(slug: string): { name: string, username: string, githubId: string }` - Extracts information from a contributor slug
3. `buildContributorUrl(contributor: Contributor): string` - Builds a complete URL for a contributor

Use the pattern `/name-username-githubID` as defined in our URL architecture. Handle cases where name or username might be missing.

REMEMBER: 
- Follow the established patterns from previous URL utility functions
- Keep the implementation simple while ensuring it works for all valid inputs
- Consider edge cases like missing names or very long usernames
- Reference the contributor entity structure in `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md`
- Focus on delivering a working solution rather than handling every possible edge case"

#### Task 1.1.4: Implement Merge Request URL Functions

**Prompt**: "Extend the URL utility module to add merge request-specific URL functions:
1. `generateMergeRequestSlug(title: string, githubId: string): string` - Generates a slug for merge request URLs
2. `parseMergeRequestSlug(slug: string): { title: string, githubId: string }` - Extracts information from a merge request slug
3. `buildMergeRequestUrl(repository: Repository, mergeRequest: MergeRequest): string` - Builds a complete URL for a merge request

Use the nested pattern `/repository-name-githubID/merge-requests/merge_request-title-githubid` as defined in our URL architecture.

REMEMBER: 
- Follow the established patterns from previous URL utility functions
- Maintain consistency in how you handle edge cases and inputs
- Make sure to handle the nested relationship between repositories and merge requests
- Reference the merge request entity structure in `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md`
- Build for the real-world use case, not theoretical perfection"

#### Task 1.1.5: Implement Commit URL Functions

**Prompt**: "Extend the URL utility module to add commit-specific URL functions:
1. `generateFileSlug(filename: string, githubId: string): string` - Generates a slug for file URLs
2. `parseFileSlug(slug: string): { filename: string, githubId: string }` - Extracts information from a file slug
3. `buildCommitUrl(repository: Repository, mergeRequest: MergeRequest, contributor: Contributor, file: File): string` - Builds a complete URL for a commit

Use the nested pattern `/repository-name-githubID/merge-requests/merge_request-title-githubid/commits/name-username-githubID/filename-githubID` as defined in our URL architecture.

REMEMBER: 
- Maintain consistency with previously implemented URL utility functions
- Handle the complex nested structure carefully but keep the implementation straightforward
- Consider path length limitations and handle very long filenames appropriately
- Review the commit entity structure in `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md`
- Apply the MVP approach - build something that works for the standard case first"

#### Task 1.1.6: Add URL Testing Utilities

**Prompt**: "Create a test suite for the URL utility module in `github-explorer/lib/url-utils.test.ts` that verifies:
1. Slug generation correctly handles special characters, spaces, and long names
2. URL parsing correctly extracts entity IDs
3. Complete URL building follows the defined patterns
4. Edge cases are handled gracefully

Include tests for all entity types (repositories, contributors, merge requests, commits) with realistic data examples.

REMEMBER: 
- Focus on testing the most critical functionality first
- Follow existing test patterns in the codebase
- Use realistic data that represents what will be seen in production
- Avoid overly complex test cases that don't add value
- Reference `DOCS/SEO/URL_ARCHITECTURE.md` to ensure tests cover all URL patterns"

### Story 1.2: Next.js Route Configuration

**Description**: Set up dynamic routes in Next.js to support the SEO-friendly URL structure.

#### Task 1.2.1: Create Repository Route Configuration

**Prompt**: "Create a dynamic route for repositories in `github-explorer/app/[repositorySlug]/page.tsx` that:
1. Extracts the repository GitHub ID from the slug using our URL utility
2. Sets up the SSR portion that generates metadata
3. Creates a client component placeholder for the repository content
4. Includes basic content placeholders for initial verification

Use the URL pattern `/repository-name-githubID` and ensure the route can handle URL parameters correctly.

REMEMBER: 
- Follow Next.js App Router conventions for dynamic routes
- Keep the implementation simple and focused on MVP requirements
- Ensure proper separation between SSR and CSR components
- Reference `DOCS/PROJECT_STRUCTURE.md` and `DOCS/core-architecture/NEXT_JS_ARCHITECTURE.md` for guidance
- Maintain error handling for cases where the repository ID can't be extracted or found"

#### Task 1.2.2: Create Contributor Route Configuration

**Prompt**: "Create a dynamic route for contributors in `github-explorer/app/contributors/[contributorSlug]/page.tsx` that:
1. Extracts the contributor GitHub ID from the slug using our URL utility
2. Sets up the SSR portion that generates metadata
3. Creates a client component placeholder for the contributor content
4. Includes basic content placeholders for initial verification

Use the URL pattern `/contributors/name-username-githubID` and ensure the route can handle URL parameters correctly.

REMEMBER: 
- Follow the same pattern established in the repository route configuration
- Maintain consistency in how you structure the server and client components
- Keep the implementation simple and MVP-focused
- Reference `DOCS/PROJECT_STRUCTURE.md` for Next.js project organization guidance
- Handle errors gracefully when contributor data can't be found"

#### Task 1.2.3: Create Merge Request Route Configuration

**Prompt**: "Create a dynamic route for merge requests in `github-explorer/app/[repositorySlug]/merge-requests/[mergeRequestSlug]/page.tsx` that:
1. Extracts both repository and merge request GitHub IDs from the slugs using our URL utility
2. Sets up the SSR portion that generates metadata
3. Creates a client component placeholder for the merge request content
4. Includes basic content placeholders for initial verification

Use the nested URL pattern `/repository-name-githubID/merge-requests/merge_request-title-githubid` and ensure the route can handle multiple URL parameters correctly.

REMEMBER: 
- Follow the same patterns established in previous route configurations
- Ensure proper handling of the nested route parameters
- Keep the implementation straightforward and focused on core functionality
- Reference `DOCS/PROJECT_STRUCTURE.md` for guidance on Next.js route organization
- Implement proper error handling for cases where either repository or merge request IDs are invalid"

#### Task 1.2.4: Create Commit Route Configuration

**Prompt**: "Create a dynamic route for commits in `github-explorer/app/[repositorySlug]/merge-requests/[mergeRequestSlug]/commits/[contributorSlug]/[fileSlug]/page.tsx` that:
1. Extracts all GitHub IDs from the slugs using our URL utility
2. Sets up the SSR portion that generates metadata
3. Creates a client component placeholder for the commit content
4. Includes basic content placeholders for initial verification

Use the deeply nested URL pattern `/repository-name-githubID/merge-requests/merge_request-title-githubid/commits/name-username-githubID/filename-githubID` and ensure the route can handle complex URL parameters correctly.

REMEMBER: 
- Follow the same patterns established in previous route configurations
- Handle the complexity of multiple nested parameters carefully
- Keep the implementation as simple as possible while ensuring it works correctly
- Reference `DOCS/PROJECT_STRUCTURE.md` for guidance on complex route structures
- Implement robust error handling given the multiple potential failure points"

### Story 1.3: Database Query Adaptation

**Description**: Create database access functions that support URL-based entity lookups.

#### Task 1.3.1: Create Repository Database Query Functions

**Prompt**: "Create a database utility in `github-explorer/lib/database/url-queries.ts` that provides repository lookup functions:
1. `getRepositoryByGithubId(githubId: string): Promise<Repository>` - Fetches a repository by GitHub ID
2. `getRepositoryBaseDataByGithubId(githubId: string): Promise<RepositoryBaseData>` - Fetches minimal repository data for SSR
3. `getRepositorySEODataByGithubId(githubId: string): Promise<RepositorySEOData>` - Fetches only SEO-relevant data

Ensure these functions use our SQLite database connection and handle cases where a repository isn't found.

REMEMBER: 
- Follow the database access patterns established in the codebase
- Use the proper connection management with `withDb` utility
- Keep queries efficient by selecting only the fields needed
- Reference `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md` for schema details
- Implement error handling according to our standards for database operations
- This is for a real app with real data, not mock data"

#### Task 1.3.2: Create Contributor Database Query Functions

**Prompt**: "Extend the database utility in `github-explorer/lib/database/url-queries.ts` to add contributor lookup functions:
1. `getContributorByGithubId(githubId: string): Promise<Contributor>` - Fetches a contributor by GitHub ID
2. `getContributorBaseDataByGithubId(githubId: string): Promise<ContributorBaseData>` - Fetches minimal contributor data for SSR
3. `getContributorSEODataByGithubId(githubId: string): Promise<ContributorSEOData>` - Fetches only SEO-relevant data

Ensure these functions use our SQLite database connection and handle cases where a contributor isn't found.

REMEMBER: 
- Follow the same patterns established for repository queries
- Maintain consistency in error handling and return types
- Keep queries optimized by selecting only necessary fields
- Reference `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md` for contributor table structure
- Follow database interaction best practices established in the codebase"

#### Task 1.3.3: Create Merge Request Database Query Functions

**Prompt**: "Extend the database utility to add merge request lookup functions:
1. `getMergeRequestByGithubId(repositoryGithubId: string, mergeRequestGithubId: string): Promise<MergeRequest>` - Fetches a merge request by GitHub IDs
2. `getMergeRequestBaseDataByGithubId(repositoryGithubId: string, mergeRequestGithubId: string): Promise<MergeRequestBaseData>` - Fetches minimal merge request data for SSR
3. `getMergeRequestSEODataByGithubId(repositoryGithubId: string, mergeRequestGithubId: string): Promise<MergeRequestSEOData>` - Fetches only SEO-relevant data

Include the repository relationship in these queries for complete context.

REMEMBER: 
- Follow the same patterns established for previous entity queries
- Implement proper JOIN operations to fetch related repository data when needed
- Keep queries efficient by selecting only the necessary fields
- Reference `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md` for merge request table structure
- Follow the MVP approach - implement what's needed for the feature to work"

#### Task 1.3.4: Create Commit Database Query Functions

**Prompt**: "Extend the database utility to add commit lookup functions:
1. `getCommitByIds(params: CommitQueryParams): Promise<Commit>` - Fetches a commit by all relevant GitHub IDs
2. `getCommitBaseDataByIds(params: CommitQueryParams): Promise<CommitBaseData>` - Fetches minimal commit data for SSR
3. `getCommitSEODataByIds(params: CommitQueryParams): Promise<CommitSEOData>` - Fetches only SEO-relevant data

The CommitQueryParams should include repositoryGithubId, mergeRequestGithubId, contributorGithubId, and fileGithubId to uniquely identify a commit.

REMEMBER: 
- Follow the same patterns established for previous entity queries
- Handle the complex relationships between commits and other entities efficiently
- Keep queries optimized by selecting only necessary fields
- Reference `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md` for commit table structure
- Implement proper error handling for complex queries with multiple join conditions"

### Story 1.4: SSR/CSR Rendering Framework

**Description**: Implement a hybrid rendering approach that renders critical SEO elements server-side and loads detailed content client-side.

#### Task 1.4.1: Create Base Layout Component with SSR/CSR Support

**Prompt**: "Create a base layout component in `github-explorer/components/layout/EntityLayout.tsx` that:
1. Takes server-rendered metadata and basic entity information as props
2. Sets up a client-side wrapper for loading detailed entity content
3. Provides a consistent layout structure for all entity pages
4. Includes loading states for client-side rendered content

This should implement our hybrid rendering approach where basic info comes from SSR and detailed content from CSR.

REMEMBER: 
- Follow existing component architecture patterns in the codebase
- Keep the implementation simple but complete for MVP needs
- Maintain clear separation between server and client components
- Reference `DOCS/core-architecture/NEXT_JS_ARCHITECTURE.md` for guidance on Next.js patterns
- Ensure the layout works for all device sizes following our responsive design principles"

#### Task 1.4.2: Implement Metadata Generation Functions

**Prompt**: "Create a metadata utility module in `github-explorer/lib/metadata-utils.ts` that provides functions for generating metadata for different entity types:
1. `generateRepositoryMetadata(repository: RepositoryBaseData): Metadata` - Generates repository metadata
2. `generateContributorMetadata(contributor: ContributorBaseData): Metadata` - Generates contributor metadata
3. `generateMergeRequestMetadata(mergeRequest: MergeRequestBaseData): Metadata` - Generates merge request metadata
4. `generateCommitMetadata(commit: CommitBaseData): Metadata` - Generates commit metadata

Each function should return a Next.js compatible metadata object with title, description, Open Graph tags, and any other relevant SEO elements.

REMEMBER: 
- Follow Next.js metadata API conventions
- Keep metadata generation simple but complete for core SEO needs
- Ensure consistency in how metadata is formatted across entity types
- Reference Next.js documentation for metadata object structure
- Focus on implementing real, useful metadata rather than placeholder content"

#### Task 1.4.3: Create Data Loading Patterns for CSR

**Prompt**: "Implement React hooks for client-side data loading in `github-explorer/hooks/entity` that:
1. Take GitHub IDs extracted from the URL as parameters
2. Load detailed entity data that wasn't included in SSR
3. Provide loading, error, and success states
4. Include retry mechanisms for failed requests

Create a hook for each entity type (repository, contributor, merge request, commit) following a consistent pattern.

REMEMBER: 
- Follow established hook patterns in the codebase
- Implement proper loading, error, and success states
- Keep the implementation focused on real-world usage
- Reference existing hooks in `github-explorer/hooks` for patterns
- Apply best practices for React hooks including proper dependencies and cleanup"

## Epic 2: Repository Page Implementation

### Story 2.1: Repository Page SSR Components

**Description**: Implement server-side rendered components for the repository page.

#### Task 2.1.1: Create Repository Page Server Component

**Prompt**: "Create the server component for the repository page in `github-explorer/app/[repositorySlug]/page.tsx` that:
1. Extracts the repository GitHub ID from the URL slug using our utility functions
2. Fetches minimal repository data using `getRepositorySEODataByGithubId`
3. Generates metadata using `generateRepositoryMetadata`
4. Passes the base data to a client component for detailed content
5. Includes basic content placeholders for initial verification

Export a `generateMetadata` function that sets up all SEO elements for the page.

REMEMBER: 
- Follow Next.js conventions for server components and metadata generation
- Keep the implementation simple and MVP-focused
- Ensure proper error handling for cases where repository data can't be fetched
- Reference `DOCS/page-architecture/REPOSITORY_PAGE_ARCHITECTURE.md` for guidance
- Build for real data, not mock implementations"

#### Task 2.1.2: Implement Repository SEO Elements

**Prompt**: "Enhance the repository page metadata generation in `github-explorer/app/[repositorySlug]/page.tsx` to include:
1. A dynamic title using the repository name
2. A description that includes repository stats and purpose
3. Open Graph tags for social sharing that include repository information
4. Structured data (JSON-LD) for search engines
5. Canonical URL to prevent duplicate content issues

Ensure all metadata is generated server-side for optimal SEO performance.

REMEMBER: 
- Follow SEO best practices for metadata structuring
- Keep the implementation focused on core SEO elements that provide value
- Ensure consistency with metadata patterns established in the framework
- Reference `DOCS/SEO/URL_ARCHITECTURE.md` for canonical URL implementation
- Follow the MVP approach - implement the most valuable elements first"

### Story 2.2: Repository Page CSR Components

**Description**: Implement client-side rendered components for the repository page.

#### Task 2.2.1: Create Repository Client Component

**Prompt**: "Create a client-side component in `github-explorer/components/repository/RepositoryContent.tsx` that:
1. Takes minimal repository data from SSR as props
2. Uses the `useRepositoryData` hook to fetch full repository data
3. Displays loading states during data fetching
4. Renders the complete repository interface once data is available

Include error handling and retry mechanisms for failed data loading.

REMEMBER: 
- Follow established patterns for client components in the codebase
- Implement proper loading, error, and empty states
- Keep the implementation simple but complete for MVP needs
- Reference `DOCS/page-architecture/REPOSITORY_PAGE_ARCHITECTURE.md` for repository component structure
- Balance performance and user experience in how data is loaded and displayed"

#### Task 2.2.2: Implement Repository Content Components

**Prompt**: "Create the main repository content components following the component hierarchy from the Repository Page Architecture document:
1. Repository Metadata Display with CompactStatCard and MetadataGrid
2. Contributors section with ContributorCard and loading states
3. ContributionHeatmap with TimeframeSelector and HeatmapGrid
4. HealthMetrics section with various charts
5. MergeRequestsTable with scrollable and responsive design
6. CommitTimeline with commit items

Ensure all links to other entities use our SEO-friendly URL patterns.

REMEMBER: 
- Follow the component structure defined in `DOCS/page-architecture/REPOSITORY_PAGE_ARCHITECTURE.md`
- Implement each component with proper responsive design
- Use the URL utility functions for generating links to other entities
- Keep the implementation MVP-focused while ensuring a complete user experience
- Maintain consistency with existing UI patterns and components"

## Epic 3: Contributor Page Implementation

### Story 3.1: Contributor Page SSR Components

**Description**: Implement server-side rendered components for the contributor page.

#### Task 3.1.1: Create Contributor Page Server Component

**Prompt**: "Create the server component for the contributor page in `github-explorer/app/contributors/[contributorSlug]/page.tsx` that:
1. Extracts the contributor GitHub ID from the URL slug using our utility functions
2. Fetches minimal contributor data using `getContributorSEODataByGithubId`
3. Generates metadata using `generateContributorMetadata`
4. Passes the base data to a client component for detailed content
5. Includes basic content placeholders for initial verification

Export a `generateMetadata` function that sets up all SEO elements for the page.

REMEMBER: 
- Follow the same patterns established for the repository page
- Keep the implementation simple but functional for MVP needs
- Implement proper error handling for cases where contributor data can't be fetched
- Reference similar page implementations for structural guidance
- Build for real data, not mock implementations"

#### Task 3.1.2: Implement Contributor SEO Elements

**Prompt**: "Enhance the contributor page metadata generation to include:
1. A dynamic title using the contributor's name and username
2. A description that includes key contribution statistics
3. Open Graph tags that include the contributor's avatar and role
4. Structured data about the contributor
5. Canonical URL to prevent duplicate content issues

Ensure all metadata is generated server-side for optimal SEO performance.

REMEMBER: 
- Follow the same SEO patterns established for the repository page
- Maintain consistency in metadata structure across entity types
- Focus on implementing metadata that provides real value
- Reference `DOCS/SEO/URL_ARCHITECTURE.md` for metadata implementation details
- Implement structured data that accurately represents contributor information"

### Story 3.2: Contributor Page CSR Components

**Description**: Implement client-side rendered components for the contributor page.

#### Task 3.2.1: Create Contributor Client Component

**Prompt**: "Create a client-side component in `github-explorer/components/contributor/ContributorContent.tsx` that:
1. Takes minimal contributor data from SSR as props
2. Uses a custom hook to fetch full contributor data
3. Displays loading states during data fetching
4. Renders the complete contributor interface once data is available

Include error handling and retry mechanisms for failed data loading.

REMEMBER: 
- Follow the same patterns established for the repository client components
- Implement proper loading, error, and empty states
- Keep the implementation simple but complete for MVP needs
- Reference similar component implementations for guidance
- Focus on real-world usage and error handling"

#### Task 3.2.2: Implement Contributor Content Components

**Prompt**: "Create the main contributor content components:
1. Contributor profile header with avatar, name, and key stats
2. Contribution timeline showing activity over time
3. Repository involvement section with links to repositories
4. Contribution statistics with visualizations
5. Related contributors section

Ensure all links to other entities use our SEO-friendly URL patterns.

REMEMBER: 
- Follow established component patterns in the codebase
- Implement responsive design for all components
- Use the URL utility functions for generating links to repositories
- Keep visualizations simple but informative
- Maintain consistency with existing UI elements and styles"

## Epic 4: Merge Request Page Implementation

### Story 4.1: Merge Request Page SSR Components

**Description**: Implement server-side rendered components for the merge request page.

#### Task 4.1.1: Create Merge Request Page Server Component

**Prompt**: "Create the server component for the merge request page in `github-explorer/app/[repositorySlug]/merge-requests/[mergeRequestSlug]/page.tsx` that:
1. Extracts both repository and merge request GitHub IDs from the URL slugs using our URL utility
2. Fetches minimal merge request data using `getMergeRequestSEODataByGithubId`
3. Generates metadata using `generateMergeRequestMetadata`
4. Passes the base data to a client component for detailed content
5. Includes basic content placeholders for initial verification

Export a `generateMetadata` function that sets up all SEO elements for the page.

REMEMBER: 
- Follow the same patterns established for repository and contributor pages
- Handle the nested route parameters properly
- Keep the implementation simple but functional for MVP needs
- Reference existing server components for structural guidance
- Implement proper error handling for data fetching failures"

#### Task 4.1.2: Implement Merge Request SEO Elements

**Prompt**: "Enhance the merge request page metadata generation to include:
1. A dynamic title using the merge request title and repository name
2. A description that includes key merge request details
3. Open Graph tags with merge request statistics
4. Structured data about the merge request
5. Canonical URL to prevent duplicate content issues

Ensure all metadata is generated server-side for optimal SEO performance.

REMEMBER: 
- Follow the same SEO patterns established for other entity pages
- Maintain consistency in metadata structure and approach
- Focus on metadata that provides actual value for SEO
- Reference `DOCS/SEO/URL_ARCHITECTURE.md` for metadata implementation guidance
- Implement structured data that accurately represents merge request information"

### Story 4.2: Merge Request Page CSR Components

**Description**: Implement client-side rendered components for the merge request page.

#### Task 4.2.1: Create Merge Request Client Component

**Prompt**: "Create a client-side component in `github-explorer/components/merge-request/MergeRequestContent.tsx` that:
1. Takes minimal merge request data from SSR as props
2. Uses a custom hook to fetch full merge request data
3. Displays loading states during data fetching
4. Renders the complete merge request interface once data is available

Include error handling and retry mechanisms for failed data loading.

REMEMBER: 
- Follow the same patterns established for other entity client components
- Implement proper loading, error, and empty states
- Keep the implementation simple but complete for MVP needs
- Reference similar component implementations for structural guidance
- Focus on real-world usage scenarios with proper error handling"

#### Task 4.2.2: Implement Merge Request Content Components

**Prompt**: "Create the main merge request content components:
1. Merge request header with title, state, and key information
2. Author and reviewer information with links to contributor pages
3. Commit list with links to individual commits
4. File changes summary with stats and visualization
5. Timeline of merge request events

Ensure all links to other entities use our SEO-friendly URL patterns.

REMEMBER: 
- Follow established component patterns in the codebase
- Use the URL utility functions for all entity links
- Implement responsive design for all components
- Keep visualizations simple but informative
- Maintain consistency with existing UI elements and styles"

## Epic 5: Commit Page Implementation

### Story 5.1: Commit Page SSR Components

**Description**: Implement server-side rendered components for the commit page.

#### Task 5.1.1: Create Commit Page Server Component

**Prompt**: "Create the server component for the commit page in `github-explorer/app/[repositorySlug]/merge-requests/[mergeRequestSlug]/commits/[contributorSlug]/[fileSlug]/page.tsx` that:
1. Extracts all relevant GitHub IDs from the URL slugs using our utility functions
2. Fetches minimal commit data using `getCommitSEODataByIds`
3. Generates metadata using `generateCommitMetadata`
4. Passes the base data to a client component for detailed content
5. Includes basic content placeholders for initial verification

Export a `generateMetadata` function that sets up all SEO elements for the page.

REMEMBER: 
- Follow the same patterns established for other entity pages
- Handle the complex nested route parameters carefully
- Keep the implementation simple but functional for MVP needs
- Reference existing server components for structural guidance
- Implement robust error handling given the multiple potential failure points"

#### Task 5.1.2: Implement Commit SEO Elements

**Prompt**: "Enhance the commit page metadata generation to include:
1. A dynamic title using the commit message, file name, and repository
2. A description that includes key commit details
3. Open Graph tags with commit statistics
4. Structured data about the commit
5. Canonical URL to prevent duplicate content issues

Ensure all metadata is generated server-side for optimal SEO performance.

REMEMBER: 
- Follow the same SEO patterns established for other entity pages
- Maintain consistency in metadata structure and approach
- Focus on metadata that provides real value for search engines
- Reference `DOCS/SEO/URL_ARCHITECTURE.md` for metadata implementation guidance
- Implement structured data that accurately represents commit information"

### Story 5.2: Commit Page CSR Components

**Description**: Implement client-side rendered components for the commit page.

#### Task 5.2.1: Create Commit Client Component

**Prompt**: "Create a client-side component in `github-explorer/components/commit/CommitContent.tsx` that:
1. Takes minimal commit data from SSR as props
2. Uses a custom hook to fetch full commit data
3. Displays loading states during data fetching
4. Renders the complete commit interface once data is available

Include error handling and retry mechanisms for failed data loading.

REMEMBER: 
- Follow the same patterns established for other entity client components
- Implement proper loading, error, and empty states
- Keep the implementation simple but complete for MVP needs
- Reference similar component implementations for structural guidance
- Focus on handling edge cases where commit data might be complex or large"

#### Task 5.2.2: Implement Commit Content Components

**Prompt**: "Create the main commit content components:
1. Commit header with hash, message, and author information
2. File diff viewer with syntax highlighting
3. Commit metadata panel with timestamp and statistics
4. Related commits section with links to other commits
5. Navigation to parent and child commits if applicable

Ensure all links to other entities use our SEO-friendly URL patterns.

REMEMBER: 
- Follow established component patterns in the codebase
- Use the URL utility functions for all entity links
- Implement responsive design for all components
- Keep the diff viewer simple but functional
- Maintain consistency with existing UI elements and styles"

## Epic 6: Navigation and Testing

### Story 6.1: Navigation Implementation

**Description**: Implement navigation components that work with the SEO-friendly URL structure.

#### Task 6.1.1: Create Breadcrumb Navigation

**Prompt**: "Create a breadcrumb navigation component in `github-explorer/components/navigation/Breadcrumb.tsx` that:
1. Takes the current URL and parses it into segments
2. Generates human-readable labels for each segment using our URL utilities
3. Creates clickable links for each level in the hierarchy
4. Displays the current page as the final non-clickable breadcrumb

The component should work with all our URL patterns and properly show the hierarchical relationship between entities.

REMEMBER: 
- Follow established navigation component patterns in the codebase
- Use the URL utility functions to parse and generate URLs
- Keep the implementation simple but flexible enough for all entity types
- Implement responsive design that works on all screen sizes
- Focus on usability and clear visual hierarchy"

#### Task 6.1.2: Update Internal Links

**Prompt**: "Update all internal links throughout the application to use our SEO-friendly URL patterns:
1. Replace direct ID-based links with slug-based links using our URL utility functions
2. Ensure all entity cards and list items link to the correct URLs
3. Update navigation components to use the new URL structure
4. Add proper aria-labels to links for accessibility

Make sure to use the appropriate URL building function from our utility module for each entity type.

REMEMBER: 
- Follow established link patterns in the codebase
- Use the URL utility functions consistently
- Keep accessibility in mind with proper labels and ARIA attributes
- Test links in different contexts to ensure they work correctly
- Maintain existing UI behavior while updating URL structure"

### Story 6.2: Testing

**Description**: Create comprehensive tests for the URL architecture and page rendering.

#### Task 6.2.1: Create URL Utility Tests

**Prompt**: "Create comprehensive tests for the URL utility module in `github-explorer/lib/url-utils.test.ts` that verify:
1. Slug generation handles various input types correctly
2. URL parsing accurately extracts entity information
3. URL building creates the expected patterns
4. Edge cases like special characters and long names are handled properly

Use Jest with realistic test data covering all entity types.

REMEMBER: 
- Follow established testing patterns in the codebase
- Use realistic test cases that represent actual production data
- Focus on testing core functionality and edge cases
- Keep tests simple and focused on one aspect at a time
- Ensure good test coverage for critical URL utility functions"

#### Task 6.2.2: Create Route Tests

**Prompt**: "Create tests for the dynamic routes that verify:
1. Routes correctly extract parameters from URLs
2. Metadata is generated properly for each entity type
3. Server and client components work together correctly
4. Error cases are handled gracefully

Use Next.js testing utilities to test both server and client rendering.

REMEMBER: 
- Follow established testing patterns for Next.js components
- Focus on testing the most critical functionality first
- Include tests for error handling and edge cases
- Keep tests simple and focused on specific behaviors
- Test both server and client rendering aspects"

#### Task 6.2.3: Create End-to-End Navigation Tests

**Prompt**: "Create end-to-end tests that verify the complete navigation flow:
1. Starting from the home page, navigate to a repository
2. From the repository, navigate to a contributor
3. Return to the repository and navigate to a merge request
4. From the merge request, navigate to a specific commit
5. Verify breadcrumb navigation works correctly at each step

Use Cypress or Playwright for these end-to-end tests.

REMEMBER: 
- Follow established E2E testing patterns in the codebase
- Focus on testing actual user journeys rather than implementation details
- Keep tests simple and resilient to UI changes
- Test on both desktop and mobile viewports
- Focus on critical paths rather than exhaustive test coverage"