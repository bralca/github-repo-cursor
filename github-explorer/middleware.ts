import { NextResponse, NextRequest } from 'next/server';

// Define protected paths that require authentication
const PROTECTED_PATHS = ['/admin'];
// Define authentication paths (login pages)
const AUTH_PATHS = ['/admin/login'];

// Check if the path is protected
function isProtectedPath(path: string): boolean {
  // Admin path is protected, but not the login page
  return PROTECTED_PATHS.some(protectedPath => 
    path === protectedPath || 
    (path.startsWith(`${protectedPath}/`) && !isAuthPath(path))
  );
}

// Check if the path is an authentication path
function isAuthPath(path: string): boolean {
  return AUTH_PATHS.some(authPath => path === authPath);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Processing: ${pathname}`);
  
  // Get the authentication cookie
  const authCookie = request.cookies.get('supabase-auth-token');
  const isAuthenticated = !!authCookie?.value;
  
  console.log(`[Middleware] Auth status: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
  
  // Add a random parameter to prevent caching issues
  const timestamp = Date.now();
  
  // If the path is protected and the user is not authenticated, redirect to login
  if (isProtectedPath(pathname) && !isAuthenticated) {
    console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to login`);
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('redirectTo', pathname);
    url.searchParams.set('t', timestamp.toString()); // Add timestamp to prevent caching
    return NextResponse.redirect(url);
  }
  
  // If the user is authenticated and trying to access an auth path, redirect to admin
  if (isAuthPath(pathname) && isAuthenticated) {
    console.log(`[Middleware] Redirecting authenticated user from ${pathname} to admin dashboard`);
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/admin';
    const url = new URL(redirectTo, request.url);
    url.searchParams.set('t', timestamp.toString()); // Add timestamp to prevent caching
    return NextResponse.redirect(url);
  }
  
  // For all other cases, continue with the request
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all routes under /admin
    '/admin/:path*',
  ],
}; 