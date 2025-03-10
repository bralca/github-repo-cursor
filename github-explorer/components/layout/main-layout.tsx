'use client';

import React from 'react';
import { Header } from '@/components/layout/header';
import { ErrorBoundary } from '@/components/error-boundary';
import { PageTransition } from '@/components/ui/page-transition';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ThemeProvider } from '@/components/theme-provider';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Main layout component that wraps all pages with:
 * - ThemeProvider for light/dark mode
 * - Header with navigation
 * - ErrorBoundary for error handling
 * - PageTransition for smooth transitions
 * - Responsive layout adjustments
 */
export function MainLayout({ children }: MainLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col">
        <ErrorBoundary>
          <Header />
          <main className={`flex-1 px-4 py-6 ${isDesktop ? 'container mx-auto' : 'w-full'}`}>
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <footer className="border-t py-4 text-center text-sm text-muted-foreground">
            <div className={`${isDesktop ? 'container mx-auto' : 'px-4'}`}>
              <p>GitHub Explorer &copy; {new Date().getFullYear()}</p>
            </div>
          </footer>
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
} 