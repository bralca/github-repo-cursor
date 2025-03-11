'use client';

import { useSupabaseItem } from './supabase';
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface MergeRequest {
  id: string;
  repository_id: string;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  draft: boolean;
  user_id: string;
  assignee_id: string | null;
  body: string | null;
  comments_count: number;
  review_comments_count: number;
  commits_count: number;
  additions: number;
  deletions: number;
  changed_files: number;
  url: string;
  author_association: string;
  merge_commit_sha: string | null;
  head_ref: string;
  base_ref: string;
  labels: string[] | null;
}

export interface MergeRequestFilters {
  state?: 'open' | 'closed' | 'merged' | null;
  search?: string | null;
  author?: string | null;
  assignee?: string | null;
  draft?: boolean | null;
  minComments?: number | null;
}

/**
 * Hook for fetching a single merge request by ID
 */
export function useMergeRequest(id: string | undefined) {
  return useSupabaseItem<MergeRequest>('merge_requests', id);
}

/**
 * Hook for fetching a paginated list of merge requests
 */
export function useMergeRequests(
  page: number = 1,
  pageSize: number = 10,
  filters: MergeRequestFilters = {}
) {
  return useQuery({
    queryKey: ['merge-requests', page, pageSize, filters],
    queryFn: async () => {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      
      let query = supabase
        .from('merge_requests')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (filters.state) {
        query = query.eq('state', filters.state);
      }
      
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,body.ilike.%${filters.search}%`);
      }
      
      if (filters.author) {
        query = query.eq('user_id', filters.author);
      }
      
      if (filters.assignee) {
        query = query.eq('assignee_id', filters.assignee);
      }
      
      if (filters.draft !== null && filters.draft !== undefined) {
        query = query.eq('draft', filters.draft);
      }
      
      if (filters.minComments) {
        query = query.gte('comments_count', filters.minComments);
      }
      
      // Apply pagination
      query = query.range(start, end);
      
      // Order by created_at descending
      query = query.order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching merge requests:', error);
        throw error;
      }
      
      return {
        data: data as MergeRequest[],
        count: count || 0,
        page,
        pageSize,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      };
    },
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook for fetching merge requests for a specific repository
 */
export function useRepositoryMergeRequests(
  repositoryId: string | null,
  page: number = 1,
  pageSize: number = 10,
  filters: Omit<MergeRequestFilters, 'repository'> = {}
) {
  return useQuery({
    queryKey: ['repository-merge-requests', repositoryId, page, pageSize, filters],
    queryFn: async () => {
      if (!repositoryId) return { data: [], count: 0, page, pageSize, totalPages: 0 };
      
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      
      let query = supabase
        .from('merge_requests')
        .select('*', { count: 'exact' })
        .eq('repository_id', repositoryId);
      
      // Apply filters
      if (filters.state) {
        query = query.eq('state', filters.state);
      }
      
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,body.ilike.%${filters.search}%`);
      }
      
      if (filters.author) {
        query = query.eq('user_id', filters.author);
      }
      
      if (filters.assignee) {
        query = query.eq('assignee_id', filters.assignee);
      }
      
      if (filters.draft !== null && filters.draft !== undefined) {
        query = query.eq('draft', filters.draft);
      }
      
      if (filters.minComments) {
        query = query.gte('comments_count', filters.minComments);
      }
      
      // Apply pagination
      query = query.range(start, end);
      
      // Order by created_at descending
      query = query.order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error(`Error fetching merge requests for repository ${repositoryId}:`, error);
        throw error;
      }
      
      return {
        data: data as MergeRequest[],
        count: count || 0,
        page,
        pageSize,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      };
    },
    enabled: !!repositoryId,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook for fetching recent merge requests
 */
export function useRecentMergeRequests(limit: number = 5) {
  return useQuery({
    queryKey: ['merge-requests', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merge_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching recent merge requests:', error);
        throw error;
      }
      
      return data as MergeRequest[];
    },
  });
} 