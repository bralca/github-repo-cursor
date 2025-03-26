# Deployment Guide

## Overview

This document provides detailed instructions for deploying the GitHub Explorer application. The application uses a split architecture with the frontend (Next.js) deployed on Vercel and the backend (Express.js) deployed on Render.com. This guide covers the configuration, environment setup, and deployment process for both platforms.

## Related Documents

- [API Reference Guide](./API_REFERENCE.md) - Details on all API endpoints
- [Development/Production Parity Guide](./DEVELOPMENT_PRODUCTION_PARITY.md) - Ensuring consistent behavior across environments
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md) - Common deployment issues and solutions
- [Project Structure](./PROJECT_STRUCTURE.md) - Understanding the application architecture

## When to Use This Document

- When setting up a new deployment environment
- When updating existing deployments
- When troubleshooting deployment issues
- When configuring environment variables for production

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Backend Deployment (Render.com)](#backend-deployment-rendercom)
4. [Environment Variables](#environment-variables)
5. [Deployment Verification](#deployment-verification)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. A GitHub account with access to the GitHub Explorer repository
2. A Vercel account (for frontend deployment)
3. A Render.com account (for backend deployment)
4. Supabase account and project (for database)

## Frontend Deployment (Vercel)

### Step 1: Connect Repository to Vercel

1. Log in to your Vercel account
2. Click "Add New" → "Project"
3. Select the GitHub Explorer repository
4. Vercel will auto-detect Next.js, but you may need to adjust settings

### Step 2: Configure Project Settings

1. **Project Name**: Choose a name for your deployment (e.g., `github-explorer-frontend`)
2. **Framework Preset**: Ensure "Next.js" is selected
3. **Root Directory**: Set to `github-explorer` (not the repository root)
4. **Build and Output Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Step 3: Configure Environment Variables

Add the following environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_BACKEND_API_URL` | `https://your-backend-app.onrender.com/api` | URL to your backend API (on Render.com) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` | Supabase anonymous key |
| `PIPELINE_SERVER_URL` | `https://your-backend-app.onrender.com` | URL to the backend pipeline server |
| `PIPELINE_SERVER_API_KEY` | `your-api-key` | Optional: API key for pipeline operations |

### Step 4: Configure File Exclusions

The repository includes a `.vercelignore` file that should exclude backend code from the frontend deployment:

```
# Server directory (backend code)
server/

# SQLite database files
*.db
*.db-shm
*.db-wal

# Backend-specific files
render-startup.sh
test-db-path.js
test-entity-counts.js

# Dev scripts (not needed in production)
scripts/cleanup-root.js
scripts/init-db.js
scripts/validate-db.js

# Test files
tests/
```

Ensure this file is present in the `github-explorer` directory.

### Step 5: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. Once complete, note the URL provided by Vercel (e.g., `https://github-explorer-frontend.vercel.app`)

## Backend Deployment (Render.com)

### Step 1: Create a New Web Service

1. Log in to your Render.com account
2. Click "New" → "Web Service"
3. Select "Build and deploy from a Git repository"
4. Connect your GitHub account if not already connected
5. Select the GitHub Explorer repository

### Step 2: Configure Service Settings

1. **Name**: Choose a name for your backend (e.g., `github-explorer-backend` or `github-repo-cursor`)
2. **Environment**: Select "Node"
3. **Region**: Choose a region close to your users
4. **Branch**: Select the branch to deploy (usually `main`)
5. **Root Directory**: Set to `github-explorer/server`
6. **Build Command**: `npm install`
7. **Start Command**: `npm start`

### Step 3: Configure Environment Variables

Add the following environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Set Node environment to production |
| `PORT` | `10000` | Port for the server (Render sets this automatically) |
| `CORS_ORIGIN` | `https://your-frontend-url.vercel.app` | Frontend URL (from Vercel) |
| `DB_PATH` | `/var/data/github_explorer/github_explorer.db` | Path to SQLite database |
| `DATA_DIR` | `/var/data/github_explorer` | Directory for persistent data |
| `SUPABASE_URL` | `https://your-project.supabase.co` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | `your-service-key` | Supabase service key (not anon key) |

### Step 4: Configure Disk Storage

If using SQLite (though Supabase/PostgreSQL is recommended):

1. In the "Disks" section, click "Add Disk"
2. **Name**: `database`
3. **Mount Path**: `/var/data/github_explorer`
4. **Size**: Choose an appropriate size (1GB minimum)

### Step 5: Advanced Options (Optional)

1. **Auto-Deploy**: Enable for automatic deployments on commits
2. **Health Check Path**: Set to `/health` or `/api/health`
3. **Instance Type**: Choose based on expected load (start with free tier for testing)

### Step 6: Deploy

1. Click "Create Web Service"
2. Render.com will build and deploy your backend
3. Note the URL provided (e.g., `https://github-explorer-backend.onrender.com`)

## Environment Variables

### Critical Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_BACKEND_API_URL` | Frontend | Connects frontend to backend API |
| `PIPELINE_SERVER_URL` | Next.js API Routes | Connects API routes to backend |
| `CORS_ORIGIN` | Backend | Allows requests from frontend domain |
| `SUPABASE_URL` | Both | Connects to Supabase database |
| `SUPABASE_ANON_KEY` | Frontend | Public key for Supabase access |
| `SUPABASE_SERVICE_KEY` | Backend | Private key for Supabase access |

### Local vs Production

Create separate environment files for development and production:

- **Frontend**:
  - `.env.local` (development)
  - `.env.production` (production)

- **Backend**:
  - `.env` (development)
  - `.env.production` (production)

## Deployment Verification

After deploying both services, verify that everything is working correctly:

### Step 1: Check Frontend Connection

1. Visit your Vercel frontend URL
2. Verify the home page loads correctly
3. Check the Network tab in developer tools for API requests
4. Ensure API requests to the backend are succeeding

### Step 2: Check Backend Health

1. Visit `https://your-backend.onrender.com/health` or `/api/health`
2. Verify the health endpoint returns a successful response
3. Check backend logs in Render.com dashboard for any errors

### Step 3: Test Key Features

1. Visit the admin dashboard page
2. Verify entity counts are displayed correctly
3. Try starting a pipeline and confirm it works
4. Navigate to repository, contributor, or merge request pages
5. Verify data is being fetched and displayed

## Troubleshooting

### Common Frontend Deployment Issues

#### Issue: Environment Variables Not Available

**Symptom**: `process.env.NEXT_PUBLIC_*` variables return undefined

**Resolution**:
1. Check that all variables are prefixed with `NEXT_PUBLIC_` for client-side access
2. Verify variables are set in Vercel project settings
3. Redeploy after making changes

#### Issue: 404 Errors for Backend API

**Symptom**: Frontend shows API errors in console

**Resolution**:
1. Verify `NEXT_PUBLIC_BACKEND_API_URL` is set correctly
2. Ensure the URL includes the `/api` path and has no trailing slash
3. Check CORS configuration on the backend

### Common Backend Deployment Issues

#### Issue: Server Not Starting

**Symptom**: Render.com shows deployment failed or health checks failing

**Resolution**:
1. Check Render.com logs for error messages
2. Verify the start command points to the correct entry file (`server.js` not `index.js`)
3. Ensure all required environment variables are set

#### Issue: Database Connection Failures

**Symptom**: Server logs show database connection errors

**Resolution**:
1. For SQLite: Check disk mount configuration
2. For Supabase: Verify credentials and network access
3. Check database path in environment variables

#### Issue: CORS Errors

**Symptom**: Frontend console shows CORS errors

**Resolution**:
1. Check `CORS_ORIGIN` setting matches your Vercel URL exactly (protocol included)
2. Ensure no trailing slash in the origin URL
3. Restart the backend server after changing CORS settings

## Further Reading

- [Vercel Documentation](https://vercel.com/docs)
- [Render.com Documentation](https://render.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Express.js in Production](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Last Updated**: [Current Date] 