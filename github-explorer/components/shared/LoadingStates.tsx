'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Generic loading skeleton component
 */
export function GenericLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-full max-w-md" />
      <Skeleton className="h-4 w-full max-w-sm" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/**
 * Repository loading skeleton component
 */
export function RepositoryLoadingSkeleton() {
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
}

/**
 * Contributor loading skeleton component
 */
export function ContributorLoadingSkeleton() {
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
}

/**
 * Merge request loading skeleton component
 */
export function MergeRequestLoadingSkeleton() {
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
}

/**
 * Commit loading skeleton component
 */
export function CommitLoadingSkeleton() {
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
}

/**
 * Entity-specific loading skeleton component
 */
export function EntityLoadingSkeleton({ 
  entityType 
}: { 
  entityType: 'repository' | 'contributor' | 'mergeRequest' | 'commit' 
}) {
  switch (entityType) {
    case 'repository':
      return <RepositoryLoadingSkeleton />;
    case 'contributor':
      return <ContributorLoadingSkeleton />;
    case 'mergeRequest':
      return <MergeRequestLoadingSkeleton />;
    case 'commit':
      return <CommitLoadingSkeleton />;
    default:
      return <GenericLoadingSkeleton />;
  }
} 