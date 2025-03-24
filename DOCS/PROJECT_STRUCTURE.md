# GitHub Explorer Project Structure

## Overview

The GitHub Explorer project is organized with distinct separation between frontend, backend, and database components. The architecture follows a clear client-server model where the backend owns the database and the frontend communicates exclusively through API calls.

## Directory Structure

```
/github-repo-cursor (Workspace Root)
├── github-explorer/             # Main Frontend Application (Next.js)
│   ├── app/                     # Next.js pages and API routes
│   │   ├── admin/               # Admin dashboard pages
│   │   └── ...                  # Other application pages
│   ├── components/              # React components
│   ├── hooks/                   # React hooks
│   │   ├── admin/               # Admin hooks using API client
│   │   └── entity/              # Entity hooks using API client
│   ├── lib/                     # Utility functions and services
│   │   ├── client/              # API client for backend communication
│   │   │   ├── api.ts           # Core API fetch function
│   │   │   ├── api-client.ts    # Main API client
│   │   │   ├── entities-api.ts  # Entity counts API
│   │   │   ├── pipeline-api.ts  # Pipeline operations API
│   │   │   └── ...              # Other API modules
│   │   └── ...                  # Other utilities
│   ├── providers/               # React context providers
│   ├── types/                   # TypeScript type definitions
│   ├── public/                  # Static assets
│   ├── .env.local               # Local environment variables
│   ├── .env.production          # Production environment variables
│   └── ...                      # Configuration files
├── github-explorer/server/      # Backend Node.js Application
│   ├── db/                      # Database directory
│   │   └── github_explorer.db   # SQLite database file
│   ├── src/                     # Server source code
│   │   ├── controllers/         # API controllers
│   │   │   └── api/             # API endpoint controllers
│   │   ├── routes/              # API route definitions
│   │   │   └── api-routes.js    # API endpoints routing
│   │   ├── pipeline/            # Pipeline implementation
│   │   │   ├── core/            # Core pipeline functionality
│   │   │   └── processors/      # Pipeline data processors
│   │   ├── utils/               # Server utilities
│   │   │   └── db-path.js       # Database path resolution utility
│   │   │   └── sqlite.js        # SQLite connection utilities
│   │   └── index.js             # Main server entry point
│   ├── scripts/                 # Server maintenance scripts
│   │   └── migrate-db.js        # Database migration script
│   ├── .env                     # Server environment variables
│   └── ...                      # Configuration files
├── DOCS/                        # Documentation files
│   └── data-systems/            # Database documentation
└── ...                          # Other project files
```

## Key Components

### Frontend (Next.js)

- **Location**: `/github-explorer`
- **Framework**: Next.js + React
- **Key Files**:
  - `app/admin/page.tsx`: Admin dashboard
  - `components/admin/PipelineControlCard.tsx`: Dashboard cards for pipeline control
  - `hooks/admin/use-pipeline-status.ts`: Hooks for pipeline status using API client
  - `lib/client/api-client.ts`: Client for API endpoints

### Backend API

- **Location**: `/github-explorer/server/src`
- **Key Directories**:
  - `controllers/api/`: API controller functions for different entities
  - `routes/api-routes.js`: API endpoint routing

### Backend

- **Location**: `/github-explorer/server`
- **Key Components**:
  - Pipeline processing logic
  - Database operations
  - Data extraction and processing
  - API controllers for all data operations

### Database

- **File**: `/github-explorer/server/db/github_explorer.db`
- **Type**: SQLite
- **Path Resolution**: Standardized through `github-explorer/server/src/utils/db-path.js`
- **Configuration**: Connection managed through backend controllers
- **Documentation**: `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md`

## Development Guidelines

### Frontend Development

- All frontend changes should be made in the `/github-explorer` directory
- React components go in `/github-explorer/components`
- Page definitions go in `/github-explorer/app`
- API client code goes in `/github-explorer/lib/client`

### Backend Development

- Server-side code should be in `/github-explorer/server`
- Pipeline processors go in `/github-explorer/server/src/pipeline/processors`
- Database operations in `/github-explorer/server/src/controllers`
- API controllers in `/github-explorer/server/src/controllers/api`

### Database Operations

- SQLite database file is stored in the server directory: `/github-explorer/server/db/github_explorer.db`
- All schema changes must be documented in `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md`
- Frontend code must never interact directly with the database, only through API calls

### API Endpoint Structure

- Backend API endpoints are defined in `/github-explorer/server/src/controllers/api/`
- API routes are configured in `/github-explorer/server/src/routes/api-routes.js`
- Frontend API client is in `/github-explorer/lib/client/`

## Important Notes

1. Database access is managed exclusively by the backend
2. The database file is stored in the `/github-explorer/server/db/` directory
3. Use the `DB_PATH` environment variable to override the default database location
4. Frontend code must only interact with the database through HTTP calls to the backend API
5. All API endpoints should have appropriate error handling 