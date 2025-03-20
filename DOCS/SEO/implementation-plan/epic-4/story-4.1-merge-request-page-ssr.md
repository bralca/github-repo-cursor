# Story 4.1: Merge Request Page SSR Components

**Description**: Implement server-side rendering components for the merge request page, focusing on metadata generation and initial content rendering.

## Tasks

### Task 4.1.1: Merge Request Page Server Component

**Prompt**: "Create a server component for the merge request page in `github-explorer/app/[repositorySlug]/merge-requests/[mergeRequestSlug]/page.tsx` that:
1. Uses the URL utility to extract both repository and merge request IDs from the slugs
2. Fetches merge request and repository data using the adapted database query functions
3. Generates appropriate metadata using the metadata generation framework
4. Passes data to client components for interactive elements
5. Implements proper error handling and loading states

Follow Next.js server component patterns and ensure optimal performance for search engine crawlers.

REMEMBER: 
- Utilize the URL utility and database query functions created in Epic 1
- Focus on server-side performance and SEO optimization
- Implement proper error handling for cases where merge requests don't exist
- Follow the patterns established for previous page server components
- Keep the implementation simple and focused on MVP requirements"

### Task 4.1.2: Merge Request Metadata Generation

**Prompt**: "Implement merge request-specific metadata generation in the merge request page component that:
1. Generates a descriptive title using the merge request title and repository name
2. Creates a meaningful meta description summarizing the merge request purpose or changes
3. Sets up OpenGraph and Twitter card metadata with appropriate images
4. Implements JSON-LD structured data for the merge request
5. Adds canonical URL and other SEO-friendly meta tags

Use the metadata generation framework from Epic 1 and follow SEO best practices.

REMEMBER: 
- Use the metadata utilities created in Epic 1
- Follow SEO best practices for title and description generation
- Structure the merge request schema appropriately with available information
- Reference `DOCS/SEO/URL_ARCHITECTURE.md` for SEO guidelines
- Implement all critical metadata without overcomplicating"

### Task 4.1.3: Merge Request Initial Content

**Prompt**: "Implement the initial content rendering for the merge request page in the server component that:
1. Renders critical above-the-fold content for the merge request
2. Displays essential merge request information like title, description, status, and related repository
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