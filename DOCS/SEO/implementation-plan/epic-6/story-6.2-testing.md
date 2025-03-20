# Story 6.2: Testing

**Description**: Implement comprehensive testing for the SEO-optimized URL architecture to ensure functionality and SEO performance.

## Tasks

### Task 6.2.1: URL Utility Unit Tests

**Prompt**: "Create comprehensive unit tests for the URL utility module in `github-explorer/lib/url-utils.test.ts` that:
1. Tests all slug generation functions with various inputs
2. Verifies parsing functions correctly extract entity information
3. Checks URL building functions create the expected URLs
4. Tests edge cases like long names, special characters, and missing data
5. Ensures round-trip consistency (parse(generate(x)) == x)

Use Jest and React Testing Library to create thorough test coverage.

REMEMBER: 
- Create tests that cover both expected and edge case inputs
- Follow testing patterns established in the codebase
- Focus on functional correctness rather than implementation details
- Use realistic data samples for tests
- Keep tests simple and focused on a single behavior per test"

### Task 6.2.2: Server Component Integration Tests

**Prompt**: "Implement integration tests for the server components in `github-explorer/app/` that:
1. Tests that server components correctly extract entity IDs from URLs
2. Verifies metadata generation produces the expected SEO elements
3. Checks that error handling works correctly for missing entities
4. Tests server component rendering with mock data
5. Verifies data is correctly passed to client components

Use Next.js testing utilities and mock server components appropriately.

REMEMBER: 
- Mock database queries to test components in isolation
- Test both success and error paths
- Focus on SEO-critical aspects like metadata generation
- Follow Next.js server component testing best practices
- Keep tests simple and focused on specific behaviors"

### Task 6.2.3: End-to-End Navigation Tests

**Prompt**: "Create end-to-end tests in `github-explorer/cypress/` or `github-explorer/playwright/` that:
1. Tests navigation through the entire application using the new URL structure
2. Verifies links between related entities work correctly
3. Checks URL consistency when navigating between pages
4. Tests browser history and back/forward navigation
5. Verifies SEO elements are present in the rendered HTML

Use Cypress or Playwright to test the application as a user would experience it.

REMEMBER: 
- Focus on user journeys through the application
- Test critical paths first (e.g., repository → merge request → commit)
- Verify SEO elements are present in the rendered page
- Test URL consistency across navigation flows
- Keep tests simple and focused on specific user journeys"

### Task 6.2.4: SEO Performance Validation

**Prompt**: "Implement SEO performance validation in `github-explorer/scripts/seo-validation.js` that:
1. Checks generated pages for SEO best practices
2. Verifies metadata presence and correctness
3. Tests structured data validity using appropriate schemas
4. Checks for mobile responsiveness and Core Web Vitals
5. Validates the sitemap against the application content

Use Lighthouse, schema.org validators, or similar tools to verify SEO performance.

REMEMBER: 
- Focus on critical SEO factors first
- Implement automated checks where possible
- Create clear reporting of SEO issues
- Follow established SEO best practices
- Keep validation focused on what matters most for search visibility" 