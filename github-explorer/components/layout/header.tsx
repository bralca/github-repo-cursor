'use client';

import * as React from 'react';
import Link from 'next/link';
import { MenuIcon, Search } from 'lucide-react';
import { GithubExplorerLogo } from '@/components/svgs/github-explorer-logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { ModeToggle } from '@/components/theme/mode-toggle';
import { NavigationMenu } from '@/components/layout/navigation-menu';
import { useIsMobile } from '@/lib/hooks/use-is-mobile';

export interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const hideNavigation = pathname?.startsWith('/profile');

  return (
    <header
      className={cn('sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur', className)}
    >
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-2 mr-4">
          {isOpen ? (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(false)}>
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Close Menu</span>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(true)}>
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Open Menu</span>
            </Button>
          )}
          <Link
            href={'/'}
            prefetch={false}
            className="flex items-center gap-2"
          >
            <GithubExplorerLogo className="h-6 w-6" />
            <span className="font-bold text-lg">TopSoftwareDevs</span>
          </Link>
        </div>

        <div className="flex-1 hidden md:flex relative max-w-xs mx-4">
          <input
            type="search"
            placeholder="Search by repository ID..."
            className="block w-full py-1.5 pl-3 pr-3 text-sm bg-muted/50 rounded-md border-0 ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary"
          />
        </div>

        {!hideNavigation && (
          <div className="flex flex-1 justify-between md:justify-end">
            <div className="hidden md:flex md:items-center">
              <Link href="/repositories" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground">
                Repositories
              </Link>
              <Link href="/contributors" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground">
                Contributors
              </Link>
              <Link href="/merge-requests" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground whitespace-nowrap">
                Merge Requests
              </Link>
              <Link href="/commits" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground">
                Commits
              </Link>
              <Link href="/admin" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground">
                Admin
              </Link>
            </div>
            <div className="flex items-center justify-end gap-2">
              <ModeToggle />
            </div>
          </div>
        )}
      </div>
      {isOpen && (
        <div className="container md:hidden">
          <NavigationMenu mobile />
        </div>
      )}
    </header>
  );
} 