'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Form validation schema
const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormValues = z.infer<typeof formSchema>;

export function SignInForm() {
  const { signIn, authState, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  // Get the redirect URL from the query parameters
  const redirectTo = searchParams.get('redirectTo') || '/admin';
  
  // Handle redirection after successful login
  useEffect(() => {
    const logState = () => {
      console.log('=== AUTH STATE CHECK ===');
      console.log('Auth State:', authState);
      console.log('Is Admin:', isAdmin);
      console.log('Login Success:', loginSuccess);
      console.log('Redirect To:', redirectTo);
      console.log('========================');
    };
    
    logState();
    
    // Only redirect if we're authenticated AND we've just successfully logged in
    if (authState === 'authenticated' && isAdmin && loginSuccess) {
      console.log('REDIRECTING NOW to:', redirectTo);
      
      // Use a small delay to ensure state is updated
      setTimeout(() => {
        // Force a hard navigation to break any redirect loops
        window.location.href = redirectTo;
      }, 500);
    }
  }, [authState, isAdmin, loginSuccess, redirectTo, router]);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Form submission handler
  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    console.log('Starting sign in process with:', values.email);
    
    try {
      const { success, error } = await signIn(values.email, values.password);
      
      console.log('Sign in result:', { success, error });
      
      if (success) {
        toast.success('Signed in successfully, redirecting...');
        console.log('Sign in successful, setting loginSuccess to true');
        
        // Set a cookie directly to ensure middleware can detect it
        document.cookie = "supabase-auth-token=true; path=/; max-age=2592000"; // 30 days
        
        // Set login success state to trigger redirect
        setLoginSuccess(true);
      } else if (error) {
        toast.error(error.message || 'Failed to sign in');
        console.error('Sign in error:', error);
      }
    } catch (error) {
      console.error('Error in sign in:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Admin Access</h1>
        <p className="text-muted-foreground">
          Sign in to access the admin dashboard
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="admin@example.com"
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </Form>
      
      {/* Debug info - remove in production */}
      <div className="mt-4 text-xs text-muted-foreground">
        <p>Auth State: {authState}</p>
        <p>Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
        <p>Login Success: {loginSuccess ? 'Yes' : 'No'}</p>
        <p>Redirect To: {redirectTo}</p>
      </div>
    </div>
  );
} 