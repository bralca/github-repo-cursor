'use client';

import Link from 'next/link';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { parseRepositorySlug, parseContributorSlug, parseMergeRequestSlug } from '@/lib/url-utils';

interface PageBreadcrumbsProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Component for rendering breadcrumbs in a smaller, truncated format at the top of the page
 */
export function PageBreadcrumbs({ className, ...props }: PageBreadcrumbsProps) {
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
  
  // Helper function to truncate text with ellipsis
  // Using "Merge Requests" (14 chars) as baseline and adding some buffer
  const truncateText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };
  
  return (
    <div 
      className={cn(
        "flex items-center text-xs text-muted-foreground overflow-x-auto whitespace-nowrap py-2 mb-2",
        className
      )} 
      {...props}
    >
      <TooltipProvider>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            {index > 0 && (
              <ChevronRight className="h-3 w-3 mx-1 flex-shrink-0 text-muted-foreground/60" />
            )}
            
            {index === breadcrumbItems.length - 1 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-medium text-foreground max-w-[200px] truncate">
                    {truncateText(item.label)}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link 
                    href={item.href} 
                    className="hover:text-foreground transition-colors max-w-[150px] truncate inline-block"
                  >
                    {truncateText(item.label, 15)}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )}
          </React.Fragment>
        ))}
      </TooltipProvider>
    </div>
  );
} 