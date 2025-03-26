# Development/Production Parity Guide

## Overview

This document outlines the critical considerations for ensuring consistent behavior between development and production environments in the GitHub Explorer application. It provides guidelines for maintaining parity, testing across environments, and avoiding common pitfalls that can lead to the "works on my machine" syndrome.

## Related Documents

- [API Reference Guide](./API_REFERENCE.md) - API endpoints and communication patterns
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Steps for deploying the application
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md) - Solving common issues
- [Project Structure](./PROJECT_STRUCTURE.md) - Understanding the application architecture

## When to Use This Document

- When implementing features that need to work consistently across environments
- When setting up development environments
- When troubleshooting environment-specific issues
- When configuring build and deployment processes

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Common Environment Disparities](#common-environment-disparities)
3. [Server Entry Points](#server-entry-points)
4. [Environment Variables](#environment-variables)
5. [API Path Consistency](#api-path-consistency)
6. [Testing Across Environments](#testing-across-environments)
7. [Debugging Environment Issues](#debugging-environment-issues)

## Architecture Overview

The GitHub Explorer application uses a split architecture:

1. **Frontend**: Next.js application deployed on Vercel
2. **Backend**: Express.js server deployed on Render.com
3. **Database**: Supabase (PostgreSQL) / SQLite

This separation requires careful attention to ensure consistent behavior across development and production environments.

## Common Environment Disparities

The most common areas where development and production environments can diverge:

| Area | Development | Production | Potential Issues |
|------|-------------|------------|------------------|
| Server Entry Point | Different file | Different file | Missing routes, 404 errors |
| Environment Variables | Local `.env` files | Platform-configured | Missing or incorrect variables |
| API Base URLs | Localhost URLs | Production domains | Cross-origin issues, connection failures |
| File System Access | Direct access | Limited or none | File operations failing in production |
| Database | Local development DB | Production DB | Schema differences, connection issues |

## Server Entry Points

### Critical Issue: Server Entry Point Consistency

One of the most critical issues for environment parity is ensuring that the server uses the same entry point file in both development and production.

#### Problem Scenario

The GitHub Explorer backend has multiple potential entry points:

- `src/index.js` - A simplified server configuration
- `src/app.js` - A more comprehensive server with all routes
- `src/server.js` - The main entry point that imports from app.js

If development uses one entry point (e.g., `server.js` which uses `app.js`), but production uses another (e.g., `index.js`), this can lead to missing routes, middleware, or other functionality in production.

#### Real-World Example

When the frontend makes a request to `/api/pipeline/start`, if:

- Development is using `server.js` → `app.js` which registers routes like `/api/pipeline/start`
- Production is using `index.js` which doesn't register these routes

The result will be that the endpoint works in development but returns 404 errors in production.

#### Solution: Standardize Server Entry Points

1. **Use a single, consistent entry point file for both environments**
   - Default to `server.js` as the main entry point
   - Ensure all startup scripts reference this file

2. **In `package.json`**:
   ```json
   "scripts": {
     "start": "node src/server.js",
     "dev": "nodemon src/server.js"
   }
   ```

3. **In `startup.sh` and `render-startup.sh`**:
   ```bash
   # Start the server using the same entry point as development
   node src/server.js
   ```

## Environment Variables

### Environment Variable Management

Use separate environment files for different environments but with the same variable names:

#### Frontend (Next.js)

- Development: `.env.local`
- Production: `.env.production`

#### Backend (Express)

- Development: `.env`
- Production: `.env.production`

### Required Environment Variables

Ensure these critical environment variables are set consistently across environments:

#### Frontend Environment Variables

```
# API Connection
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001/api  # Development
NEXT_PUBLIC_BACKEND_API_URL=https://your-app.onrender.com/api  # Production

# Database Connection
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Pipeline Configuration
PIPELINE_SERVER_URL=http://localhost:3001  # Development
PIPELINE_SERVER_URL=https://your-app.onrender.com  # Production
```

#### Backend Environment Variables

```
# Server Configuration
PORT=3001  # Development
PORT=10000  # Production (Render.com sets this automatically)

# CORS Configuration
CORS_ORIGIN=http://localhost:3000  # Development
CORS_ORIGIN=https://your-frontend-app.vercel.app  # Production

# Database Configuration
DB_PATH=./db/github_explorer.db  # If using SQLite
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### Environment Variable Guidelines

1. **No hardcoded values**: Always use environment variables for configuration
2. **Defaults for development**: Provide sensible defaults for development environment
3. **Documentation**: Document all required environment variables
4. **Validation**: Validate required environment variables on startup

```javascript
// Example of environment variable validation
if (!process.env.CORS_ORIGIN) {
  console.warn('CORS_ORIGIN environment variable not set, defaulting to "*"');
}

if (!process.env.SUPABASE_URL) {
  console.error('SUPABASE_URL environment variable is required');
  process.exit(1);
}
```

## API Path Consistency

### API Path Structure

Maintain consistent API path structures across frontend, backend, and Next.js API routes:

#### Backend API Routes (Express)

```javascript
// api-routes.js
router.get('/entity-counts', getEntityCounts);
router.post('/pipeline-operations', handlePipelineOperations);
```

#### Next.js API Routes

```
/app/api/entity-counts/route.ts
/app/api/pipeline-operations/route.ts
```

#### Frontend API Client

```typescript
// Consistent endpoint naming
fetchFromApi('entity-counts');
fetchFromApi('pipeline-operations', 'POST', undefined, { operation: 'start' });
```

### Path Construction Guidelines

1. **No trailing slashes**: Avoid trailing slashes in API paths
2. **Consistent path case**: Use kebab-case for all API paths
3. **Match exactly**: Ensure Next.js API routes match Express routes exactly

#### Critical Issue: Pipeline Endpoint Path

When Next.js API routes forward requests to backend endpoints, ensure the path construction matches exactly:

```typescript
// INCORRECT - Doesn't match backend routes:
const serverApiUrl = `${serverUrl}/api/pipeline/${actualOperation}`;

// CORRECT - Matches backend route structure:
const serverApiUrl = `${serverUrl}/api/pipeline-operations`;
```

## Testing Across Environments

### Local Testing Strategy

1. **Run both services locally**:
   ```bash
   # Terminal 1 - Frontend
   cd github-explorer
   npm run dev
   
   # Terminal 2 - Backend
   cd github-explorer/server
   npm run dev
   ```

2. **Use environment variables for local testing**:
   - Create `.env.local` for frontend
   - Create `.env` for backend

3. **Test functionality**:
   - Verify API endpoints work locally
   - Check for console errors

### Production-Like Testing

1. **Use production environment variables locally**:
   ```bash
   # Frontend
   NODE_ENV=production npm run dev
   
   # Backend
   NODE_ENV=production npm run dev
   ```

2. **Deploy to staging environment**:
   - Deploy to Vercel preview environments
   - Deploy to Render.com preview environments

3. **Cross-environment testing**:
   - Test local frontend → production backend
   - Test production frontend → local backend

## Debugging Environment Issues

### Common Environment-Specific Issues

1. **404 Not Found Errors**:
   - Check server entry point file
   - Verify route registrations
   - Confirm API path construction

2. **CORS Errors**:
   - Check `CORS_ORIGIN` configuration
   - Verify frontend and backend URLs
   - Remove trailing slashes

3. **Environment Variable Issues**:
   - Check for missing variables
   - Verify prefix for client-side variables (`NEXT_PUBLIC_`)
   - Check for typos in variable names

### Environment Variable Debugging

Add debug logging to trace environment configurations:

```javascript
// Server startup logging
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`Server running on port ${process.env.PORT}`);
console.log(`CORS_ORIGIN: ${process.env.CORS_ORIGIN}`);
console.log(`Database path: ${process.env.DB_PATH}`);
```

### Server Entry Point Debugging

Verify the server entry point in use:

```javascript
// Add to each potential entry point file
console.log(`Server starting from file: ${__filename}`);
```

## Best Practices for Environment Parity

1. **Use a consistent entry point** for server startup in all environments
2. **Dockerize development environment** to ensure consistency
3. **Create a deployment checklist** to verify all required configurations
4. **Implement health checks** that verify environment configuration
5. **Maintain parity in dependencies** between development and production
6. **Use the same Node.js version** across all environments
7. **Review configuration before each deployment**

## Further Reading

- [Twelve-Factor App](https://12factor.net/) - Best practices for modern applications
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Express Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Last Updated**: [Current Date] 