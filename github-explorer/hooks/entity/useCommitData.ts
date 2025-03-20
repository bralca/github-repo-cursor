'use client';

import { useState, useEffect } from 'react';
import { getCommitBySha } from '@/lib/database/commits';
import { parseRepositorySlug, parseFileSlug } from '@/lib/url-utils';

interface UseCommitDataOptions {
  initialData?: any;
  skipFetch?: boolean;
}

interface CommitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

interface ExtendedCommitData {
  id: string;
  github_id: string;
  sha: string;
  message: string;
  committed_at: string;
  files?: CommitFile[];
  filteredFiles?: CommitFile[];
  [key: string]: any; // Allow for other properties
}

/**
 * Hook for loading commit data on the client
 * 
 * @param repositorySlug The repository slug from the URL
 * @param commitSha The commit SHA from the URL
 * @param fileSlug The file slug from the URL (optional)
 * @param options Options for the data fetching
 * @returns Commit data and loading/error states
 */
export function useCommitData(
  repositorySlug: string, 
  commitSha: string,
  fileSlug?: string,
  options: UseCommitDataOptions = {}
) {
  const [data, setData] = useState<ExtendedCommitData | null>(options.initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!options.initialData && !options.skipFetch);
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Function to fetch the data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse the repository slug to get the repository GitHub ID
      const repoInfo = parseRepositorySlug(repositorySlug);
      if (!repoInfo) {
        throw new Error('Invalid repository slug');
      }

      // Parse the file slug if provided
      let fileInfo = null;
      if (fileSlug) {
        fileInfo = parseFileSlug(fileSlug);
        if (!fileInfo) {
          throw new Error('Invalid file slug');
        }
      }

      // Fetch the commit data
      const commitData = await getCommitBySha(repositorySlug, commitSha) as ExtendedCommitData;
      if (!commitData) {
        throw new Error('Commit not found');
      }

      // If a file slug was provided and files exist, filter to only include changes for that file
      if (fileInfo && Array.isArray(commitData.files) && commitData.files.length > 0) {
        commitData.filteredFiles = commitData.files.filter(
          (file: CommitFile) => file.filename === fileInfo?.filename
        );
      }

      setData(commitData);
    } catch (err) {
      console.error('Error fetching commit data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load commit data'));
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  // Retry function exposed to the component
  const retry = () => {
    setIsRetrying(true);
    fetchData();
  };

  // Fetch data on mount or when parameters change
  useEffect(() => {
    if (!options.skipFetch) {
      fetchData();
    }
  }, [repositorySlug, commitSha, fileSlug, options.skipFetch]);

  return {
    data,
    isLoading,
    error,
    retry,
    isRetrying
  };
} 