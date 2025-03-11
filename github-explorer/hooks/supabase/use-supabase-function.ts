'use client';

import { useMutation, UseMutationOptions, UseMutationResult, useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

/**
 * A hook for invoking Supabase Edge Functions with React Query's useQuery.
 * 
 * @param functionName - The name of the Edge Function to invoke
 * @param payload - The payload to send to the function
 * @param options - Additional React Query options
 * @returns A React Query result with the function response
 */
export function useSupabaseFunction<TData = unknown, TPayload = unknown>(
  functionName: string,
  payload?: TPayload,
  options?: Omit<UseQueryOptions<TData, Error, TData>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, Error> {
  return useQuery<TData, Error>({
    queryKey: ['edge-function', functionName, payload],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke<TData>(functionName, {
          body: payload,
        });
        
        if (error) {
          console.error(`Error invoking function ${functionName}:`, error);
          toast.error(`Error invoking function: ${error.message}`);
          throw error;
        }
        
        return data;
      } catch (error: any) {
        console.error(`Error invoking function ${functionName}:`, error);
        toast.error(`Error invoking function: ${error.message || 'Unknown error'}`);
        throw error;
      }
    },
    ...options,
  });
}

/**
 * A hook for invoking Supabase Edge Functions with React Query's useMutation.
 * 
 * @param functionName - The name of the Edge Function to invoke
 * @param options - Additional React Query mutation options
 * @returns A React Query mutation result
 */
export function useSupabaseFunctionMutation<TData = unknown, TPayload = unknown>(
  functionName: string,
  options?: Omit<UseMutationOptions<TData, Error, TPayload>, 'mutationFn'>
): UseMutationResult<TData, Error, TPayload> {
  return useMutation<TData, Error, TPayload>({
    mutationFn: async (payload: TPayload) => {
      try {
        const { data, error } = await supabase.functions.invoke<TData>(functionName, {
          body: payload,
        });
        
        if (error) {
          console.error(`Error invoking function ${functionName}:`, error);
          toast.error(`Error invoking function: ${error.message}`);
          throw error;
        }
        
        return data;
      } catch (error: any) {
        console.error(`Error invoking function ${functionName}:`, error);
        toast.error(`Error invoking function: ${error.message || 'Unknown error'}`);
        throw error;
      }
    },
    ...options,
  });
}

/**
 * A hook for invoking Supabase Edge Functions with authentication.
 * This ensures the user's JWT token is included in the request.
 * 
 * @param functionName - The name of the Edge Function to invoke
 * @param options - Additional React Query mutation options
 * @returns A React Query mutation result
 */
export function useAuthenticatedSupabaseFunctionMutation<TData = unknown, TPayload = unknown>(
  functionName: string,
  options?: Omit<UseMutationOptions<TData, Error, TPayload>, 'mutationFn'>
): UseMutationResult<TData, Error, TPayload> {
  return useMutation<TData, Error, TPayload>({
    mutationFn: async (payload: TPayload) => {
      try {
        // Get the current session to include the auth token
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          const error = new Error('Authentication required');
          toast.error('Authentication required to invoke this function');
          throw error;
        }
        
        const { data, error } = await supabase.functions.invoke<TData>(functionName, {
          body: payload,
          // The token is automatically included when using the Supabase client
        });
        
        if (error) {
          console.error(`Error invoking authenticated function ${functionName}:`, error);
          toast.error(`Error invoking function: ${error.message}`);
          throw error;
        }
        
        return data;
      } catch (error: any) {
        console.error(`Error invoking authenticated function ${functionName}:`, error);
        toast.error(`Error invoking function: ${error.message || 'Unknown error'}`);
        throw error;
      }
    },
    ...options,
  });
} 