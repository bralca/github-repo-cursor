# Story 6.1: Navigation Implementation

**Description**: Create navigation components that use the new SEO-friendly URLs for linking between pages.

## Tasks

### Task 6.1.1: URL-Aware Link Component

**Prompt**: "Create a custom Link component in `github-explorer/components/shared/EntityLink.tsx` that:
1. Extends Next.js Link component to support entity-specific URL generation
2. Accepts entity objects (repositories, contributors, etc.) as props
3. Uses the URL utility to generate the correct href
4. Implements proper typing for different entity types
5. Supports optional text and styling props

This component will be used throughout the application to ensure consistent URL generation.

REMEMBER: 
- Use TypeScript generics or union types for flexible entity handling
- Ensure the component is simple to use with reasonable defaults
- Integrate with the URL utility functions created in Epic 1
- Reference `DOCS/core-architecture/COMPONENT_LIBRARY.md` for component patterns
- Focus on creating a reusable component that works across the application"

### Task 6.1.2: Navigation Bar Integration

**Prompt**: "Update the navigation bar component in `github-explorer/components/layout/NavBar.tsx` to:
1. Use the custom Link component for entity navigation
2. Update any hardcoded routes to use the new URL structure
3. Implement breadcrumb navigation for nested routes
4. Ensure active link states work correctly with the new URL patterns
5. Support mobile responsive behavior

This will ensure consistent navigation throughout the application using the SEO-friendly URLs.

REMEMBER: 
- Maintain the existing look and feel while updating the link behavior
- Use the custom Link component created in the previous task
- Test navigation across different screen sizes
- Follow accessibility best practices for navigation elements
- Keep the implementation focused on the core navigation needs"

### Task 6.1.3: Entity Card Link Integration

**Prompt**: "Update entity card components in `github-explorer/components/shared/` to use the custom Link component for:
1. Repository cards - linking to repository pages
2. Contributor cards - linking to contributor pages
3. Merge request cards - linking to merge request pages
4. File/commit cards - linking to commit pages

Ensure all links use the SEO-friendly URL structure and maintain consistent behavior.

REMEMBER: 
- Replace current link implementations with the new EntityLink component
- Ensure card styling and behavior remains consistent
- Test cards in different contexts and layouts
- Follow accessibility best practices for interactive elements
- Keep changes focused on updating the link behavior without unnecessary changes"

### Task 6.1.4: Sitemap Generation

**Prompt**: "Implement a sitemap generator in `github-explorer/app/sitemap.ts` that:
1. Creates a Next.js compliant sitemap using the URL utilities
2. Generates URLs for all main entity types - repositories, contributors, merge requests, and commits
3. Sets appropriate change frequencies and priorities
4. Updates automatically when new content is added
5. Follows SEO best practices for sitemap structure

This will improve search engine discovery of the application content using the new URL structure.

REMEMBER: 
- Follow Next.js sitemap generation patterns
- Use the URL utilities to create consistent URLs
- Implement reasonable limits to avoid excessively large sitemaps
- Reference `DOCS/SEO/URL_ARCHITECTURE.md` for URL patterns
- Focus on creating a solution that works without overcomplication" 