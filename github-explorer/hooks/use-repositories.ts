'use client'

import { useSupabaseQuery, useSupabaseItem, useSupabasePaginatedList } from './supabase'
import { supabase } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

export interface Repository {
  id: string
  name: string
  full_name: string
  description: string | null
  owner: string
  stars: number
  forks: number
  language: string | null
  created_at: string
  updated_at: string
  last_commit_at: string | null
  is_fork: boolean
  is_archived: boolean
  url: string
  homepage: string | null
  topics: string[] | null
  license: string | null
  open_issues: number
  watchers: number
}

export interface RepositoryFilters {
  language?: string | null
  owner?: string | null
  minStars?: number | null
  search?: string | null
  isArchived?: boolean | null
  isFork?: boolean | null
}

/**
 * Hook for fetching a single repository by ID
 */
export function useRepository(id: string | undefined) {
  return useSupabaseItem<Repository>('repositories', id)
}

/**
 * Hook for fetching a paginated list of repositories
 */
export function useRepositories(
  page: number = 1,
  pageSize: number = 10,
  filters: RepositoryFilters = {}
) {
  return useQuery({
    queryKey: ['repositories', page, pageSize, filters],
    queryFn: async () => {
      const start = (page - 1) * pageSize
      const end = start + pageSize - 1
      
      let query = supabase
        .from('repositories')
        .select('*', { count: 'exact' })
      
      // Apply filters
      if (filters.language) {
        query = query.eq('language', filters.language)
      }
      
      if (filters.owner) {
        query = query.eq('owner', filters.owner)
      }
      
      if (filters.minStars) {
        query = query.gte('stars', filters.minStars)
      }
      
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }
      
      if (filters.isArchived !== null && filters.isArchived !== undefined) {
        query = query.eq('is_archived', filters.isArchived)
      }
      
      if (filters.isFork !== null && filters.isFork !== undefined) {
        query = query.eq('is_fork', filters.isFork)
      }
      
      // Apply pagination
      query = query.range(start, end)
      
      // Order by stars descending
      query = query.order('stars', { ascending: false })
      
      const { data, error, count } = await query
      
      if (error) {
        console.error('Error fetching repositories:', error)
        throw error
      }
      
      return {
        data: data as Repository[],
        count: count || 0,
        page,
        pageSize,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      }
    },
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook for fetching the top repositories by stars
 */
export function useTopRepositories(limit: number = 5) {
  return useQuery({
    queryKey: ['repositories', 'top', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .order('stars', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('Error fetching top repositories:', error)
        throw error
      }
      
      return data as Repository[]
    },
  })
}

/**
 * Hook for fetching repositories by language
 */
export function useRepositoriesByLanguage(language: string | null, limit: number = 10) {
  return useQuery({
    queryKey: ['repositories', 'language', language, limit],
    queryFn: async () => {
      if (!language) return []
      
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .eq('language', language)
        .order('stars', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error(`Error fetching repositories for language ${language}:`, error)
        throw error
      }
      
      return data as Repository[]
    },
    enabled: !!language,
  })
}

/**
 * Hook for fetching repositories by owner
 */
export function useRepositoriesByOwner(owner: string | null, limit: number = 10) {
  return useQuery({
    queryKey: ['repositories', 'owner', owner, limit],
    queryFn: async () => {
      if (!owner) return []
      
      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .eq('owner', owner)
        .order('stars', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error(`Error fetching repositories for owner ${owner}:`, error)
        throw error
      }
      
      return data as Repository[]
    },
    enabled: !!owner,
  })
} 