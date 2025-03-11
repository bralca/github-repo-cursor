'use client';

import { useSupabaseItem, useSupabasePaginatedList } from './supabase';
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface Contributor {
  id: string;
  username: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  email: string | null;
  twitter_username: string | null;
  blog: string | null;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  created_at: string;
  updated_at: string;
  repositories: number | null;
  direct_commits: number | null;
  pull_requests_merged: number | null;
  url: string;
}

export interface ContributorFilters {
  search?: string | null;
  minContributions?: number | null;
  minRepositories?: number | null;
  company?: string | null;
}

/**
 * Hook for fetching a single contributor by ID
 */
export function useContributor(id: string | undefined) {
  return useSupabaseItem<Contributor>('contributors', id);
}

/**
 * Hook for fetching a paginated list of contributors
 */
export function useContributors(
  page: number = 1,
  pageSize: number = 10,
  filters: ContributorFilters = {}
) {
  return useQuery({
    queryKey: ['contributors', page, pageSize, filters],
    queryFn: async () => {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      
      let query = supabase
        .from('contributors')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (filters.search) {
        query = query.or(`username.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
      }
      
      if (filters.minContributions) {
        // This would need a join with contributor_repository or a different approach
        // For now, we'll skip this filter
      }
      
      if (filters.minRepositories) {
        // Use the repositories column from the schema
        query = query.gte('repositories', filters.minRepositories);
      }
      
      if (filters.company) {
        query = query.ilike('company', `%${filters.company}%`);
      }
      
      // Apply pagination
      query = query.range(start, end);
      
      // Order by repositories or followers as a proxy for contribution activity
      query = query.order('repositories', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching contributors:', error);
        throw error;
      }
      
      return {
        data: data as Contributor[],
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
 * Hook for fetching the top contributors by repositories count
 */
export function useTopContributors(limit: number = 5) {
  return useQuery({
    queryKey: ['contributors', 'top', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contributors')
        .select('*')
        // Order by repositories count
        .order('repositories', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching top contributors:', error);
        throw error;
      }
      
      return data as Contributor[];
    },
  });
}

/**
 * Hook for fetching contributors for a specific repository
 * This uses the contributor_repository junction table
 */
export function useRepositoryContributors(repositoryId: string | null, limit: number = 10) {
  return useQuery({
    queryKey: ['repository-contributors', repositoryId, limit],
    queryFn: async () => {
      if (!repositoryId) return [];
      
      // Join with contributor_repository to get contribution counts
      const { data, error } = await supabase
        .from('contributor_repository')
        .select(`
          contribution_count,
          contributors:contributor_id(*)
        `)
        .eq('repository_id', repositoryId)
        .order('contribution_count', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error(`Error fetching contributors for repository ${repositoryId}:`, error);
        throw error;
      }
      
      // Extract the contributors from the nested structure and add contribution count
      return data.map((item: any) => ({
        ...item.contributors,
        contribution_count: item.contribution_count
      })) as (Contributor & { contribution_count: number })[];
    },
    enabled: !!repositoryId,
  });
}

/**
 * Hook for fetching contributors by company
 */
export function useContributorsByCompany(company: string | null, limit: number = 10) {
  return useQuery({
    queryKey: ['contributors', 'company', company, limit],
    queryFn: async () => {
      if (!company) return [];
      
      const { data, error } = await supabase
        .from('contributors')
        .select('*')
        .ilike('company', `%${company}%`)
        // Order by repositories as a proxy for activity
        .order('repositories', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error(`Error fetching contributors for company ${company}:`, error);
        throw error;
      }
      
      return data as Contributor[];
    },
    enabled: !!company,
  });
} 