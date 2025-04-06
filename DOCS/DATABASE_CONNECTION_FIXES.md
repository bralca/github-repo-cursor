# Database Connection Management Fixes

This document tracks files where `db.close()` is called directly, which can interfere with the database connection manager pattern.

## Connection Manager Files (DO NOT MODIFY)

These files manage database connections and should have `db.close()` calls:

1. `github-explorer/server/src/db/connection-manager.js` - This file is responsible for managing database connections and should contain `db.close()` calls.

## Core Utility Files (MAY NEED MODIFICATION)

These files are utilities that may need special handling:

1. `github-explorer/server/src/utils/sqlite.js` - Basic SQLite utility functions
2. `github-explorer/server/src/utils/verify-db-connection.js` - Verification utility for database connections
3. `github-explorer/server/src/migrations/run-migration.js` - Database migration script

## Script Files (MAY NEED MODIFICATION)

These are standalone scripts that may run independently:

1. `github-explorer/server/scripts/init-db.js` - Database initialization script
2. `github-explorer/server/scripts/validate-db.js` - Database validation script
3. `github-explorer/server/scripts/reenrich-commits-with-missing-filenames.js` - Data repair script

## API Controller Files (NEED MODIFICATION)

These files should be updated to use the connection manager and not close connections:

1. `github-explorer/server/src/controllers/pipeline-operations-controller.js` - Fixed by removing all `db.close()` calls
2. `github-explorer/server/src/controllers/api/sitemap.js` - Fixed by removing all `db.close()` calls
3. `github-explorer/server/src/controllers/api/pipeline-operations.js` - Fixed by removing all `db.close()` calls
4. `github-explorer/server/src/controllers/api/contributor-rankings.js` - Fixed by removing all `db.close()` calls

## Sitemap Generation Files (NEED MODIFICATION)

Sitemap related files that require updates:

1. `github-explorer/server/src/utils/db-init-sitemap.js` - Fixed by removing all `db.close()` calls
2. `github-explorer/server/scripts/generate-sitemap.js` - Fixed by improving connection handling

## Pipeline Enricher Files (NEED MODIFICATION)

Pipeline enricher classes that need updates:

1. `github-explorer/server/src/pipeline/enrichers/repository-enricher.js` - Fixed by removing `this.db.close()` calls
2. `github-explorer/server/src/pipeline/enrichers/contributor-enricher.js` - Fixed by removing `this.db.close()` calls

## Guidelines for Fixing `db.close()` Issues

When fixing these issues, follow these guidelines:

1. **API Controllers**: Remove all `db.close()` calls and let the connection manager handle connections
2. **Utility Functions**: Remove all `db.close()` calls if they're used within the API server
3. **Standalone Scripts**: May keep `db.close()` calls if they run as separate processes
4. **Connection Manager**: Keep `db.close()` calls as this is the proper place to manage connections

## Solution Strategy

1. Replace direct database connections with connection manager (`getConnection()`)
2. Remove explicit `db.close()` calls from API controllers and utilities
3. Update comments to note that connections are managed by the connection manager
4. Restart the server after making changes to ensure connections are properly managed 