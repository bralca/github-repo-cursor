'use client'

import { useSupabaseQuery } from '@/lib/supabase/hooks'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

export type Repository = Database['public']['Tables']['repositories']['Row']

interface RepositoriesResult {
  repositories: Repository[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface UseRepositoriesOptions {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: keyof Repository
  sortOrder?: 'asc' | 'desc'
}

/**
 * Hook for fetching repositories from Supabase
 */
export function useRepositories({
  page = 1,
  pageSize = 10,
  search = '',
  sortBy = 'stars',
  sortOrder = 'desc',
}: UseRepositoriesOptions = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  return useSupabaseQuery<RepositoriesResult>(
    ['repositories', { page, pageSize, search, sortBy, sortOrder }],
    async () => {
      let query = supabase
        .from('repositories')
        .select('*', { count: 'exact' })
      
      // Apply search filter if provided
      if (search) {
        query = query.ilike('name', `%${search}%`)
      }
      
      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
      
      // Apply pagination
      query = query.range(from, to)
      
      const { data, error, count } = await query
      
      if (error) {
        throw error
      }
      
      return {
        repositories: data as Repository[],
        totalCount: count ?? 0,
        page,
        pageSize,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      }
    }
  )
} 