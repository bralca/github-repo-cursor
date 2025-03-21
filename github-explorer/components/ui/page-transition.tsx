'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, memo, useCallback, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
  initial?: boolean;
  className?: string;
  onExitComplete?: () => void;
}

// Component that safely accesses search params
function SearchParamsHandler({ onParamsChange }: { onParamsChange: (fullPath: string) => void }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  useEffect(() => {
    const fullPath = pathname + searchParams.toString();
    onParamsChange(fullPath);
  }, [pathname, searchParams, onParamsChange]);
  
  return null;
}

/**
 * PageTransition component that provides smooth transitions between pages
 */
export function PageTransition({
  children,
  mode = 'wait',
  initial = true,
  className = '',
  onExitComplete,
}: PageTransitionProps) {
  const pathname = usePathname();
  const [key, setKey] = useState(pathname);
  
  const handleParamsChange = useCallback((fullPath: string) => {
    setKey(fullPath);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsHandler onParamsChange={handleParamsChange} />
      </Suspense>
      <AnimatePresence mode={mode} initial={initial} onExitComplete={onExitComplete}>
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={className}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

/**
 * PageLoader component that displays a loading animation
 */
export const PageLoader = memo(function PageLoader() {
  return (
    <div className="flex min-h-[200px] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
    </div>
  );
});

/**
 * withPageTransition HOC that wraps a component with PageTransition
 */
export function withPageTransition<P extends object>(
  Component: React.ComponentType<P>,
  transitionProps?: Omit<PageTransitionProps, 'children'>
) {
  const WithPageTransition = (props: P) => {
    return (
      <PageTransition {...transitionProps}>
        <Component {...props} />
      </PageTransition>
    );
  };

  return WithPageTransition;
}

interface LoadingContainerProps {
  children: React.ReactNode;
  loading: boolean;
  loader?: React.ReactNode;
  minHeight?: string | number;
}

/**
 * LoadingContainer component that shows loading state
 */
export function LoadingContainer({
  children,
  loading,
  loader = <PageLoader />,
  minHeight = '200px',
}: LoadingContainerProps) {
  return (
    <div style={{ minHeight }}>
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {loader}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 