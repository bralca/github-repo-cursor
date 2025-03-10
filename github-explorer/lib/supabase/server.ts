import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Creates a Supabase client for use in Server Components and Server Actions.
 * 
 * Use this function within server components to fetch data directly from Supabase.
 * Note: This simplified version doesn't use cookies for sessions - it's for data access only.
 */
export function createServerSupabaseClient() {
  // Use the environment variable names set in .env.local
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Your project's URL and Key are required to create a Supabase client!");
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * Creates a Supabase admin client for direct database operations
 * with service role privileges. This should only be used in secure
 * server-side contexts where elevated permissions are required.
 * 
 * NEVER expose this client to the client-side.
 */
export function createServiceSupabaseClient() {
  // Use the environment variable names set in .env.local
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials');
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} 