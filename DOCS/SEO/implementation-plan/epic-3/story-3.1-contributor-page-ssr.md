# Story 3.1: Contributor Page SSR Components

**Description**: Implement server-side rendering components for the contributor page, focusing on metadata generation and initial content rendering.

## Tasks

### Task 3.1.1: Contributor Page Server Component

**Prompt**: "Create a server component for the contributor page in `github-explorer/app/contributors/[contributorSlug]/page.tsx` that:
1. Uses the URL utility to extract the contributor ID from the slug
2. Fetches contributor data using the adapted database query functions
3. Generates appropriate metadata using the metadata generation framework
4. Passes data to client components for interactive elements
5. Implements proper error handling and loading states

Follow Next.js server component patterns and ensure optimal performance for search engine crawlers.

REMEMBER: 
- Utilize the URL utility and database query functions created in Epic 1
- Focus on server-side performance and SEO optimization
- Implement proper error handling for cases where contributors don't exist
- Follow the same patterns established for the repository page server component
- Keep the implementation simple and focused on MVP requirements"

### Task 3.1.2: Contributor Metadata Generation

**Prompt**: "Implement contributor-specific metadata generation in the contributor page component that:
1. Generates a descriptive title using the contributor name and username
2. Creates a meaningful meta description summarizing the contributor's activity or bio
3. Sets up OpenGraph and Twitter card metadata with the contributor's avatar
4. Implements JSON-LD structured data for the contributor (using Person schema)
5. Adds canonical URL and other SEO-friendly meta tags

Use the metadata generation framework from Epic 1 and follow SEO best practices.

REMEMBER: 
- Use the metadata utilities created in Epic 1
- Follow SEO best practices for title and description generation
- Structure the Person schema appropriately with available contributor information
- Reference `DOCS/SEO/URL_ARCHITECTURE.md` for SEO guidelines
- Implement all critical metadata while maintaining simplicity"

### Task 3.1.3: Contributor Initial Content

**Prompt**: "Implement the initial content rendering for the contributor page in the server component that:
1. Renders critical above-the-fold content for the contributor
2. Displays essential contributor information like name, username, avatar, and basic stats
3. Sets up layout and containers for client components to hydrate
4. Optimizes for Core Web Vitals and initial page load
5. Implements skeleton loading states for client-rendered content

Focus on delivering the essential content quickly while setting up for client-side hydration.

REMEMBER: 
- Prioritize above-the-fold content for fast initial rendering
- Balance between server and client rendering for optimal performance
- Use semantic HTML for better SEO and accessibility
- Follow patterns established for the repository page
- Focus on the MVP approach, implementing essential features first" 