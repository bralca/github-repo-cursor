'use client';

import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

/**
 * A wrapper around React Query's useMutation hook for Supabase mutations.
 * This hook provides a consistent way to mutate data in Supabase with React Query.
 * 
 * @param mutationFn - A function that performs the Supabase mutation
 * @param options - Additional React Query mutation options
 * @returns A React Query mutation result
 */
export function useSupabaseMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<{ data: TData | null; error: PostgrestError | null }>,
  options?: Omit<UseMutationOptions<TData, PostgrestError, TVariables>, 'mutationFn'>
): UseMutationResult<TData, PostgrestError, TVariables> {
  return useMutation<TData, PostgrestError, TVariables>({
    mutationFn: async (variables) => {
      const { data, error } = await mutationFn(variables);
      
      if (error) {
        console.error('Supabase mutation error:', error);
        toast.error(`Error updating data: ${error.message}`);
        throw error;
      }
      
      if (data === null) {
        return {} as TData;
      }
      
      return data;
    },
    ...options,
  });
}

/**
 * A hook for inserting a new item into a Supabase table.
 * 
 * @param table - The Supabase table name
 * @param options - Additional React Query mutation options
 * @returns A React Query mutation result
 */
export function useSupabaseInsert<TData = unknown, TVariables = unknown>(
  table: string,
  options?: Omit<UseMutationOptions<TData, PostgrestError, TVariables>, 'mutationFn'>
): UseMutationResult<TData, PostgrestError, TVariables> {
  return useSupabaseMutation<TData, TVariables>(
    async (variables) => {
      return await supabase
        .from(table)
        .insert(variables)
        .select()
        .single();
    },
    {
      onSuccess: (data) => {
        toast.success('Item created successfully');
        options?.onSuccess?.(data, {} as TVariables, { context: undefined });
      },
      ...options,
    }
  );
}

/**
 * A hook for updating an item in a Supabase table.
 * 
 * @param table - The Supabase table name
 * @param options - Additional React Query mutation options
 * @returns A React Query mutation result
 */
export function useSupabaseUpdate<TData = unknown, TVariables extends { id: string | number } = { id: string | number }>(
  table: string,
  options?: Omit<UseMutationOptions<TData, PostgrestError, TVariables>, 'mutationFn'>
): UseMutationResult<TData, PostgrestError, TVariables> {
  return useSupabaseMutation<TData, TVariables>(
    async (variables) => {
      const { id, ...rest } = variables;
      
      return await supabase
        .from(table)
        .update(rest)
        .eq('id', id)
        .select()
        .single();
    },
    {
      onSuccess: (data) => {
        toast.success('Item updated successfully');
        options?.onSuccess?.(data, {} as TVariables, { context: undefined });
      },
      ...options,
    }
  );
}

/**
 * A hook for deleting an item from a Supabase table.
 * 
 * @param table - The Supabase table name
 * @param options - Additional React Query mutation options
 * @returns A React Query mutation result
 */
export function useSupabaseDelete<TData = unknown>(
  table: string,
  options?: Omit<UseMutationOptions<TData, PostgrestError, string | number>, 'mutationFn'>
): UseMutationResult<TData, PostgrestError, string | number> {
  return useSupabaseMutation<TData, string | number>(
    async (id) => {
      return await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .select()
        .single();
    },
    {
      onSuccess: (data) => {
        toast.success('Item deleted successfully');
        options?.onSuccess?.(data, '' as string | number, { context: undefined });
      },
      ...options,
    }
  );
} 