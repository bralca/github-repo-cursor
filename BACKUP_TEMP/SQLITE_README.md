# SQLite Implementation for GitHub Explorer

This document provides instructions for setting up and using SQLite as a local database backend for GitHub Explorer.

## Overview

GitHub Explorer supports two database backends:
1. **Supabase PostgreSQL** (primary, cloud-based)
2. **SQLite** (local development and testing)

The SQLite implementation allows you to work with GitHub data locally without requiring a connection to Supabase.

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- SQLite3 command-line tools installed
  - macOS: `brew install sqlite3`
  - Windows: Download from [SQLite website](https://www.sqlite.org/download.html)
  - Linux: `sudo apt-get install sqlite3`

### Configuration

1. Create or update your `.env` file to use SQLite:

```
DB_TYPE=sqlite
DB_PATH=github_explorer.db
```

2. Initialize the database schema:

```bash
sqlite3 github_explorer.db < manual_schema.sql
```

### Data Import Options

#### Option 1: Import from Supabase

If you have access to Supabase and want to import data:

1. Configure Supabase credentials in `.env`:

```
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

2. Export data from Supabase:

```bash
node export-raw-data-to-sqlite.js
```

3. Import the data into the SQLite database:

```bash
node migrate_table.js
```

#### Option 2: Start with an Empty Database

If you don't have Supabase access or want to start fresh:

1. Initialize the database with the schema only:

```bash
sqlite3 github_explorer.db < manual_schema.sql
```

2. Use the application to fetch and store GitHub data directly.

### Testing the Connection

Verify your SQLite setup:

```bash
node test-closed-merge-requests.js
```

This should display information about the database connection and sample data if available.

## Database Structure

The primary table in the SQLite database is:

### closed_merge_requests_raw

Stores raw JSON data from GitHub API specifically for closed merge requests.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key (auto-incrementing) |
| entity_type | TEXT | Type of entity (repository, contributor, etc.) |
| github_id | TEXT | GitHub identifier |
| data | TEXT | JSON data stored as text |
| fetched_at | TEXT | When the data was fetched |
| api_endpoint | TEXT | API endpoint used |
| etag | TEXT | ETag for caching |
| created_at | TEXT | When the record was created |

## Database Management

### Using SQLite Studio (Recommended)

[SQLite Studio](https://sqlitestudio.pl/) provides a GUI for managing your SQLite database:

1. Download and install SQLite Studio
2. Open SQLite Studio and connect to your `github_explorer.db` file
3. Use the interface to browse tables, run queries, and manage data

### Using Command Line

Basic SQLite commands:

```bash
# Open the database
sqlite3 github_explorer.db

# List tables
.tables

# Show schema for a table
.schema closed_merge_requests_raw

# Run a query
SELECT COUNT(*) FROM closed_merge_requests_raw;

# Exit
.exit
```

## Database Utility Functions

The application includes utility functions in `lib/database.js` that abstract the database backend:

```javascript
import { 
  getDb, 
  fetchClosedMergeRequest, 
  storeClosedMergeRequest, 
  queryClosedMergeRequests, 
  closeDb 
} from './lib/database.js';

// Example usage:
async function example() {
  // Get database connection
  const db = await getDb();
  
  // Query merge requests
  const data = await queryClosedMergeRequests(null, { limit: 10 });
  
  // Close connection when done
  await closeDb();
}
```

## Optimizations

The SQLite database has been optimized for performance and storage efficiency:

1. **Auto-incrementing Integer IDs**: Using proper integer primary keys instead of large strings
2. **Specific Tables**: Using a dedicated table for closed merge requests instead of a generic raw data table
3. **Proper Indexing**: Indexing frequently queried columns for faster access

These optimizations result in approximately 60% reduction in database size compared to the previous implementation, while maintaining full functionality.

## Troubleshooting

### Common Issues

1. **Database file not found**
   - Ensure the path in `DB_PATH` is correct
   - Check file permissions

2. **Table doesn't exist**
   - Run the schema initialization script again
   - Verify the table name matches the schema

3. **Foreign key constraint failed**
   - Ensure referenced records exist before inserting related data
   - Check that foreign key constraints are enabled (`PRAGMA foreign_keys = ON;`)

4. **Database is locked**
   - Close any other connections to the database
   - Ensure all transactions are properly committed or rolled back

### Getting Help

If you encounter issues with the SQLite implementation:

1. Check the application logs for error messages
2. Verify your environment variables are set correctly
3. Ensure SQLite is properly installed and accessible
4. Consult the SQLite documentation at [sqlite.org](https://www.sqlite.org/docs.html)

## Contributing

When contributing code that interacts with the database:

1. Ensure your code works with both Supabase and SQLite backends
2. Test database operations with both backends before submitting changes
3. Update schema files if you modify the database structure
4. Document any SQLite-specific considerations in your pull request 