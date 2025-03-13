
# Next.js Architecture for GitHub Analytics

This document outlines the architecture of the Next.js frontend for the GitHub Analytics application.

## Overview

The GitHub Analytics frontend is built with Next.js 14+, leveraging the App Router for improved performance and developer experience. The architecture follows modern React patterns with a focus on server components for data-intensive rendering and client components for interactive elements.

**IMPORTANT: The frontend connects directly to Supabase for all data access. There is no backend API layer between the frontend and the database.**

## Project Structure

```
src/
├── app/                    # Next.js App Router directory
│   ├── api/                # API route handlers
│   ├── (auth)/             # Authentication-related routes
│   │   ├── login/
│   │   └── register/  
│   ├── repositories/       # Repository pages
│   │   └── [id]/           # Dynamic repository page
│   ├── contributors/       # Contributors pages
│   │   └── [id]/           # Dynamic contributor page
│   ├── merge-requests/     # Merge requests pages
│   │   └── [id]/           # Dynamic merge request page
│   ├── commits/            # Commits pages
│   │   └── [id]/           # Dynamic commit page
│   ├── admin/              # Admin dashboard
│   └── page.tsx            # Homepage
├── components/             # Shared components
│   ├── ui/                 # UI components (shadcn)
│   ├── home/               # Homepage components
│   ├── repository/         # Repository components
│   ├── contributors/       # Contributors components
│   ├── merge-requests/     # Merge requests components
│   ├── commits/            # Commits components
│   └── admin/              # Admin components
├── hooks/                  # Custom React hooks
│   ├── use-repositories.ts # Repository data hooks
│   ├── use-contributors.ts # Contributor data hooks
│   └── use-supabase.ts     # Supabase integration hooks
├── lib/                    # Utility libraries 
│   ├── supabase.ts         # Supabase client
│   └── utils.ts            # Helper functions
├── types/                  # TypeScript types
└── contexts/               # React contexts
    └── AuthContext.tsx     # Authentication context
```

## Key Architectural Decisions

### 1. Direct Supabase Integration

**The Next.js frontend directly queries Supabase for all data access.** This is a fundamental design decision:

- There is no API layer between the frontend and Supabase
- Both Server Components and Client Components connect to Supabase directly
- The Node.js server is only used for pipeline processing, not as an API server
- Authentication flows through Supabase Auth directly

### 2. Server Components vs. Client Components

- **Server Components** are used for:
  - Data fetching directly from Supabase
  - Initial page rendering
  - SEO-critical content
  - Static parts of the UI

- **Client Components** are used for:
  - Interactive UI elements
  - Components requiring React hooks
  - Real-time updates
  - Client-side form handling

### 3. Data Fetching Strategy

Next.js allows for multiple data fetching approaches, all connecting directly to Supabase:

1. **Server Component Data Fetching**:
   ```typescript
   // In a Server Component
   import { createServerSupabaseClient } from '@/lib/supabase';
   
   async function RepositoryPage({ params }: { params: { id: string } }) {
     const supabase = createServerSupabaseClient();
     const { data: repository, error } = await supabase
       .from('repositories')
       .select('*')
       .eq('id', params.id)
       .single();
       
     if (error) return <div>Error loading repository</div>;
     return <RepositoryDetails repository={repository} />;
   }
   ```

2. **React Query for Client Components**:
   ```typescript
   // In a Client Component
   'use client';
   
   import { useQuery } from '@tanstack/react-query';
   import { supabaseClient } from '@/lib/supabase';
   
   function RepositoryActivity({ repositoryId }: { repositoryId: string }) {
     const { data, isLoading } = useQuery({
       queryKey: ['repository-activity', repositoryId],
       queryFn: async () => {
         const { data, error } = await supabaseClient
           .from('commits')
           .select('*')
           .eq('repository_id', repositoryId)
           .order('committed_date', { ascending: false });
           
         if (error) throw error;
         return data;
       }
     });
     
     if (isLoading) return <LoadingSkeleton />;
     return <ActivityChart data={data} />;
   }
   ```

3. **Server Actions for Form Submissions**:
   ```typescript
   // In a Server Action file
   'use server';
   
   import { createServerSupabaseClient } from '@/lib/supabase';
   
   export async function updateRepository(formData: FormData) {
     const supabase = createServerSupabaseClient();
     const id = formData.get('id') as string;
     const name = formData.get('name') as string;
     
     const { error } = await supabase
       .from('repositories')
       .update({ name })
       .eq('id', id);
       
     return { success: !error };
   }
   ```

### 4. Route Structure

The application uses Next.js App Router with the following route structure:

- **/** - Homepage with overview statistics
- **/repositories** - List of all repositories
- **/repositories/[id]** - Individual repository details
- **/contributors** - List of all contributors
- **/contributors/[id]** - Individual contributor details
- **/merge-requests** - List of all merge requests
- **/merge-requests/[id]** - Individual merge request details
- **/commits** - List of all commits
- **/commits/[id]** - Individual commit details
- **/admin** - Admin dashboard for system management

### 5. Component Design

Components follow these principles:

1. **Composability**: Components are designed to be composable and reusable
2. **Single Responsibility**: Each component has a clear, focused purpose
3. **Prop Drilling Avoidance**: Context API is used for global state
4. **Separation of Concerns**: Data fetching, presentation, and business logic are separated

### 6. State Management

The application uses a combination of:

- **Server Component State**: Data fetched directly from Supabase on the server
- **React Query**: For Supabase data fetching and caching in client components
- **Context API**: For global application state like authentication
- **Component State**: For local UI state

### 7. Authentication

Authentication is managed through Supabase Auth with the following flow:

1. User signs in via Supabase Auth UI or custom forms
2. Session is stored and managed by Supabase
3. Protected routes check authentication status
4. Supabase RLS policies protect data at the database level

## Performance Optimization

The architecture implements several performance optimizations:

1. **Static Generation**: Where possible, pages are statically generated at build time
2. **Incremental Static Regeneration**: For pages that need fresh data but can benefit from caching
3. **Image Optimization**: Using Next.js Image component for optimized image loading
4. **Code Splitting**: Automatic code splitting by pages and components
5. **Prefetching**: Intelligent link prefetching for faster navigation

## Error Handling Strategy

The application implements comprehensive error handling:

1. **Error Boundaries**: Catch JavaScript errors anywhere in the component tree
2. **Loading UI**: Display loading states while data is being fetched
3. **Not Found Pages**: Custom 404 pages for resources that don't exist
4. **Error Pages**: Custom error pages for server errors

## Deployment Strategy

The Next.js application is designed to be deployed on Vercel with the following configuration:

1. **Environment Variables**: Securely stored in Vercel project settings
2. **Preview Deployments**: Automatic preview deployments for pull requests
3. **Edge Functions**: For functions that need to run close to users
4. **Analytics**: Vercel Analytics for performance monitoring

## Integration with Node.js Server

The Next.js application does NOT use the Node.js server for data access. The Node.js server's sole purpose is to:

1. Run the data pipeline processes
2. Process GitHub API data
3. Update the Supabase database

The Node.js server is deployed separately on Heroku and is not a dependency for the frontend's normal operation.

## Direct Supabase Database Access

All data access from the frontend goes directly to Supabase:

1. **Server Components**: Use `createServerSupabaseClient()` for direct database access
2. **Client Components**: Use `supabaseClient` for client-side database access
3. **Data Hooks**: Custom hooks encapsulate Supabase queries with React Query

Example of a custom hook for direct Supabase access:

```typescript
// src/hooks/useRepositories.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase';

export function useRepositories(options = {}) {
  const { limit = 10, page = 0 } = options;
  const offset = page * limit;
  
  return useQuery({
    queryKey: ['repositories', { limit, page }],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('repositories')
        .select('*')
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) throw error;
      return data;
    }
  });
}
```
