'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps extends Omit<ImageProps, 'unoptimized'> {
  /**
   * Fallback alt text if none is provided
   * Included for accessibility
   */
  fallbackAlt?: string;

  /**
   * Show a gray placeholder background during loading
   * @default true
   */
  showPlaceholder?: boolean;

  /**
   * CSS class name for the placeholder
   */
  placeholderClassName?: string;

  /**
   * Custom CSS class for when the image is loading
   */
  loadingClassName?: string;

  /**
   * Custom CSS class for when the image has loaded
   */
  loadedClassName?: string;

  /**
   * Force optimization for this image even if it would normally be skipped
   * @default false
   */
  forceOptimize?: boolean;
}

/**
 * Determines if an image should be optimized based on its characteristics
 */
function shouldOptimizeImage(src: string, forceOptimize?: boolean): boolean {
  if (forceOptimize) return true;

  // Skip optimization for SVG images (lossless format)
  if (typeof src === 'string' && (
    src.endsWith('.svg') || 
    src.includes('.svg?') || 
    src.startsWith('data:image/svg+xml')
  )) {
    return false;
  }

  // Skip optimization for GIF images (often animated)
  if (typeof src === 'string' && (
    src.endsWith('.gif') || 
    src.includes('.gif?')
  )) {
    return false;
  }

  // Skip optimization for very small images like icons
  if (typeof src === 'string' && (
    src.includes('icon') || 
    src.includes('logo') || 
    src.includes('favicon')
  )) {
    return false;
  }

  return true;
}

/**
 * OptimizedImage component that wraps Next.js Image with:
 * - Automatic detection of images that should/shouldn't be optimized
 * - Loading state management with placeholders
 * - Better error handling and fallbacks
 */
export function OptimizedImage({
  src,
  alt,
  fallbackAlt = 'Image',
  width,
  height,
  showPlaceholder = true,
  placeholderClassName,
  className,
  loadingClassName,
  loadedClassName,
  forceOptimize = false,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Determine if this image should be optimized
  const unoptimized = !shouldOptimizeImage(src?.toString() || '', forceOptimize);
  
  // Set default alt text if none provided (for accessibility)
  const imageAlt = alt || fallbackAlt;
  
  return (
    <div className="relative">
      {/* Show placeholder during loading if enabled */}
      {showPlaceholder && isLoading && !hasError && (
        <div
          className={cn(
            "absolute inset-0 bg-muted/30 rounded-md animate-pulse",
            placeholderClassName
          )}
          style={{ width, height }}
          aria-hidden="true"
        />
      )}
      
      {/* Fallback for error state */}
      {hasError ? (
        <div
          className={cn(
            "flex items-center justify-center bg-muted/20 rounded-md text-muted-foreground text-sm",
            className
          )}
          style={{ width, height }}
        >
          Failed to load image
        </div>
      ) : (
        /* Actual image component */
        <Image
          src={src}
          alt={imageAlt}
          width={width}
          height={height}
          unoptimized={unoptimized}
          className={cn(
            // Base styles
            "transition-opacity duration-300",
            // Loading state
            isLoading ? "opacity-0" : "opacity-100",
            // Dynamic classes based on state
            isLoading ? loadingClassName : loadedClassName,
            className
          )}
          onLoadingComplete={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          {...props}
        />
      )}
    </div>
  );
} 