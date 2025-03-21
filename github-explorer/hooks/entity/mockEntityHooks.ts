'use client';

import { useState, useEffect } from 'react';

// Mock repository data
const MOCK_REPOSITORIES = {
  'react-facebook-123456': {
    id: '123456',
    name: 'react',
    full_name: 'facebook/react',
    description: 'A JavaScript library for building user interfaces',
    owner: 'facebook',
    stars: 180000,
    forks: 37000,
    health_percentage: 98,
    open_issues_count: 634,
    primary_language: 'JavaScript',
    watchers_count: 6900,
    license: 'MIT'
  },
  'next-vercel-789012': {
    id: '789012',
    name: 'next.js',
    full_name: 'vercel/next.js',
    description: 'The React Framework for Production',
    owner: 'vercel',
    stars: 85000,
    forks: 18000,
    health_percentage: 95,
    open_issues_count: 1203,
    primary_language: 'TypeScript',
    watchers_count: 3500,
    license: 'MIT'
  }
};

// Mock contributor data
const MOCK_CONTRIBUTORS = {
  'john-doe-johndoe-111222': {
    id: '111222',
    name: 'John Doe',
    username: 'johndoe',
    avatar: 'https://github.com/johndoe.png',
    bio: 'Software engineer and open source contributor',
    company: 'Acme Inc',
    location: 'San Francisco, CA',
    followers: 2500,
    repositories: 45,
    impact_score: 89,
    role_classification: 'Core Contributor'
  },
  'jane-smith-janesmith-333444': {
    id: '333444',
    name: 'Jane Smith',
    username: 'janesmith',
    avatar: 'https://github.com/janesmith.png',
    bio: 'Full-stack developer and community leader',
    company: 'TechCorp',
    location: 'New York, NY',
    followers: 1800,
    repositories: 32,
    impact_score: 92,
    role_classification: 'Maintainer'
  }
};

// Mock merge request data
const MOCK_MERGE_REQUESTS: Record<string, Record<string, any>> = {
  'react-facebook-123456': {
    'add-new-feature-456789': {
      id: '456789',
      title: 'Add new feature',
      description: 'This PR adds an exciting new feature to React',
      state: 'open',
      author: 'johndoe',
      repository: 'facebook/react',
      commits_count: 5,
      additions: 250,
      deletions: 30,
      changed_files: 8,
      complexity_score: 76
    },
    'fix-bug-567890': {
      id: '567890',
      title: 'Fix critical rendering bug',
      description: 'Fixes the rendering issue in concurrent mode',
      state: 'merged',
      author: 'janesmith',
      repository: 'facebook/react',
      commits_count: 2,
      additions: 45,
      deletions: 12,
      changed_files: 3,
      complexity_score: 53
    }
  }
};

// Mock commit data
const MOCK_COMMITS: Record<string, Record<string, any>> = {
  'react-facebook-123456': {
    'abc123def456': {
      sha: 'abc123def456',
      message: 'Fix critical bug in render method',
      author_name: 'John Doe',
      author_username: 'johndoe',
      committed_at: '2023-05-10T15:32:45Z',
      additions: 25,
      deletions: 8,
      files_changed: 3
    },
    'def456ghi789': {
      sha: 'def456ghi789',
      message: 'Add documentation for hooks',
      author_name: 'Jane Smith',
      author_username: 'janesmith',
      committed_at: '2023-05-12T09:15:22Z',
      additions: 120,
      deletions: 0,
      files_changed: 5
    }
  }
};

interface UseDataOptions {
  initialData?: any;
  skipFetch?: boolean;
}

// Generic data loading hook that simulates API/database access with a delay
function useMockData<T>(
  mockDataSource: Record<string, T>,
  id: string,
  options: UseDataOptions = {}
) {
  const [data, setData] = useState<T | null>(options.initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!options.initialData && !options.skipFetch);
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const fetchData = () => {
    if (options.skipFetch) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate API delay
    setTimeout(() => {
      if (mockDataSource[id]) {
        setData(mockDataSource[id]);
        setIsLoading(false);
      } else {
        setError(new Error(`Entity with ID "${id}" not found`));
        setIsLoading(false);
      }
    }, 1000);
  };

  const retry = () => {
    setIsRetrying(true);
    fetchData();
    setTimeout(() => setIsRetrying(false), 1000);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  return {
    data,
    isLoading,
    error,
    retry,
    isRetrying
  };
}

// Mock repository data hook
export function useRepositoryData(
  repositorySlug: string,
  options: UseDataOptions = {}
) {
  return useMockData(MOCK_REPOSITORIES, repositorySlug, options);
}

// Mock contributor data hook
export function useContributorData(
  contributorSlug: string,
  options: UseDataOptions = {}
) {
  return useMockData(MOCK_CONTRIBUTORS, contributorSlug, options);
}

// Mock merge request data hook
export function useMergeRequestData(
  repositorySlug: string,
  mergeRequestSlug: string,
  options: UseDataOptions = {}
) {
  const [data, setData] = useState<any>(options.initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!options.initialData && !options.skipFetch);
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const fetchData = () => {
    if (options.skipFetch) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate API delay
    setTimeout(() => {
      if (MOCK_MERGE_REQUESTS[repositorySlug] && MOCK_MERGE_REQUESTS[repositorySlug][mergeRequestSlug]) {
        setData(MOCK_MERGE_REQUESTS[repositorySlug][mergeRequestSlug]);
        setIsLoading(false);
      } else {
        setError(new Error(`Merge request "${mergeRequestSlug}" not found in repository "${repositorySlug}"`));
        setIsLoading(false);
      }
    }, 1000);
  };

  const retry = () => {
    setIsRetrying(true);
    fetchData();
    setTimeout(() => setIsRetrying(false), 1000);
  };

  useEffect(() => {
    fetchData();
  }, [repositorySlug, mergeRequestSlug]);

  return {
    data,
    isLoading,
    error,
    retry,
    isRetrying
  };
}

// Mock commit data hook
export function useCommitData(
  repositorySlug: string,
  commitSha: string,
  fileSlug?: string,
  options: UseDataOptions = {}
) {
  const [data, setData] = useState<any>(options.initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(!options.initialData && !options.skipFetch);
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const fetchData = () => {
    if (options.skipFetch) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate API delay
    setTimeout(() => {
      if (MOCK_COMMITS[repositorySlug] && MOCK_COMMITS[repositorySlug][commitSha]) {
        setData(MOCK_COMMITS[repositorySlug][commitSha]);
        setIsLoading(false);
      } else {
        setError(new Error(`Commit "${commitSha}" not found in repository "${repositorySlug}"`));
        setIsLoading(false);
      }
    }, 1000);
  };

  const retry = () => {
    setIsRetrying(true);
    fetchData();
    setTimeout(() => setIsRetrying(false), 1000);
  };

  useEffect(() => {
    fetchData();
  }, [repositorySlug, commitSha]);

  return {
    data,
    isLoading,
    error,
    retry,
    isRetrying
  };
}

// Unified entity data hook
export function useEntityData(
  entityType: 'repository' | 'contributor' | 'mergeRequest' | 'commit',
  slugs: {
    repositorySlug?: string;
    contributorSlug?: string;
    mergeRequestSlug?: string;
    commitSha?: string;
    fileSlug?: string;
  },
  options: UseDataOptions = {}
) {
  // Get the appropriate data, loading, error, and retry function based on entity type
  switch (entityType) {
    case 'repository':
      return useRepositoryData(slugs.repositorySlug || '', options);
    
    case 'contributor':
      return useContributorData(slugs.contributorSlug || '', options);
    
    case 'mergeRequest':
      return useMergeRequestData(
        slugs.repositorySlug || '', 
        slugs.mergeRequestSlug || '', 
        options
      );
    
    case 'commit':
      return useCommitData(
        slugs.repositorySlug || '', 
        slugs.commitSha || '', 
        slugs.fileSlug,
        options
      );
    
    default:
      return {
        data: null,
        isLoading: false,
        error: new Error(`Unknown entity type: ${entityType}`),
        retry: () => {},
        isRetrying: false
      };
  }
} 