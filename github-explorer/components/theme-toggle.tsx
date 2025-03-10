'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * Theme toggle button component
 * @returns Theme toggle component
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label={
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      }
      className={cn(
        'inline-flex items-center justify-center rounded-md p-2.5 text-sm font-medium transition-colors',
        'hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun
        className={cn(
          'h-5 w-5 rotate-0 scale-100 transition-all',
          theme === 'dark' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        )}
      />
      <Moon
        className={cn(
          'absolute h-5 w-5 rotate-90 scale-100 transition-all',
          theme === 'dark' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        )}
      />
    </button>
  );
} 