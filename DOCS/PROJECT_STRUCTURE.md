# GitHub Explorer Project Structure

## Overview

The GitHub Explorer project is organized with distinct separation between frontend, backend, and database components. Understanding this structure is crucial for proper development.

## Directory Structure

```
/github-repo-cursor (Workspace Root)
├── github-explorer/             # Main Frontend Application (Next.js)
│   ├── app/                     # Next.js pages and API routes
│   │   ├── admin/               # Admin dashboard pages
│   │   ├── api/                 # Frontend API endpoints
│   │   │   ├── sqlite/          # API endpoints for SQLite operations
│   │   │   │   ├── [...endpoint]/  # Dynamic route handler
│   │   │   │   └── handlers/    # Individual API handlers
│   │   └── ...                  # Other application pages
│   ├── components/              # React components
│   ├── hooks/                   # React hooks
│   ├── lib/                     # Utility functions and services
│   │   ├── database/            # Database connection and utilities
│   │   │   ├── connection.ts    # SQLite connection management
│   │   │   ├── init-sqlite.ts   # Database initialization
│   │   │   └── sqlite.ts        # Frontend client for SQLite API
│   ├── providers/               # React context providers
│   ├── server/                  # Backend server components
│   │   ├── db/                  # Database directory
│   │   │   └── github_explorer.db  # SQLite database file
│   │   ├── src/                 # Server source code
│   │   │   ├── controllers/     # API controllers
│   │   │   │   └── api/         # API endpoint controllers
│   │   │   ├── pipeline/        # Pipeline implementation
│   │   │   │   ├── core/        # Core pipeline functionality
│   │   │   │   └── processors/  # Pipeline data processors
│   │   │   └── utils/           # Server utilities
│   │   │       └── db-path.js   # Database path resolution utility
│   ├── types/                   # TypeScript type definitions
│   ├── public/                  # Static assets
│   └── ...                      # Configuration files
├── DOCS/                        # Documentation files
│   └── data-systems/            # Database documentation
├── lib/                         # Root-level utilities (legacy)
│   └── database/                # Root-level database utilities (legacy)
├── app/                         # Root-level app (legacy)
│   └── api/                     # Root-level API endpoints (legacy)
└── github_explorer.db           # Legacy SQLite database file (will be removed)
```

## Key Components

### Frontend (Next.js)

- **Location**: `/github-explorer`
- **Framework**: Next.js + React
- **Key Files**:
  - `app/admin/page.tsx`: Admin dashboard
  - `components/admin/PipelineControlCard.tsx`: Dashboard cards for pipeline control
  - `hooks/admin/use-sqlite-pipeline-status.ts`: Hooks for pipeline status
  - `lib/database/sqlite.ts`: Client for SQLite API endpoints

### API Endpoints

- **Location**: `/github-explorer/app/api`
- **Key Directories**:
  - `sqlite/`: API endpoints for SQLite operations (legacy, will be removed)
  - `sqlite/handlers/`: Individual API handlers for different operations (legacy, will be removed)

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
- **Configuration**: Connection managed through `github-explorer/lib/database/connection.ts` (will be updated to use API client)
- **Documentation**: `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md`

## Development Guidelines

### Frontend Development

- All frontend changes should be made in the `/github-explorer` directory
- React components go in `/github-explorer/components`
- Page definitions go in `/github-explorer/app`
- API endpoints for frontend use go in `/github-explorer/app/api`

### Backend Development

- Server-side code should be in `/github-explorer/server`
- Pipeline processors go in `/github-explorer/server/src/pipeline/processors`
- Database operations in `/github-explorer/server/src/controllers`
- API controllers in `/github-explorer/server/src/controllers/api`

### Database Operations

- SQLite database file is stored in the server directory: `/github-explorer/server/db/github_explorer.db`
- All schema changes must be documented in `DOCS/data-systems/DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md`
- Frontend database access is through API endpoints (HTTP calls to backend API)

### API Endpoint Structure

- Frontend API endpoints should be in `/github-explorer/app/api/` (will be replaced by backend API calls)
- Backend API endpoints are defined in `/github-explorer/server/src/controllers/api/`
- API routes are configured in `/github-explorer/server/src/routes/api-routes.js`

## Important Notes

1. Do not confuse the root-level `app/` and `lib/` directories with those in the `github-explorer/` directory
2. Database access is standardized through `github-explorer/server/src/utils/db-path.js` utility
3. The SQLite database file is stored in the `/github-explorer/server/db/` directory
4. Use the `DB_PATH` environment variable to override the default database location
5. Frontend code should only interact with the database through HTTP calls to the backend API 