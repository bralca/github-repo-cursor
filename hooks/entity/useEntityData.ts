'use client';

import { useState } from 'react';
import { useRepositoryData } from './useRepositoryData';
import { useContributorData } from './useContributorData';
import { useMergeRequestData } from './useMergeRequestData';
import { useCommitData } from './useCommitData';

interface UseEntityDataOptions {
  initialData?: any;
  skipFetch?: boolean;
}

/**
 * Generic hook for loading entity data based on entity type
 * 
 * This hook is a convenient wrapper around the specific entity data hooks.
 * It provides a unified interface for loading any type of entity data.
 * 
 * @param entityType The type of entity to load
 * @param slugs Object containing the necessary slugs for the entity type
 * @param options Options for data fetching
 * @returns Entity data and loading/error states
 */
export function useEntityData(
  entityType: 'repository' | 'contributor' | 'mergeRequest' | 'commit',
  slugs: {
    repositorySlug?: string;
    contributorSlug?: string;
    mergeRequestSlug?: string;
    commitSha?: string;
    fileSlug?: string;
  },
  options: UseEntityDataOptions = {}
) {
  const [notInitialized] = useState<boolean>(true);
  
  // Repository data hook
  const {
    data: repositoryData,
    isLoading: repositoryLoading,
    error: repositoryError,
    retry: repositoryRetry,
    isRetrying: repositoryRetrying
  } = useRepositoryData(
    slugs.repositorySlug || '',
    {
      ...options,
      skipFetch: !slugs.repositorySlug || entityType !== 'repository' || options.skipFetch
    }
  );
  
  // Contributor data hook
  const {
    data: contributorData,
    isLoading: contributorLoading,
    error: contributorError,
    retry: contributorRetry,
    isRetrying: contributorRetrying
  } = useContributorData(
    slugs.contributorSlug || '',
    {
      ...options,
      skipFetch: !slugs.contributorSlug || entityType !== 'contributor' || options.skipFetch
    }
  );
  
  // Merge request data hook
  const {
    data: mergeRequestData,
    isLoading: mergeRequestLoading,
    error: mergeRequestError,
    retry: mergeRequestRetry,
    isRetrying: mergeRequestRetrying
  } = useMergeRequestData(
    slugs.repositorySlug || '',
    slugs.mergeRequestSlug || '',
    {
      ...options,
      skipFetch: !slugs.repositorySlug || !slugs.mergeRequestSlug || entityType !== 'mergeRequest' || options.skipFetch
    }
  );
  
  // Commit data hook
  const {
    data: commitData,
    isLoading: commitLoading,
    error: commitError,
    retry: commitRetry,
    isRetrying: commitRetrying
  } = useCommitData(
    slugs.repositorySlug || '',
    slugs.commitSha || '',
    slugs.fileSlug,
    {
      ...options,
      skipFetch: !slugs.repositorySlug || !slugs.commitSha || entityType !== 'commit' || options.skipFetch
    }
  );
  
  // Get the appropriate data, loading, error, and retry function based on entity type
  let data, isLoading, error, retry, isRetrying;
  
  switch (entityType) {
    case 'repository':
      data = repositoryData;
      isLoading = repositoryLoading;
      error = repositoryError;
      retry = repositoryRetry;
      isRetrying = repositoryRetrying;
      break;
      
    case 'contributor':
      data = contributorData;
      isLoading = contributorLoading;
      error = contributorError;
      retry = contributorRetry;
      isRetrying = contributorRetrying;
      break;
      
    case 'mergeRequest':
      data = mergeRequestData;
      isLoading = mergeRequestLoading;
      error = mergeRequestError;
      retry = mergeRequestRetry;
      isRetrying = mergeRequestRetrying;
      break;
      
    case 'commit':
      data = commitData;
      isLoading = commitLoading;
      error = commitError;
      retry = commitRetry;
      isRetrying = commitRetrying;
      break;
      
    default:
      data = null;
      isLoading = false;
      error = new Error(`Unknown entity type: ${entityType}`);
      retry = () => {};
      isRetrying = false;
  }
  
  return {
    data,
    isLoading,
    error,
    retry,
    isRetrying
  };
} 