# Story 1.1: URL Utility Framework

**Description**: Create a shared URL utility module to standardize URL generation and parsing across the application.

## Tasks

### Task 1.1.1: Create Base URL Utility Module

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

### Task 1.1.2: Implement Repository URL Functions

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

### Task 1.1.3: Implement Contributor URL Functions

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

### Task 1.1.4: Implement Merge Request URL Functions

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

### Task 1.1.5: Implement Commit URL Functions

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

### Task 1.1.6: Add URL Testing Utilities

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