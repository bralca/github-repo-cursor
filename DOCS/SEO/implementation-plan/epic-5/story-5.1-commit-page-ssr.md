# Story 5.1: Commit Page SSR Components

**Description**: Implement server-side rendering components for the commit page, focusing on metadata generation and initial content rendering.

## Tasks

### Task 5.1.1: Commit Page Server Component

**Prompt**: "Create a server component for the commit page in `github-explorer/app/[repositorySlug]/merge-requests/[mergeRequestSlug]/commits/[contributorSlug]/[fileSlug]/page.tsx` that:
1. Uses the URL utility to extract all entity IDs from the slugs
2. Fetches commit, file, contributor, merge request, and repository data using the adapted database query functions
3. Generates appropriate metadata using the metadata generation framework
4. Passes data to client components for interactive elements
5. Implements proper error handling and loading states

Follow Next.js server component patterns and ensure optimal performance for search engine crawlers.

REMEMBER: 
- Utilize the URL utility and database query functions created in Epic 1
- Focus on server-side performance and SEO optimization
- Implement proper error handling for cases where any of the entities don't exist
- Follow the patterns established for previous page server components
- Keep the implementation simple and focused on MVP requirements"

### Task 5.1.2: Commit Metadata Generation

**Prompt**: "Implement commit-specific metadata generation in the commit page component that:
1. Generates a descriptive title using the file name, commit message, and contributor
2. Creates a meaningful meta description summarizing the commit changes
3. Sets up OpenGraph and Twitter card metadata with appropriate images
4. Implements JSON-LD structured data for the commit
5. Adds canonical URL and other SEO-friendly meta tags

Use the metadata generation framework from Epic 1 and follow SEO best practices.

REMEMBER: 
- Use the metadata utilities created in Epic 1
- Follow SEO best practices for title and description generation
- Structure the commit schema appropriately with available information
- Reference `DOCS/SEO/URL_ARCHITECTURE.md` for SEO guidelines
- Implement all critical metadata without overcomplicating"

### Task 5.1.3: Commit Initial Content

**Prompt**: "Implement the initial content rendering for the commit page in the server component that:
1. Renders critical above-the-fold content for the commit
2. Displays essential commit information like file name, message, contributor, and related entities
3. Sets up layout and containers for client components to hydrate
4. Optimizes for Core Web Vitals and initial page load
5. Implements skeleton loading states for client-rendered content

Focus on delivering the essential content quickly while setting up for client-side hydration.

REMEMBER: 
- Prioritize above-the-fold content for fast initial rendering
- Balance between server and client rendering for optimal performance
- Use semantic HTML for better SEO and accessibility
- Follow patterns established for previous pages
- Focus on the MVP approach, implementing essential features first" 