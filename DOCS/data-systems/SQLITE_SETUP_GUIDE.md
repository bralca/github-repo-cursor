# SQLite Setup Guide for GitHub Explorer

This guide provides instructions for setting up SQLite for the GitHub Explorer application.

## Overview

GitHub Explorer has been updated to use SQLite as the primary database for data storage, while still using Supabase for authentication. This document guides you through the setup process.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- GitHub API token for data fetching (if using the pipeline)

## Installation

1. Clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/your-organization/github-explorer.git
   cd github-explorer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Install SQLite packages:
   ```bash
   npm install sqlite sqlite3
   # or
   yarn add sqlite sqlite3
   ```

## Configuration

1. Create or update your `.env.local` file with the following variables:

   ```
   # Database configuration
   DB_PATH=./github_explorer.db
   
   # Pipeline configuration
   PIPELINE_SERVER_URL=http://localhost:3001
   PIPELINE_SERVER_API_KEY=your_secret_key
   
   # GitHub configuration for data fetching
   GITHUB_TOKEN=your_github_token
   ```

   > **Note**: The `DB_PATH` is relative to your project root. You can use an absolute path if needed.

2. Configure environment variables in your deployment platform (Vercel, Netlify, etc.) with the same values.

## Database Initialization

GitHub Explorer will automatically create the SQLite database and schema when it first connects. However, you can manually initialize the database with:

```bash
# Create a script to run the initialization
node scripts/init-sqlite-db.js
```

## Starting the Pipeline Server

The pipeline server is a separate Node.js application that runs in parallel to your Next.js application. It handles data processing tasks in the background.

1. Start the pipeline server:
   ```bash
   npm run pipeline-server
   # or
   yarn pipeline-server
   ```

2. Start the Next.js development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

> **Important**: Both servers need to be running for the pipeline operations to work correctly.

## Migration from Supabase

If you're migrating from Supabase to SQLite, you can use the migration tool to transfer your data:

```bash
# Run the migration tool
npm run migrate-supabase-to-sqlite
# or
yarn migrate-supabase-to-sqlite
```

This will connect to your Supabase database, extract the data, and insert it into your SQLite database.

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Check that the `DB_PATH` is correct and the directory is writable
   - Ensure SQLite packages are installed correctly

2. **Pipeline connection errors**:
   - Verify the pipeline server is running
   - Check that `PIPELINE_SERVER_URL` points to the correct address

3. **Missing tables**:
   - The tables are created automatically on first access
   - Check console logs for any SQLite errors during initialization

### Getting Help

If you encounter issues not covered here, please:

1. Check the application logs for specific error messages
2. Refer to the SQLite documentation for database-specific problems
3. Open an issue in the GitHub repository

## Backup and Maintenance

SQLite databases are contained in a single file, making backup simple:

1. Regular backups:
   ```bash
   # Copy the database file to a backup location
   cp github_explorer.db backups/github_explorer_$(date +%Y%m%d).db
   ```

2. Database optimization:
   ```bash
   # Run VACUUM to optimize the database
   sqlite3 github_explorer.db "VACUUM;"
   ```

## Additional Resources

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [GitHub Explorer Database Documentation](./DATABASE_DOCUMENTATION.md)
- [SQLite Node.js Driver](https://github.com/TryGhost/node-sqlite3/wiki) 