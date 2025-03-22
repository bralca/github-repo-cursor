'use client';

import { useMediaQuery } from '@/hooks/use-media-query';

/**
 * Hook to detect if the current device is a mobile device based on screen width
 * @returns boolean indicating if the current device is mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
} 