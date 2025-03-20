# Story 1.3: Database Query Adaptation

**Description**: Adapt database queries to support fetching entities by URL slugs rather than just by ID.

## Tasks

### Task 1.3.1: Create Repository Query Functions

**Prompt**: "Create database query functions in `github-explorer/lib/database/repositories.ts` that:
1. Add a new function `getRepositoryBySlug(slug: string)` that extracts the GitHub ID from the slug and fetches the repository
2. Update any existing functions that list repositories to include slug generation
3. Ensure all functions use the URL utility functions for consistency

Optimize for performance while ensuring queries return all data needed for SEO-friendly URL generation.

REMEMBER: 
- Follow established database access patterns in the codebase
- Keep functions simple, purpose-driven, and well-typed
- Handle edge cases where slugs might be malformed
- Reference `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md` for guidance
- Focus on delivering a working solution that meets immediate needs"

### Task 1.3.2: Create Contributor Query Functions

**Prompt**: "Create database query functions in `github-explorer/lib/database/contributors.ts` that:
1. Add a new function `getContributorBySlug(slug: string)` that extracts the GitHub ID from the slug and fetches the contributor
2. Update any existing functions that list contributors to include slug generation
3. Ensure all functions use the URL utility functions for consistency

Optimize for performance while ensuring queries return all data needed for SEO-friendly URL generation.

REMEMBER: 
- Follow the same patterns established in the repository query functions
- Maintain consistent error handling and response formats
- Ensure edge cases like missing contributor information are handled gracefully
- Reference `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md` for guidance
- Prioritize functional correctness over premature optimization"

### Task 1.3.3: Create Merge Request Query Functions

**Prompt**: "Create database query functions in `github-explorer/lib/database/merge-requests.ts` that:
1. Add a new function `getMergeRequestBySlug(repositorySlug: string, mergeRequestSlug: string)` that extracts IDs from slugs and fetches the merge request
2. Update any existing functions that list merge requests to include slug generation
3. Ensure all functions use the URL utility functions for consistency

Optimize for performance while ensuring queries return all data needed for SEO-friendly URL generation, including the associated repository information.

REMEMBER: 
- Follow the same patterns established in previous query functions
- Handle the relationship between repositories and merge requests correctly
- Ensure edge cases with invalid slugs are handled gracefully
- Reference `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md` for guidance
- Focus on delivering a working solution that meets immediate needs"

### Task 1.3.4: Create Commit Query Functions

**Prompt**: "Create database query functions in `github-explorer/lib/database/commits.ts` that:
1. Add a new function `getCommitBySlug(repositorySlug: string, mergeRequestSlug: string, contributorSlug: string, fileSlug: string)` that extracts IDs from slugs and fetches the commit
2. Update any existing functions that list commits to include slug generation
3. Ensure all functions use the URL utility functions for consistency

Optimize for performance while ensuring queries return all data needed for SEO-friendly URL generation, including all the associated entity information.

REMEMBER: 
- Follow the same patterns established in previous query functions
- Handle the complex relationships between repositories, merge requests, contributors, and files
- Ensure robust error handling for all potential error cases
- Reference `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md` for guidance
- Build an MVP solution that works before optimization" 