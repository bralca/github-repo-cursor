'use client';

import { useEntityData } from '@/hooks/entity/mockEntityHooks';
import { EntityLoadingSkeleton, EntityErrorState } from '@/components/shared';
import { ReactNode } from 'react';

interface EntityWrapperProps {
  entityType: 'repository' | 'contributor' | 'mergeRequest' | 'commit';
  slug: string;
  initialData?: any;
  skipFetch?: boolean;
  children: (data: any) => ReactNode;
}

/**
 * A wrapper component that handles loading and error states for any entity type
 * It uses the useEntityData hook to fetch the entity data and renders the appropriate
 * loading or error state components while data is loading or if an error occurs.
 * 
 * Note: This component now uses mock data as the actual entity pages have been removed.
 */
export function EntityWrapper({
  entityType,
  slug,
  initialData,
  skipFetch = false,
  children
}: EntityWrapperProps) {
  // For merge requests, we need to parse the slug to get the repositorySlug and mergeRequestSlug
  let repositorySlug, mergeRequestSlug;
  
  if (entityType === 'mergeRequest' && slug.includes('/')) {
    [repositorySlug, mergeRequestSlug] = slug.split('/');
  }
  
  // Always use the mock hooks to prevent errors
  const { data, isLoading, error, retry, isRetrying } = useEntityData(
    entityType,
    {
      repositorySlug: entityType === 'repository' ? slug : (entityType === 'mergeRequest' || entityType === 'commit' ? repositorySlug : undefined),
      contributorSlug: entityType === 'contributor' ? slug : undefined,
      mergeRequestSlug: entityType === 'mergeRequest' ? mergeRequestSlug : undefined,
      commitSha: entityType === 'commit' ? slug : undefined
    },
    { initialData, skipFetch }
  );

  if (isLoading) {
    return <EntityLoadingSkeleton entityType={entityType} />;
  }

  if (error) {
    return (
      <EntityErrorState
        entityType={entityType}
        error={error}
        retry={retry}
        isRetrying={isRetrying}
      />
    );
  }

  if (!data) {
    return <EntityErrorState entityType={entityType} error={new Error('Entity not found')} />;
  }

  return <>{children(data)}</>;
} 