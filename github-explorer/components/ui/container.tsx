import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'default' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  as?: React.ElementType;
}

/**
 * Container component for consistent layout sizing
 * Provides different size options and centering capabilities
 */
export function Container({
  children,
  size = 'default',
  centered = false,
  as: Component = 'div',
  className,
  ...props
}: ContainerProps) {
  // Container size classes
  const sizeClasses = {
    default: 'max-w-7xl',
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    full: 'max-w-full',
  };

  return (
    <Component 
      className={cn(
        'w-full px-4 sm:px-6 md:px-8',
        sizeClasses[size],
        centered && 'mx-auto',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
} 