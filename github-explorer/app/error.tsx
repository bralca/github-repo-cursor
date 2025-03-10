'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/error-boundary';
import { Container } from '@/components/ui/container';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Router Error:', error);
  }, [error]);

  return (
    <Container centered className="min-h-[70vh]">
      <ErrorDisplay error={error} resetCallback={reset} />
    </Container>
  );
} 