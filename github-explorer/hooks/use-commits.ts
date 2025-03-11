'use client';

import { useSupabaseItem } from './supabase';
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface Commit {
  id: string;
  repository_id: string;
  hash: string;
  title: string;
  author: string;
  date: string;
  author_name: string;
  author_email: string;
  committer_name: string;
  committer_email: string;
  message_body: string | null;
  url: string;
  stats_additions: number | null;
  stats_deletions: number | null;
  stats_total: number | null;
  files_changed: number | null;
  parents: any[] | null;
  verification_verified: boolean | null;
  verification_reason: string | null;
  authored_date: string | null;
  committed_date: string | null;
}

export interface CommitFilters {
  search?: string | null;
  author?: string | null;
  since?: string | null;
  until?: string | null;
  minChanges?: number | null;
}

/**
 * Hook for fetching a single commit by ID
 */
export function useCommit(id: string | undefined) {
  return useSupabaseItem<Commit>('commits', id);
}

/**
 * Hook for fetching a paginated list of commits
 */
export function useCommits(
  page: number = 1,
  pageSize: number = 10,
  filters: CommitFilters = {}
) {
  return useQuery({
    queryKey: ['commits', page, pageSize, filters],
    queryFn: async () => {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      
      let query = supabase
        .from('commits')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,message_body.ilike.%${filters.search}%`);
      }
      
      if (filters.author) {
        query = query.or(`author.ilike.%${filters.author}%,author_name.ilike.%${filters.author}%,author_email.ilike.%${filters.author}%`);
      }
      
      if (filters.since) {
        query = query.gte('date', filters.since);
      }
      
      if (filters.until) {
        query = query.lte('date', filters.until);
      }
      
      if (filters.minChanges) {
        query = query.gte('stats_total', filters.minChanges);
      }
      
      // Apply pagination
      query = query.range(start, end);
      
      // Order by date descending
      query = query.order('date', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching commits:', error);
        throw error;
      }
      
      return {
        data: data as Commit[],
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
 * Hook for fetching commits for a specific repository
 */
export function useRepositoryCommits(
  repositoryId: string | null,
  page: number = 1,
  pageSize: number = 10,
  filters: Omit<CommitFilters, 'repository'> = {}
) {
  return useQuery({
    queryKey: ['repository-commits', repositoryId, page, pageSize, filters],
    queryFn: async () => {
      if (!repositoryId) return { data: [], count: 0, page, pageSize, totalPages: 0 };
      
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      
      let query = supabase
        .from('commits')
        .select('*', { count: 'exact' })
        .eq('repository_id', repositoryId);
      
      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,message_body.ilike.%${filters.search}%`);
      }
      
      if (filters.author) {
        query = query.or(`author.ilike.%${filters.author}%,author_name.ilike.%${filters.author}%,author_email.ilike.%${filters.author}%`);
      }
      
      if (filters.since) {
        query = query.gte('date', filters.since);
      }
      
      if (filters.until) {
        query = query.lte('date', filters.until);
      }
      
      if (filters.minChanges) {
        query = query.gte('stats_total', filters.minChanges);
      }
      
      // Apply pagination
      query = query.range(start, end);
      
      // Order by date descending
      query = query.order('date', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error(`Error fetching commits for repository ${repositoryId}:`, error);
        throw error;
      }
      
      return {
        data: data as Commit[],
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
 * Hook for fetching recent commits
 */
export function useRecentCommits(limit: number = 5) {
  return useQuery({
    queryKey: ['commits', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commits')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching recent commits:', error);
        throw error;
      }
      
      return data as Commit[];
    },
  });
}

/**
 * Hook for fetching commit activity over time
 */
export function useCommitActivity(
  repositoryId: string | null,
  period: 'day' | 'week' | 'month' = 'week',
  limit: number = 52
) {
  return useQuery({
    queryKey: ['commit-activity', repositoryId, period, limit],
    queryFn: async () => {
      if (!repositoryId) return [];
      
      // This is a simplified version - in a real app, you would use a database function
      // or a specialized endpoint to get aggregated data
      const { data, error } = await supabase
        .from('commit_activity')
        .select('*')
        .eq('repository_id', repositoryId)
        .eq('period', period)
        .order('date', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error(`Error fetching commit activity for repository ${repositoryId}:`, error);
        throw error;
      }
      
      return data;
    },
    enabled: !!repositoryId,
  });
} 