'use client';

import { useState, useCallback, useEffect } from 'react';

// Types for merge request data
export interface MergeRequestDetails {
  id: string;
  github_id: number;
  title: string;
  description: string;
  state: 'open' | 'closed' | 'merged';
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  commits_count: number;
  additions: number;
  deletions: number;
  changed_files: number;
  complexity_score: number | null;
  review_time_hours: number | null;
  cycle_time_hours: number | null;
  labels: string[];
  source_branch: string;
  target_branch: string;
  review_count: number;
  comment_count: number;
  repository: {
    id: string;
    github_id: number;
    name: string;
    full_name: string;
  };
  author: {
    id: string;
    github_id: number;
    username: string;
    name: string | null;
    avatar: string;
  };
  merged_by: {
    id: string;
    github_id: number;
    username: string;
    name: string | null;
    avatar: string;
  } | null;
}

export interface MergeRequestComment {
  id: string;
  author: {
    id: string;
    github_id: number;
    username: string;
    name: string | null;
    avatar: string;
  };
  content: string;
  created_at: string;
  updated_at: string;
  is_review_comment: boolean;
  position: {
    file_path: string;
    line_number: number;
  } | null;
}

export interface MergeRequestActivity {
  id: string;
  type: 'comment' | 'review' | 'state_change' | 'commit' | 'reference';
  actor: {
    id: string;
    github_id: number;
    username: string;
    name: string | null;
    avatar: string;
  };
  created_at: string;
  details: any; // This would be a union type based on activity type
}

export interface MergeRequestFile {
  file_path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch: string | null;
  previous_path?: string; // Only for renamed files
}

export interface MergeRequestCommit {
  github_id: string; // SHA
  message: string;
  author: {
    id: string;
    github_id: number;
    username: string;
    name: string | null;
    avatar: string;
  };
  committed_at: string;
  additions: number;
  deletions: number;
  changed_files: number;
}

interface PagedData<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Hook for fetching detailed merge request data
export function useMergeRequestDetails(
  repositoryGithubId: number, 
  mergeRequestGithubId: number,
  initialData?: Partial<MergeRequestDetails>
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<MergeRequestDetails | null>(initialData ? initialData as MergeRequestDetails : null);

  const fetchData = useCallback(async () => {
    if (!repositoryGithubId || !mergeRequestGithubId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate a delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data based on the IDs
      const mockData: MergeRequestDetails = {
        id: `mr-${repositoryGithubId}-${mergeRequestGithubId}`,
        github_id: mergeRequestGithubId,
        title: initialData?.title || `Merge Request #${mergeRequestGithubId}`,
        description: initialData?.description || 'This is a detailed description of the merge request that would include more information about what changes were made and why.',
        state: initialData?.state || 'closed',
        is_draft: false,
        created_at: initialData?.created_at || new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: initialData?.updated_at || new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        closed_at: initialData?.state === 'open' ? null : new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        merged_at: initialData?.state === 'merged' ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() : null,
        commits_count: 2,
        additions: initialData?.additions || 317,
        deletions: initialData?.deletions || 0,
        changed_files: initialData?.changed_files || 1,
        complexity_score: 42,
        review_time_hours: 3,
        cycle_time_hours: 24,
        labels: ['enhancement', 'translation'],
        source_branch: 'feature/spanish-translation',
        target_branch: 'main',
        review_count: 1,
        comment_count: 2,
        repository: {
          id: `repo-${repositoryGithubId}`,
          github_id: repositoryGithubId,
          name: initialData?.repository?.name || 'ShoulderSurfing',
          full_name: initialData?.repository?.full_name || 'TheLegendOfSaram/ShoulderSurfing'
        },
        author: {
          id: 'author-123',
          github_id: 73335686,
          username: 'TheLegendOfSaram',
          name: 'Saram',
          avatar: 'https://avatars.githubusercontent.com/u/73335686?v=4'
        },
        merged_by: {
          id: 'merger-456',
          github_id: 789012,
          username: 'repo-owner',
          name: 'Repository Owner',
          avatar: 'https://avatars.githubusercontent.com/u/789012?v=4'
        }
      };
      
      setData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch merge request details'));
    } finally {
      setLoading(false);
    }
  }, [repositoryGithubId, mergeRequestGithubId, initialData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
}

// Hook for fetching merge request comments with pagination
export function useMergeRequestComments(
  repositoryGithubId: number, 
  mergeRequestGithubId: number
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<PagedData<MergeRequestComment>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    hasMore: false
  });

  const fetchComments = useCallback(async (page: number = 1, pageSize: number = 10) => {
    if (!repositoryGithubId || !mergeRequestGithubId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Mock data
      const mockComments: MergeRequestComment[] = [
        {
          id: 'comment-1',
          author: {
            id: 'author-123',
            github_id: 73335686,
            username: 'TheLegendOfSaram',
            name: 'Saram',
            avatar: 'https://avatars.githubusercontent.com/u/73335686?v=4'
          },
          content: 'Just added the Spanish translation files as requested. Please review.',
          created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          is_review_comment: false,
          position: null
        },
        {
          id: 'comment-2',
          author: {
            id: 'reviewer-789',
            github_id: 789012,
            username: 'repo-owner',
            name: 'Repository Owner',
            avatar: 'https://avatars.githubusercontent.com/u/789012?v=4'
          },
          content: 'Looks good! Thank you for your contribution.',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          is_review_comment: true,
          position: null
        }
      ];
      
      setData({
        data: mockComments,
        total: mockComments.length,
        page,
        pageSize,
        hasMore: false
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch comments'));
    } finally {
      setLoading(false);
    }
  }, [repositoryGithubId, mergeRequestGithubId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const loadMore = useCallback(() => {
    if (!data.hasMore || loading) return;
    fetchComments(data.page + 1, data.pageSize);
  }, [data.hasMore, data.page, data.pageSize, fetchComments, loading]);

  return { 
    comments: data.data, 
    total: data.total, 
    loading, 
    error, 
    loadMore, 
    hasMore: data.hasMore 
  };
}

// Hook for fetching merge request activity with pagination
export function useMergeRequestActivity(
  repositoryGithubId: number, 
  mergeRequestGithubId: number
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<PagedData<MergeRequestActivity>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    hasMore: false
  });

  const fetchActivity = useCallback(async (page: number = 1, pageSize: number = 10) => {
    if (!repositoryGithubId || !mergeRequestGithubId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Mock data
      const mockActivity: MergeRequestActivity[] = [
        {
          id: 'activity-1',
          type: 'state_change',
          actor: {
            id: 'author-123',
            github_id: 73335686,
            username: 'TheLegendOfSaram',
            name: 'Saram',
            avatar: 'https://avatars.githubusercontent.com/u/73335686?v=4'
          },
          created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          details: { from: null, to: 'open' }
        },
        {
          id: 'activity-2',
          type: 'commit',
          actor: {
            id: 'author-123',
            github_id: 73335686,
            username: 'TheLegendOfSaram',
            name: 'Saram',
            avatar: 'https://avatars.githubusercontent.com/u/73335686?v=4'
          },
          created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          details: { 
            commit_id: 'abc123', 
            message: 'Added Spanish translation file' 
          }
        },
        {
          id: 'activity-3',
          type: 'review',
          actor: {
            id: 'reviewer-789',
            github_id: 789012,
            username: 'repo-owner',
            name: 'Repository Owner',
            avatar: 'https://avatars.githubusercontent.com/u/789012?v=4'
          },
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          details: { 
            state: 'approved' 
          }
        },
        {
          id: 'activity-4',
          type: 'state_change',
          actor: {
            id: 'reviewer-789',
            github_id: 789012,
            username: 'repo-owner',
            name: 'Repository Owner',
            avatar: 'https://avatars.githubusercontent.com/u/789012?v=4'
          },
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          details: { from: 'open', to: 'merged' }
        }
      ];
      
      setData({
        data: mockActivity,
        total: mockActivity.length,
        page,
        pageSize,
        hasMore: false
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch activity'));
    } finally {
      setLoading(false);
    }
  }, [repositoryGithubId, mergeRequestGithubId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const loadMore = useCallback(() => {
    if (!data.hasMore || loading) return;
    fetchActivity(data.page + 1, data.pageSize);
  }, [data.hasMore, data.page, data.pageSize, fetchActivity, loading]);

  return { 
    activities: data.data, 
    total: data.total, 
    loading, 
    error, 
    loadMore, 
    hasMore: data.hasMore 
  };
}

// Hook for fetching merge request files
export function useMergeRequestFiles(
  repositoryGithubId: number, 
  mergeRequestGithubId: number
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [files, setFiles] = useState<MergeRequestFile[]>([]);

  const fetchFiles = useCallback(async () => {
    if (!repositoryGithubId || !mergeRequestGithubId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Mock data
      const mockFiles: MergeRequestFile[] = [
        {
          file_path: 'lang/es_mx.json',
          status: 'added',
          additions: 317,
          deletions: 0,
          patch: '+ {\n+  "language": "Español (México)",\n+  "region": "México",\n+  "authors": ["TheLegendOfSaram"],\n+  "strings": {\n+    "menu.start": "Iniciar",\n+    "menu.options": "Opciones",\n+    "menu.quit": "Salir",\n+    // ... many more strings\n+  }\n+}'
        }
      ];
      
      setFiles(mockFiles);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch files'));
    } finally {
      setLoading(false);
    }
  }, [repositoryGithubId, mergeRequestGithubId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return { files, loading, error, refresh: fetchFiles };
}

// Hook for fetching merge request commits
export function useMergeRequestCommits(
  repositoryGithubId: number, 
  mergeRequestGithubId: number
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [commits, setCommits] = useState<MergeRequestCommit[]>([]);

  const fetchCommits = useCallback(async () => {
    if (!repositoryGithubId || !mergeRequestGithubId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Mock data
      const mockCommits: MergeRequestCommit[] = [
        {
          github_id: 'abc123def456',
          message: 'Added Spanish translation file',
          author: {
            id: 'author-123',
            github_id: 73335686,
            username: 'TheLegendOfSaram',
            name: 'Saram',
            avatar: 'https://avatars.githubusercontent.com/u/73335686?v=4'
          },
          committed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          additions: 317,
          deletions: 0,
          changed_files: 1
        },
        {
          github_id: 'xyz789uvw012',
          message: 'Fixed typo in Spanish translation',
          author: {
            id: 'author-123',
            github_id: 73335686,
            username: 'TheLegendOfSaram',
            name: 'Saram',
            avatar: 'https://avatars.githubusercontent.com/u/73335686?v=4'
          },
          committed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
          additions: 1,
          deletions: 1,
          changed_files: 1
        }
      ];
      
      setCommits(mockCommits);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch commits'));
    } finally {
      setLoading(false);
    }
  }, [repositoryGithubId, mergeRequestGithubId]);

  useEffect(() => {
    fetchCommits();
  }, [fetchCommits]);

  return { commits, loading, error, refresh: fetchCommits };
} 