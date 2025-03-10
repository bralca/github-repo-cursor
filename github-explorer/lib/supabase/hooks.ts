import { useQuery, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
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
  options: QueryOptions<T> = {}
) {
  return useQuery({
    queryKey,
    queryFn,
    retry: options.retry ?? 1,
    staleTime: options.staleTime,
    gcTime: options.cacheTime,
    enabled: options.enabled,
    onSuccess: options.onSuccess,
    onError: (error: Error) => {
      console.error('Supabase query error:', error);
      toast.error(`Error fetching data: ${error.message}`);
      if (options.onError) {
        options.onError(error);
      }
    },
  });
}

interface MutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  invalidateQueries?: QueryKey[];
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
  options: MutationOptions<TData, TVariables> = {}
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      if (options.onSuccess) {
        options.onSuccess(data, variables);
      }
      
      // Invalidate affected queries
      if (options.invalidateQueries?.length) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
    onError: (error: Error, variables) => {
      console.error('Supabase mutation error:', error);
      toast.error(`Error updating data: ${error.message}`);
      if (options.onError) {
        options.onError(error, variables);
      }
    },
    onSettled: (data, error, variables) => {
      if (data && !error && options.onSettled) {
        options.onSettled(data, null, variables as TVariables);
      } else if (error && options.onSettled) {
        options.onSettled(undefined, error as Error, variables as TVariables);
      }
    },
  });
} 