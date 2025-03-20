'use client';

import { ReactNode, useState, Component, ErrorInfo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface EntityLayoutProps {
  // Server-rendered content
  header: ReactNode;
  // Optional sidebar content
  sidebar?: ReactNode;
  // Client-rendered content (lazy loaded)
  children: ReactNode;
  // Loading state from client component
  isLoading?: boolean;
  // Error state from client component
  error?: Error | null;
  // Entity type for error messages
  entityType: 'repository' | 'contributor' | 'mergeRequest' | 'commit';
}

/**
 * Base layout component for entity pages
 * 
 * This component provides a consistent layout for all entity pages,
 * with server-rendered header and client-rendered content.
 */
export function EntityLayout({
  header,
  sidebar,
  children,
  isLoading = false,
  error = null,
  entityType,
}: EntityLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Server-rendered header - always visible */}
      <div className="mb-8">
        {header}
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Optional sidebar */}
        {sidebar && (
          <div className="w-full md:w-1/4">
            {sidebar}
          </div>
        )}
        
        {/* Main content area */}
        <div className={`w-full ${sidebar ? 'md:w-3/4' : ''}`}>
          <ErrorBoundary entityType={entityType}>
            {error ? (
              <EntityErrorState entityType={entityType} error={error} />
            ) : isLoading ? (
              <EntityLoadingState entityType={entityType} />
            ) : (
              children
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  entityType: 'repository' | 'contributor' | 'mergeRequest' | 'commit';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component for entity layouts
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error in entity component:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <EntityErrorState entityType={this.props.entityType} error={this.state.error} />;
    }

    return this.props.children;
  }
}

interface EntityErrorStateProps {
  entityType: 'repository' | 'contributor' | 'mergeRequest' | 'commit';
  error?: Error | null;
}

/**
 * Error state component for entity layouts
 */
function EntityErrorState({ entityType, error }: EntityErrorStateProps) {
  const entityNames = {
    repository: 'Repository',
    contributor: 'Contributor',
    mergeRequest: 'Merge Request',
    commit: 'Commit',
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <h3 className="text-lg font-medium text-red-800 mb-2">
        {`Error Loading ${entityNames[entityType]} Data`}
      </h3>
      {error && (
        <p className="text-sm text-red-600 mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
      )}
      <button 
        className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        onClick={() => window.location.reload()}
      >
        Try Again
      </button>
    </div>
  );
}

interface EntityLoadingStateProps {
  entityType: 'repository' | 'contributor' | 'mergeRequest' | 'commit';
}

/**
 * Loading state component for entity layouts
 */
function EntityLoadingState({ entityType }: EntityLoadingStateProps) {
  // Different loading layouts based on entity type
  switch (entityType) {
    case 'repository':
      return (
        <div className="space-y-6">
          <Skeleton className="h-8 w-full max-w-md" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      );
    
    case 'contributor':
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      );
      
    case 'mergeRequest':
      return (
        <div className="space-y-6">
          <Skeleton className="h-8 w-full max-w-md" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      );
      
    case 'commit':
      return (
        <div className="space-y-6">
          <Skeleton className="h-8 w-full max-w-md" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-96 w-full" />
        </div>
      );
      
    default:
      return (
        <div className="space-y-6">
          <Skeleton className="h-8 w-full max-w-md" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-64 w-full" />
        </div>
      );
  }
} 