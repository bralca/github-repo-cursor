'use client';

import { useEffect, useState } from 'react';

/**
 * Hook that detects if a media query matches the current screen size
 * @param query Media query string to evaluate
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const media = window.matchMedia(query);
    
    // Set initial value
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    // Create an event listener function
    const listener = () => {
      setMatches(media.matches);
    };
    
    // Add the listener to media query changes
    media.addEventListener('change', listener);
    
    // Clean up
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [matches, query]);

  // Return false if not mounted to prevent SSR/client hydration mismatch
  return mounted ? matches : false;
}

/**
 * Predefined breakpoint values matching Tailwind's defaults
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

/**
 * Hook that detects if the screen is at least a certain predefined breakpoint size
 * @param breakpoint One of the predefined Tailwind breakpoints
 * @returns Boolean indicating if the screen is at least the specified breakpoint size
 */
export function useBreakpoint(breakpoint: keyof typeof breakpoints): boolean {
  return useMediaQuery(`(min-width: ${breakpoints[breakpoint]})`);
}

/**
 * Hook that detects if the screen is smaller than a certain predefined breakpoint size
 * @param breakpoint One of the predefined Tailwind breakpoints
 * @returns Boolean indicating if the screen is smaller than the specified breakpoint size
 */
export function useIsMobile(breakpoint: keyof typeof breakpoints = 'md'): boolean {
  return !useMediaQuery(`(min-width: ${breakpoints[breakpoint]})`);
} 