
# Epic 1: Foundation & Infrastructure

This epic focuses on establishing the core foundation for the rebuilt GitHub Explorer application with Next.js, Node.js, and Supabase. It includes setting up the projects, establishing database connectivity, implementing GitHub API integration, and creating the essential infrastructure components.

## Goals

- Set up Next.js frontend project with proper configuration
- Create Node.js server with Express and TypeScript for pipeline processing
- Establish direct connectivity from Next.js to the existing Supabase database
- Implement GitHub API integration in the Node.js server
- Create data pipeline architecture for processing GitHub data
- Develop core UI components and layouts for the Next.js application

## User Stories

### Story 1.1: Next.js Project Setup

**Description**: Set up a new Next.js project with TypeScript, Tailwind CSS, and Shadcn UI.

**Tasks**:
- **Task 1.1.1: Core Project Setup**
  - Create new Next.js project with TypeScript
  - Configure directory structure (pages, components, hooks, utils, etc.)
  - Set up basic .gitignore and README
  - Estimated effort: 2-3 hours

- **Task 1.1.2: Styling & UI Foundation**
  - Install and configure Tailwind CSS
  - Set up tailwind.config.js with proper color scheme
  - Implement custom theme variables
  - Estimated effort: 2-3 hours

- **Task 1.1.3: Development Environment**
  - Configure ESLint with appropriate rules
  - Set up Prettier for code formatting
  - Add VS Code settings for the project
  - Configure environment variables (.env files)
  - Estimated effort: 2-3 hours

- **Task 1.1.4: UI Framework Integration**
  - Install Shadcn UI components
  - Set up component theming
  - Create theme provider with dark/light mode
  - Implement ThemeToggle component
  - Estimated effort: 3-4 hours

- **Task 1.1.5: Responsive Base Layout**
  - Create responsive layout component
  - Implement mobile breakpoint handlers
  - Set up navigation container
  - Create global error boundary
  - Estimated effort: 4-5 hours

**Implementation Details**:
- Use the latest Next.js version (14+) with the App Router
- Implement both server and client components
- Set up project structure following Next.js best practices
- Create TypeScript interfaces that align with the database schema
- Configure Tailwind CSS with the design system from the Design Guidelines
- Set up dark mode support using next-themes

**API Example**:
```typescript
// Example Next.js app layout (app/layout.tsx)
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GitHub Explorer',
  description: 'Explore GitHub repositories, contributors, and activity',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Acceptance Criteria**:
- Next.js project is successfully created with TypeScript
- Tailwind CSS and Shadcn UI are properly configured
- The application compiles without errors
- Base layout renders correctly
- Environment variables are properly set up
- Dark mode works as expected
- The project structure follows Next.js best practices

**Estimated Effort**: Medium (2-3 days)
**Dependencies**: None (this is the foundation story)

---

### Story 1.2: Node.js Pipeline Server Setup

**Description**: Create a minimal Node.js server application with Express and TypeScript to handle data processing pipeline tasks.

**Tasks**:
- **Task 1.2.1: Server Project Initialization**
  - Set up Node.js project with TypeScript
  - Configure tsconfig.json for backend needs
  - Install core dependencies (express, cors, etc.)
  - Create basic server entry point
  - Estimated effort: 2-3 hours

- **Task 1.2.2: API Foundation**
  - Implement basic Express middleware setup
  - Create route structure with controllers pattern
  - Set up health check endpoint
  - Add request validation middleware
  - Estimated effort: 3-4 hours

- **Task 1.2.3: Error Handling System**
  - Implement global error handler middleware
  - Create custom error classes
  - Set up error logging mechanism
  - Implement centralized error response format
  - Estimated effort: 3-4 hours

- **Task 1.2.4: Logging Infrastructure**
  - Install and configure structured logging (Winston/Pino)
  - Implement request ID tracking
  - Create logging middleware
  - Set up different log levels for environments
  - Estimated effort: 2-3 hours

- **Task 1.2.5: Deployment Configuration**
  - Create production build process
  - Configure environment variables for deployment
  - Set up deployment scripts
  - Create CI pipeline configuration
  - Estimated effort: 3-4 hours

**Implementation Details**:
- Use Express for a minimal web server framework
- Set up TypeScript configuration with strict type checking
- Create a focused folder organization (routes, processors, utils)
- Implement error handling middleware
- Use Winston or Pino for structured logging
- Configure dotenv for environment variables
- Structure for deployment on Heroku

**API Example**:
```typescript
// Example Express server setup (server/src/index.ts)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { pipelineRoutes } from './routes/pipeline';
import { logger } from './utils/logger';

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.use('/pipeline', pipelineRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Pipeline server running on port ${port}`);
});
```

**Acceptance Criteria**:
- Node.js server with Express is set up and running
- TypeScript is properly configured
- Basic API routes for pipeline triggers are established
- Error handling middleware is in place
- Logging is properly implemented
- Health check endpoint returns 200 status code
- Server can be deployed to Heroku

**Estimated Effort**: Medium (2-3 days)
**Dependencies**: None (this is a foundation story)

---

### Story 1.3: Supabase Direct Integration with Next.js

**Description**: Establish direct connection to the existing Supabase database from the Next.js frontend.

**Tasks**:
- **Task 1.3.1: Supabase Client Setup**
  - Install Supabase client libraries
  - Configure environment variables for Supabase
  - Create client initialization utilities
  - Implement client singleton pattern
  - Estimated effort: 2-3 hours

- **Task 1.3.2: TypeScript Database Types**
  - Generate TypeScript types from database schema
  - Create type utilities for database operations
  - Set up type guards for database responses
  - Implement interface extensions for application needs
  - Estimated effort: 3-4 hours

- **Task 1.3.3: Authentication Foundation**
  - Implement sign in functionality
  - Create signup flow
  - Add password reset capability
  - Implement authentication state management
  - Estimated effort: 5-6 hours

- **Task 1.3.4: Protected Routes**
  - Create authentication middleware
  - Implement route guards
  - Set up redirect logic for unauthenticated users
  - Add session persistence
  - Estimated effort: 3-4 hours

- **Task 1.3.5: Data Access Hooks** 
  - Create base query hook patterns
  - Implement React Query integration
  - Add error handling utilities
  - Create loading state handlers
  - Estimated effort: 4-5 hours

**Implementation Details**:
- Use the official Supabase client libraries
- Create custom hooks for React Query integration
- Implement both Server Component and Client Component data fetching patterns
- Generate TypeScript types from the database schema
- Create utility functions for common database operations
- Implement proper error handling for database operations

**API Example**:
```typescript
// Example Next.js Supabase client setup
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

export const createClient = () => {
  return createClientComponentClient<Database>()
}

// Example React Query hook for repositories data
// hooks/use-repositories.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export function useRepositories({
  page = 1,
  limit = 10,
} = {}) {
  return useQuery({
    queryKey: ['repositories', { page, limit }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .range((page - 1) * limit, page * limit - 1)
      
      if (error) throw error
      
      return data
    }
  })
}

// Example Server Component data fetching
// app/repositories/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export default async function RepositoriesPage() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
  const { data: repositories } = await supabase
    .from('repositories')
    .select('*')
    .limit(10)
  
  return (
    <div>
      <h1>Repositories</h1>
      {/* Render repositories */}
    </div>
  )
}
```

**Acceptance Criteria**:
- Next.js application can directly connect to the Supabase database
- All database tables can be accessed without errors
- TypeScript types reflect the database schema
- Authentication works with Supabase Auth
- Server Components can fetch data from Supabase
- Client Components can fetch data with React Query
- Database operations are properly typed
- Error handling is comprehensive

**Estimated Effort**: Medium (3-4 days)
**Dependencies**: Story 1.1 (Next.js Project Setup)

---

### Story 1.4: GitHub API Integration in Node.js Server

**Description**: Implement GitHub API integration in the Node.js server for pipeline data processing.

**Tasks**:
- **Task 1.4.1: GitHub API Client Foundation**
  - Install and configure Octokit
  - Create client wrapper class
  - Set up authentication with GitHub API
  - Implement basic request methods
  - Estimated effort: 3-4 hours

- **Task 1.4.2: Repository Data Service**
  - Create methods for fetching repository details
  - Implement repository statistics collection
  - Add repository contributor listing
  - Build repository activity tracking
  - Estimated effort: 4-5 hours

- **Task 1.4.3: Contributor Data Service**
  - Implement contributor profile fetching
  - Create contributor statistics methods
  - Add organization membership retrieval
  - Build contributor activity timeline collection
  - Estimated effort: 4-5 hours

- **Task 1.4.4: Merge Request Data Service**
  - Create pull request listing functionality
  - Implement PR details retrieval
  - Add PR comment and review fetching
  - Build PR statistics collection
  - Estimated effort: 4-5 hours

- **Task 1.4.5: Rate Limiting & Resilience**
  - Implement token rotation for rate limits
  - Create exponential backoff mechanism
  - Add request batching for efficiency
  - Implement circuit breaker pattern
  - Set up request caching
  - Estimated effort: 5-6 hours

**Implementation Details**:
- Use the Octokit library for GitHub API integration
- Implement token-based authentication with GitHub
- Create utility functions for handling rate limits
- Set up retries with exponential backoff for transient errors
- Create focused service classes for different GitHub data types
- Implement proper error handling and logging

**API Example**:
```typescript
// Example GitHub API service (server/src/services/github.ts)
import { Octokit } from '@octokit/rest'
import { retry } from '@octokit/plugin-retry'
import { throttling } from '@octokit/plugin-throttling'
import { logger } from '../utils/logger'

const MyOctokit = Octokit.plugin(retry, throttling)

export class GitHubService {
  private octokit: InstanceType<typeof MyOctokit>

  constructor() {
    this.octokit = new MyOctokit({
      auth: process.env.GITHUB_TOKEN,
      throttle: {
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
          logger.warn(
            `Request quota exhausted for request ${options.method} ${options.url}`
          )

          if (retryCount < 3) {
            logger.info(`Retrying after ${retryAfter} seconds!`)
            return true
          }
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
          logger.warn(
            `Secondary rate limit triggered for request ${options.method} ${options.url}`
          )
          return true
        },
      },
    })
  }

  async getRepository(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      })
      return data
    } catch (error) {
      logger.error('Error fetching repository', { error, owner, repo })
      throw error
    }
  }

  // Additional methods for other GitHub data...
}
```

**Acceptance Criteria**:
- GitHub API integration is functioning correctly
- Authentication with GitHub API works as expected
- Rate limiting is properly handled
- Retries are implemented for transient errors
- All required data collection services are implemented
- Retrieved data can be properly formatted for database storage
- Error handling is comprehensive
- Integration works within the pipeline process

**Estimated Effort**: Large (4-5 days)
**Dependencies**: Story 1.2 (Node.js Pipeline Server Setup)

---

### Story 1.5: Data Pipeline Architecture

**Description**: Design and implement a streamlined data pipeline architecture for processing GitHub data in the Node.js server.

**Tasks**:
- **Task 1.5.1: Pipeline Core Architecture**
  - Design pipeline stages and interfaces
  - Create pipeline executor
  - Implement pipeline context
  - Build stage sequencing mechanism
  - Estimated effort: 5-6 hours

- **Task 1.5.2: Repository Processing Stage**
  - Implement repository metadata extraction
  - Create repository statistics calculation
  - Add repository status determination
  - Build repository enrichment process
  - Estimated effort: 4-5 hours

- **Task 1.5.3: Contributor Processing Stage**
  - Create contributor identification process
  - Implement contributor profile enrichment
  - Add contributor statistics calculation
  - Build contributor-repository relationship mapping
  - Estimated effort: 4-5 hours

- **Task 1.5.4: Merge Request Processing Stage**
  - Implement PR data extraction and normalization
  - Create PR status tracking
  - Add PR review data processing
  - Build PR statistics calculation
  - Estimated effort: 4-5 hours

- **Task 1.5.5: Data Storage & Persistence**
  - Create database transaction management
  - Implement bulk upsert operations
  - Add conflict resolution strategies
  - Build data validation before storage
  - Estimated effort: 3-4 hours

- **Task.1.5.6: Pipeline Scheduling & Control**
  - Implement cron-based scheduling
  - Create manual pipeline trigger endpoints
  - Add pipeline monitoring
  - Build notification system for pipeline events
  - Estimated effort: 4-5 hours

- **Task 1.5.7: Error Recovery & Resilience**
  - Implement checkpoint system
  - Create rollback mechanisms
  - Add partial success handling
  - Build retry logic for failed stages
  - Estimated effort: 5-6 hours

**Implementation Details**:
- Create a modular pipeline with distinct processing stages
- Implement batch processing to handle large datasets
- Create data enrichment modules for each entity type
- Use a simple scheduling mechanism for periodic execution
- Implement logging and progress tracking
- Create recovery mechanisms for failed pipeline runs
- Support manual triggering via API endpoints

**API Example**:
```typescript
// Example pipeline coordinator (server/src/pipeline/coordinator.ts)
import { logger } from '../utils/logger'
import { GitHubService } from '../services/github'
import { SupabaseService } from '../services/supabase'
import { processRepositories } from './processors/repositories'
import { processContributors } from './processors/contributors'
import { processMergeRequests } from './processors/mergeRequests'

export async function runPipeline(repositories: string[]) {
  logger.info('Starting pipeline', { repositories })
  const github = new GitHubService()
  const supabase = new SupabaseService()
  
  try {
    // Step 1: Fetch and process repositories
    logger.info('Step 1: Processing repositories')
    const repoData = await processRepositories(github, repositories)
    await supabase.upsertRepositories(repoData)
    
    // Step 2: Process contributors
    logger.info('Step 2: Processing contributors')
    const contributorData = await processContributors(github, repositories)
    await supabase.upsertContributors(contributorData)
    
    // Step 3: Process merge requests
    logger.info('Step 3: Processing merge requests')
    const mrData = await processMergeRequests(github, repositories)
    await supabase.upsertMergeRequests(mrData)
    
    logger.info('Pipeline completed successfully')
    return { success: true }
  } catch (error) {
    logger.error('Pipeline failed', { error })
    return { success: false, error }
  }
}
```

**Acceptance Criteria**:
- Data pipeline architecture is implemented
- Pipeline stages are properly defined
- Batch processing works correctly
- Data is correctly stored in Supabase
- Scheduling system can run the pipeline automatically
- Progress tracking provides visibility into pipeline execution
- Error recovery handles failures gracefully
- Manual triggering via API endpoints works correctly

**Estimated Effort**: Large (5-6 days)
**Dependencies**: Story 1.2 (Node.js Pipeline Server Setup), Story 1.4 (GitHub API Integration)

---

### Story 1.6: Next.js Core UI Components

**Description**: Create the core UI components for the Next.js application, including layout, navigation, and reusable UI elements.

**Tasks**:
- **Task 1.6.1: Layout Component Foundation**
  - Create base layout component
  - Implement responsive container
  - Add page transitions
  - Build layout variants (full, sidebar, centered)
  - Estimated effort: 3-4 hours

- **Task 1.6.2: Navigation System**
  - Create responsive navigation bar
  - Implement mobile navigation menu
  - Add active route highlighting
  - Build navigation items configuration
  - Estimated effort: 4-5 hours

- **Task 1.6.3: Data Display Components**
  - Create card components
  - Implement data grid/table
  - Add loading skeleton components
  - Build error state components
  - Estimated effort: 4-5 hours

- **Task 1.6.4: Chart & Visualization Components**
  - Implement bar chart component
  - Create line chart component
  - Add pie/donut chart
  - Build heatmap visualization
  - Estimated effort: 5-6 hours

- **Task 1.6.5: Interactive Components**
  - Create form components (inputs, selects, etc.)
  - Implement modal dialog system
  - Add toast notification component
  - Build tooltip and popover components
  - Estimated effort: 4-5 hours

- **Task 1.6.6: Theming System**
  - Implement theme provider
  - Create dark/light mode toggle
  - Add theme persistence
  - Build theme customization utilities
  - Estimated effort: 3-4 hours

**Implementation Details**:
- Use Shadcn UI as the foundation for UI components
- Implement responsive design with Tailwind CSS
  - Create mobile, tablet, and desktop layouts
  - Use Tailwind's responsive modifiers consistently
- Create layout components with proper metadata
- Implement navigation components with active states
- Create data display components for consistent UI
- Implement loading skeletons for data fetching states
- Create error handling components for failed requests
- Add toast notifications for user feedback
- Implement theme switching with next-themes

**API Example**:
```tsx
// Example Navigation component (components/navigation.tsx)
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'

const navigationLinks = [
  { href: '/', label: 'Home' },
  { href: '/repositories', label: 'Repositories' },
  { href: '/contributors', label: 'Contributors' },
  { href: '/merge-requests', label: 'Merge Requests' },
  { href: '/commits', label: 'Commits' },
  { href: '/admin', label: 'Admin' },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">GitHub Explorer</span>
          </Link>
        </div>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigationLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
        
        {/* Mobile menu button */}
        <div className="flex items-center md:hidden space-x-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>
      
      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="container md:hidden py-4">
          <nav className="flex flex-col space-y-4">
            {navigationLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href ? 'text-foreground' : 'text-muted-foreground'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
```

**Acceptance Criteria**:
- Core UI components are implemented
- Layout works responsively on different screen sizes
- Navigation menu functions correctly
- Card components display data properly
- Data visualization components render correctly
- Loading states provide feedback during data fetching
- Error states handle failures gracefully
- Form components validate input properly
- Toast notifications provide feedback to users
- Theme toggle switches between light and dark modes

**Estimated Effort**: Medium (3-4 days)
**Dependencies**: Story 1.1 (Next.js Project Setup)

---

### Story 1.7: Next.js Direct Supabase Data Fetching Patterns

**Description**: Implement secure and efficient data fetching patterns in the Next.js application that directly access Supabase.

**Tasks**:
- **Task 1.7.1: Security Foundation**
  - Set up Row Level Security policies in Supabase
  - Implement JWT token management
  - Create secure database access utilities
  - Add input sanitization helpers
  - Estimated effort: 4-5 hours

- **Task 1.7.2: Server Component Data Fetching**
  - Create server-side fetching patterns
  - Implement error handling for server components
  - Add data transformation utilities
  - Build server-side pagination
  - Estimated effort: 3-4 hours

- **Task 1.7.3: Client Component Data Fetching**
  - Implement React Query integration with Supabase
  - Create custom query hooks
  - Add optimistic updates pattern
  - Build client-side caching strategy
  - Estimated effort: 4-5 hours

- **Task 1.7.4: Advanced Data Fetching Patterns**
  - Implement infinite scrolling with Supabase
  - Create real-time subscription patterns
  - Add polling strategies
  - Build prefetching utilities
  - Estimated effort: 4-5 hours

- **Task 1.7.5: Performance Optimization**
  - Implement query result normalization
  - Create query deduplication
  - Add selective column fetching
  - Build query parameter optimization
  - Estimated effort: 3-4 hours

**Implementation Details**:
- Use React Query for client-side data fetching and state management
- Create custom hooks for common Supabase query patterns
- Implement server components for initial data loading directly from Supabase
- Configure RLS policies to ensure secure data access
- Separate service role and anon key usage appropriately
- Create utilities for data transformation between Supabase and UI formats
- Implement error boundaries for catching and displaying errors
- Add suspense boundaries for loading states
- Create reusable pagination and infinite scrolling components

**Security Considerations**:
- Use server-side data fetching for sensitive operations
- Never expose service role keys to the client
- Implement comprehensive RLS policies for all tables
- Use the anon key for client-side operations
- Utilize JWT tokens from Supabase Auth for user-specific data
- Validate and sanitize all inputs before database operations
- Implement proper error handling to avoid leaking information

**API Example**:
```typescript
// Example React Query hook for direct Supabase access with security considerations
// hooks/use-repositories.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

interface UseRepositoriesOptions {
  page?: number
  limit?: number
  search?: string
}

export function useRepositories({
  page = 1,
  limit = 10,
  search = '',
}: UseRepositoriesOptions = {}) {
  return useQuery({
    queryKey: ['repositories', { page, limit, search }],
    queryFn: async () => {
      // Client-side uses the anon key which respects RLS policies
      let query = supabase
        .from('repositories')
        .select('*')
        .range((page - 1) * limit, page * limit - 1)
      
      if (search) {
        // Sanitize search input
        const sanitizedSearch = search.replace(/[%_]/g, '\\$&')
        query = query.ilike('name', `%${sanitizedSearch}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      return data
    },
  })
}

// Example Server Component data fetching with more privileged access
// app/repositories/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

interface RepositoryPageProps {
  params: { id: string }
}

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  // Server-side access with cookies for auth context
  const supabase = createServerComponentClient<Database>({ cookies })
  
  // Validate ID is numeric to prevent injection
  const id = parseInt(params.id)
  if (isNaN(id)) notFound()
  
  const { data: repository, error } = await supabase
    .from('repositories')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !repository) {
    console.error('Error fetching repository:', error)
    notFound()
  }
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">{repository.name}</h1>
      {/* Display repository details */}
    </div>
  )
}
```

**Acceptance Criteria**:
- Direct Supabase data fetching patterns are implemented securely
- Row Level Security policies are properly configured in Supabase
- Service role key is never exposed to the client
- React Query hooks work correctly with Supabase
- Server components fetch data from Supabase on the server
- All user inputs are properly validated and sanitized
- Error handling provides meaningful feedback without leaking sensitive info
- Loading states display during data fetching
- Data transformation utilities work correctly
- Pagination and infinite scrolling function as expected
- Reusable data fetching hooks simplify common operations
- Security best practices are followed throughout implementation

**Estimated Effort**: Medium (3-4 days)
**Dependencies**: Story 1.1 (Next.js Project Setup), Story 1.3 (Supabase Direct Integration with Next.js), Story 1.6 (Next.js Core UI Components)

---

## Dependencies

- No external dependencies beyond the technology stack

## Definition of Done

- Next.js project is set up and running
- Node.js server for pipeline processing is set up and running
- Next.js frontend can directly connect to the Supabase database
- GitHub API integration is implemented in the Node.js server
- Data pipeline architecture is designed and implemented
- Core UI components are created
- Data fetching patterns are established for direct Supabase access
- All code is properly typed with TypeScript
- Documentation is updated to reflect the architecture
