# Story 1.4: SSR/CSR Rendering Framework

**Description**: Create reusable components and patterns for server-side rendering (SSR) and client-side rendering (CSR) that will be used across all entity pages.

## Tasks

### Task 1.4.1: Create Metadata Generation Framework

**Prompt**: "Create a reusable metadata generation framework in `github-explorer/lib/metadata-utils.ts` that:
1. Provides typed functions for generating Next.js metadata objects for different entity types
2. Includes helpers for OpenGraph images, Twitter cards, canonical URLs, and other SEO elements
3. Implements structured data (JSON-LD) generators for repositories, contributors, merge requests, and commits

Use TypeScript interfaces for type safety and ensure all metadata follows SEO best practices.

REMEMBER: 
- Focus on creating a simple, reusable framework that works across entity types
- Follow established patterns in the existing codebase
- Implement SEO best practices from `DOCS/SEO/URL_ARCHITECTURE.md`
- Don't overcomplicate - deliver essential metadata features first
- Make functions composable and flexible for different entity types"

### Task 1.4.2: Implement Server Component Patterns

**Prompt**: "Create reusable server component patterns in `github-explorer/components/server/` that:
1. Implement a `MetadataGenerator` component that takes entity data and generates appropriate metadata
2. Create data fetching wrapper components for each entity type
3. Establish error handling and loading state patterns for SSR

These patterns will be used across all entity pages to ensure consistency in server-side rendering.

REMEMBER: 
- Follow Next.js server component best practices
- Keep components simple and focused on a single responsibility
- Implement proper error boundaries and loading states
- Reference Next.js documentation and `DOCS/core-architecture/NEXT_JS_ARCHITECTURE.md`
- Focus on creating a solid foundation for all entity pages"

### Task 1.4.3: Implement Client Component Patterns

**Prompt**: "Create reusable client component patterns in `github-explorer/components/client/` that:
1. Implement a base content layout component that handles common UI elements
2. Create entity-specific content components that can be hydrated with data
3. Establish patterns for client-side data fetching for dynamic content updates

These patterns will be used across all entity pages to ensure consistency in client-side rendering.

REMEMBER: 
- Follow Next.js client component best practices
- Focus on performance and user experience
- Implement proper error handling and loading states
- Use existing UI components from the component library when possible
- Create components that are reusable across different entity pages"

### Task 1.4.4: Create Error and Loading States

**Prompt**: "Implement standardized error and loading state components in `github-explorer/components/shared/` that:
1. Create a reusable `ErrorBoundary` component with appropriate error messaging
2. Implement entity-specific error displays for cases like 'not found'
3. Create loading skeleton components for each entity type
4. Ensure all components are accessible and provide clear user feedback

These components will be used across all entity pages to provide a consistent user experience during loading and error states.

REMEMBER: 
- Prioritize user experience with clear, helpful error messages
- Keep loading states simple but informative
- Follow accessibility best practices for all components
- Use consistent styling and design patterns
- Reference `DOCS/core-architecture/COMPONENT_LIBRARY.md` for design patterns" 