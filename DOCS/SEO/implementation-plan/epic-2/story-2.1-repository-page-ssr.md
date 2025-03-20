# Story 2.1: Repository Page SSR Components

**Description**: Implement server-side rendering components for the repository page, focusing on metadata generation and initial content rendering.

## Tasks

### Task 2.1.1: Repository Page Server Component

**Prompt**: "Create a server component for the repository page in `github-explorer/app/[repositorySlug]/page.tsx` that:
1. Uses the URL utility to extract the repository ID from the slug
2. Fetches repository data using the adapted database query functions
3. Generates appropriate metadata using the metadata generation framework
4. Passes data to client components for interactive elements
5. Implements proper error handling and loading states

Follow Next.js server component patterns and ensure optimal performance for search engine crawlers.

REMEMBER: 
- Utilize the URL utility and database query functions created in Epic 1
- Focus on server-side performance and SEO optimization
- Implement proper error handling for cases where repositories don't exist
- Reference `DOCS/page-architecture/REPOSITORY_PAGE_ARCHITECTURE.md` for guidance
- Keep the implementation simple and focused on MVP requirements"

### Task 2.1.2: Repository Metadata Generation

**Prompt**: "Implement repository-specific metadata generation in the repository page component that:
1. Generates a descriptive title using the repository name and key information
2. Creates a meaningful meta description using the repository description or summary
3. Sets up OpenGraph and Twitter card metadata with appropriate images
4. Implements JSON-LD structured data for the repository
5. Adds canonical URL and other SEO-friendly meta tags

Use the metadata generation framework from Epic 1 and follow SEO best practices.

REMEMBER: 
- Use the metadata utilities created in Epic 1
- Follow SEO best practices for title and description generation
- Keep structured data accurate and focused on repository information
- Reference `DOCS/SEO/URL_ARCHITECTURE.md` for SEO guidelines
- Implement all critical metadata without overcomplicating"

### Task 2.1.3: Repository Initial Content

**Prompt**: "Implement the initial content rendering for the repository page in the server component that:
1. Renders critical above-the-fold content for the repository
2. Displays essential repository information like name, description, and stats
3. Sets up layout and containers for client components to hydrate
4. Optimizes for Core Web Vitals and initial page load
5. Implements skeleton loading states for client-rendered content

Focus on delivering the essential content quickly while setting up for client-side hydration.

REMEMBER: 
- Prioritize above-the-fold content for fast initial rendering
- Balance between server and client rendering for optimal performance
- Use semantic HTML for better SEO and accessibility
- Reference `DOCS/page-architecture/REPOSITORY_PAGE_ARCHITECTURE.md` for guidance
- Focus on the MVP approach, implementing essential features first" 