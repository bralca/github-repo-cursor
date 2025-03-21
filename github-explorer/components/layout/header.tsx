'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Menu, ChevronRight } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/use-media-query';
import { parseRepositorySlug, parseContributorSlug, parseMergeRequestSlug } from '@/lib/url-utils';

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  showThemeToggle?: boolean;
  showBreadcrumbs?: boolean;
}

interface NavItemProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  isMobile?: boolean;
}

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Repositories', href: '/repositories' },
  { name: 'Contributors', href: '/contributors' },
  { name: 'Merge Requests', href: '/merge-requests' },
  { name: 'Commits', href: '/commits' },
  { name: 'Admin', href: '/admin' },
];

function NavItem({ href, children, className, isMobile = false }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  const itemClasses = cn(
    'transition-colors hover:text-foreground/80',
    isMobile ? 'text-lg my-2 w-full' : 'px-4 py-2',
    isActive
      ? 'text-foreground font-medium'
      : 'text-foreground/60',
    className
  );

  return (
    <Link
      href={href}
      className={itemClasses}
    >
      {children}
    </Link>
  );
}

/**
 * Breadcrumb component for showing the navigation path hierarchy
 */
function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  
  // Split path into segments
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;
  
  // Generate breadcrumb items
  const breadcrumbItems: Array<{href: string; label: string}> = [];
  
  // Always add home
  breadcrumbItems.push({ href: '/', label: 'Home' });
  
  // Parse each segment and build the path progressively
  let currentPath = '';
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    
    // Handle known entity types
    if (i === 0 && segment !== 'contributors' && segment !== 'admin') {
      // This is likely a repository slug
      const repoInfo = parseRepositorySlug(segment);
      if (repoInfo) {
        breadcrumbItems.push({
          href: currentPath,
          label: repoInfo.name,
        });
        continue;
      }
    }
    
    if (segment === 'contributors' && i === 0) {
      breadcrumbItems.push({
        href: currentPath,
        label: 'Contributors',
      });
      continue;
    }
    
    if (i === 1 && segments[0] === 'contributors') {
      // This is likely a contributor slug
      const contributorInfo = parseContributorSlug(segment);
      if (contributorInfo) {
        breadcrumbItems.push({
          href: currentPath,
          label: contributorInfo.name || contributorInfo.username || 'Contributor',
        });
        continue;
      }
    }
    
    if (segment === 'merge-requests' && i === 1) {
      breadcrumbItems.push({
        href: currentPath,
        label: 'Merge Requests',
      });
      continue;
    }
    
    if (i === 2 && segments[1] === 'merge-requests') {
      // This is likely a merge request slug
      const mrInfo = parseMergeRequestSlug(segment);
      if (mrInfo) {
        breadcrumbItems.push({
          href: currentPath,
          label: mrInfo.title || 'Merge Request',
        });
        continue;
      }
    }
    
    if (segment === 'commits' && i === 3) {
      breadcrumbItems.push({
        href: currentPath,
        label: 'Commits',
      });
      continue;
    }
    
    // For other segments, just use the segment as is
    breadcrumbItems.push({
      href: currentPath,
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
    });
  }
  
  return (
    <div className="flex items-center text-sm text-foreground/60 overflow-x-auto whitespace-nowrap p-2 scrollbar-hide">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.href}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-1 text-foreground/40" />
          )}
          {index === breadcrumbItems.length - 1 ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Link 
              href={item.href} 
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function Header({
  className,
  showThemeToggle = true,
  showBreadcrumbs = true,
  ...props
}: HeaderProps) {
  const isDesktop = useBreakpoint('md');
  
  return (
    <header className={cn('sticky top-0 z-50 w-full border-b bg-background', className)} {...props}>
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight">GitHub Explorer</span>
          </Link>
        </div>

        {isDesktop ? (
          <nav className="flex items-center space-x-6">
            {navigation.map((item) => (
              <NavItem key={item.name} href={item.href}>
                {item.name}
              </NavItem>
            ))}
          </nav>
        ) : (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="mb-4">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <SheetClose asChild key={item.name}>
                    <NavItem href={item.href} isMobile>
                      {item.name}
                    </NavItem>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        )}

        {showThemeToggle && (
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        )}
      </div>
      
      {/* Breadcrumb navigation */}
      {showBreadcrumbs && <Breadcrumbs />}
    </header>
  );
} 