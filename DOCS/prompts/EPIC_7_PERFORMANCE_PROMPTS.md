# Epic 7: Performance & Refinement Prompts

IMPORTANT: All implementations should build upon existing code. Do not rebuild functionality from scratch.

This document outlines the specific prompts needed to implement Epic 7 (Performance & Refinement), categorized by user story. Each prompt emphasizes extending and optimizing existing code rather than creating new implementations.

## Story 7.1: Database Query Optimization

### Database Indexing Tasks (Lovable AI) 🔴 Not Started

1. Analyze existing database queries and implement missing indexes:
```sql
-- First examine existing indexes before adding these
CREATE INDEX IF NOT EXISTS idx_commits_author ON commits(author);
CREATE INDEX IF NOT EXISTS idx_commits_date ON commits(date);
CREATE INDEX IF NOT EXISTS idx_merge_requests_status ON merge_requests(status);
CREATE INDEX IF NOT EXISTS idx_merge_requests_author ON merge_requests(author);
CREATE INDEX IF NOT EXISTS idx_contributor_repository_contributor_id ON contributor_repository(contributor_id);
```

2. Create materialized view for expensive contributor statistics:
```sql
-- Review existing contributor queries first and extend with materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS contributor_stats AS
SELECT 
  c.id,
  c.username,
  c.avatar,
  COUNT(DISTINCT com.hash) AS total_commits,
  COUNT(DISTINCT mr.id) AS total_pull_requests,
  COUNT(DISTINCT r.id) AS total_repositories,
  MAX(com.date) AS last_activity_date
FROM 
  contributors c
  LEFT JOIN commits com ON c.id = com.author
  LEFT JOIN merge_requests mr ON c.id = mr.author
  LEFT JOIN contributor_repository cr ON c.id = cr.contributor_id
  LEFT JOIN repositories r ON cr.repository_id = r.id
GROUP BY 
  c.id, c.username, c.avatar;

-- Don't forget to implement refresh mechanism
CREATE OR REPLACE FUNCTION refresh_contributor_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY contributor_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add appropriate triggers for view refresh
CREATE TRIGGER refresh_contributor_stats_after_commit
AFTER INSERT OR UPDATE OR DELETE ON commits
FOR EACH STATEMENT EXECUTE FUNCTION refresh_contributor_stats();
```

### Query Optimization Tasks (Lovable AI) 🔴 Not Started

1. Implement optimized data fetching pattern with pagination support:
```typescript
// Modify existing query function to support pagination
// Example: src/services/supabase.ts or relevant data fetching file
export const getRepositoryCommits = async (
  repoId: number,
  { page = 1, pageSize = 20, filter = {} }: { page?: number; pageSize?: number; filter?: Record<string, any> }
) => {
  // Start with existing query structure
  let query = supabase
    .from('commits')
    .select('*')
    .eq('repository_id', repoId);
  
  // Apply existing filters (if any) from the filter object
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value);
    }
  });
  
  // Add pagination to existing query
  const { data, error, count } = await query
    .order('date', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)
    .count('exact');

  if (error) throw error;
  
  return {
    data,
    pagination: {
      currentPage: page,
      pageSize,
      totalItems: count || 0,
      totalPages: count ? Math.ceil(count / pageSize) : 0
    }
  };
};
```

2. Enhance React Query hooks with optimized loading states:
```typescript
// Extend existing hook with loading state handling
// Example: src/hooks/useRepositoryData.ts or similar file
export function useRepositoryCommits(repoId: number, options = {}) {
  const { 
    page = 1, 
    pageSize = 20, 
    filters = {},
    enabled = true 
  } = options;
  
  const result = useQuery({
    queryKey: ['repository-commits', repoId, page, pageSize, filters],
    queryFn: () => getRepositoryCommits(repoId, { page, pageSize, filter: filters }),
    keepPreviousData: true, // Keep old data while fetching new data
    enabled: enabled && !!repoId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Enhance with more detailed loading states
  return {
    ...result,
    isLoadingInitial: result.isLoading && !result.data,
    isLoadingMore: result.isFetching && !!result.data,
    isRefreshing: result.isFetching && !result.isLoadingMore,
  };
}
```

## Story 7.2: Caching Implementation

### React Query Caching (Lovable AI) 🔴 Not Started

1. Extend React Query client configuration with optimized caching settings:
```typescript
// src/lib/queryClient.ts or similar file
import { QueryClient } from '@tanstack/react-query';

// Extend existing queryClient configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes - keep unused data for 30 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnReconnect: true, // Refetch when reconnecting after being offline
      retry: (failureCount, error: any) => {
        // Only retry network errors, not 4xx/5xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false; // Don't retry client errors
        }
        return failureCount < 3; // Retry other errors up to 3 times
      },
    },
  },
});

// Add query invalidation helpers to maintain cache consistency
export const invalidateRepositoryQueries = (repoId?: number) => {
  if (repoId) {
    // Invalidate specific repository queries
    queryClient.invalidateQueries({ queryKey: ['repository', repoId] });
  } else {
    // Invalidate all repository-related queries
    queryClient.invalidateQueries({ queryKey: ['repositories'] });
  }
};
```

### Local Storage Caching (GPT-4) 🔴 Not Started

1. Implement local storage caching utility for stable data:
```typescript
// src/utils/localStorageCache.ts
export const localStorageCache = {
  get: (key: string) => {
    try {
      const cached = localStorage.getItem(`app-cache:${key}`);
      if (!cached) return null;
      
      const { data, expiry } = JSON.parse(cached);
      if (Date.now() > expiry) {
        localStorage.removeItem(`app-cache:${key}`);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  },
  
  set: (key: string, data: any, ttlMinutes = 60) => {
    try {
      const item = {
        data,
        expiry: Date.now() + (ttlMinutes * 60 * 1000)
      };
      
      localStorage.setItem(`app-cache:${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  },
  
  invalidate: (keyPattern: string) => {
    try {
      const keys = Object.keys(localStorage).filter(
        key => key.startsWith(`app-cache:${keyPattern}`)
      );
      
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }
};
```

2. Integrate local storage caching with React Query hooks:
```typescript
// Example: enhance existing hooks with local storage caching
// src/hooks/useRepositoryData.ts
import { localStorageCache } from '@/utils/localStorageCache';

export function useRepositoryDetails(repoId: number) {
  return useQuery({
    queryKey: ['repository', repoId],
    queryFn: async () => {
      // Check local cache first for stable data
      const cached = localStorageCache.get(`repository:${repoId}`);
      if (cached) return cached;
      
      // If not in cache, fetch from API
      const data = await fetchRepositoryDetails(repoId);
      
      // Cache result for future use (repositories don't change often)
      localStorageCache.set(`repository:${repoId}`, data, 60); // Cache for 60 minutes
      
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
```

## Story 7.3: Error Handling Enhancement

### Error Boundary Component (Lovable AI) 🔴 Not Started

1. Create comprehensive error boundary component:
```typescript
// src/components/ui/error-boundary.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to an error reporting service
    console.error('Component error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You could send this to an error tracking service like Sentry
    // if implemented in the project
  }
  
  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-4 rounded border border-destructive bg-destructive/10 text-center my-4">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
          <h3 className="font-semibold text-lg mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <div className="space-x-4">
            <Button onClick={this.resetError} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" /> Try Again
            </Button>
            <Button onClick={() => window.location.reload()} variant="secondary">
              Reload Page
            </Button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### API Error Handling Utility (Lovable AI) 🔴 Not Started

1. Create error categorization and handling utility:
```typescript
// src/utils/errorHandling.ts
export type ErrorCategory = 'network' | 'authentication' | 'authorization' | 'validation' | 'server' | 'unknown';

export interface AppError {
  message: string;
  category: ErrorCategory;
  code?: string;
  retryable: boolean;
  details?: any;
}

export function categorizeError(error: any): AppError {
  // Network errors
  if (!navigator.onLine || error?.message?.includes('Failed to fetch')) {
    return {
      message: 'Network error. Please check your connection.',
      category: 'network',
      retryable: true
    };
  }
  
  // Supabase specific errors
  if (error?.code) {
    // Authentication errors
    if (error.code === 'PGRST301' || error.code === 'PGRST302') {
      return {
        message: 'Authentication error. Please log in again.',
        category: 'authentication',
        code: error.code,
        retryable: false
      };
    }
    
    // Authorization errors
    if (error.code === 'PGRST403') {
      return {
        message: 'You do not have permission to perform this action.',
        category: 'authorization',
        code: error.code,
        retryable: false
      };
    }
    
    // Validation errors
    if (error.code === 'PGRST400') {
      return {
        message: 'Invalid input data.',
        category: 'validation',
        code: error.code,
        retryable: false,
        details: error.details
      };
    }
  }
  
  // Default server error
  return {
    message: 'Something went wrong. Please try again later.',
    category: 'server',
    retryable: true
  };
}
```

2. Create error toast utility:
```typescript
// src/utils/errorToast.ts
import { toast } from 'sonner';
import { categorizeError, type AppError } from './errorHandling';

export function showErrorToast(error: any) {
  const appError = categorizeError(error);
  
  toast.error(appError.message, {
    description: appError.details
      ? typeof appError.details === 'string'
        ? appError.details
        : JSON.stringify(appError.details)
      : undefined,
    action: appError.retryable
      ? {
          label: 'Retry',
          onClick: () => window.location.reload(),
        }
      : undefined,
    duration: 5000,
  });
  
  return appError;
}
```

## Story 7.4: Loading State Refinement

### Skeleton Component System (Lovable AI) 🔴 Not Started

1. Create comprehensive skeleton component system:
```typescript
// src/components/ui/skeletons.tsx
import { Skeleton } from '@/components/ui/skeleton';

// Repository card skeleton
export function RepositorySkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-4 w-2/3" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
      </div>
    </div>
  );
}

// Commit list item skeleton
export function CommitItemSkeleton() {
  return (
    <div className="p-4 border-b flex items-start space-x-3">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="space-y-2 flex-grow">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex space-x-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

// CommitList skeleton with multiple items
export function CommitListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="border rounded-lg divide-y">
      {Array(count).fill(0).map((_, i) => (
        <CommitItemSkeleton key={i} />
      ))}
    </div>
  );
}

// Contributor skeleton
export function ContributorSkeleton() {
  return (
    <div className="p-4 border rounded-lg flex items-center space-x-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

// MergeRequest skeleton
export function MergeRequestSkeleton() {
  return (
    <div className="p-4 border-b space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center space-x-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
```

### Progressive Loading Implementation (GPT-4) 🔴 Not Started

1. Create component-aware loading patterns:
```typescript
// src/components/ui/loading-container.tsx
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingContainerProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  delay?: number; // Delay showing skeleton to prevent flicker
}

export function LoadingContainer({
  isLoading,
  skeleton,
  children,
  delay = 300,
}: LoadingContainerProps) {
  const [showSkeleton, setShowSkeleton] = React.useState(false);
  
  React.useEffect(() => {
    if (!isLoading) {
      setShowSkeleton(false);
      return;
    }
    
    const timer = setTimeout(() => {
      if (isLoading) {
        setShowSkeleton(true);
      }
    }, delay);
    
    return () => clearTimeout(timer);
  }, [isLoading, delay]);
  
  if (isLoading) {
    if (showSkeleton) {
      return <>{skeleton}</>;
    }
    return null; // Don't show anything during short loads
  }
  
  return <>{children}</>;
}

// Usage example
function RepoList({ repositories, isLoading }) {
  return (
    <LoadingContainer
      isLoading={isLoading}
      skeleton={
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <RepositorySkeleton key={i} />
          ))}
        </div>
      }
    >
      <div className="space-y-4">
        {repositories.map((repo) => (
          <RepositoryCard key={repo.id} repository={repo} />
        ))}
      </div>
    </LoadingContainer>
  );
}
```

## Story 7.5: User Experience Refinement

### Analytics Integration (GPT-4) 🔴 Not Started

1. Implement analytics utility for tracking user interactions:
```typescript
// src/utils/analytics.ts
// Add this file to track user interactions

// Define tracking event types for better type safety
export type TrackEventCategory = 
  | 'navigation' 
  | 'interaction' 
  | 'error' 
  | 'search' 
  | 'filter' 
  | 'sort';

export type TrackEventAction = 
  | 'click' 
  | 'view' 
  | 'submit' 
  | 'select' 
  | 'expand' 
  | 'collapse';

export const analytics = {
  // Track page views
  trackPageView: (page: string) => {
    console.log(`[Analytics] Page View: ${page}`);
    // This would be replaced with actual analytics implementation
    // such as Google Analytics, Mixpanel, etc.
  },
  
  // Track user events
  trackEvent: (
    category: TrackEventCategory, 
    action: TrackEventAction, 
    label?: string, 
    value?: number
  ) => {
    console.log(`[Analytics] Event: ${category} - ${action}${label ? ` - ${label}` : ''}${value ? ` - ${value}` : ''}`);
    // This would be replaced with actual analytics implementation
  },
  
  // Track timing events
  trackTiming: (category: string, variable: string, time: number) => {
    console.log(`[Analytics] Timing: ${category} - ${variable} - ${time}ms`);
    // This would be replaced with actual analytics implementation
  }
};
```

2. Create hooks for tracking component usage:
```typescript
// src/hooks/useTrackInteraction.ts
import { useCallback } from 'react';
import { analytics, TrackEventCategory, TrackEventAction } from '@/utils/analytics';

export function useTrackInteraction(
  category: TrackEventCategory,
  defaultLabel?: string
) {
  const trackInteraction = useCallback(
    (action: TrackEventAction, label?: string, value?: number) => {
      analytics.trackEvent(category, action, label || defaultLabel, value);
    },
    [category, defaultLabel]
  );

  return trackInteraction;
}

// Usage example:
// const track = useTrackInteraction('navigation');
// <Button onClick={() => track('click', 'home-button')}>Home</Button>
```

### Empty and Partial State Components (Lovable AI) 🔴 Not Started

1. Create improved empty state components:
```typescript
// src/components/ui/empty-states.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  Users, 
  GitPullRequest, 
  GitCommit,
  Search,
  AlertCircle,
  FileQuestion
} from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title,
  description,
  icon,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-background">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        {icon || <FileQuestion className="w-6 h-6" />}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Specialized empty states
export function EmptyRepositories({ onCreateNew }: { onCreateNew?: () => void }) {
  return (
    <EmptyState
      title="No repositories found"
      description="Get started by adding your first repository or refine your search criteria."
      icon={<FolderOpen className="w-6 h-6" />}
      action={onCreateNew ? { label: "Add Repository", onClick: onCreateNew } : undefined}
    />
  );
}

export function EmptyContributors() {
  return (
    <EmptyState
      title="No contributors found"
      description="There are no contributors matching your search criteria or in this repository."
      icon={<Users className="w-6 h-6" />}
    />
  );
}

export function EmptyMergeRequests() {
  return (
    <EmptyState
      title="No merge requests found"
      description="There are no merge requests matching your search criteria or in this repository."
      icon={<GitPullRequest className="w-6 h-6" />}
    />
  );
}

export function EmptyCommits() {
  return (
    <EmptyState
      title="No commits found"
      description="There are no commits matching your search criteria or in this repository."
      icon={<GitCommit className="w-6 h-6" />}
    />
  );
}

export function NoSearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      title="No results found"
      description={`We couldn't find any matches for "${query}". Try using different keywords or filters.`}
      icon={<Search className="w-6 h-6" />}
    />
  );
}
```

## Story 7.6: Performance Monitoring

### Web Vitals Tracking (GPT-4) 🔴 Not Started

1. Implement frontend performance monitoring:
```typescript
// src/utils/performance.ts
import { 
  getCLS, 
  getFID, 
  getLCP, 
  getFCP, 
  getTTFB, 
  type Metric 
} from 'web-vitals';

// Collect all web vitals metrics
export function reportWebVitals(onPerfEntry?: (metric: Metric) => void) {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    getCLS(onPerfEntry);  // Cumulative Layout Shift
    getFID(onPerfEntry);  // First Input Delay
    getLCP(onPerfEntry);  // Largest Contentful Paint
    getFCP(onPerfEntry);  // First Contentful Paint
    getTTFB(onPerfEntry); // Time to First Byte
  }
}

// Track component render performance
export const useComponentPerformance = (componentName: string) => {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log component lifecycle duration
      console.log(`Component ${componentName} mounted for ${duration.toFixed(2)}ms`);
      
      // Could send this to an analytics service
      if (duration > 500) {
        console.warn(`Component ${componentName} took over 500ms to render!`);
      }
    };
  }, [componentName]);
};
```

2. Create Performance Context for app-wide monitoring:
```typescript
// src/contexts/PerformanceContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { reportWebVitals } from '@/utils/performance';

interface PerformanceContextType {
  metrics: Record<string, number>;
  logPerformance: (name: string, duration: number) => void;
}

const PerformanceContext = createContext<PerformanceContextType>({
  metrics: {},
  logPerformance: () => {},
});

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  
  const logPerformance = (name: string, duration: number) => {
    setMetrics(prev => ({
      ...prev,
      [name]: duration
    }));
  };
  
  useEffect(() => {
    // Report Web Vitals
    reportWebVitals((metric) => {
      logPerformance(metric.name, metric.value);
    });
    
    // Track navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          logPerformance('navigationTime', navigation.loadEventEnd);
          logPerformance('domLoadTime', navigation.domComplete);
          logPerformance('firstByteTime', navigation.responseStart);
        }
      }, 0);
    });
  }, []);
  
  return (
    <PerformanceContext.Provider value={{ metrics, logPerformance }}>
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = () => useContext(PerformanceContext);
```

### Performance Dashboard (Lovable AI) 🔴 Not Started

1. Create performance monitoring dashboard component:
```typescript
// src/components/admin/PerformanceDashboard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePerformance } from '@/contexts/PerformanceContext';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function PerformanceDashboard() {
  const { metrics } = usePerformance();
  
  // In a real implementation, these would be fetched from a backend
  // with historical data
  const performanceData = [
    { name: 'Page 1', LCP: metrics.LCP || 0, FID: metrics.FID || 0, CLS: metrics.CLS || 0 },
    // More historical data would go here
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="web-vitals">
            <TabsList>
              <TabsTrigger value="web-vitals">Web Vitals</TabsTrigger>
              <TabsTrigger value="api">API Performance</TabsTrigger>
              <TabsTrigger value="components">Component Renders</TabsTrigger>
            </TabsList>
            
            <TabsContent value="web-vitals">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Largest Contentful Paint (LCP)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metrics.LCP ? `${(metrics.LCP / 1000).toFixed(2)}s` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Target: &lt; 2.5s
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      First Input Delay (FID)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metrics.FID ? `${metrics.FID.toFixed(2)}ms` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Target: &lt; 100ms
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Cumulative Layout Shift (CLS)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metrics.CLS || 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Target: &lt; 0.1
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="LCP" stroke="#8884d8" />
                  <Line type="monotone" dataKey="FID" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="CLS" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="api">
              {/* API performance metrics would go here */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Response Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">150ms</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Slowest Endpoint
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-medium">/api/repositories</div>
                    <div className="text-2xl font-bold">350ms</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Error Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0.5%</div>
                  </CardContent>
                </Card>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: '/api/commits', value: 120 },
                  { name: '/api/merge-requests', value: 180 },
                  { name: '/api/contributors', value: 150 },
                  { name: '/api/repositories', value: 350 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Response Time (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="components">
              {/* Component render performance would go here */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Slowest Components
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span>CommitDiff</span>
                          <span className="font-mono">450ms</span>
                        </li>
                        <li className="flex justify-between">
                          <span>RepositoryList</span>
                          <span className="font-mono">320ms</span>
                        </li>
                        <li className="flex justify-between">
                          <span>ContributionHeatmap</span>
                          <span className="font-mono">280ms</span>
                        </li>
                        <li className="flex justify-between">
                          <span>MergeRequestList</span>
                          <span className="font-mono">210ms</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Re-render Count
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span>CommitList</span>
                          <span className="font-mono">12</span>
                        </li>
                        <li className="flex justify-between">
                          <span>FilterBar</span>
                          <span className="font-mono">8</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Timeline</span>
                          <span className="font-mono">6</span>
                        </li>
                        <li className="flex justify-between">
                          <span>SearchBox</span>
                          <span className="font-mono">5</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Story 7.7: Accessibility and Internationalization

### Accessibility Enhancements (GPT-4) 🔴 Not Started

1. Create accessibility testing utility:
```typescript
// src/utils/a11y.ts
import React, { useRef, useEffect } from 'react';

// Check if element has accessible name
export function hasAccessibleName(element: HTMLElement): boolean {
  return element.hasAttribute('aria-label') || 
         element.hasAttribute('aria-labelledby') || 
         element.hasAttribute('title') ||
         (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) ||
         !!element.textContent?.trim();
}

// Hook to announce messages to screen readers
export function useA11yAnnounce() {
  const [message, setMessage] = React.useState('');
  
  useEffect(() => {
    if (!message) return;
    
    // Create or find an existing announcer element
    let announcer = document.getElementById('a11y-announcer');
    
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'a11y-announcer';
      announcer.setAttribute('aria-live', 'assertive');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }
    
    // Set the message
    announcer.textContent = message;
    
    // Clear the message after a delay
    const timerId = setTimeout(() => {
      if (announcer) announcer.textContent = '';
      setMessage('');
    }, 3000);
    
    return () => clearTimeout(timerId);
  }, [message]);
  
  return setMessage;
}

// Hook to trap focus in a modal or dialog
export function useTrapFocus(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    // Focus the first element when opened
    firstElement?.focus();
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      // Trap focus in the container
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);
  
  return containerRef;
}
```

2. Create accessible component wrappers:
```typescript
// src/components/ui/accessible-wrapper.tsx
import React, { forwardRef } from 'react';

interface AccessibleProps {
  children: React.ReactNode;
  id?: string;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  hideVisually?: boolean;
  role?: string;
  className?: string;
}

export const VisuallyHidden = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
      {...props}
    />
  )
);
VisuallyHidden.displayName = "VisuallyHidden";

export const AccessibleRegion = forwardRef<HTMLDivElement, AccessibleProps>(
  ({ 
    children, 
    id, 
    label, 
    labelledBy, 
    describedBy, 
    hideVisually,
    role,
    className,
    ...props 
  }, ref) => {
    const accessibilityProps: React.HTMLAttributes<HTMLDivElement> = {
      id,
      className,
      ...props
    };
    
    if (role) {
      accessibilityProps['role'] = role;
    }
    
    if (label) {
      accessibilityProps['aria-label'] = label;
    }
    
    if (labelledBy) {
      accessibilityProps['aria-labelledby'] = labelledBy;
    }
    
    if (describedBy) {
      accessibilityProps['aria-describedby'] = describedBy;
    }
    
    if (hideVisually) {
      accessibilityProps.className = `absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 ${className || ''}`;
    }
    
    return (
      <div ref={ref} {...accessibilityProps}>
        {children}
      </div>
    );
  }
);
AccessibleRegion.displayName = "AccessibleRegion";
```

### Internationalization Setup (Lovable AI) 🔴 Not Started

1. Implement basic internationalization support:
```typescript
// src/utils/i18n.ts
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Simple translation system
const translations: Record<string, Record<string, string>> = {
  en: {
    // Common
    'app.title': 'GitHub Analytics',
    'app.loading': 'Loading...',
    'app.error': 'An error occurred',
    'app.retry': 'Retry',
    'app.save': 'Save',
    'app.cancel': 'Cancel',
    'app.delete': 'Delete',
    'app.edit': 'Edit',
    'app.search': 'Search',
    'app.filter': 'Filter',
    'app.sort': 'Sort',
    'app.noResults': 'No results found',
    
    // Repositories
    'repos.title': 'Repositories',
    'repos.empty': 'No repositories found',
    'repos.addNew': 'Add Repository',
    
    // Commits
    'commits.title': 'Commits',
    'commits.empty': 'No commits found',
    'commits.author': 'Author',
    'commits.date': 'Date',
    'commits.message': 'Message',
    
    // Contributors
    'contributors.title': 'Contributors',
    'contributors.empty': 'No contributors found',
    'contributors.activity': 'Activity',
    
    // Merge Requests
    'mr.title': 'Merge Requests',
    'mr.empty': 'No merge requests found',
    'mr.status': 'Status',
    'mr.author': 'Author',
    'mr.created': 'Created',
    'mr.updated': 'Updated',
  },
  // Other languages can be added here
};

// Default language
const DEFAULT_LANGUAGE = 'en';

// Types
interface I18nContextValue {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
}

// Create context
const I18nContext = createContext<I18nContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key) => key,
  formatDate: (date) => new Date(date).toLocaleDateString(),
  formatNumber: (number) => number.toString(),
});

// Provider component
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  
  // Translation function
  const t = useCallback((key: string, params?: Record<string, string>) => {
    const translation = translations[language]?.[key] || key;
    
    if (!params) return translation;
    
    // Replace parameters
    return Object.entries(params).reduce(
      (acc, [param, value]) => acc.replace(`{{${param}}}`, value),
      translation
    );
  }, [language]);
  
  // Date formatter
  const formatDate = useCallback((date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(language, options);
  }, [language]);
  
  // Number formatter
  const formatNumber = useCallback((number: number, options?: Intl.NumberFormatOptions) => {
    return number.toLocaleString(language, options);
  }, [language]);
  
  return (
    <I18nContext.Provider value={{ language, setLanguage, t, formatDate, formatNumber }}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use translations
export function useTranslation() {
  return useContext(I18nContext);
}

// HOC to wrap components with translations
export function withTranslation<P extends object>(
  Component: React.ComponentType<P & { t: I18nContextValue['t'] }>
) {
  return (props: P) => {
    const { t } = useTranslation();
    return <Component t={t} {...props} />;
  };
}
```

## Implementation Testing Strategy

For each performance improvement, implement incremental testing:

1. Measure baseline performance before changes:
```typescript
// src/utils/performanceTesting.ts
export function benchmarkFunction<T extends (...args: any[]) => any>(
  fn: T, 
  args: Parameters<T>,
  iterations: number = 100
): number {
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    fn(...args);
  }
  
  const end = performance.now();
  return (end - start) / iterations;
}

// Example usage:
const avgTime = benchmarkFunction(getRepositoryCommits, [1, { page: 1, pageSize: 20 }]);
console.log(`Average execution time: ${avgTime}ms`);
```

2. Implement incremental changes with A/B testing capability:
```typescript
// src/utils/featureFlags.ts
export const featureFlags = {
  useOptimizedQueries: true,
  useEnhancedCaching: true,
  useSkeletonLoading: true,
  // Add more flags as needed
};

// Usage example
export function getRepositoryData(repoId: number, options = {}) {
  if (featureFlags.useOptimizedQueries) {
    return getOptimizedRepositoryData(repoId, options);
  } else {
    return getLegacyRepositoryData(repoId, options);
  }
}
```

This document outlines the specific implementation prompts for Epic 7: Performance & Refinement. Each task has been broken down into detailed code examples with specific implementation guidance.

Remember to build upon existing code patterns and functionality rather than creating new implementations from scratch. Use the 🔴 Not Started / 🟡 In Progress / 🟢 Completed status indicators to track implementation progress.

When implementing performance improvements, always measure baseline performance before making changes and validate improvements afterward.
