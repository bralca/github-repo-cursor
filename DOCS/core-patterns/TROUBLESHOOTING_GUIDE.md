# Troubleshooting Guide

## Overview

This guide provides solutions for common issues encountered when developing, deploying, or using the GitHub Explorer application. It covers frontend, backend, API, database, and deployment problems with step-by-step resolution approaches.

## Related Documents

- [API Reference Guide](./API_REFERENCE.md) - API endpoints and communication patterns
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Steps for deploying the application
- [Development/Production Parity Guide](./DEVELOPMENT_PRODUCTION_PARITY.md) - Ensuring consistent behavior
- [Project Structure](./PROJECT_STRUCTURE.md) - Understanding the application architecture

## When to Use This Document

- When encountering errors during development or production
- When API requests fail or return unexpected results
- When deployment fails or behaves differently than expected
- When setting up a new development environment

## Table of Contents

1. [API Connection Issues](#api-connection-issues)
2. [Frontend Issues](#frontend-issues)
3. [Backend Issues](#backend-issues)
4. [SQL Query and API Development Issues](#sql-query-and-api-development-issues)
5. [Database Issues](#database-issues)
6. [Deployment Issues](#deployment-issues)
7. [Environment Configuration Issues](#environment-configuration-issues)

## API Connection Issues

### 404 Not Found for API Endpoints

**Symptom**: Frontend receives 404 errors when trying to access backend API endpoints

**Causes**:
1. Backend server is not running
2. Incorrect API base URL configuration
3. Endpoint path mismatch between frontend and backend
4. Server running with different entry point file

**Resolution**:
1. Check if the backend server is running with `npm start` in the server directory
2. Verify `NEXT_PUBLIC_BACKEND_API_URL` in frontend environment
3. Compare API path in frontend request with backend route definition
4. Check that the server is using the correct entry point (should be `server.js`)

**Example Fix for Server Entry Point**:
```bash
# Edit github-explorer/server/startup.sh
# Change this line:
node src/index.js

# To:
node src/server.js
```

### Pipeline Endpoint Path Mismatch

**Symptom**: Pipeline operations fail with 404 errors in production but work in development

**Cause**: Next.js API route forwarding to backend using incorrect path structure

**Resolution**:
1. Edit `github-explorer/app/api/pipeline-operations/route.ts`
2. Find the URL construction part:
   ```typescript
   const serverApiUrl = `${serverUrl}/api/pipeline/${actualOperation}`;
   ```
3. Update to match backend route structure:
   ```typescript
   const serverApiUrl = `${serverUrl}/api/pipeline-operations`;
   ```
4. Ensure backend has the correct route registered:
   ```javascript
   // In api-routes.js
   router.post('/pipeline-operations', handlePipelineOperations);
   ```

### CORS Errors

**Symptom**: Browser console shows errors like:
```
Access to fetch at 'https://backend-url.com/api/endpoint' from origin 'https://frontend-url.com' has been blocked by CORS policy
```

**Causes**:
1. Incorrect CORS configuration on backend
2. Missing or incorrect `CORS_ORIGIN` environment variable
3. Trailing slash in origin URL

**Resolution**:
1. Verify the `CORS_ORIGIN` setting in backend environment variables:
   ```
   # Development
   CORS_ORIGIN=http://localhost:3000
   
   # Production
   CORS_ORIGIN=https://your-frontend-app.vercel.app
   ```
2. Remove any trailing slashes from the origin URL
3. Ensure frontend URL protocol (http/https) matches exactly
4. Restart the backend server after changing configuration

## Frontend Issues

### Environment Variables Not Available

**Symptom**: `process.env.NEXT_PUBLIC_*` variables return undefined in browser

**Causes**:
1. Missing `NEXT_PUBLIC_` prefix for client-side variables
2. Environment variables not set in Vercel project settings
3. Incorrect environment file

**Resolution**:
1. Ensure all client-side variables are prefixed with `NEXT_PUBLIC_`
2. Verify variables are set in the appropriate environment file:
   - Development: `.env.local`
   - Production: `.env.production` or Vercel project settings
3. Rebuild and redeploy the application after changes

### API Client Network Errors

**Symptom**: Network errors when making API requests from the frontend

**Causes**:
1. Backend server not running
2. Incorrect API base URL
3. Network configuration issues

**Resolution**:
1. Check backend server status and logs
2. Verify the API URL in environment variables:
   ```
   NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001/api  # Development
   NEXT_PUBLIC_BACKEND_API_URL=https://your-app.onrender.com/api  # Production
   ```
3. Test the API endpoint directly using a tool like curl or Postman:
   ```bash
   curl https://your-app.onrender.com/api/entity-counts
   ```

### Component Rendering Errors

**Symptom**: React components fail to render or show error boundaries

**Causes**:
1. Missing or invalid data from API
2. Undefined values not handled
3. Type errors in TypeScript

**Resolution**:
1. Add defensive checks for undefined or null values:
   ```typescript
   // Before rendering data
   if (!data || data.length === 0) {
     return <EmptyState message="No data available" />;
   }
   ```
2. Use optional chaining and nullish coalescing:
   ```typescript
   // Safely access nested properties
   const count = data?.statistics?.count ?? 0;
   ```
3. Check network requests in browser developer tools for data issues

## Backend Issues

### Server Fails to Start

**Symptom**: Backend server fails to start with error messages

**Causes**:
1. Missing dependencies
2. Port already in use
3. Missing required environment variables
4. Database connection issues

**Resolution**:
1. Install dependencies with `npm install`
2. Check if another process is using the port:
   ```bash
   # Find process using port 3001
   lsof -i :3001
   # Kill the process
   kill -9 <PID>
   ```
3. Verify required environment variables are set
4. Check database connectivity:
   ```bash
   # For SQLite
   ls -la ./db/github_explorer.db
   # For Supabase
   curl -I https://your-supabase-project.supabase.co
   ```

### Missing or Incorrect Routes

**Symptom**: Certain API endpoints return 404 errors

**Causes**:
1. Route not defined in API routes file
2. Server using wrong entry point file
3. Middleware blocking the request

**Resolution**:
1. Check route definitions in `github-explorer/server/src/routes/api-routes.js`:
   ```javascript
   // Ensure the route is properly defined
   router.get('/entity-counts', getEntityCounts);
   ```
2. Verify server entry point in `startup.sh` and `package.json`:
   ```bash
   # startup.sh should use:
   node src/server.js
   
   # package.json should have:
   "start": "node src/server.js"
   ```
3. Debug middleware by adding logging:
   ```javascript
   app.use((req, res, next) => {
     console.log(`${req.method} ${req.url}`);
     next();
   });
   ```

### Database Connection Errors

**Symptom**: Server logs show database connection errors

**Causes**:
1. Incorrect database path or URL
2. Missing or invalid credentials
3. Database not initialized
4. Missing permissions

**Resolution**:
1. Check database environment variables:
   ```
   # SQLite
   DB_PATH=./db/github_explorer.db
   
   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-key
   ```
2. Verify database exists and is accessible
3. Check for permission issues:
   ```bash
   # For SQLite
   ls -la ./db/github_explorer.db
   
   # For Supabase, check RLS policies in Supabase dashboard
   ```

## SQL Query and API Development Issues

### SQL Query Alias Reference Errors

**Symptom**: Error messages like "no such column" or "Assignment to constant variable" when working with nested SQL queries

**Causes**:
1. Outer query references column names that only exist in the inner query
2. Not properly using column aliases across nested queries
3. Using original column names instead of their aliases

**Example Problem**:
```javascript
const monthlyQuery = `
  SELECT 
    strftime('%Y-%m', committed_at) as month, 
    AVG(daily_count) as average_daily_commits
  FROM (
    SELECT 
      date(committed_at) as day, 
      COUNT(DISTINCT id) as daily_count,
      strftime('%Y-%m', committed_at) as month_group
    FROM commits 
    WHERE contributor_id = ? 
    GROUP BY date(committed_at)
  ) 
  GROUP BY strftime('%Y-%m', committed_at)  -- PROBLEM: using committed_at from inner query
`;
```

**Resolution**:
1. Always reference aliases from inner queries, not the original columns:
   ```javascript
   const monthlyQuery = `
     SELECT 
       month_group as month, 
       AVG(daily_count) as average_daily_commits
     FROM (
       SELECT 
         date(committed_at) as day, 
         COUNT(DISTINCT id) as daily_count,
         strftime('%Y-%m', committed_at) as month_group
       FROM commits 
       WHERE contributor_id = ? 
       GROUP BY date(committed_at)
     ) 
     GROUP BY month_group  -- FIXED: using the alias from inner query
   `;
   ```

2. Test SQL queries directly against the database before implementing in code:
   ```bash
   # Test the query directly in SQLite
   sqlite3 db/github_explorer.db "YOUR QUERY HERE"
   ```

3. Use comments in complex SQL queries to document the purpose of each section

### JavaScript Date Manipulation Errors

**Symptom**: "Assignment to constant variable" errors when working with dates

**Causes**:
1. Attempting to modify const variables
2. Date objects are mutable, but variables declared with const cannot be reassigned

**Example Problem**:
```javascript
const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
// Later in the code
startDate.setDate(startDate.getDate() - 1); // Error: Assignment to constant variable
```

**Resolution**:
1. Use let instead of const for variables that will be modified:
   ```javascript
   let startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
   startDate.setDate(startDate.getDate() - 1); // Works fine
   ```

2. Create a new variable for the modified date:
   ```javascript
   const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
   const adjustedStartDate = new Date(startDate);
   adjustedStartDate.setDate(adjustedStartDate.getDate() - 1);
   ```

3. Use date libraries like date-fns for safe date manipulations:
   ```javascript
   import { subDays } from 'date-fns';
   
   const startDate = new Date();
   const previousDay = subDays(startDate, 1);
   ```

### API Parameter Validation Issues

**Symptom**: Endpoint returns unexpected errors or incorrect data when provided with different parameter values

**Causes**:
1. Inconsistent ID handling (UUID vs GitHub ID)
2. Missing validation for query parameters
3. Improper type conversion

**Resolution**:
1. Clearly document and standardize ID types used in endpoints:
   ```javascript
   /**
    * Gets a contributor by GitHub ID
    * @param {number|string} id - The contributor's GitHub ID (not UUID)
    */
   async function getContributorById(req, res) {
     const githubId = parseInt(req.params.id, 10);
     
     // Validate it's a GitHub ID not a UUID
     if (isNaN(githubId) || req.params.id.includes('-')) {
       return res.status(400).json({ error: "Invalid GitHub ID format. Use numeric GitHub ID, not UUID." });
     }
     
     // Continue with query...
   }
   ```

2. Standardize parameter handling in controllers:
   ```javascript
   // For timeframe parameters with defaults
   const validTimeframes = ['30days', '90days', '6months', '1year', 'all'];
   const timeframe = validTimeframes.includes(req.query.timeframe) 
     ? req.query.timeframe 
     : '1year'; // Default
   ```

3. Use middleware for common parameter validation:
   ```javascript
   function validateContributorId(req, res, next) {
     const githubId = parseInt(req.params.id, 10);
     if (isNaN(githubId)) {
       return res.status(400).json({ error: "Invalid GitHub ID format" });
     }
     req.githubId = githubId; // Store validated parameter
     next();
   }
   
   // In routes file
   router.get('/contributors/:id/activity', validateContributorId, getContributorActivity);
   ```

### Testing and Debugging API Endpoints

**Symptom**: Endpoints work in some cases but fail in others

**Causes**:
1. Insufficient testing with different parameters
2. Not testing direct SQL queries
3. Unclear error messages

**Resolution**:
1. Test SQL queries directly before implementing in controllers:
   ```bash
   sqlite3 db/github_explorer.db "SELECT date(committed_at) as commit_date, COUNT(DISTINCT id) as count FROM commits WHERE contributor_id = 'your-id' GROUP BY date(committed_at)"
   ```

2. Implement progressive API testing:
   ```bash
   # Test with default parameters
   curl http://localhost:3001/api/contributors/12345/activity
   
   # Test with specific timeframe
   curl http://localhost:3001/api/contributors/12345/activity?timeframe=30days
   
   # Test with nonexistent ID
   curl http://localhost:3001/api/contributors/99999/activity
   ```

3. Enhance error logging:
   ```javascript
   try {
     // API logic
   } catch (error) {
     console.error(`Error in getContributorActivity: ${error.message}`);
     console.error(`Query parameters: ${JSON.stringify(req.params)}`);
     console.error(`Query: ${query}`);
     console.error(`Stack: ${error.stack}`);
     
     return res.status(500).json({
       error: "Database operation failed",
       details: process.env.NODE_ENV !== 'production' ? error.message : undefined
     });
   }
   ```

## Database Issues

### SQLite Disk I/O Errors

**Symptom**: Error messages like `SQLITE_CANTOPEN` or `disk I/O error`

**Causes**:
1. Missing database directory
2. Insufficient permissions
3. Disk full
4. Concurrent access issues

**Resolution**:
1. Ensure database directory exists:
   ```bash
   mkdir -p ./db
   ```
2. Check permissions:
   ```bash
   chmod 755 ./db
   chmod 644 ./db/github_explorer.db
   ```
3. Check disk space:
   ```bash
   df -h
   ```
4. Implement connection pooling or locking

### Supabase Connection Issues

**Symptom**: Errors connecting to Supabase

**Causes**:
1. Incorrect project URL or API keys
2. Project not active
3. Network restrictions

**Resolution**:
1. Verify Supabase credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key  # Frontend
   SUPABASE_SERVICE_KEY=your-service-key  # Backend
   ```
2. Check project status in Supabase dashboard
3. Test connection:
   ```javascript
   const { createClient } = require('@supabase/supabase-js');
   const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
   
   async function testConnection() {
     const { data, error } = await supabase.from('repositories').select('count');
     console.log({ data, error });
   }
   
   testConnection();
   ```

## Deployment Issues

### Vercel Deployment Failures

**Symptom**: Frontend deployment fails on Vercel

**Causes**:
1. Build errors
2. Missing dependencies
3. Environment variable issues
4. Node.js version incompatibility

**Resolution**:
1. Check build logs in Vercel dashboard
2. Verify build command and settings:
   - Root Directory: `github-explorer`
   - Build Command: `npm run build`
   - Output Directory: `.next`
3. Add `.vercelignore` to exclude server code:
   ```
   server/
   *.db
   ```
4. Set required environment variables in Vercel project settings

### Render.com Deployment Failures

**Symptom**: Backend deployment fails on Render.com

**Causes**:
1. Build errors
2. Startup script issues
3. Environment variable issues
4. Disk configuration issues

**Resolution**:
1. Check logs in Render.com dashboard
2. Verify service configuration:
   - Root Directory: `github-explorer/server`
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Check startup script (`startup.sh`):
   ```bash
   # Ensure it's using the correct entry point
   node src/server.js
   ```
4. Set required environment variables in Render.com service settings
5. For SQLite, check disk configuration:
   - Add disk with mount path `/var/data/github_explorer`
   - Set `DB_PATH=/var/data/github_explorer/github_explorer.db`

## Environment Configuration Issues

### Local vs Production Differences

**Symptom**: Application works locally but fails in production

**Causes**:
1. Different server entry points
2. Missing environment variables
3. Path resolution differences
4. Resource access limitations

**Resolution**:
1. Ensure server entry point consistency:
   ```bash
   # Both should use the same file:
   # Local: npm run dev (should use server.js)
   # Production: npm start (should use server.js)
   ```
2. Compare environment variables:
   ```bash
   # Check local variables
   grep -r "process.env" ./github-explorer
   
   # Ensure all are set in production
   ```
3. Use absolute paths or environment variables for file access
4. Review logs in both environments

### Missing Files After Deployment

**Symptom**: 404 errors for static files or missing dependencies

**Causes**:
1. Files excluded by `.gitignore` or `.vercelignore`
2. Build process not including required files
3. Incorrect path resolution

**Resolution**:
1. Check `.gitignore` and `.vercelignore` for excluded files
2. Modify build configuration to include required files
3. Use path resolution utilities:
   ```javascript
   import path from 'path';
   
   // Resolve relative to current file
   const filePath = path.resolve(__dirname, 'relative/path');
   
   // Resolve relative to project root
   const rootPath = process.cwd();
   const configPath = path.join(rootPath, 'config.json');
   ```

## Debugging Techniques

### Frontend Debugging

1. Use browser developer tools:
   - Network tab for API requests
   - Console for error messages
   - React DevTools for component state

2. Add debug logging:
   ```typescript
   console.log('API Request:', { url, method, body });
   console.log('API Response:', data);
   ```

3. Create a debug component:
   ```jsx
   const DebugPanel = ({ data }) => (
     <div className="debug-panel">
       <pre>{JSON.stringify(data, null, 2)}</pre>
     </div>
   );
   ```

### Backend Debugging

1. Add request logging middleware:
   ```javascript
   app.use((req, res, next) => {
     console.log(`${req.method} ${req.url}`);
     console.log('Headers:', req.headers);
     console.log('Body:', req.body);
     next();
   });
   ```

2. Monitor file paths:
   ```javascript
   console.log('Current directory:', process.cwd());
   console.log('File path:', __filename);
   console.log('Database path:', process.env.DB_PATH);
   ```

3. Use environment-specific logging:
   ```javascript
   if (process.env.NODE_ENV !== 'production') {
     console.log('Debug info (dev only):', debugData);
   }
   ```

## Further Reading

- [Express.js Debugging](https://expressjs.com/en/guide/debugging.html)
- [Next.js Debugging](https://nextjs.org/docs/advanced-features/debugging)
- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- [Vercel Deployment Troubleshooting](https://vercel.com/docs/platform/deployments#troubleshooting)
- [Render.com Troubleshooting](https://render.com/docs/troubleshooting)

---

**Last Updated**: [Current Date] 