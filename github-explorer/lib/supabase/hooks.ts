import { useQuery, useMutation, useQueryClient, type QueryKey, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { supabase } from './client';
import { toast } from 'sonner';

type QueryFn<T> = (...args: any[]) => Promise<T>;

interface QueryOptions<T> {
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retry?: boolean | number;
  staleTime?: number;
  cacheTime?: number;
}

/**
 * Custom hook for fetching data from Supabase using React Query
 * 
 * @param queryKey Unique key for identifying this query in the cache
 * @param queryFn Function that returns a promise with the data
 * @param options Additional options for the query
 * @returns React Query result with data, loading state, and error handling
 */
export function useSupabaseQuery<T>(
  queryKey: QueryKey,
  queryFn: QueryFn<T>,
  options?: Omit<UseQueryOptions<T, Error, T, QueryKey>, 'queryKey' | 'queryFn'>
) {
  // Create the query options
  const queryOptions: UseQueryOptions<T, Error, T, QueryKey> = {
    queryKey,
    queryFn,
    retry: 1,
    ...options,
  };

  return useQuery(queryOptions);
}

/**
 * Custom hook for modifying data in Supabase using React Query's mutation
 * 
 * @param mutationFn Function that performs the data modification
 * @param options Additional options for the mutation
 * @returns React Query mutation result with loading state and error handling
 */
export function useSupabaseMutation<TData, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    ...options,
    onError: (error, variables, context) => {
      console.error('Supabase mutation error:', error);
      toast.error(`Error updating data: ${error.message}`);
      
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
  });
} 