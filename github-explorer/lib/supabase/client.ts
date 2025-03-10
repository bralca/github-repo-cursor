import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// For client-side code, environment variables must be prefixed with NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

// Log these for debugging - these shouldn't contain actual values, just for debugging
console.log("Client-side environment check:", {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
});

// Check if we're in development and provide helpful debug info
if (!supabaseUrl || !supabaseKey) {
  // In development, show more detailed error
  if (process.env.NODE_ENV === 'development') {
    console.error(
      "🔍 Missing Supabase credentials in client-side code.\n" +
      "For client components to access Supabase, you need environment variables with NEXT_PUBLIC_ prefix:\n" +
      "  - NEXT_PUBLIC_SUPABASE_URL\n" +
      "  - NEXT_PUBLIC_SUPABASE_KEY\n" +
      "Add these to your .env.local file."
    );
  }
}

/**
 * Create a Supabase client for client-side interactions.
 * This client uses the anon key and should only be used
 * for operations permitted through Row Level Security (RLS) policies.
 */
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      storageKey: 'supabase-auth-token',
      storage: {
        getItem: (key) => {
          if (typeof window === 'undefined') {
            return null;
          }
          
          const item = window.localStorage.getItem(key);
          console.log(`[Auth] Getting item from storage: ${key}, exists: ${!!item}`);
          return item;
        },
        setItem: (key, value) => {
          if (typeof window === 'undefined') {
            return;
          }
          
          console.log(`[Auth] Setting item in storage: ${key}`);
          window.localStorage.setItem(key, value);
          
          // Also set a cookie for middleware access
          document.cookie = `${key}=true; path=/; max-age=2592000`; // 30 days
        },
        removeItem: (key) => {
          if (typeof window === 'undefined') {
            return;
          }
          
          console.log(`[Auth] Removing item from storage: ${key}`);
          window.localStorage.removeItem(key);
          
          // Also remove the cookie
          document.cookie = `${key}=; path=/; max-age=0`;
        },
      },
    },
  }
); 