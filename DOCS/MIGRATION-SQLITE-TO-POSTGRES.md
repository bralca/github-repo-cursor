# Migrating from SQLite to PostgreSQL

## Overview

This document outlines a step-by-step plan for migrating the GitHub Explorer application from SQLite to PostgreSQL. This migration is necessary to support the expected massive database requirements of the application in production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Migration Strategy](#migration-strategy)
3. [Environment Setup](#environment-setup)
4. [Database Connection Changes](#database-connection-changes)
5. [SQL Syntax Changes](#sql-syntax-changes)
6. [Testing Plan](#testing-plan)
7. [Deployment Strategy](#deployment-strategy)
8. [Rollback Plan](#rollback-plan)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

Before beginning the migration, ensure you have:

- PostgreSQL installed locally for development
- Heroku account for production deployment
- Access to the GitHub Explorer codebase

Required packages:
```bash
npm install pg pg-promise dotenv
```

## Migration Strategy

This migration will follow a phased approach:

1. **Phase 1**: Create PostgreSQL schema and adapt connection logic
2. **Phase 2**: Adapt SQL queries for PostgreSQL compatibility
3. **Phase 3**: Data migration
4. **Phase 4**: Testing
5. **Phase 5**: Production deployment

## Environment Setup

### Local Development Setup

1. Install PostgreSQL locally:
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. Create development database:
   ```bash
   createdb github_explorer_dev
   ```

3. Add environment variables to `.env`:
   ```
   # PostgreSQL Connection
   DATABASE_URL=postgres://username:password@localhost:5432/github_explorer_dev
   ```

### Heroku Setup

1. Create a PostgreSQL database on Heroku:
   ```bash
   heroku addons:create heroku-postgresql:standard-0
   ```

2. Get the connection string:
   ```bash
   heroku config:get DATABASE_URL
   ```

## Database Connection Changes

### Create Database Adapter Module

Create a new file at `github-explorer/lib/database/postgres.ts`:

```typescript
import { Pool, PoolClient } from 'pg';
import { randomUUID } from 'crypto';

// Parse database URL
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
};

// Connection pool
let pool: Pool | null = null;

/**
 * Initialize the database connection pool
 */
export const initializePool = () => {
  if (pool) return;
  
  pool = new Pool({
    connectionString: getDatabaseUrl(),
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
    } : undefined,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 5000, // Return an error after 5 seconds if a connection couldn't be established
  });
  
  pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
  });
  
  console.log('PostgreSQL connection pool initialized');
};

/**
 * Get a client from the pool
 */
export const getClient = async (): Promise<PoolClient> => {
  if (!pool) {
    initializePool();
  }
  return pool!.connect();
};

/**
 * Execute a database operation with a client
 */
export async function withPgClient<T>(
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    return await operation(client);
  } finally {
    client.release();
  }
}

/**
 * Generate a UUID for primary keys
 */
export function generateUuid(): string {
  return randomUUID();
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('PostgreSQL connection pool closed');
  }
}
```

### Update Database Connection Utility

Modify `github-explorer/lib/database/connection.ts` to support both SQLite and PostgreSQL:

```typescript
import sqlite3 from 'sqlite3';
import { open, Database as SQLiteDatabase } from 'sqlite';
import { PoolClient } from 'pg';
import path from 'path';
import fs from 'fs';
import { withPgClient, initializePool } from './postgres';

// Which database to use
const USE_POSTGRES = process.env.USE_POSTGRES === 'true';

// Set debug mode for sqlite3 when in development
if (process.env.NODE_ENV === 'development' && !USE_POSTGRES) {
  sqlite3.verbose();
}

// Connection cache for SQLite
let dbInstance: SQLiteDatabase | null = null;

/**
 * Get a SQLite database connection
 * This creates a connection if one doesn't exist, or returns the cached one
 */
export async function getSQLiteDb(): Promise<SQLiteDatabase> {
  if (USE_POSTGRES) {
    throw new Error('Trying to use SQLite when PostgreSQL is configured');
  }
  
  if (dbInstance) {
    return dbInstance;
  }
  
  // Use the standardized database path resolution
  const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), '../../github_explorer.db');
  
  // Log database connection for debugging
  console.log(`Opening SQLite database at: ${dbPath}`);
  
  // Ensure the directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  try {
    // Open the database with improved settings
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    
    // Cache the database instance
    dbInstance = db;
    
    // Set some pragmas for performance
    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec('PRAGMA synchronous = NORMAL;');
    await db.exec('PRAGMA foreign_keys = ON;');
    await db.exec('PRAGMA temp_store = MEMORY;');
    
    console.log('SQLite database connection established successfully');
    return db;
  } catch (error) {
    console.error('Error opening SQLite database:', error);
    throw new Error(`Failed to open SQLite database at ${dbPath}: ${error}`);
  }
}

/**
 * Execute a database operation with a connection
 * @param callback The operation to execute with the database connection
 * @returns The result of the callback
 */
export async function withDb<T>(
  callback: (db: SQLiteDatabase | PoolClient) => Promise<T>
): Promise<T> {
  // Initialize PostgreSQL pool if needed
  if (USE_POSTGRES) {
    initializePool();
    return withPgClient(callback);
  }
  
  // Use SQLite
  const db = await getSQLiteDb();
  
  try {
    // Execute the callback with the database connection
    return await callback(db);
  } catch (error) {
    console.error('Error executing database operation:', error);
    throw error;
  }
}

/**
 * Check if we're using PostgreSQL
 */
export function isUsingPostgres(): boolean {
  return USE_POSTGRES === true;
}
```

## Database Schema Changes

Create a file at `github-explorer/lib/database/init-postgres.ts`:

```typescript
import { withPgClient } from './postgres';

/**
 * Initialize PostgreSQL database with required tables
 */
export async function initPostgresDatabase() {
  console.log('Initializing PostgreSQL database...');
  
  await withPgClient(async (client) => {
    // Start a transaction
    await client.query('BEGIN');
    
    try {
      // Pipeline Status Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS pipeline_status (
          pipeline_type TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          is_running INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Pipeline History Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS pipeline_history (
          id SERIAL PRIMARY KEY,
          pipeline_type TEXT NOT NULL,
          status TEXT NOT NULL,
          started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP,
          items_processed INTEGER DEFAULT 0,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Pipeline Schedules Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS pipeline_schedules (
          id SERIAL PRIMARY KEY,
          pipeline_type TEXT UNIQUE NOT NULL,
          cron_expression TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 0,
          description TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert default pipeline schedules if they don't exist
      await client.query(`
        INSERT INTO pipeline_schedules 
          (pipeline_type, cron_expression, is_active, description) 
        VALUES 
          ('github_sync', '0 */2 * * *', 0, 'Sync GitHub data every 2 hours'),
          ('data_processing', '15 */2 * * *', 0, 'Process raw data every 2 hours'),
          ('data_enrichment', '30 */4 * * *', 0, 'Enrich entities every 4 hours'),
          ('ai_analysis', '0 2 * * *', 0, 'Run AI analysis daily at 2 AM')
        ON CONFLICT (pipeline_type) DO NOTHING
      `);
      
      // Insert default pipeline status records if they don't exist
      await client.query(`
        INSERT INTO pipeline_status 
          (pipeline_type, status, is_running, updated_at) 
        VALUES 
          ('github_sync', 'idle', 0, NOW()),
          ('data_processing', 'idle', 0, NOW()),
          ('data_enrichment', 'idle', 0, NOW()),
          ('ai_analysis', 'idle', 0, NOW())
        ON CONFLICT (pipeline_type) DO NOTHING
      `);
      
      // Raw Data Tables
      
      // Closed Merge Requests Raw Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS closed_merge_requests_raw (
          id SERIAL PRIMARY KEY,
          entity_type TEXT NOT NULL,
          github_id TEXT NOT NULL,
          data JSONB NOT NULL,
          fetched_at TIMESTAMP NOT NULL DEFAULT NOW(),
          api_endpoint TEXT,
          etag TEXT,
          is_processed INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Core Entity Tables
      
      // Repositories Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS repositories (
          id UUID PRIMARY KEY,
          github_id BIGINT NOT NULL,
          name TEXT NOT NULL,
          full_name TEXT NOT NULL,
          description TEXT,
          url TEXT,
          api_url TEXT,
          stars INTEGER,
          forks INTEGER,
          is_enriched INTEGER DEFAULT 0,
          health_percentage INTEGER,
          open_issues_count INTEGER,
          last_updated TIMESTAMP,
          size_kb INTEGER,
          watchers_count INTEGER,
          primary_language TEXT,
          license TEXT,
          is_fork BOOLEAN DEFAULT FALSE,
          is_archived BOOLEAN DEFAULT FALSE,
          default_branch TEXT,
          source TEXT,
          owner_id UUID,
          owner_github_id BIGINT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Contributors Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS contributors (
          id UUID PRIMARY KEY,
          github_id BIGINT NOT NULL,
          username TEXT,
          name TEXT,
          avatar TEXT,
          is_enriched INTEGER DEFAULT 0,
          bio TEXT,
          company TEXT,
          blog TEXT,
          twitter_username TEXT,
          location TEXT,
          followers INTEGER,
          repositories INTEGER,
          impact_score INTEGER,
          role_classification TEXT,
          top_languages JSONB,
          organizations JSONB,
          first_contribution TIMESTAMP,
          last_contribution TIMESTAMP,
          direct_commits INTEGER,
          pull_requests_merged INTEGER,
          pull_requests_rejected INTEGER,
          code_reviews INTEGER,
          is_placeholder BOOLEAN DEFAULT FALSE,
          is_bot BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Merge Requests Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS merge_requests (
          id UUID PRIMARY KEY,
          github_id INTEGER NOT NULL,
          repository_id UUID NOT NULL,
          repository_github_id BIGINT,
          author_id UUID,
          author_github_id BIGINT,
          title TEXT NOT NULL,
          description TEXT,
          state TEXT NOT NULL,
          is_draft BOOLEAN DEFAULT FALSE,
          is_enriched INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          closed_at TIMESTAMP,
          merged_at TIMESTAMP,
          merged_by_id UUID,
          merged_by_github_id BIGINT,
          commits_count INTEGER,
          additions INTEGER,
          deletions INTEGER,
          changed_files INTEGER,
          complexity_score INTEGER,
          review_time_hours INTEGER,
          cycle_time_hours INTEGER,
          labels JSONB,
          source_branch TEXT,
          target_branch TEXT,
          review_count INTEGER,
          comment_count INTEGER,
          FOREIGN KEY (repository_id) REFERENCES repositories(id),
          FOREIGN KEY (author_id) REFERENCES contributors(id)
        )
      `);
      
      // Commits Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS commits (
          id UUID PRIMARY KEY,
          github_id TEXT NOT NULL,
          repository_id UUID NOT NULL,
          repository_github_id BIGINT,
          contributor_id UUID,
          contributor_github_id BIGINT,
          pull_request_id UUID,
          pull_request_github_id INTEGER,
          message TEXT NOT NULL,
          committed_at TIMESTAMP,
          parents JSONB,
          filename TEXT,
          status TEXT,
          additions INTEGER,
          deletions INTEGER,
          patch TEXT,
          complexity_score INTEGER,
          is_merge_commit BOOLEAN DEFAULT FALSE,
          is_enriched INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (repository_id) REFERENCES repositories(id),
          FOREIGN KEY (contributor_id) REFERENCES contributors(id),
          FOREIGN KEY (pull_request_id) REFERENCES merge_requests(id)
        )
      `);
      
      // Junction table for contributor-repository relationship
      await client.query(`
        CREATE TABLE IF NOT EXISTS contributor_repository (
          id UUID PRIMARY KEY,
          contributor_id UUID NOT NULL,
          contributor_github_id BIGINT,
          repository_id UUID NOT NULL,
          repository_github_id BIGINT,
          commit_count INTEGER,
          pull_requests INTEGER,
          reviews INTEGER,
          issues_opened INTEGER,
          first_contribution_date TIMESTAMP,
          last_contribution_date TIMESTAMP,
          lines_added INTEGER,
          lines_removed INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (contributor_id) REFERENCES contributors(id),
          FOREIGN KEY (repository_id) REFERENCES repositories(id)
        )
      `);
      
      // Rankings Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS contributor_rankings (
          id UUID PRIMARY KEY,
          contributor_id UUID NOT NULL,
          contributor_github_id BIGINT NOT NULL,
          rank_position INTEGER NOT NULL,
          total_score REAL NOT NULL,
          code_volume_score REAL NOT NULL,
          code_efficiency_score REAL NOT NULL,
          commit_impact_score REAL NOT NULL,
          collaboration_score REAL NOT NULL,
          repo_popularity_score REAL NOT NULL,
          repo_influence_score REAL NOT NULL,
          followers_score REAL NOT NULL,
          profile_completeness_score REAL NOT NULL,
          followers_count INTEGER,
          raw_lines_added INTEGER,
          raw_lines_removed INTEGER,
          raw_commits_count INTEGER,
          repositories_contributed INTEGER,
          calculation_timestamp TIMESTAMP NOT NULL,
          FOREIGN KEY (contributor_id) REFERENCES contributors(id)
        )
      `);
      
      // Create indices for efficient querying
      await client.query(`CREATE INDEX IF NOT EXISTS idx_contributor_rankings_contributor_id ON contributor_rankings(contributor_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_contributor_rankings_timestamp ON contributor_rankings(calculation_timestamp)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_contributor_rankings_rank ON contributor_rankings(rank_position)`);
      
      await client.query(`CREATE INDEX IF NOT EXISTS idx_commits_github_id ON commits(github_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_commits_repository_id ON commits(repository_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_commits_contributor_id ON commits(contributor_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_commits_pull_request_id ON commits(pull_request_id)`);
      
      // Commit the transaction
      await client.query('COMMIT');
      
      console.log('PostgreSQL database initialization completed successfully');
    } catch (error) {
      // Rollback the transaction on error
      await client.query('ROLLBACK');
      console.error('Error initializing PostgreSQL database:', error);
      throw error;
    }
  });
}

// Initialize the database when this module is imported
initPostgresDatabase().catch(console.error);
```

## SQL Syntax Changes

Create a file at `github-explorer/lib/database/sql-adapter.ts` to handle syntax differences:

```typescript
import { isUsingPostgres } from './connection';

/**
 * Convert SQLite-style query to PostgreSQL-style query
 * @param query The SQL query
 * @returns The converted query
 */
export function adaptQuery(query: string): string {
  if (!isUsingPostgres()) {
    return query;
  }
  
  // Replace SQLite-specific syntax with PostgreSQL equivalents
  let pgQuery = query;
  
  // Replace randomblob() with gen_random_uuid()
  pgQuery = pgQuery.replace(/hex\(randomblob\(16\)\)/g, 'gen_random_uuid()');
  
  // Replace datetime() with NOW()
  pgQuery = pgQuery.replace(/datetime\('now'(, [^)]+)?\)/g, 'NOW()');
  
  // Replace INSERT OR IGNORE with INSERT ... ON CONFLICT DO NOTHING
  if (pgQuery.includes('INSERT OR IGNORE INTO')) {
    const tableName = pgQuery.match(/INSERT OR IGNORE INTO\s+(\w+)/)?.[1];
    const uniqueFields = getUniqueFields(tableName);
    
    if (uniqueFields) {
      pgQuery = pgQuery.replace('INSERT OR IGNORE INTO', 'INSERT INTO');
      pgQuery += ` ON CONFLICT (${uniqueFields}) DO NOTHING`;
    } else {
      console.warn(`Could not determine unique fields for table ${tableName}, INSERT OR IGNORE may not work correctly`);
    }
  }
  
  // Handle AUTOINCREMENT for PostgreSQL
  pgQuery = pgQuery.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');
  
  // Handle COALESCE with different parameter types
  pgQuery = pgQuery.replace(/POWER\(/g, 'POW(');
  
  // Replace JSON handling
  pgQuery = pgQuery.replace(/JSON_EXTRACT\(([^,]+), '([^']+)'\)/g, '$1->\'$2\'');
  
  return pgQuery;
}

/**
 * Get unique fields for a table (for ON CONFLICT clause)
 * This is a simplified version, in practice you would need to check the actual schema
 */
function getUniqueFields(tableName: string | undefined): string | null {
  if (!tableName) return null;
  
  const uniqueConstraints: Record<string, string> = {
    'pipeline_schedules': 'pipeline_type',
    'pipeline_status': 'pipeline_type',
    'repositories': 'github_id',
    'contributors': 'github_id',
    'merge_requests': 'repository_id, github_id',
    'commits': 'github_id, repository_id, filename',
    'contributor_repository': 'contributor_id, repository_id'
  };
  
  return uniqueConstraints[tableName] || null;
}

/**
 * Prepare values for insertion into PostgreSQL
 * @param values Values to be inserted
 * @returns Processed values
 */
export function adaptValues(values: any): any {
  if (!isUsingPostgres()) {
    return values;
  }
  
  // Handle arrays and objects for JSONB columns
  if (values && typeof values === 'object') {
    if (Array.isArray(values)) {
      return values.map(adaptValues);
    }
    
    const result: Record<string, any> = {};
    for (const key in values) {
      const value = values[key];
      
      // Convert JSON strings to PostgreSQL JSONB
      if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          const parsed = JSON.parse(value);
          result[key] = parsed; // Store as object, pg driver will handle conversion
        } catch (e) {
          result[key] = value; // Not valid JSON, keep as string
        }
      } else if (value && typeof value === 'object') {
        result[key] = adaptValues(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  
  return values;
}
```

## Data Migration

Create a script at `github-explorer/scripts/migrate-to-postgres.ts`:

```typescript
import dotenv from 'dotenv';
dotenv.config();

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { Pool } from 'pg';
import fs from 'fs';

// Define batch size for processing
const BATCH_SIZE = 1000;

// Set source SQLite database path
const SQLITE_DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), '../../github_explorer.db');

// PostgreSQL connection
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

async function getSqliteDb() {
  return open({
    filename: SQLITE_DB_PATH,
    driver: sqlite3.Database
  });
}

async function migrateTable(tableName: string, transformRow?: (row: any) => any) {
  console.log(`Migrating table: ${tableName}`);
  
  // Connect to both databases
  const sqliteDb = await getSqliteDb();
  const pgClient = await pgPool.connect();
  
  try {
    // Get the schema for the table from SQLite
    const columns = await sqliteDb.all(`PRAGMA table_info(${tableName})`);
    if (!columns || columns.length === 0) {
      console.log(`Table ${tableName} does not exist in SQLite database, skipping`);
      return;
    }
    
    // Get the total number of rows
    const countResult = await sqliteDb.get(`SELECT COUNT(*) as count FROM ${tableName}`);
    const totalRows = countResult.count;
    console.log(`Found ${totalRows} rows to migrate in ${tableName}`);
    
    // Process in batches to avoid memory issues
    for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
      console.log(`Processing batch ${Math.floor(offset / BATCH_SIZE) + 1}/${Math.ceil(totalRows / BATCH_SIZE)}`);
      
      // Fetch a batch of rows from SQLite
      const rows = await sqliteDb.all(`SELECT * FROM ${tableName} LIMIT ${BATCH_SIZE} OFFSET ${offset}`);
      
      if (rows.length === 0) break;
      
      // Start a transaction for this batch
      await pgClient.query('BEGIN');
      
      try {
        for (const row of rows) {
          // Transform row if needed
          const transformedRow = transformRow ? transformRow(row) : row;
          
          // Convert any JSON strings to objects for PostgreSQL JSONB
          Object.keys(transformedRow).forEach(key => {
            if (typeof transformedRow[key] === 'string') {
              try {
                // Check if it's a JSON string
                if ((transformedRow[key].startsWith('{') && transformedRow[key].endsWith('}')) ||
                    (transformedRow[key].startsWith('[') && transformedRow[key].endsWith(']'))) {
                  transformedRow[key] = JSON.parse(transformedRow[key]);
                }
              } catch (e) {
                // Not a JSON string, leave as is
              }
            }
          });
          
          // Build the column names and parameter placeholders
          const columnNames = Object.keys(transformedRow).join(', ');
          const paramPlaceholders = Object.keys(transformedRow).map((_, index) => `$${index + 1}`).join(', ');
          const paramValues = Object.values(transformedRow);
          
          // Insert into PostgreSQL
          await pgClient.query(
            `INSERT INTO ${tableName} (${columnNames}) VALUES (${paramPlaceholders}) ON CONFLICT DO NOTHING`,
            paramValues
          );
        }
        
        // Commit the transaction
        await pgClient.query('COMMIT');
      } catch (error) {
        // Rollback on error
        await pgClient.query('ROLLBACK');
        console.error(`Error migrating batch in ${tableName}:`, error);
        throw error;
      }
    }
    
    console.log(`Completed migration of ${tableName}`);
  } catch (error) {
    console.error(`Error migrating table ${tableName}:`, error);
    throw error;
  } finally {
    // Close connections
    await sqliteDb.close();
    pgClient.release();
  }
}

async function migrateDatabase() {
  console.log('Starting database migration from SQLite to PostgreSQL');
  
  try {
    // Create PostgreSQL schema first
    // This would require importing your initPostgresDatabase() function
    // For now, assuming the schema is already created
    
    // Migrate tables in order to satisfy foreign key constraints
    
    // Migrate basic tables first
    await migrateTable('pipeline_status');
    await migrateTable('pipeline_history');
    await migrateTable('pipeline_schedules');
    await migrateTable('closed_merge_requests_raw', row => {
      // Convert data field to proper JSON
      if (row.data && typeof row.data === 'string') {
        try {
          row.data = JSON.parse(row.data);
        } catch (e) {
          console.warn('Could not parse JSON data:', e);
        }
      }
      return row;
    });
    
    // Migrate core entity tables in dependency order
    await migrateTable('contributors');
    await migrateTable('repositories');
    await migrateTable('merge_requests');
    await migrateTable('commits');
    await migrateTable('contributor_repository');
    await migrateTable('contributor_rankings');
    
    console.log('Database migration completed successfully');
    
    // Verify migration
    await verifyMigration();
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the pool
    await pgPool.end();
  }
}

async function verifyMigration() {
  console.log('Verifying migration...');
  
  const sqliteDb = await getSqliteDb();
  const pgClient = await pgPool.connect();
  
  try {
    // Get tables from SQLite
    const sqliteTables = await sqliteDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    
    for (const { name: tableName } of sqliteTables) {
      // Count rows in SQLite
      const sqliteCount = await sqliteDb.get(`SELECT COUNT(*) as count FROM ${tableName}`);
      
      // Count rows in PostgreSQL
      const pgCount = await pgClient.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      
      console.log(`Table ${tableName}: SQLite=${sqliteCount.count}, PostgreSQL=${pgCount.rows[0].count}`);
    }
    
    console.log('Verification completed');
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await sqliteDb.close();
    pgClient.release();
  }
}

// Run the migration
migrateDatabase().catch(console.error);
```

## Testing Plan

Before deploying to production, follow this testing plan:

### Test 1: SQLite vs PostgreSQL Query Syntax

Create a file at `github-explorer/scripts/test-query-syntax.ts`:

```typescript
import dotenv from 'dotenv';
dotenv.config();

import { withDb } from '../lib/database/connection';
import { adaptQuery } from '../lib/database/sql-adapter';

// Set of test queries to validate
const TEST_QUERIES = [
  // Simple SELECT
  "SELECT * FROM repositories LIMIT 10",
  
  // Join query
  "SELECT r.name, c.username FROM repositories r JOIN contributor_repository cr ON r.id = cr.repository_id JOIN contributors c ON cr.contributor_id = c.id LIMIT 5",
  
  // Query with datetime
  "SELECT * FROM pipeline_history WHERE created_at > datetime('now', '-1 day')",
  
  // Insert with hex(randomblob())
  "INSERT INTO repositories (id, github_id, name, full_name) VALUES (hex(randomblob(16)), 12345, 'test-repo', 'org/test-repo')",
  
  // INSERT OR IGNORE
  "INSERT OR IGNORE INTO pipeline_status (pipeline_type, status) VALUES ('test', 'idle')"
];

async function testQuerySyntax() {
  console.log('Testing query syntax adaptation for PostgreSQL...');
  
  for (const query of TEST_QUERIES) {
    console.log('\nOriginal query:');
    console.log(query);
    
    console.log('Adapted query:');
    console.log(adaptQuery(query));
    
    console.log('-------------------------------------------');
  }
}

testQuerySyntax().catch(console.error);
```

### Test 2: Connection Switching

Create a file at `github-explorer/scripts/test-connection-switching.ts`:

```typescript
import dotenv from 'dotenv';
dotenv.config();

import { withDb } from '../lib/database/connection';

async function testConnectionSwitching() {
  console.log('Testing database connection switching...');
  
  // First with SQLite
  process.env.USE_POSTGRES = 'false';
  
  try {
    const sqliteResult = await withDb(async (db) => {
      return db.get('SELECT sqlite_version() as version');
    });
    
    console.log('SQLite connection successful:');
    console.log('SQLite version:', sqliteResult?.version);
  } catch (e) {
    console.error('SQLite connection failed:', e);
  }
  
  // Then with PostgreSQL
  process.env.USE_POSTGRES = 'true';
  
  try {
    const pgResult = await withDb(async (client) => {
      const result = await client.query('SELECT version()');
      return result.rows[0];
    });
    
    console.log('PostgreSQL connection successful:');
    console.log('PostgreSQL version:', pgResult?.version);
  } catch (e) {
    console.error('PostgreSQL connection failed:', e);
  }
}

testConnectionSwitching().catch(console.error);
```

### Test 3: Data Access Layer

Create a file at `github-explorer/scripts/test-data-access.ts`:

```typescript
import dotenv from 'dotenv';
dotenv.config();

import { withDb } from '../lib/database/connection';

async function testEntityCounts() {
  console.log('Testing entity counts with current database...');
  
  try {
    // Helper function to safely count entities from a table
    async function countEntities(tableName: string) {
      try {
        const result = await withDb(async (db) => {
          // For SQLite
          if ('get' in db) {
            const countResult = await db.get(`SELECT COUNT(*) as count FROM ${tableName}`);
            return countResult?.count || 0;
          } 
          // For PostgreSQL
          else {
            const countResult = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
            return parseInt(countResult.rows[0].count, 10);
          }
        });
        
        console.log(`${tableName}: ${result} records`);
        return result;
      } catch (e) {
        console.error(`Error counting ${tableName}:`, e);
        return 0;
      }
    }
    
    // Count entities from each main table
    await countEntities('repositories');
    await countEntities('contributors');
    await countEntities('merge_requests');
    await countEntities('commits');
    await countEntities('contributor_rankings');
    
  } catch (e) {
    console.error('Test failed:', e);
  }
}

testEntityCounts().catch(console.error);
```

## API Updates

Update the API handlers to work with PostgreSQL:

### 1. Modify `/app/api/sqlite/[...endpoint]/route.ts`

Add adapter logic to handle different database types:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { adaptQuery, adaptValues } from '@/lib/database/sql-adapter';
import { isUsingPostgres } from '@/lib/database/connection';

// When receiving a request
async function handleRequest(request: NextRequest) {
  // If using PostgreSQL, adapt the query parameters
  if (isUsingPostgres()) {
    // If it's a POST request with a body
    if (request.method === 'POST') {
      const body = await request.json();
      
      // Adapt SQL in the body if any
      if (body.sql) {
        body.sql = adaptQuery(body.sql);
      }
      
      // Adapt parameters
      if (body.params) {
        body.params = adaptValues(body.params);
      }
      
      // Create a new request with adapted body
      request = new NextRequest(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(body),
      });
    }
  }
  
  // Continue with the original request handling
  // ...
}
```

## Deployment Strategy

Follow these steps to deploy the migrated application:

### 1. Local Testing

1. Run the migration script locally:
   ```bash
   # Set environment variables
   export USE_POSTGRES=true
   export DATABASE_URL=postgres://username:password@localhost:5432/github_explorer_dev
   
   # Run the migration script
   npx ts-node github-explorer/scripts/migrate-to-postgres.ts
   ```

2. Test the application with both SQLite and PostgreSQL:
   ```bash
   # Test with SQLite
   export USE_POSTGRES=false
   npm run dev
   
   # Test with PostgreSQL
   export USE_POSTGRES=true
   npm run dev
   ```

### 2. Staging Deployment

1. Create a staging environment on Heroku:
   ```bash
   heroku create github-explorer-staging
   heroku addons:create heroku-postgresql:standard-0 -a github-explorer-staging
   ```

2. Deploy to staging:
   ```bash
   git push heroku-staging main
   ```

3. Configure environment variables:
   ```bash
   heroku config:set USE_POSTGRES=true -a github-explorer-staging
   ```

4. Run the migration script:
   ```bash
   heroku run -a github-explorer-staging "node dist/scripts/migrate-to-postgres.js"
   ```

### 3. Production Deployment

1. After verifying staging, deploy to production:
   ```bash
   heroku create github-explorer-prod
   heroku addons:create heroku-postgresql:standard-0 -a github-explorer-prod
   ```

2. Deploy to production:
   ```bash
   git push heroku-prod main
   ```

3. Configure environment variables:
   ```bash
   heroku config:set USE_POSTGRES=true -a github-explorer-prod
   ```

4. Run the migration script:
   ```bash
   heroku run -a github-explorer-prod "node dist/scripts/migrate-to-postgres.js"
   ```

## Rollback Plan

If issues occur, implement this rollback plan:

1. Revert to SQLite:
   ```bash
   heroku config:set USE_POSTGRES=false -a github-explorer-prod
   ```

2. Deploy the last known good version:
   ```bash
   git checkout last-good-commit
   git push -f heroku-prod HEAD:main
   ```

## Monitoring and Maintenance

### Database Maintenance

1. Set up regular database backups:
   ```bash
   heroku addons:create heroku-postgresql:standard-0 --fork DATABASE_URL -a github-explorer-prod
   ```

2. Configure pgBackups:
   ```bash
   heroku pg:backups:schedule DATABASE_URL --at '02:00 America/New_York' -a github-explorer-prod
   ```

### Performance Monitoring

1. Set up Heroku Postgres Metrics:
   ```bash
   heroku addons:create librato:development -a github-explorer-prod
   ```

2. Set up query performance tracking:
   ```bash
   heroku addons:create pganalyze:hobby -a github-explorer-prod
   ```

## Conclusion

This migration plan provides a structured approach to transitioning from SQLite to PostgreSQL while maintaining application functionality. By following the step-by-step process and testing thoroughly at each stage, you can ensure a smooth migration with minimal disruption.

The PostgreSQL database will provide the necessary scalability and performance for handling massive datasets in production, making it suitable for the GitHub Explorer application's expected growth. 