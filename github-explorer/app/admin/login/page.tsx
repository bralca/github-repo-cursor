'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignInForm } from '@/components/auth/sign-in-form';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const { authState, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Login page loaded');
    console.log('Auth state:', authState);
    console.log('Is admin:', isAdmin);
    
    // If already authenticated, redirect to admin dashboard
    if (authState === 'authenticated' && isAdmin) {
      console.log('Already authenticated, redirecting to admin dashboard');
      window.location.href = '/admin';
    }
  }, [authState, isAdmin, router]);

  // Show loading state while checking authentication
  if (authState === 'loading') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-lg">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <SignInForm />
      
      {/* Debug info - remove in production */}
      <div className="mt-8 text-xs text-muted-foreground">
        <p>Auth State: {authState}</p>
        <p>Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
} 