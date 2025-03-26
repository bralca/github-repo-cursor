# Authentication Architecture

## Overview

This document describes the authentication system used in the GitHub Explorer application, focusing on how admin authentication and authorization are implemented. The application uses Supabase Auth for authentication services and implements a middleware-based protection system for admin routes.

## Table of Contents

- [Authentication Flow](#authentication-flow)
- [Admin Access Control](#admin-access-control)
- [Frontend Implementation](#frontend-implementation)
- [Middleware Protection](#middleware-protection)
- [Backend Authentication](#backend-authentication)
- [Authentication State Management](#authentication-state-management)
- [Cookie-Based Authentication](#cookie-based-authentication)
- [Development vs. Production](#development-vs-production)

## Authentication Flow

The GitHub Explorer application implements the following authentication flow:

1. **User navigates to an admin page**
2. **Middleware intercepts the request**
   - Checks for authentication cookie
   - Redirects to login if no valid authentication exists
3. **User enters credentials in login form**
4. **Supabase Auth validates credentials**
5. **On successful authentication:**
   - Session is created in Supabase
   - Authentication token is stored in local storage and cookies
   - User is redirected to requested admin page
6. **For subsequent requests:**
   - Middleware validates the authentication cookie
   - Protected routes remain accessible as long as the session is valid

## Admin Access Control

### Admin Role Designation

Admin roles are defined in `hooks/use-auth.ts`:

```typescript
export const ADMIN_ROLES = ['admin', 'superadmin', 'owner'];
```

In the current implementation, for testing purposes, any authenticated user is considered an admin:

```typescript
// For testing purposes, consider any authenticated user an admin
// In production, you would check a custom claim or a database record
const isUserAdmin = true; // Temporary for testing
```

In a production deployment, this would be replaced with proper role checking:

```typescript
// Production implementation would check for admin roles
const isUserAdmin = ADMIN_ROLES.includes(session.user?.role || '');
```

## Frontend Implementation

### Sign-In Form Component

The sign-in form (`components/auth/sign-in-form.tsx`) handles the authentication process:

1. **Form Input Fields**:
   - Email and password inputs with validation
   - Submission button with loading state

2. **Authentication Logic**:
   - Uses `useAuth` hook for sign-in functionality
   - Handles success and error states
   - Sets authentication cookie directly to ensure middleware can detect it
   - Redirects to the requested admin page after successful authentication

3. **Redirection Handling**:
   - Captures the `redirectTo` query parameter to return the user to their intended destination
   - Uses client-side navigation after successful authentication

### Admin Login Page

The admin login page (`app/admin/login/page.tsx`):

1. **Authentication State Check**:
   - Checks if the user is already authenticated and is an admin
   - Redirects to admin dashboard if already authenticated
   - Shows loading state while checking authentication

2. **Form Rendering**:
   - Renders the sign-in form component
   - Includes debug information in development mode

## Middleware Protection

The application uses Next.js middleware (`middleware.ts`) to protect admin routes:

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the authentication cookie
  const authCookie = request.cookies.get('supabase-auth-token');
  const isAuthenticated = !!authCookie?.value;
  
  // If the path is protected and the user is not authenticated, redirect to login
  if (isProtectedPath(pathname) && !isAuthenticated) {
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }
  
  // If the user is authenticated and trying to access an auth path, redirect to admin
  if (isAuthPath(pathname) && isAuthenticated) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/admin';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }
  
  // For all other cases, continue with the request
  return NextResponse.next();
}
```

The middleware is configured to run only on admin paths:

```typescript
export const config = {
  matcher: [
    // Match all routes under /admin
    '/admin/:path*',
  ],
};
```

## Backend Authentication

The backend implements a simple authentication middleware (`server/src/middleware/auth.middleware.js`) for API routes:

```javascript
export function authenticateToken(req, res, next) {
  try {
    // For demo/test purposes, we're allowing all requests
    // In a real application, this would validate tokens
    
    logger.info('Authentication middleware bypassed for testing');
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`, { error });
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      details: 'Invalid or missing authentication token'
    });
  }
}
```

In the current implementation, authentication is bypassed for testing purposes. In a production environment, this middleware would:

1. Extract the JWT token from the Authorization header
2. Verify the token's validity using the Supabase JWT secret
3. Decode the token to get the user's ID and role
4. Check if the user has admin privileges
5. Allow or deny access based on the user's role

## Authentication State Management

The application uses a custom `useAuth` hook (`hooks/use-auth.ts`) to manage authentication state:

```typescript
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Get the current user and determine admin status
  const getCurrentUser = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session) {
        setAuthState('unauthenticated');
        setUser(null);
        setIsAdmin(false);
        return;
      }

      setUser(session.user);
      setIsAdmin(true); // Temporary for testing
      setAuthState('authenticated');
    } catch (error) {
      setAuthState('unauthenticated');
      setUser(null);
      setIsAdmin(false);
    }
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error };
      }

      await getCurrentUser();
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      setAuthState('unauthenticated');
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Subscribe to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          getCurrentUser();
        } else if (event === 'SIGNED_OUT') {
          setAuthState('unauthenticated');
          setUser(null);
          setIsAdmin(false);
        }
      }
    );

    // Get initial user
    getCurrentUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [getCurrentUser]);

  return {
    authState,
    user,
    isAdmin,
    signIn,
    signOut
  };
};
```

This hook provides:

1. **Authentication State**: `'loading'`, `'authenticated'`, or `'unauthenticated'`
2. **User Information**: The current authenticated user or null
3. **Admin Status**: Whether the current user has admin privileges
4. **Sign-in and Sign-out Methods**: Functions to authenticate or end a session

## Cookie-Based Authentication

The application uses both localStorage and cookies for authentication to ensure middleware can detect authentication state:

```typescript
// In the Supabase client configuration
storage: {
  getItem: (key) => {
    if (typeof window === 'undefined') {
      return null;
    }
    
    return window.localStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') {
      return;
    }
    
    window.localStorage.setItem(key, value);
    
    // Also set a cookie for middleware access
    document.cookie = `${key}=true; path=/; max-age=2592000`; // 30 days
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') {
      return;
    }
    
    window.localStorage.removeItem(key);
    
    // Also remove the cookie
    document.cookie = `${key}=; path=/; max-age=0`;
  },
}
```

Additionally, the sign-in form explicitly sets a cookie to ensure the middleware can detect authentication:

```typescript
// Set a cookie directly to ensure middleware can detect it
document.cookie = "supabase-auth-token=true; path=/; max-age=2592000"; // 30 days
```

## Development vs. Production

### Development Mode

In development mode:

1. Any authenticated user is considered an admin
2. Authentication middleware on the backend is bypassed
3. Debug information is displayed in the UI

### Production Mode

For production deployment:

1. The admin check should be uncommented to verify user roles
2. Backend authentication middleware should validate tokens properly
3. Debug information should be removed from the UI
4. Proper error handling and security logging should be implemented

### Environment Variables

The authentication system relies on these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The public anon key for client-side authentication
- `SUPABASE_SERVICE_KEY`: The private service key for server-side operations (not exposed to the client)

These must be configured in both development and production environments for authentication to work properly. 