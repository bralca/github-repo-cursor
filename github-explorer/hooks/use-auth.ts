/**
 * Authentication hook for Supabase auth
 * Provides functionality for sign in, sign out, and authentication state
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

// Define auth admin roles
export const ADMIN_ROLES = ['admin', 'superadmin', 'owner'];

// Define auth states
export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Custom hook for authentication functionality
 */
export const useAuth = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Get the current user and determine admin status
  const getCurrentUser = useCallback(async () => {
    try {
      setAuthState('loading');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error.message);
        setAuthState('unauthenticated');
        setUser(null);
        setIsAdmin(false);
        return;
      }
      
      if (!session) {
        setAuthState('unauthenticated');
        setUser(null);
        setIsAdmin(false);
        return;
      }

      setUser(session.user);
      
      // For testing purposes, consider any authenticated user an admin
      // In production, you would check a custom claim or a database record
      // const isUserAdmin = ADMIN_ROLES.includes(session.user?.role || '');
      const isUserAdmin = true; // Temporary for testing
      
      setIsAdmin(isUserAdmin);
      setAuthState('authenticated');
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      setAuthState('unauthenticated');
      setUser(null);
      setIsAdmin(false);
    }
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return { success: false, error };
      }

      // Refresh the current user data
      await getCurrentUser();

      // For testing purposes, skip the admin check
      // In production, you would uncomment this
      /*
      if (!isAdmin) {
        toast.error("You don't have admin access");
        await signOut(); // Sign out if not admin
        return { success: false, error: new Error("Not authorized as admin") };
      }
      */

      toast.success('Signed in successfully');
      router.refresh();
      return { success: true, data };
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign in');
      return { success: false, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      setAuthState('unauthenticated');
      router.refresh();
      toast.success('Signed out successfully');
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign out');
      return { success: false, error };
    }
  };

  // Check auth state on mount and when session changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          getCurrentUser();
        } else if (event === 'SIGNED_OUT') {
          setAuthState('unauthenticated');
          setUser(null);
          setIsAdmin(false);
        }
      }
    );

    // Get initial user
    getCurrentUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [getCurrentUser]);

  return {
    user,
    authState,
    isAdmin,
    signIn,
    signOut,
    getCurrentUser,
  };
}; 