'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary component to catch and display errors gracefully
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Here you could send the error to an error reporting service
    // Example: errorReportingService.captureException(error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorDisplay error={this.state.error} />;
    }

    return this.props.children;
  }
}

interface ErrorDisplayProps {
  error?: Error;
  resetCallback?: () => void;
}

/**
 * Error display component that shows error details and recovery options
 */
export function ErrorDisplay({ error, resetCallback }: ErrorDisplayProps) {
  const router = useRouter();

  const handleRetry = React.useCallback(() => {
    if (resetCallback) {
      resetCallback();
    } else {
      // Refresh the current page
      router.refresh();
    }
  }, [resetCallback, router]);

  const handleGoHome = React.useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-4">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">Something went wrong</CardTitle>
          <CardDescription>
            We encountered an unexpected error while rendering this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">
              {error?.message || 'Unknown error occurred'}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" onClick={handleGoHome}>
            Go to Home
          </Button>
          <Button onClick={handleRetry}>Try Again</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 