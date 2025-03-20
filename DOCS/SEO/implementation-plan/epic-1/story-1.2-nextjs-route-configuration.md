# Story 1.2: Next.js Route Configuration

**Description**: Set up dynamic routes in Next.js to support the SEO-friendly URL structure.

## Tasks

### Task 1.2.1: Create Repository Route Configuration

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

### Task 1.2.2: Create Contributor Route Configuration

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

### Task 1.2.3: Create Merge Request Route Configuration

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

### Task 1.2.4: Create Commit Route Configuration

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