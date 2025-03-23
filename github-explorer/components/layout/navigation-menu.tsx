'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavigationMenuProps {
  mobile?: boolean;
}

/**
 * Navigation menu component for both desktop and mobile views
 */
export function NavigationMenu({ mobile = false }: NavigationMenuProps) {
  const pathname = usePathname();
  
  const navigationItems = [
    { name: 'Admin', href: '/admin' },
  ];

  return (
    <nav className={cn(
      mobile ? 'flex flex-col space-y-1 py-2' : 'hidden'
    )}>
      {navigationItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'px-3 py-2 text-sm font-medium',
              isActive 
                ? 'text-foreground font-semibold' 
                : 'text-foreground/70 hover:text-foreground',
              mobile && 'hover:bg-muted rounded-md'
            )}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
} 