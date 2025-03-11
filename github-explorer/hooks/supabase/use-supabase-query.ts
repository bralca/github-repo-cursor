'use client';

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

/**
 * A wrapper around React Query's useQuery hook for Supabase queries.
 * This hook provides a consistent way to fetch data from Supabase with React Query.
 * 
 * @param queryKey - The React Query key for caching and deduplication
 * @param queryFn - A function that returns a Supabase query
 * @param options - Additional React Query options
 * @returns A React Query result with data, error, and loading state
 */
export function useSupabaseQuery<TData = unknown>(
  queryKey: string[],
  queryFn: () => Promise<{ data: TData | null; error: PostgrestError | null }>,
  options?: Omit<UseQueryOptions<TData, PostgrestError, TData>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, PostgrestError> {
  return useQuery<TData, PostgrestError>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await queryFn();
      
      if (error) {
        console.error('Supabase query error:', error);
        toast.error(`Error fetching data: ${error.message}`);
        throw error;
      }
      
      if (data === null) {
        return [] as unknown as TData;
      }
      
      return data;
    },
    ...options,
  });
}

/**
 * A hook for fetching a single item by ID from a Supabase table.
 * 
 * @param table - The Supabase table name
 * @param id - The ID of the item to fetch
 * @param options - Additional React Query options
 * @returns A React Query result with the item data
 */
export function useSupabaseItem<TData = unknown>(
  table: string,
  id: string | number | undefined,
  options?: Omit<UseQueryOptions<TData, PostgrestError, TData>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, PostgrestError> {
  return useSupabaseQuery<TData>(
    [table, 'item', id ? id.toString() : 'undefined'],
    async () => {
      if (!id) {
        return { data: null, error: null };
      }
      
      return await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
    },
    {
      enabled: !!id,
      ...options,
    }
  );
}

/**
 * A hook for fetching a list of items from a Supabase table.
 * 
 * @param table - The Supabase table name
 * @param options - Additional React Query options
 * @returns A React Query result with the list data
 */
export function useSupabaseList<TData = unknown>(
  table: string,
  options?: Omit<UseQueryOptions<TData[], PostgrestError, TData[]>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData[], PostgrestError> {
  return useSupabaseQuery<TData[]>(
    [table, 'list'],
    async () => {
      return await supabase
        .from(table)
        .select('*');
    },
    options
  );
}

/**
 * A hook for fetching a paginated list of items from a Supabase table.
 * 
 * @param table - The Supabase table name
 * @param page - The current page number (1-based)
 * @param pageSize - The number of items per page
 * @param options - Additional React Query options
 * @returns A React Query result with the paginated data
 */
export function useSupabasePaginatedList<TData = unknown>(
  table: string,
  page: number = 1,
  pageSize: number = 10,
  options?: Omit<UseQueryOptions<TData[], PostgrestError, TData[]>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData[], PostgrestError> {
  return useSupabaseQuery<TData[]>(
    [table, 'list', 'page', page.toString(), 'pageSize', pageSize.toString()],
    async () => {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      
      return await supabase
        .from(table)
        .select('*')
        .range(start, end);
    },
    {
      placeholderData: (previousData) => previousData,
      ...options,
    }
  );
} 