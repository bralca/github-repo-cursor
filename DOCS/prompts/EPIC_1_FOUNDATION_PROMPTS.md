
# Epic 1: Foundation & Infrastructure - Implementation Prompts

This document contains detailed prompts for implementing Epic 1: Foundation & Infrastructure. Each prompt is designed to complete a specific task from the implementation plan.

## Implementation Tracking

| Story | Task | Status | Assigned To | Notes |
|-------|------|--------|-------------|-------|
| **1.1: Next.js Project Setup** | | | | |
| | 1.1.1: Core Project Setup | ⬜ | | |
| | 1.1.2: Styling & UI Foundation | ⬜ | | |
| | 1.1.3: Development Environment | ⬜ | | |
| | 1.1.4: UI Framework Integration | ⬜ | | |
| | 1.1.5: Responsive Base Layout | ⬜ | | |
| **1.2: Node.js Pipeline Server Setup** | | | | |
| | 1.2.1: Server Project Initialization | ⬜ | | |
| | 1.2.2: API Foundation | ⬜ | | |
| | 1.2.3: Error Handling System | ⬜ | | |
| | 1.2.4: Logging Infrastructure | ⬜ | | |
| | 1.2.5: Deployment Configuration | ⬜ | | |
| **1.3: Supabase Direct Integration with Next.js** | | | | |
| | 1.3.1: Supabase Client Setup | ⬜ | | |
| | 1.3.2: TypeScript Database Types | ⬜ | | |
| | 1.3.3: Authentication Foundation | ⬜ | | |
| | 1.3.4: Protected Routes | ⬜ | | |
| | 1.3.5: Data Access Hooks | ⬜ | | |
| **1.4: GitHub API Integration in Node.js Server** | | | | |
| | 1.4.1: GitHub API Client Foundation | ⬜ | | |
| | 1.4.2: Repository Data Service | ⬜ | | |
| | 1.4.3: Contributor Data Service | ⬜ | | |
| | 1.4.4: Merge Request Data Service | ⬜ | | |
| | 1.4.5: Rate Limiting & Resilience | ⬜ | | |
| **1.5: Data Pipeline Architecture** | | | | |
| | 1.5.1: Pipeline Core Architecture | ⬜ | | |
| | 1.5.2: Repository Processing Stage | ⬜ | | |
| | 1.5.3: Contributor Processing Stage | ⬜ | | |
| | 1.5.4: Merge Request Processing Stage | ⬜ | | |
| | 1.5.5: Data Storage & Persistence | ⬜ | | |
| | 1.5.6: Pipeline Scheduling & Control | ⬜ | | |
| | 1.5.7: Error Recovery & Resilience | ⬜ | | |
| **1.6: Next.js Core UI Components** | | | | |
| | 1.6.1: Layout Component Foundation | ⬜ | | |
| | 1.6.2: Navigation System | ⬜ | | |
| | 1.6.3: Data Display Components | ⬜ | | |
| | 1.6.4: Chart & Visualization Components | ⬜ | | |
| | 1.6.5: Interactive Components | ⬜ | | |
| | 1.6.6: Theming System | ⬜ | | |
| **1.7: Next.js Direct Supabase Data Fetching Patterns** | | | | |
| | 1.7.1: Security Foundation | ⬜ | | |
| | 1.7.2: Server Component Data Fetching | ⬜ | | |
| | 1.7.3: Client Component Data Fetching | ⬜ | | |
| | 1.7.4: Advanced Data Fetching Patterns | ⬜ | | |
| | 1.7.5: Performance Optimization | ⬜ | | |

## Implementation Prompts

### Story 1.1: Next.js Project Setup

#### Prompt for Task 1.1.1: Core Project Setup
```
Create a new Next.js project for GitHub Analytics with TypeScript. Set up a well-structured directory organization to handle pages, components, hooks, utils, and other key areas. The project should:

1. Use Next.js v14+ with the App Router
2. Set up TypeScript with strict mode enabled
3. Create the following directory structure:
   - app/ (for Next.js App Router)
   - components/ (for shared UI components)
   - lib/ (for utilities and helpers)
   - hooks/ (for custom React hooks)
   - types/ (for TypeScript definitions)
   - integrations/ (for third-party service integrations)
   - styles/ (for global styles)

4. Create a basic .gitignore file that excludes:
   - node_modules
   - .next
   - .env*.local
   - build outputs

5. Add a README.md with:
   - Project title and description
   - Setup instructions
   - Technology stack overview
   - Basic usage guide

Reference the DATABASE_SCHEMA.md and DESIGN_GUIDELINES.md documents for context on the data structure and design requirements. Ensure the project structure can effectively support the features outlined in the ROADMAP.md document.
```

#### Prompt for Task 1.1.2: Styling & UI Foundation
```
Set up Tailwind CSS for the GitHub Analytics Next.js project, along with appropriate color scheme configuration and theme variables. Implement:

1. Install and configure Tailwind CSS with PostCSS
2. Create a tailwind.config.js file that includes:
   - Custom color palette based on the DESIGN_GUIDELINES.md document
   - Extended theme for typography, spacing, and breakpoints
   - Enable JIT mode for optimized development
   - Configure dark mode support

3. Configure Tailwind plugins for:
   - Forms
   - Typography
   - Aspect ratio
   - Line clamp

4. Set up base CSS variables in a globals.css file for:
   - Primary, secondary, and accent colors
   - Light and dark mode variants
   - Consistent spacing scales
   - Typography scales

5. Create CSS reset styles and base element styling

Reference the DESIGN_GUIDELINES.md document to ensure the color palette and design system align with the specified design direction. The styling should support both light and dark modes as required in the project specifications.
```

#### Prompt for Task 1.1.3: Development Environment
```
Configure development environment tools and settings for the GitHub Analytics Next.js project. Implement:

1. Set up ESLint with:
   - Next.js recommended configuration
   - TypeScript support
   - Import sorting rules
   - Accessibility rules
   - React hooks rules

2. Configure Prettier with:
   - 2 space indentation
   - Single quotes
   - Semicolons required
   - No trailing commas
   - 80 character line width

3. Create VS Code settings in .vscode/settings.json with:
   - Format on save enabled
   - ESLint auto-fix on save
   - Recommended extensions list
   - Custom IntelliSense settings

4. Configure environment variables:
   - Create .env.example file with required variables
   - Set up .env.local for development
   - Document environment variables in README
   - Implement environment variable validation

5. Set up scripts in package.json:
   - Development server
   - Production build
   - Type checking
   - Linting
   - Combined check script for CI

All configuration should be consistent with the requirements in the DEVELOPMENT_STANDARDS.md document to ensure code quality and consistency across the project.
```

#### Prompt for Task 1.1.4: UI Framework Integration
```
Integrate Shadcn UI components into the GitHub Analytics Next.js project and set up theming with dark/light mode support. Implement:

1. Install and configure Shadcn UI:
   - Set up the CLI for component installation
   - Configure component directory structure
   - Set up the cn utility for class name merging

2. Configure theme providers:
   - Create ThemeProvider component using next-themes
   - Set up theme context and hooks
   - Implement system theme detection
   - Create storage mechanism for theme preference

3. Implement ThemeToggle component:
   - Create toggle with icon indicators
   - Add animations for state changes
   - Ensure keyboard accessibility
   - Provide tooltip for function clarity

4. Set up component theming:
   - Configure design tokens in CSS
   - Create theme override mechanism
   - Set up variant handling
   - Implement consistent spacing system

5. Implement basic themed components:
   - Button with variants
   - Card with variations
   - Navigation elements
   - Form controls

Reference the DESIGN_GUIDELINES.md document for theme color requirements and component styling directions. The implementation should support seamless switching between light and dark themes and be accessible according to WCAG standards.
```

#### Prompt for Task 1.1.5: Responsive Base Layout
```
Create a responsive base layout system for the GitHub Analytics Next.js project. Implement:

1. Design a responsive layout component that:
   - Adapts to mobile, tablet, and desktop viewports
   - Implements proper container constraints
   - Handles header, footer, and main content areas
   - Includes proper meta tags and SEO configuration

2. Implement mobile breakpoint handlers:
   - Create a useMediaQuery hook
   - Set up responsive breakpoints matching Tailwind
   - Implement viewport state detection
   - Create conditional rendering utilities

3. Create a navigation container:
   - Build responsive navigation with mobile drawer
   - Implement active state highlighting
   - Create collapsible sections for categories
   - Add user menu area for authenticated users

4. Set up global error boundary:
   - Implement error catching component
   - Create fallback UI for errors
   - Add error reporting mechanism
   - Create recovery options for users

5. Implement page transitions:
   - Add subtle animations between route changes
   - Create loading states for data fetching
   - Implement progress indicators
   - Ensure accessibility during transitions

Reference the DESIGN_GUIDELINES.md document for layout specifications and responsive behavior requirements. The layout system should be flexible enough to accommodate all the pages outlined in the ROADMAP.md document.
```

### Story 1.2: Node.js Pipeline Server Setup

#### Prompt for Task 1.2.1: Server Project Initialization
```
Create a new Node.js server project for the GitHub Analytics data processing pipeline with TypeScript. Implement:

1. Initialize a new Node.js project:
   - Set up package.json with appropriate metadata
   - Configure TypeScript with tsconfig.json
   - Create standard directory structure (src, dist, etc.)
   - Initialize Git repository with .gitignore

2. Configure TypeScript for backend needs:
   - Set strict type checking
   - Configure module resolution
   - Set up path aliases
   - Configure source maps for debugging

3. Install core dependencies:
   - Express for API framework
   - Cors for cross-origin request handling
   - Helmet for security headers
   - Body-parser for request parsing
   - Dotenv for environment variables
   - Winston/Pino for logging

4. Create basic server entry point:
   - Set up Express application
   - Configure basic middleware
   - Create health check endpoint
   - Implement graceful shutdown

5. Set up build and development scripts:
   - Configure nodemon for development
   - Set up TypeScript compilation
   - Create start/dev/build scripts
   - Implement clean script for builds

Reference the NODE_SERVER_ARCHITECTURE.md document for details on the server design and requirements. The project structure should support the pipeline stages outlined in the DATA_PIPELINE_ARCHITECTURE.md document.
```

#### Prompt for Task 1.2.2: API Foundation
```
Implement the API foundation for the GitHub Analytics Node.js server using Express. Create:

1. Set up basic Express middleware:
   - Configure CORS with appropriate origins
   - Implement Helmet for security headers
   - Add request parsing middleware
   - Set up compression for responses
   - Implement request ID tracking

2. Create route structure with controllers pattern:
   - Implement Router-Controller-Service pattern
   - Set up route registration system
   - Create versioned API structure (v1)
   - Implement controller base class
   - Set up dependency injection pattern

3. Implement health check endpoint:
   - Create GET /health with status checks
   - Add database connection testing
   - Implement service dependencies verification
   - Add detailed health metrics
   - Set up monitoring-friendly response format

4. Add request validation middleware:
   - Implement validation using Zod
   - Create validation middleware factory
   - Set up error response formatting
   - Implement custom validation rules
   - Create reusable validation schemas

5. Implement rate limiting:
   - Add rate limiting middleware
   - Configure limits by routes
   - Set up response headers for limits
   - Create limit bypass for internal requests
   - Implement storage for limit tracking

Reference the NODE_SERVER_ARCHITECTURE.md document for API design guidelines and endpoint specifications. The implementation should align with the requirements in the DATA_PIPELINE_ARCHITECTURE.md document.
```

#### Prompt for Task 1.2.3: Error Handling System
```
Implement a comprehensive error handling system for the GitHub Analytics Node.js server. Create:

1. Global error handler middleware:
   - Create centralized error handling middleware
   - Implement different handlers by error type
   - Set up status code mapping
   - Create consistent error response format
   - Add production vs development mode behaviors

2. Custom error classes:
   - Create base AppError class
   - Implement specific error types (NotFound, Validation, etc.)
   - Add metadata support to errors
   - Create serialization methods
   - Implement error categorization

3. Error logging mechanism:
   - Set up structured error logging
   - Create error severity classification
   - Implement context capturing
   - Add stack trace handling
   - Create log rotation/management

4. Centralized error response format:
   - Implement RFC7807 Problem Details format
   - Create error code system
   - Add internationalization support
   - Implement debug info (dev only)
   - Create error reference documentation

5. Client-side error handling support:
   - Add correlation IDs for error tracking
   - Create retry-after headers for rate limits
   - Implement problem JSON content type
   - Add HATEOAS links for error resolution
   - Create documentation references in responses

Reference the NODE_SERVER_ARCHITECTURE.md document for error handling requirements and best practices. The implementation should provide detailed error information for debugging while maintaining security by not exposing sensitive details in production.
```

#### Prompt for Task 1.2.4: Logging Infrastructure
```
Implement a structured logging infrastructure for the GitHub Analytics Node.js server. Create:

1. Configure structured logging:
   - Set up Winston or Pino logger
   - Configure JSON log format
   - Implement log levels with environment overrides
   - Create transport configuration (console, file)
   - Set up log rotation for file transport

2. Implement request ID tracking:
   - Create middleware for generating request IDs
   - Set up header propagation (X-Request-ID)
   - Implement context storage for request data
   - Create child loggers with request context
   - Add correlation ID support

3. Create logging middleware:
   - Implement request/response logging
   - Add timing information
   - Create redaction for sensitive data
   - Implement sampling for high-volume endpoints
   - Add user context when authenticated

4. Set up different log levels:
   - Configure production vs development logging
   - Implement debug logging with filtering
   - Create verbose mode for troubleshooting
   - Set up error-only mode for alerts
   - Add performance logging level

5. Implement operational logging:
   - Create startup/shutdown logging
   - Add configuration logging (sanitized)
   - Implement health check logging
   - Create pipeline stage logging
   - Add periodic system status logging

Reference the NODE_SERVER_ARCHITECTURE.md document for logging requirements and standards. The implementation should balance comprehensive logging with performance considerations and should support debugging in production environments.
```

#### Prompt for Task 1.2.5: Deployment Configuration
```
Create the deployment configuration for the GitHub Analytics Node.js server. Implement:

1. Create production build process:
   - Configure TypeScript compilation settings
   - Set up asset copying
   - Implement bundle optimization
   - Create Docker build configuration
   - Add dependency pruning for production

2. Configure environment variables:
   - Create .env.example template
   - Implement validation for required variables
   - Set up sensitive variable handling
   - Configure different environments (dev/staging/prod)
   - Add documentation for all variables

3. Set up deployment scripts:
   - Create deployment shell scripts
   - Implement database migration handling
   - Add version tagging
   - Create rollback procedures
   - Implement health verification post-deploy

4. Create CI pipeline configuration:
   - Set up GitHub Actions workflow
   - Configure staging deployment
   - Implement production deployment
   - Add automated testing steps
   - Create approval gates for production

5. Implement infrastructure configuration:
   - Create Dockerfile
   - Set up docker-compose for local development
   - Implement Kubernetes manifests if needed
   - Configure cloud provider settings
   - Add monitoring/alert configuration

Reference the NODE_SERVER_ARCHITECTURE.md document for deployment requirements and target environments. The configuration should support easy deployment to the hosting platforms specified in the project requirements (Railway/Render).
```

### Story 1.3: Supabase Direct Integration with Next.js

#### Prompt for Task 1.3.1: Supabase Client Setup
```
Implement Supabase client integration for the GitHub Analytics Next.js application. Create:

1. Install Supabase client libraries:
   - @supabase/supabase-js
   - @supabase/auth-helpers-nextjs
   - @supabase/auth-helpers-react (if needed)

2. Configure environment variables:
   - Set up NEXT_PUBLIC_SUPABASE_URL
   - Configure NEXT_PUBLIC_SUPABASE_ANON_KEY
   - Add SUPABASE_SERVICE_ROLE_KEY (server-only)
   - Create variable validation checks
   - Add environment-specific configurations

3. Create client initialization utilities:
   - Implement createClient utility
   - Set up server-side client creator
   - Create client-side client creator
   - Implement auth middleware
   - Add revalidation helpers

4. Implement client singleton pattern:
   - Create singleton instance for client components
   - Implement request-scoped instance for server
   - Add provider components if needed
   - Create reusable hooks
   - Implement context providers

5. Set up error handling and retry logic:
   - Create error handling utilities
   - Implement automatic retry for transient errors
   - Add circuit breaker pattern
   - Create error notification system
   - Implement logging for API issues

Reference the SUPABASE_INTEGRATION.md document for integration details and authentication requirements. The implementation should follow Next.js best practices for Supabase integration with the App Router.
```

#### Prompt for Task 1.3.2: TypeScript Database Types
```
Generate and implement TypeScript types for the GitHub Analytics Supabase database schema. Create:

1. Generate TypeScript types from database schema:
   - Use Supabase CLI or type generator
   - Create comprehensive Database type
   - Set up table-specific types
   - Generate enum types for constants
   - Create join table types

2. Create type utilities for database operations:
   - Implement insert/update helper types
   - Create query result types
   - Add pagination result types
   - Implement filter types
   - Create sort parameter types

3. Set up type guards for database responses:
   - Implement type assertion utilities
   - Create validation functions
   - Add runtime type checking
   - Implement error handling for type mismatches
   - Create conversion utilities for dates and arrays

4. Implement interface extensions for application needs:
   - Create view models extending database types
   - Implement form state interfaces
   - Add request/response types
   - Create composite types for joined data
   - Implement partial types for updates

5. Add generic database utility types:
   - Create pagination parameters type
   - Implement filter parameter types
   - Add sorting parameter types
   - Create subscription event types
   - Implement transaction types

Reference the DATABASE_SCHEMA.md document for the complete database structure and relationships. The types should match the database schema defined in the Supabase project and support all operations needed by the application.
```

#### Prompt for Task 1.3.3: Authentication Foundation
```
Implement authentication functionality for the GitHub Analytics Next.js application using Supabase Auth. Create:

1. Implement sign in functionality:
   - Create sign in form with email/password
   - Add social login providers if required
   - Implement error handling and validation
   - Create loading and success states
   - Add persistent session handling

2. Create signup flow:
   - Implement registration form
   - Add email verification process
   - Create profile creation after signup
   - Implement welcome experience
   - Add conversion tracking

3. Add password reset capability:
   - Create password reset request form
   - Implement reset token handling
   - Add reset password form
   - Create success confirmation
   - Add security notifications

4. Implement authentication state management:
   - Create auth context provider
   - Implement user profile fetching
   - Add session refresh handling
   - Create sign out functionality
   - Implement auth state listeners

5. Set up authentication middleware:
   - Create server-side auth checking
   - Implement client-side auth guards
   - Add role-based access control
   - Create auth event logging
   - Implement security headers

Reference the SUPABASE_INTEGRATION.md document for authentication requirements and flow designs. The implementation should support the authentication methods specified in the project requirements and handle edge cases like expired sessions.
```

#### Prompt for Task 1.3.4: Protected Routes
```
Implement protected routes and authentication middleware for the GitHub Analytics Next.js application. Create:

1. Create authentication middleware:
   - Implement middleware.ts for Auth Router
   - Set up public route allowlist
   - Create role-based route protection
   - Add auth state verification
   - Implement session refresh logic

2. Implement route guards:
   - Create server component auth checking
   - Implement client-side route protection
   - Add loading states during verification
   - Create unauthorized view components
   - Implement role-specific route guards

3. Set up redirect logic for unauthenticated users:
   - Create redirect middleware
   - Implement return URL preservation
   - Add login prompt dialog
   - Create custom error pages
   - Implement partial authentication views

4. Add session persistence:
   - Set up cookie-based session storage
   - Implement refresh token rotation
   - Create session recovery mechanisms
   - Add multi-tab synchronization
   - Implement session timeout handling

5. Create auth utility hooks:
   - Implement useAuth hook
   - Create useAuthRequired hook
   - Add useRole for role checking
   - Implement usePermission for fine-grained control
   - Create useAuthRedirect for navigation

Reference the SUPABASE_INTEGRATION.md document for authentication flow requirements and NEXT_JS_ARCHITECTURE.md for routing guidelines. The implementation should support a seamless authentication experience with appropriate security measures.
```

#### Prompt for Task 1.3.5: Data Access Hooks
```
Implement data access hooks for interacting with the Supabase database in the GitHub Analytics Next.js application. Create:

1. Create base query hook patterns:
   - Implement useSupabaseQuery hook
   - Create useSupabaseMutation hook
   - Add useSupabaseSubscription for realtime
   - Implement useSupabaseStorage for files
   - Create useSupabaseFunction for edge functions

2. Implement React Query integration:
   - Set up QueryClient provider
   - Create queryKey factories
   - Implement query cache policies
   - Add mutation optimistic updates
   - Create query invalidation utilities

3. Add error handling utilities:
   - Implement error classification
   - Create retry strategies
   - Add toast notifications for errors
   - Implement fallback data
   - Create error boundary integration

4. Create loading state handlers:
   - Implement skeleton components
   - Add loading overlays
   - Create progressive loading patterns
   - Implement stale-while-revalidate UX
   - Add loading indicators

5. Implement specific data access hooks:
   - Create useRepositories hook
   - Implement useContributors hook
   - Add useMergeRequests hook
   - Create useCommits hook
   - Implement analytics data hooks

Reference the SUPABASE_INTEGRATION.md document for database access patterns and DATABASE_SCHEMA.md for entity relationships. The hooks should provide a clean, type-safe interface to the database with appropriate loading, error, and caching behaviors.
```

### Story 1.4: GitHub API Integration in Node.js Server

#### Prompt for Task 1.4.1: GitHub API Client Foundation
```
Implement a robust GitHub API client in the Node.js server for the GitHub Analytics application. Create:

1. Install and configure Octokit:
   - Set up Octokit REST client
   - Add Octokit plugins (throttling, retry, pagination)
   - Configure authentication methods
   - Implement request logging
   - Create client configuration

2. Create client wrapper class:
   - Implement GitHubClient class
   - Add typed methods for common operations
   - Create request builders
   - Implement response parsing
   - Add error handling

3. Set up authentication with GitHub API:
   - Configure personal access token auth
   - Implement OAuth flow if needed
   - Add JWT authentication option
   - Create token refresh mechanisms
   - Implement token validation

4. Implement basic request methods:
   - Create GET/POST/PATCH/DELETE wrappers
   - Add pagination handling
   - Implement response transformation
   - Create error classification
   - Add request metadata handling

5. Create testing utilities:
   - Implement mock GitHub API responses
   - Create testing fixtures
   - Add rate limit simulation
   - Implement error response testing
   - Create client testing utilities

Reference the DATA_PIPELINE_ARCHITECTURE.md document for GitHub data requirements and GITHUB_API_INTEGRATION.md for API usage patterns. The client should handle GitHub API rate limits gracefully and provide a consistent interface for all GitHub API operations.
```

#### Prompt for Task 1.4.2: Repository Data Service
```
Implement the Repository Data Service for fetching and processing GitHub repository data. Create:

1. Create methods for fetching repository details:
   - Implement getRepository method
   - Add getRepositories for batch fetching
   - Create searchRepositories for discovery
   - Implement getRepositoryByName
   - Add repository existence checking

2. Implement repository statistics collection:
   - Create methods for commit frequency
   - Add star history retrieval
   - Implement fork statistics
   - Create contributor count methods
   - Add language breakdown retrieval

3. Add repository contributor listing:
   - Implement getRepositoryContributors
   - Create contributor statistics methods
   - Add contribution timeline retrieval
   - Implement top contributors identification
   - Create contributor ranking methods

4. Build repository activity tracking:
   - Implement recent events retrieval
   - Create commit activity analysis
   - Add issue activity tracking
   - Implement PR velocity metrics
   - Create activity heatmap data

5. Add repository metadata methods:
   - Implement license detection
   - Create repository health scoring
   - Add dependency analysis
   - Implement code quality metrics
   - Create documentation coverage assessment

Reference the DATABASE_SCHEMA.md document for repository data structure and DATA_PIPELINE_ARCHITECTURE.md for processing requirements. The service should efficiently collect all required repository data while respecting API rate limits.
```

#### Prompt for Task 1.4.3: Contributor Data Service
```
Implement the Contributor Data Service for fetching and processing GitHub contributor data. Create:

1. Implement contributor profile fetching:
   - Create getUser method for basic profiles
   - Add detailed profile retrieval
   - Implement avatar and image handling
   - Create username validation
   - Add profile existence checking

2. Create contributor statistics methods:
   - Implement contribution count retrieval
   - Add contribution type breakdown
   - Create time-based contribution analysis
   - Implement repository focus identification
   - Add language expertise detection

3. Add organization membership retrieval:
   - Create getUserOrganizations method
   - Implement organization role detection
   - Add organization activity analysis
   - Create organization relationship mapping
   - Implement team membership detection

4. Build contributor activity timeline collection:
   - Create getUserEvents method
   - Implement event type classification
   - Add timeline generation
   - Create activity pattern analysis
   - Implement activity heatmap data

5. Add contributor relationship mapping:
   - Create co-contributor identification
   - Implement collaboration frequency analysis
   - Add mentor/mentee pattern detection
   - Create community role classification
   - Implement expertise network mapping

Reference the DATABASE_SCHEMA.md document for contributor data structure and DATA_PIPELINE_ARCHITECTURE.md for processing requirements. The service should efficiently collect all required contributor data while protecting user privacy and respecting API rate limits.
```

#### Prompt for Task 1.4.4: Merge Request Data Service
```
Implement the Merge Request Data Service for fetching and processing GitHub pull request data. Create:

1. Create pull request listing functionality:
   - Implement getRepositoryPullRequests method
   - Add filtering by status (open, closed, merged)
   - Create search and filtering capabilities
   - Implement pagination for large repositories
   - Add sorting and ordering options

2. Implement PR details retrieval:
   - Create getPullRequest method for detailed data
   - Add diff retrieval and parsing
   - Implement file change analysis
   - Create commit list retrieval
   - Add PR description parsing

3. Add PR comment and review fetching:
   - Implement getPullRequestComments method
   - Create getPullRequestReviews method
   - Add review comment thread grouping
   - Implement review decision tracking
   - Create comment sentiment analysis

4. Build PR statistics collection:
   - Implement time-to-merge calculation
   - Add review cycle time measurement
   - Create code change volume metrics
   - Implement review thoroughness metrics
   - Add PR complexity scoring

5. Implement PR timeline and activity tracking:
   - Create PR lifecycle event retrieval
   - Implement review request tracking
   - Add CI/CD status integration
   - Create branch protection compliance checking
   - Implement merge strategy detection

Reference the DATABASE_SCHEMA.md document for merge request data structure and DATA_PIPELINE_ARCHITECTURE.md for processing requirements. The service should collect comprehensive PR data to enable advanced analytics on development workflows.
```

#### Prompt for Task 1.4.5: Rate Limiting & Resilience
```
Implement GitHub API rate limiting and resilience features for the GitHub Analytics data pipeline. Create:

1. Implement token rotation for rate limits:
   - Create token pool management
   - Add rate limit tracking per token
   - Implement token selection algorithm
   - Create token health monitoring
   - Add token refresh capabilities

2. Create exponential backoff mechanism:
   - Implement retry with increasing delays
   - Add jitter to prevent thundering herd
   - Create maximum retry configuration
   - Implement retry event logging
   - Add retry success tracking

3. Add request batching for efficiency:
   - Create request queue system
   - Implement batching by repository
   - Add priority-based processing
   - Create request deduplication
   - Implement optimal batch size adjustment

4. Implement circuit breaker pattern:
   - Create service health monitoring
   - Add failure threshold detection
   - Implement circuit open/closed states
   - Create half-open testing mechanism
   - Add circuit state logging and alerts

5. Set up request caching:
   - Implement in-memory cache
   - Add Redis cache option
   - Create cache invalidation strategies
   - Implement conditional requests (ETag/If-Modified-Since)
   - Add cache statistics monitoring

Reference the DATA_PIPELINE_ARCHITECTURE.md document for pipeline efficiency requirements and GitHub API guidelines. The implementation should maximize data collection while strictly adhering to GitHub's rate limits and terms of service.
```

### Story 1.5: Data Pipeline Architecture

#### Prompt for Task 1.5.1: Pipeline Core Architecture
```
Implement the core architecture for the GitHub Analytics data processing pipeline. Create:

1. Design pipeline stages and interfaces:
   - Create PipelineStage interface
   - Implement stage input/output types
   - Add stage context and configuration
   - Create stage dependency specification
   - Implement stage progress reporting

2. Create pipeline executor:
   - Implement PipelineExecutor class
   - Add stage registration and ordering
   - Create execution flow control
   - Implement parallel execution capability
   - Add execution monitoring and metrics

3. Implement pipeline context:
   - Create shared context mechanism
   - Add context persistence between stages
   - Implement context value validation
   - Create context serialization
   - Add secure storage for sensitive data

4. Build stage sequencing mechanism:
   - Implement topological sorting of stages
   - Create conditional stage execution
   - Add dependency validation
   - Implement stage skipping logic
   - Create circular dependency detection

5. Add pipeline configuration:
   - Create configuration schema and validation
   - Implement environment-specific configs
   - Add dynamic configuration loading
   - Create configuration documentation
   - Implement configuration versioning

Reference the DATA_PIPELINE_ARCHITECTURE.md document for pipeline design requirements and stage specifications. The architecture should be flexible, extensible, and robust enough to handle large data processing tasks with appropriate error handling.
```

#### Prompt for Task 1.5.2: Repository Processing Stage
```
Implement the Repository Processing Stage for the GitHub Analytics data pipeline. Create:

1. Implement repository metadata extraction:
   - Create repository data fetching
   - Add metadata normalization
   - Implement owner/organization linking
   - Create repository categorization
   - Add license detection and parsing

2. Create repository statistics calculation:
   - Implement commit frequency analysis
   - Add contribution pattern detection
   - Create fork and star trend analysis
   - Implement language usage calculation
   - Add code volume and churn metrics

3. Add repository status determination:
   - Create activity level classification
   - Implement maintenance status detection
   - Add deprecation/archive detection
   - Create freshness evaluation
   - Implement popularity trend analysis

4. Build repository enrichment process:
   - Create advanced metadata collection
   - Implement dependency graph analysis
   - Add security vulnerability assessment
   - Create documentation coverage checking
   - Implement community health evaluation

5. Add data validation and transformation:
   - Create data schema validation
   - Implement data cleaning and normalization
   - Add missing data handling
   - Create data transformation pipelines
   - Implement output formatting

Reference the DATABASE_SCHEMA.md document for repository data structure and DATA_PIPELINE_ARCHITECTURE.md for processing requirements. The stage should efficiently process repository data and prepare it for storage in the database.
```

#### Prompt for Task 1.5.3: Contributor Processing Stage
```
Implement the Contributor Processing Stage for the GitHub Analytics data pipeline. Create:

1. Create contributor identification process:
   - Implement contributor extraction from commits
   - Add user profile resolution
   - Create identity merging (email/username)
   - Implement bot account detection
   - Add anonymous contributor handling

2. Implement contributor profile enrichment:
   - Create public profile data collection
   - Add employment and affiliation detection
   - Implement social media link collection
   - Create location and timezone analysis
   - Add profile completeness assessment

3. Add contributor statistics calculation:
   - Implement contribution counting
   - Create contribution type categorization
   - Add time-based contribution analysis
   - Implement project focus detection
   - Create expertise level assessment

4. Build contributor-repository relationship mapping:
   - Create contribution relationship modeling
   - Implement repository focus detection
   - Add collaboration network mapping
   - Create maintainer relationship detection
   - Implement mentorship pattern identification

5. Add role and behavior classification:
   - Create role classification algorithms
   - Implement contribution pattern analysis
   - Add specialization detection
   - Create community role identification
   - Implement expertise mapping

Reference the DATABASE_SCHEMA.md document for contributor data structure and DATA_PIPELINE_ARCHITECTURE.md for processing requirements. The stage should respect user privacy while extracting valuable contributor insights for analysis.
```

#### Prompt for Task 1.5.4: Merge Request Processing Stage
```
Implement the Merge Request Processing Stage for the GitHub Analytics data pipeline. Create:

1. Implement PR data extraction and normalization:
   - Create pull request fetching
   - Add core data extraction and cleaning
   - Implement PR linkage to repositories
   - Create author resolution and linking
   - Add timeline event sequencing

2. Create PR status tracking:
   - Implement status classification
   - Add merge status determination
   - Create abandoned PR detection
   - Implement long-running PR identification
   - Add stale PR detection

3. Add PR review data processing:
   - Create review extraction and linking
   - Implement review decision tracking
   - Add reviewer identification
   - Create review comment analysis
   - Implement review thoroughness assessment

4. Build PR statistics calculation:
   - Create time-to-merge calculation
   - Implement review cycle metrics
   - Add code change volume analysis
   - Create file impact assessment
   - Implement complexity scoring

5. Add PR relationship mapping:
   - Create issue linkage detection
   - Implement related PR identification
   - Add dependent PR mapping
   - Create branch relationship mapping
   - Implement release association

Reference the DATABASE_SCHEMA.md document for merge request data structure and DATA_PIPELINE_ARCHITECTURE.md for processing requirements. The stage should extract comprehensive PR data and calculate derived metrics for analysis.
```

#### Prompt for Task 1.5.5: Data Storage & Persistence
```
Implement the Data Storage & Persistence system for the GitHub Analytics data pipeline. Create:

1. Create database transaction management:
   - Implement transaction wrapper
   - Add session management
   - Create rollback handlers
   - Implement transaction isolation settings
   - Add transaction logging

2. Implement bulk upsert operations:
   - Create efficient bulk insert methods
   - Add update-or-insert logic
   - Implement chunking for large datasets
   - Create progress tracking for long operations
   - Add performance monitoring

3. Add conflict resolution strategies:
   - Implement last-write-wins policy
   - Create merge-based resolution
   - Add conflict logging
   - Implement manual resolution flagging
   - Create data version tracking

4. Build data validation before storage:
   - Create schema validation
   - Implement foreign key verification
   - Add data integrity checks
   - Create constraint validation
   - Implement type conversion and checking

5. Add persistence monitoring and alerting:
   - Create storage operation logging
   - Implement performance metrics
   - Add space utilization monitoring
   - Create error rate tracking
   - Implement alert thresholds

Reference the DATABASE_SCHEMA.md document for data structure and DATA_PIPELINE_ARCHITECTURE.md for storage requirements. The implementation should ensure data integrity while optimizing for bulk operations and handling conflicts gracefully.
```

#### Prompt for Task 1.5.6: Pipeline Scheduling & Control
```
Implement the Pipeline Scheduling & Control system for the GitHub Analytics data pipeline. Create:

1. Implement cron-based scheduling:
   - Create scheduler configuration
   - Add cron expression parsing
   - Implement timezone handling
   - Create schedule management API
   - Add schedule override capabilities

2. Create manual pipeline trigger endpoints:
   - Implement REST API for triggers
   - Add authentication and authorization
   - Create parameter validation
   - Implement immediate execution option
   - Add confirmation and validation steps

3. Add pipeline monitoring:
   - Create real-time status tracking
   - Implement progress reporting
   - Add execution history logging
   - Create performance metrics collection
   - Implement resource utilization tracking

4. Build notification system for pipeline events:
   - Create event types for pipeline stages
   - Implement notification channels (email, webhook)
   - Add notification templates
   - Create notification preferences
   - Implement critical alert escalation

5. Add pipeline control API:
   - Create pause/resume functionality
   - Implement cancel operation
   - Add priority adjustment
   - Create stage skipping controls
   - Implement forced reprocessing options

Reference the DATA_PIPELINE_ARCHITECTURE.md document for pipeline control requirements. The implementation should provide both automated scheduling and manual control options with appropriate monitoring and notification capabilities.
```

#### Prompt for Task 1.5.7: Error Recovery & Resilience
```
Implement Error Recovery & Resilience features for the GitHub Analytics data pipeline. Create:

1. Implement checkpoint system:
   - Create stage checkpointing
   - Add checkpoint persistence
   - Implement checkpoint validation
   - Create checkpoint management API
   - Add automatic checkpoint intervals

2. Create rollback mechanisms:
   - Implement transaction rollback
   - Add stage output rollback
   - Create database state restoration
   - Implement version-based rollback
   - Add partial rollback capabilities

3. Add partial success handling:
   - Create item-level success tracking
   - Implement continue-on-error options
   - Add error aggregation and reporting
   - Create threshold-based pipeline control
   - Implement data quality scoring

4. Build retry logic for failed stages:
   - Create automatic retry system
   - Implement exponential backoff
   - Add retry limits configuration
   - Create selective retry capability
   - Implement retry prioritization

5. Implement pipeline resilience features:
   - Create dispatcher redundancy
   - Add worker pool management
   - Implement resource monitoring
   - Create failover mechanisms
   - Add self-healing capabilities

Reference the DATA_PIPELINE_ARCHITECTURE.md document for resilience requirements. The implementation should ensure the pipeline can recover from failures and continue processing with minimal manual intervention.
```

### Story 1.6: Next.js Core UI Components

#### Prompt for Task 1.6.1: Layout Component Foundation
```
Implement the Layout Component Foundation for the GitHub Analytics Next.js application. Create:

1. Create base layout component:
   - Implement RootLayout with metadata
   - Add document structure with HTML and body
   - Create context providers wrapper
   - Implement Suspense boundaries
   - Add error boundaries

2. Implement responsive container:
   - Create responsive container component
   - Add max-width constraints
   - Implement padding and margin system
   - Create grid layout options
   - Add responsive breakpoint handling

3. Add page transitions:
   - Implement smooth page transitions
   - Create loading state indicators
   - Add exit/enter animations
   - Implement route-specific transitions
   - Create transition context provider

4. Build layout variants:
   - Create full-width layout
   - Implement sidebar layout with collapsible nav
   - Add centered content layout
   - Create dashboard grid layout
   - Implement split view layout

5. Create layout composition utilities:
   - Implement nested layout support
   - Add layout switching utilities
   - Create layout persistence between routes
   - Implement layout context sharing
   - Add layout configuration system

Reference the DESIGN_GUIDELINES.md document for layout specifications and NEXT_JS_ARCHITECTURE.md for component structure. The layout system should be flexible, maintainable, and consistent across the application.
```

#### Prompt for Task 1.6.2: Navigation System
```
Implement the Navigation System for the GitHub Analytics Next.js application. Create:

1. Create responsive navigation bar:
   - Implement primary navigation component
   - Add responsive layout adjustments
   - Create brand/logo section
   - Implement search integration
   - Add user profile section

2. Implement mobile navigation menu:
   - Create mobile drawer component
   - Add hamburger toggle button
   - Implement slide-in animation
   - Create backdrop overlay
   - Add touch gesture support

3. Add active route highlighting:
   - Implement current route detection
   - Create visual indicators for active items
   - Add parent route highlighting
   - Implement breadcrumb integration
   - Create route history tracking

4. Build navigation items configuration:
   - Create navigation item interface
   - Implement hierarchical menu structure
   - Add permission-based visibility
   - Create dynamic item generation
   - Implement item grouping and separation

5. Add navigation features:
   - Create keyboard navigation support
   - Implement search filtering
   - Add recently visited shortcuts
   - Create favorite/pin functionality
   - Implement navigation history

Reference the DESIGN_GUIDELINES.md document for navigation specifications and NEXT_JS_ARCHITECTURE.md for component requirements. The navigation system should be intuitive, accessible, and adaptable to different screen sizes.
```

#### Prompt for Task 1.6.3: Data Display Components
```
Implement Data Display Components for the GitHub Analytics Next.js application. Create:

1. Create card components:
   - Implement base Card component
   - Add variants (elevated, outlined, filled)
   - Create card header/body/footer sections
   - Implement card actions area
   - Add loading state for data fetching

2. Implement data grid/table:
   - Create responsive data table
   - Add sorting and filtering capabilities
   - Implement pagination controls
   - Create row selection functionality
   - Add expandable row details

3. Add loading skeleton components:
   - Implement skeleton loader system
   - Create text, card, and avatar skeletons
   - Add skeleton animation options
   - Implement content-aware skeletons
   - Create skeleton screen patterns

4. Build error state components:
   - Implement error message display
   - Create retry action button
   - Add error details expansion
   - Implement fallback content option
   - Create error boundary integration

5. Add data visualization components:
   - Implement stat card with trend
   - Create metric comparison display
   - Add progress indicator components
   - Implement data spotlight component
   - Create data badge and pill components

Reference the DESIGN_GUIDELINES.md document for component specifications and UI patterns. The components should provide consistent data display patterns throughout the application with appropriate loading and error states.
```

#### Prompt for Task 1.6.4: Chart & Visualization Components
```
Implement Chart & Visualization Components for the GitHub Analytics Next.js application. Create:

1. Implement bar chart component:
   - Create responsive bar chart
   - Add horizontal and vertical options
   - Implement stacked and grouped variants
   - Create animated transitions
   - Add interactive tooltips and legends

2. Create line chart component:
   - Implement responsive line chart
   - Add area fill option
   - Create multi-series support
   - Implement zoom and pan interactions
   - Add date range selection

3. Add pie/donut chart:
   - Create responsive pie/donut chart
   - Implement slice selection
   - Add percentage and value display
   - Create legend with filtering
   - Implement animation options

4. Build heatmap visualization:
   - Create contribution-style heatmap
   - Implement time-based heat mapping
   - Add color scale configuration
   - Create tooltip with details
   - Implement zoom for detailed view

5. Add advanced visualization options:
   - Create radar/spider chart
   - Implement sankey diagram
   - Add tree/hierarchy visualization
   - Create network graph component
   - Implement geographic visualization

Reference the DESIGN_GUIDELINES.md document for visualization specifications and data representation requirements. Use Recharts or another charting library that's compatible with the project's needs, ensuring all visualizations are responsive and interactive.
```

#### Prompt for Task 1.6.5: Interactive Components
```
Implement Interactive Components for the GitHub Analytics Next.js application. Create:

1. Create form components:
   - Implement text input with validation
   - Add select dropdown with search
   - Create checkbox and radio components
   - Implement date picker component
   - Add file upload with preview

2. Implement modal dialog system:
   - Create modal component with backdrop
   - Add different sizes and positions
   - Implement stacked modals handling
   - Create confirmation dialog pattern
   - Add drawer variant for mobile

3. Add toast notification component:
   - Implement toast notification system
   - Create different toast types (success, error)
   - Add custom duration and dismissal
   - Implement stacked notifications handling
   - Create action buttons in toasts

4. Build tooltip and popover components:
   - Create tooltip with different positions
   - Implement rich content popovers
   - Add hover and click triggers
   - Create delay and animation options
   - Implement accessibility features

5. Add interactive data components:
   - Create collapsible sections
   - Implement tabs and tab panels
   - Add accordion component
   - Create card carousel/slider
   - Implement drag-and-drop sorting

Reference the DESIGN_GUIDELINES.md document for component specifications and interaction patterns. All components should be fully accessible according to WCAG standards and provide consistent interaction patterns throughout the application.
```

#### Prompt for Task 1.6.6: Theming System
```
Implement the Theming System for the GitHub Analytics Next.js application. Create:

1. Implement theme provider:
   - Create ThemeProvider component using next-themes
   - Add theme context and hooks
   - Implement nested theme support
   - Create theme application to components
   - Add theme initialization and defaults

2. Create dark/light mode toggle:
   - Implement theme toggle component
   - Add smooth transition animation
   - Create icon indicators for modes
   - Implement keyboard shortcut support
   - Add system preference detection

3. Add theme persistence:
   - Create local storage persistence
   - Implement user preference saving
   - Add theme restore on load
   - Create server-side rendering support
   - Implement theme synchronization across tabs

4. Build theme customization utilities:
   - Create theme configuration interface
   - Implement color palette generators
   - Add theme preview capability
   - Create theme export/import
   - Implement theme sharing functionality

5. Implement component theming system:
   - Create component-specific theme options
   - Add variant support through themes
   - Implement theme composition
   - Create theme overrides at component level
   - Add dynamic theme application

Reference the DESIGN_GUIDELINES.md document for theme specifications and color requirements. The theming system should provide a consistent look and feel across the application with seamless switching between light and dark modes.
```

### Story 1.7: Next.js Direct Supabase Data Fetching Patterns

#### Prompt for Task 1.7.1: Security Foundation
```
Implement the Security Foundation for direct Supabase data access in the GitHub Analytics Next.js application. Create:

1. Set up Row Level Security policies in Supabase:
   - Implement RLS for all database tables
   - Create role-based access policies
   - Add data ownership restrictions
   - Implement time-based access controls
   - Create read/write permission separation

2. Implement JWT token management:
   - Create token storage and retrieval
   - Add token refresh mechanisms
   - Implement expiration handling
   - Create token validation utilities
   - Add secure token transmission

3. Create secure database access utilities:
   - Implement service role vs anon role usage
   - Add parameter sanitization
   - Create input validation helpers
   - Implement query construction utilities
   - Add secure error handling

4. Add input sanitization helpers:
   - Create string sanitization utilities
   - Implement SQL injection prevention
   - Add type validation and coercion
   - Create schema validation with Zod
   - Implement boundary checking for values

5. Implement access control system:
   - Create permission-based access control
   - Add role hierarchy implementation
   - Implement feature flagging system
   - Create audit logging for access
   - Add access denial handling

Reference the SUPABASE_INTEGRATION.md document for security requirements and DATABASE_SCHEMA.md for data access patterns. The implementation should ensure secure data access while providing appropriate error feedback and preventing unauthorized access.
```

#### Prompt for Task 1.7.2: Server Component Data Fetching
```
Implement Server Component Data Fetching patterns for Supabase in the GitHub Analytics Next.js application. Create:

1. Create server-side fetching patterns:
   - Implement createServerComponentClient usage
   - Add cookie-based auth handling
   - Create reusable fetch utilities
   - Implement request deduplication
   - Add edge runtime optimization

2. Implement error handling for server components:
   - Create error boundary integration
   - Add graceful fallbacks for data failures
   - Implement error classification
   - Create user-friendly error messages
   - Add error logging and monitoring

3. Add data transformation utilities:
   - Create response normalization
   - Implement data modeling and mapping
   - Add computed property generation
   - Create data enrichment utilities
   - Implement view model transformation

4. Build server-side pagination:
   - Implement efficient pagination queries
   - Create cursor-based pagination
   - Add page size optimization
   - Implement total count fetching
   - Create pagination metadata handling

5. Add advanced server fetching features:
   - Implement parallel data fetching
   - Create request batching
   - Add conditional fetching logic
   - Implement streaming responses
   - Create resource prioritization

Reference the NEXT_JS_ARCHITECTURE.md document for server component patterns and SUPABASE_INTEGRATION.md for data fetching requirements. The implementation should leverage server components for optimal performance and SEO benefits.
```

#### Prompt for Task 1.7.3: Client Component Data Fetching
```
Implement Client Component Data Fetching patterns using React Query with Supabase in the GitHub Analytics Next.js application. Create:

1. Implement React Query integration with Supabase:
   - Create QueryClientProvider setup
   - Add default query options
   - Implement query key factories
   - Create query error handling
   - Add devtools configuration

2. Create custom query hooks:
   - Implement useRepositories hook
   - Add useContributors hook
   - Create useMergeRequests hook
   - Implement useCommits hook
   - Add analytics query hooks

3. Add optimistic updates pattern:
   - Create mutation optimistic update utilities
   - Implement rollback on error
   - Add optimistic rendering helpers
   - Create toast integration for updates
   - Implement loading state handling

4. Build client-side caching strategy:
   - Implement cache time configuration
   - Add stale time optimization
   - Create cache invalidation utilities
   - Implement prefetching strategy
   - Add cache persistence options

5. Create mutation utilities:
   - Implement useMutation wrappers
   - Add mutation error handling
   - Create success action utilities
   - Implement form integration helpers
   - Add batch mutation support

Reference the NEXT_JS_ARCHITECTURE.md document for client component patterns and SUPABASE_INTEGRATION.md for React Query integration. The implementation should provide a smooth user experience with optimistic updates and proper loading states.
```

#### Prompt for Task 1.7.4: Advanced Data Fetching Patterns
```
Implement Advanced Data Fetching Patterns for Supabase in the GitHub Analytics Next.js application. Create:

1. Implement infinite scrolling with Supabase:
   - Create useInfiniteQuery integration
   - Add cursor-based pagination
   - Implement scroll position restoration
   - Create loading indicator components
   - Add dynamic fetch threshold adjustment

2. Create real-time subscription patterns:
   - Implement Supabase real-time subscriptions
   - Add subscription management hooks
   - Create data merging strategies
   - Implement optimistic subscription updates
   - Add subscription error recovery

3. Add polling strategies:
   - Create configurable polling intervals
   - Implement background/foreground detection
   - Add polling backoff for errors
   - Create manual polling triggers
   - Implement polling coordination

4. Build prefetching utilities:
   - Create route-based prefetching
   - Implement hover intent prefetching
   - Add priority-based prefetch queue
   - Create prefetch cache configuration
   - Implement partial data prefetching

5. Add parallel data loading:
   - Create parallel query execution
   - Implement query batching
   - Add query dependency chain
   - Create waterfall prevention utilities
   - Implement loading state aggregation

Reference the NEXT_JS_ARCHITECTURE.md document for advanced fetching patterns and SUPABASE_INTEGRATION.md for real-time capabilities. The implementation should optimize the user experience with advanced loading patterns while maintaining performance.
```

#### Prompt for Task 1.7.5: Performance Optimization
```
Implement Performance Optimizations for Supabase data fetching in the GitHub Analytics Next.js application. Create:

1. Implement query result normalization:
   - Create normalized data structures
   - Add entity relationship mapping
   - Implement denormalization for views
   - Create efficient update patterns
   - Add normalization utilities

2. Create query deduplication:
   - Implement request deduplication
   - Add identical query detection
   - Create query hash generation
   - Implement request batching
   - Add parallel request limiting

3. Add selective column fetching:
   - Create column selection utilities
   - Implement minimal data fetching
   - Add dynamic column selection
   - Create view-based column sets
   - Implement custom select builders

4. Build query parameter optimization:
   - Create efficient filter construction
   - Implement indexed query planning
   - Add query plan analysis
   - Create query hint system
   - Implement query execution metrics

5. Add advanced caching strategies:
   - Create tiered caching system
   - Implement partial query caching
   - Add stale-while-revalidate pattern
   - Create cache warming strategies
   - Implement cache analysis and optimization

Reference the SUPABASE_INTEGRATION.md document for database optimization and NEXT_JS_ARCHITECTURE.md for Next.js performance patterns. The implementation should maximize performance while minimizing database load and bandwidth usage.
```

## End-to-End Testing Prompts

### Prompt for Task 1.8.1: Data Pipeline Integration Testing
```
Implement comprehensive integration tests for the GitHub Analytics data pipeline. Create:

1. Set up testing framework:
   - Configure Jest/Vitest for testing
   - Add test database configuration
   - Implement test utilities and helpers
   - Create GitHub API mocks
   - Add test data fixtures

2. Create pipeline stage tests:
   - Implement repository stage tests
   - Add contributor stage tests
   - Create merge request stage tests
   - Implement commit stage tests
   - Add data enrichment stage tests

3. Test error handling and recovery:
   - Create API error simulation
   - Implement rate limit testing
   - Add database error handling tests
   - Create pipeline recovery testing
   - Implement partial failure scenarios

4. Add end-to-end pipeline tests:
   - Create full pipeline execution tests
   - Implement staging environment tests
   - Add performance benchmark tests
   - Create data validation tests
   - Implement smoke tests for production

5. Set up CI/CD integration:
   - Configure GitHub Actions for testing
   - Add test coverage reporting
   - Implement deployment gate tests
   - Create regression test suite
   - Add automated test runs

The tests should cover both success and error paths, with appropriate mocking of external dependencies like the GitHub API to prevent hitting real endpoints during tests.
```

### Prompt for Task 1.8.2: Frontend Hook Testing
```
Implement comprehensive tests for React Query and Supabase hooks in the GitHub Analytics application. Create:

1. Set up testing environment:
   - Configure testing library
   - Add mock service worker for API
   - Implement Supabase mocking
   - Create test providers wrapper
   - Add test utilities and helpers

2. Test base query hooks:
   - Create useSupabaseQuery tests
   - Implement usePagination tests
   - Add useInfiniteLoad tests
   - Test useRealtimeSubscription
   - Implement useOptimisticMutation tests

3. Test loading and error states:
   - Create loading state tests
   - Implement error handling tests
   - Add retry functionality testing
   - Create timeout scenario tests
   - Implement fallback behavior tests

4. Test data transformations:
   - Create data mapping tests
   - Implement normalization tests
   - Add data validation tests
   - Test computed property generation
   - Implement transformation chain tests

5. Test specific domain hooks:
   - Create repository hook tests
   - Implement contributor hook tests
   - Add merge request hook tests
   - Test commit data hooks
   - Implement analytics hook tests

The tests should verify correct behavior in all states (loading, error, success) and ensure proper integration with Supabase and React Query.
```

With these detailed prompts, the team can track progress on each task and provide specific instructions to AI tools or developers implementing the functionality.
