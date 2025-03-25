# GitHub Explorer Environment Files

This document explains the environment file structure for the GitHub Explorer application.

## Environment Files Structure

The application uses separate environment files for frontend and backend components, with different files for local development and production:

### Frontend Environment Files (Next.js)

- `.env.local` - Local development environment variables for the frontend
- `.env.production` - Production environment variables for the frontend

### Backend Environment Files (Node.js Server)

- `server/.env` - Local development environment variables for the backend
- `server/.env.production` - Production environment variables for the backend

## Local Development

For local development, the application uses the following files:

- `.env.local` - Frontend variables (automatically loaded by Next.js)
- `server/.env` - Backend variables (loaded by dotenv in the Node.js server)

## Production Deployment

For production deployment on render.com:

- Next.js frontend service should use values from `.env.production`
- Node.js backend service should use values from `server/.env.production`
- Sensitive information (like API keys) should be configured as environment variables in the render.com dashboard rather than in the files

## Environment Variables

### Frontend Variables

The frontend environment variables include:

- `NEXT_PUBLIC_BACKEND_API_URL` - URL of the backend API
- `PIPELINE_SERVER_URL` - URL of the pipeline server
- `PIPELINE_SERVER_API_KEY` - API key for the pipeline server
- `NEXT_PUBLIC_APP_URL` - URL of the frontend application
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase authentication configuration

### Backend Variables

The backend environment variables include:

- `NODE_ENV` - Environment type (development/production)
- `PORT` - Server port
- `CORS_ORIGIN` - CORS allowed origin
- `DB_TYPE` and `DB_PATH` - Database configuration
- `GITHUB_API_URL` and `GITHUB_TOKEN` - GitHub API configuration
- Pipeline configuration variables
- Rate limiting and logging configuration
- Migration configuration

## Important Notes

1. Never commit sensitive information like API keys to the repository
2. Use environment variables on render.com for sensitive information
3. The local development environment uses http://localhost:3000 for the frontend and http://localhost:3001 for the backend
4. The frontend code must never attempt to access .env variables unless they are prefixed with NEXT_PUBLIC_ 