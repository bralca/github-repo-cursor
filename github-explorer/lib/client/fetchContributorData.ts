'use client';

import { useState, useEffect } from 'react';

export interface ContributorDetailData {
  id: string;
  github_id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  repositories: number | null;
  impact_score: number | null;
  role_classification: string | null;
  // Additional fields that might be loaded client-side
  direct_commits?: number;
  pull_requests_merged?: number;
  pull_requests_rejected?: number;
  code_reviews?: number;
  first_contribution?: string;
  last_contribution?: string;
  top_languages?: string[];
}

export interface ContributorRepository {
  id: string;
  name: string;
  full_name: string;
  description: string | null;
  commit_count: number;
  primary_language: string | null;
  last_contribution_date: string;
}

export interface ContributorActivity {
  id: string;
  type: 'commit' | 'pull_request' | 'review';
  repository_name: string;
  title: string;
  date: string;
  url: string;
}

export interface PagedData<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Hook for loading contributor detailed data
 */
export function useContributorDetails(githubId: string, initialData?: ContributorDetailData) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributor, setContributor] = useState<ContributorDetailData | null>(initialData || null);

  useEffect(() => {
    const fetchData = async () => {
      if (!githubId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would fetch data from an API
        // For MVP, we'll simulate loading with a delay and mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock enhanced contributor data
        setContributor({
          id: 'contrib-1',
          github_id: githubId,
          name: initialData?.name || 'GitHub Developer',
          username: initialData?.username || 'dev123',
          avatar: initialData?.avatar || 'https://avatars.githubusercontent.com/u/1234567',
          bio: initialData?.bio || 'Full-stack developer with a passion for open source',
          company: initialData?.company || 'Tech Company',
          location: initialData?.location || 'San Francisco, CA',
          repositories: initialData?.repositories || 42,
          impact_score: initialData?.impact_score || 85,
          role_classification: initialData?.role_classification || 'Core Contributor',
          direct_commits: 128,
          pull_requests_merged: 42,
          pull_requests_rejected: 15,
          code_reviews: 86,
          first_contribution: '2022-01-15',
          last_contribution: '2023-03-10',
          top_languages: ['JavaScript', 'TypeScript', 'Python'],
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load contributor details:', err);
        setError('Failed to load contributor details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [githubId]);
  
  return {
    contributor,
    loading,
    error,
    refresh: () => {
      setLoading(true);
      // Re-fetch data implementation would go here
      // For MVP, we just simulate loading
      setTimeout(() => setLoading(false), 800);
    }
  };
}

/**
 * Hook for loading contributor repositories with pagination
 */
export function useContributorRepositories(githubId: string, pageSize: number = 10) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<ContributorRepository[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadRepositories = async (cursor?: string) => {
    if (!githubId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would fetch data from an API
      // For MVP, we'll simulate loading with a delay and mock data
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Mock repository data
      const newRepositories: ContributorRepository[] = [
        { 
          id: cursor ? 'repo-4' : 'repo-1', 
          name: cursor ? 'advanced-analytics' : 'project-alpha', 
          full_name: cursor ? 'organization/advanced-analytics' : 'organization/project-alpha',
          description: cursor ? 'Advanced data analytics platform' : 'A cutting-edge web application framework',
          commit_count: cursor ? 18 : 48,
          primary_language: cursor ? 'Python' : 'TypeScript',
          last_contribution_date: new Date(Date.now() - (cursor ? 21 : 7) * 86400000).toISOString()
        },
        { 
          id: cursor ? 'repo-5' : 'repo-2', 
          name: cursor ? 'mobile-app' : 'data-processor', 
          full_name: cursor ? 'organization/mobile-app' : 'organization/data-processor',
          description: cursor ? 'Cross-platform mobile application' : 'High-performance data processing library',
          commit_count: cursor ? 22 : 32,
          primary_language: cursor ? 'React Native' : 'Python',
          last_contribution_date: new Date(Date.now() - (cursor ? 28 : 14) * 86400000).toISOString()
        },
        { 
          id: cursor ? 'repo-6' : 'repo-3', 
          name: cursor ? 'documentation' : 'ui-components', 
          full_name: cursor ? 'organization/documentation' : 'organization/ui-components',
          description: cursor ? 'Project documentation and guides' : 'Reusable UI component library',
          commit_count: cursor ? 15 : 27,
          primary_language: cursor ? 'Markdown' : 'JavaScript',
          last_contribution_date: new Date(Date.now() - (cursor ? 35 : 30) * 86400000).toISOString()
        },
      ];
      
      if (cursor) {
        setRepositories(prevRepos => [...prevRepos, ...newRepositories]);
        setNextCursor(newRepositories.length >= pageSize ? 'next-page-2' : null);
        setHasMore(newRepositories.length >= pageSize && cursor !== 'next-page-1');
      } else {
        setRepositories(newRepositories);
        setNextCursor('next-page-1');
        setHasMore(true);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load contributor repositories:', err);
      setError('Failed to load repositories. Please try again later.');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadRepositories();
  }, [githubId, pageSize]);
  
  const loadMore = () => {
    if (nextCursor && hasMore && !loading) {
      loadRepositories(nextCursor);
    }
  };
  
  return {
    repositories,
    loading,
    error,
    hasMore,
    loadMore,
    refresh: () => loadRepositories()
  };
}

/**
 * Hook for loading contributor activities with pagination
 */
export function useContributorActivities(
  githubId: string,
  activityType: 'all' | 'commit' | 'pull_request' | 'review' = 'all',
  pageSize: number = 10
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<ContributorActivity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadActivities = async (cursor?: string) => {
    if (!githubId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would fetch data from an API
      // For MVP, we'll simulate loading with a delay and mock data
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Mock base activities
      let newActivities: ContributorActivity[] = [
        {
          id: cursor ? 'act-7' : 'act-1',
          type: 'pull_request',
          repository_name: 'project-alpha',
          title: cursor ? 'Refactor authentication service' : 'Add new authentication feature',
          date: new Date(Date.now() - (cursor ? 18 : 3) * 86400000).toISOString(),
          url: '#'
        },
        {
          id: cursor ? 'act-8' : 'act-2',
          type: 'commit',
          repository_name: 'data-processor',
          title: cursor ? 'Add unit tests for parser' : 'Fix performance issue in data parser',
          date: new Date(Date.now() - (cursor ? 21 : 5) * 86400000).toISOString(),
          url: '#'
        },
        {
          id: cursor ? 'act-9' : 'act-3',
          type: 'review',
          repository_name: 'ui-components',
          title: cursor ? 'Review form validation' : 'Review component accessibility improvements',
          date: new Date(Date.now() - (cursor ? 24 : 7) * 86400000).toISOString(),
          url: '#'
        },
        {
          id: cursor ? 'act-10' : 'act-4',
          type: 'commit',
          repository_name: 'project-alpha',
          title: cursor ? 'Fix typos in documentation' : 'Update API documentation',
          date: new Date(Date.now() - (cursor ? 27 : 9) * 86400000).toISOString(),
          url: '#'
        },
        {
          id: cursor ? 'act-11' : 'act-5',
          type: 'pull_request',
          repository_name: 'ui-components',
          title: cursor ? 'Implement dark mode' : 'Add new button variants',
          date: new Date(Date.now() - (cursor ? 30 : 12) * 86400000).toISOString(),
          url: '#'
        },
        {
          id: cursor ? 'act-12' : 'act-6',
          type: 'review',
          repository_name: 'data-processor',
          title: cursor ? 'Review error handling' : 'Code review for performance optimizations',
          date: new Date(Date.now() - (cursor ? 33 : 15) * 86400000).toISOString(),
          url: '#'
        },
      ];
      
      // Filter by activity type if needed
      if (activityType !== 'all') {
        newActivities = newActivities.filter(activity => activity.type === activityType);
      }
      
      if (cursor) {
        setActivities(prevActivities => [...prevActivities, ...newActivities]);
        setNextCursor(newActivities.length >= pageSize ? 'next-page-2' : null);
        setHasMore(newActivities.length >= pageSize && cursor !== 'next-page-1');
      } else {
        setActivities(newActivities);
        setNextCursor('next-page-1');
        setHasMore(true);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load contributor activities:', err);
      setError('Failed to load activities. Please try again later.');
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadActivities();
  }, [githubId, activityType, pageSize]);
  
  const loadMore = () => {
    if (nextCursor && hasMore && !loading) {
      loadActivities(nextCursor);
    }
  };
  
  return {
    activities,
    loading,
    error,
    hasMore,
    loadMore,
    refresh: () => loadActivities()
  };
}

/**
 * Hook for loading contributor statistics over time
 */
export function useContributorStats(githubId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchStats = async () => {
      if (!githubId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would fetch data from an API
        // For MVP, we'll simulate loading with a delay and mock data
        await new Promise(resolve => setTimeout(resolve, 700));
        
        // Mock contribution stats by month
        setStats({
          'Jan': 15,
          'Feb': 21,
          'Mar': 18,
          'Apr': 32,
          'May': 27,
          'Jun': 38
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load contributor stats:', err);
        setError('Failed to load statistics. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [githubId]);
  
  return {
    stats,
    loading,
    error,
    refresh: () => {
      setLoading(true);
      // Re-fetch implementation would go here
      setTimeout(() => setLoading(false), 700);
    }
  };
}

/**
 * Hook for loading contributor language distribution
 */
export function useContributorLanguages(githubId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);

  useEffect(() => {
    const fetchLanguages = async () => {
      if (!githubId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would fetch data from an API
        // For MVP, we'll simulate loading with a delay and mock data
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Mock language data with weighted distribution
        // Duplicate entries indicate higher usage of that language
        setLanguages([
          'JavaScript', 'JavaScript', 'JavaScript',
          'TypeScript', 'TypeScript', 
          'Python', 'Python', 'Python', 'Python',
          'HTML', 
          'CSS'
        ]);
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load contributor languages:', err);
        setError('Failed to load language distribution. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchLanguages();
  }, [githubId]);
  
  return {
    languages,
    loading,
    error,
    refresh: () => {
      setLoading(true);
      // Re-fetch implementation would go here
      setTimeout(() => setLoading(false), 600);
    }
  };
} 