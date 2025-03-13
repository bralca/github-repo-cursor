# Supabase Integration for GitHub Analytics

This document outlines the integration between the GitHub Analytics application and the existing Supabase database. It covers connection patterns, authentication, data access, and best practices for both the Next.js frontend and Node.js server components.

## Overview

The GitHub Analytics application connects to an existing Supabase PostgreSQL database that stores all GitHub data, user information, and analytics. Both the Next.js frontend and Node.js server interact with this database, but with different access patterns and security considerations.

## Database Connection

### Next.js Frontend Connection

The Next.js frontend connects to Supabase using the Supabase JavaScript client:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// For server components
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceKey
  );
};
```

### Node.js Server Connection

The Node.js server connects to Supabase using the service role key for elevated privileges:

```typescript
// server/src/services/database/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

## Authentication

### User Authentication Flow

The application uses Supabase Auth for user authentication with the following flow:

1. User signs in via the Next.js frontend using Supabase Auth
2. Supabase returns a JWT token and refreshes it automatically
3. The JWT is used for subsequent API calls to Supabase
4. For protected routes, the JWT is verified before accessing data

Example authentication in Next.js:

```typescript
// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Error logging in:', error.message);
      return;
    }
    
    // Redirect to dashboard or home page
    window.location.href = '/';
  };
  
  // ... form JSX
}
```

### Role-Based Access Control

The application uses Supabase's Row Level Security (RLS) for fine-grained access control:

1. Public data is accessible to all authenticated users
2. User-specific data is restricted by user ID
3. Admin functions require the admin role

Example RLS policy:

```sql
-- Example RLS policy for repositories table
CREATE POLICY "Public repositories are viewable by everyone"
ON repositories FOR SELECT
USING (is_public = true);

CREATE POLICY "Private repositories are viewable by members only"
ON repositories FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM repository_members WHERE repository_id = id
  )
);
```

## Data Access Patterns

### Direct Access from Next.js

Server Components in Next.js can access Supabase directly:

```typescript
// src/app/repositories/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase';

export default async function RepositoriesPage() {
  const supabase = createServerSupabaseClient();
  
  const { data: repositories, error } = await supabase
    .from('repositories')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('Error fetching repositories:', error);
    return <div>Error loading repositories</div>;
  }
  
  return (
    <div>
      <h1>Repositories</h1>
      <ul>
        {repositories.map(repo => (
          <li key={repo.id}>{repo.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### React Query Integration

For Client Components in Next.js, React Query is used with Supabase:

```typescript
// src/hooks/use-repositories.ts
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

### Database Functions

The application leverages Supabase's PostgreSQL functions for complex operations:

```typescript
// src/hooks/use-top-contributors.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase';

export function useTopContributors(repositoryId: number, limit = 5) {
  return useQuery({
    queryKey: ['top-contributors', repositoryId, limit],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .rpc('get_repository_contributors_by_commits', {
          repo_id: repositoryId,
          limit_count: limit
        });
        
      if (error) throw error;
      return data;
    }
  });
}
```

### Node.js Server Data Access

The Node.js server uses a more privileged connection for advanced operations:

```typescript
// server/src/services/analytics/contributor-analytics.service.ts
import { supabase } from '../database/supabase';

export class ContributorAnalyticsService {
  async getContributorRepositoryImpact(contributorId: string) {
    // Complex query combining multiple tables
    const { data, error } = await supabase
      .from('commits')
      .select(`
        id,
        message,
        repository_id,
        repositories(name, full_name)
      `)
      .eq('author', contributorId)
      .order('committed_date', { ascending: false });
      
    if (error) throw error;
    
    // Process and aggregate the data
    // ...
    
    return processedData;
  }
}
```

## Real-time Subscriptions

The application uses Supabase's real-time capabilities for live updates:

```typescript
// src/hooks/use-realtime-notifications.ts
'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase';

export function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const channel = supabaseClient
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(current => [...current, payload.new]);
        }
      )
      .subscribe();
      
    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [userId]);
  
  return notifications;
}
```

## Data Models and TypeScript Integration

The application uses TypeScript types generated from Supabase schema:

```typescript
// src/types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      repositories: {
        Row: {
          id: number
          name: string
          full_name: string
          description: string | null
          is_fork: boolean
          is_archived: boolean
          is_private: boolean
          created_at: string
          updated_at: string
          // ... other columns
        }
        Insert: {
          id: number
          name: string
          full_name: string
          // ... required fields for insert
        }
        Update: {
          id?: number
          name?: string
          // ... optional fields for update
        }
      }
      // ... other tables
    }
    Functions: {
      get_repository_contributors_by_commits: {
        Args: {
          repo_id: number
          limit_count: number
        }
        Returns: {
          author: string
          repository_id: number
          contribution_count: number
        }[]
      }
      // ... other functions
    }
  }
}
```

## Custom Hook Patterns

For consistent data access, the application uses custom hooks for standard operations:

```typescript
// src/hooks/useSupabaseQuery.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

export function useSupabaseQuery<T = any>({
  table,
  queryKey,
  select = '*',
  filter,
  options = {}
}: {
  table: string;
  queryKey: any[];
  select?: string;
  filter?: (query: PostgrestFilterBuilder<any, any, any>) => PostgrestFilterBuilder<any, any, any>;
  options?: object;
}) {
  return useQuery({
    queryKey: [table, ...queryKey],
    queryFn: async () => {
      let query = supabaseClient
        .from(table)
        .select(select);
        
      if (filter) {
        query = filter(query);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as T[];
    },
    ...options
  });
}
```

## Pagination

The application implements both offset-based and cursor-based pagination:

```typescript
// src/hooks/usePagination.ts
'use client';

import { useState } from 'react';
import { useSupabaseQuery } from './useSupabaseQuery';

export function usePagination({
  table,
  pageSize = 10,
  initialPage = 0,
  select = '*',
  sortBy = 'created_at',
  sortDirection = 'desc',
  filter
}: {
  table: string;
  pageSize?: number;
  initialPage?: number;
  select?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filter?: (query: any) => any;
}) {
  const [page, setPage] = useState(initialPage);
  const offset = page * pageSize;
  
  const query = useSupabaseQuery({
    table,
    queryKey: ['paginated', page, pageSize, sortBy, sortDirection],
    select,
    filter: (query) => {
      let filteredQuery = query
        .order(sortBy, { ascending: sortDirection === 'asc' })
        .range(offset, offset + pageSize - 1);
        
      if (filter) {
        filteredQuery = filter(filteredQuery);
      }
      
      return filteredQuery;
    },
    options: {
      keepPreviousData: true
    }
  });
  
  return {
    ...query,
    page,
    setPage,
    pageSize,
    offset,
    nextPage: () => setPage(p => p + 1),
    prevPage: () => setPage(p => Math.max(0, p - 1)),
    goToPage: (newPage: number) => setPage(newPage)
  };
}
```

## Error Handling

The application implements consistent error handling patterns:

```typescript
// src/utils/supabase-error-handler.ts
export class SupabaseError extends Error {
  code: string;
  details: string;
  hint: string;
  
  constructor(error: any) {
    super(error.message);
    this.name = 'SupabaseError';
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
  }
  
  static handle(error: any) {
    const supabaseError = new SupabaseError(error);
    
    // Log error for debugging
    console.error('Supabase Error:', supabaseError);
    
    // Return user-friendly message based on error code
    if (supabaseError.code === '42P01') {
      return 'The requested resource does not exist.';
    }
    
    if (supabaseError.code === '42501') {
      return 'You do not have permission to access this resource.';
    }
    
    return 'An error occurred while accessing the database.';
  }
}
```

## Database Transactions

The Node.js server handles complex database transactions:

```typescript
// server/src/services/database/transaction.service.ts
import { supabase } from './supabase';

export class TransactionService {
  async processMergeRequest(mergeRequestData: any, commitsData: any[]) {
    // Start a PostgreSQL transaction
    const { error: beginError } = await supabase.rpc('begin');
    if (beginError) throw beginError;
    
    try {
      // Insert merge request
      const { data: mergeRequest, error: mrError } = await supabase
        .from('merge_requests')
        .upsert(mergeRequestData)
        .select()
        .single();
        
      if (mrError) throw mrError;
      
      // Insert all commits with the merge request ID
      const commits = commitsData.map(commit => ({
        ...commit,
        merge_request_id: mergeRequest.id
      }));
      
      const { error: commitsError } = await supabase
        .from('commits')
        .upsert(commits);
        
      if (commitsError) throw commitsError;
      
      // Update repository statistics
      const { error: statsError } = await supabase.rpc(
        'update_repository_stats',
        { repository_id: mergeRequestData.repository_id }
      );
      
      if (statsError) throw statsError;
      
      // Commit the transaction
      const { error: commitError } = await supabase.rpc('commit');
      if (commitError) throw commitError;
      
      return mergeRequest;
    } catch (error) {
      // Rollback on error
      await supabase.rpc('rollback');
      throw error;
    }
  }
}
```

## Security Best Practices

The application follows these security best practices for Supabase integration:

1. **Environment Variables**: All Supabase credentials are stored in environment variables
2. **Principle of Least Privilege**: Different API keys for different access levels
3. **Row-Level Security**: All tables have RLS policies
4. **Input Validation**: All user input is validated before database operations
5. **Prepared Statements**: All dynamic queries use prepared statements

## Performance Optimization

The application optimizes database performance through:

1. **Indexing**: All frequently queried columns are indexed
2. **Query Optimization**: Complex queries are optimized for performance
3. **Connection Pooling**: Both Next.js and Node.js use connection pooling
4. **Caching**: Frequent queries are cached
5. **Vertical Optimization**: Function-level optimizations like `useSupabaseQuery`

Example indexing:

```sql
-- Example index creation
CREATE INDEX idx_commits_author ON commits(author);
CREATE INDEX idx_commits_repository_id ON commits(repository_id);
CREATE INDEX idx_commits_committed_date ON commits(committed_date);
```

## Database Schema Compatibility

The application ensures compatibility with the existing database schema:

1. **Schema Validation**: TypeScript types validate against the database schema
2. **Migration Strategy**: New features adapt to existing schema
3. **Schema Versioning**: Code handles different schema versions gracefully

## Environment Configuration

The application uses different Supabase environments for development and production:

### Next.js Environment Variables

```
# .env.local for Next.js
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Node.js Environment Variables

```
# .env for Node.js server
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Conclusion

The Supabase integration for GitHub Analytics provides a robust foundation for both the Next.js frontend and Node.js server components. By following these patterns and best practices, the application can efficiently interact with the existing database while maintaining security, performance, and compatibility.

Key takeaways:

1. **Separate Client Libraries**: Different Supabase clients for frontend and backend
2. **Type Safety**: Complete TypeScript coverage for database interactions
3. **Custom Hooks**: Standardized data access patterns
4. **Security First**: Proper authentication and authorization throughout
5. **Performance Optimization**: Efficient query design and caching
