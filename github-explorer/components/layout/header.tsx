'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Menu } from 'lucide-react';

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
import { useBreakpoint, useIsMobile } from '@/hooks/use-media-query';

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  showThemeToggle?: boolean;
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

export function Header({
  className,
  showThemeToggle = true,
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
    </header>
  );
} 