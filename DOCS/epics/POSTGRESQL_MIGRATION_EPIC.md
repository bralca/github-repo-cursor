# PostgreSQL Migration Epic

## Overview

This epic outlines a comprehensive plan for migrating the GitHub Explorer application from SQLite to PostgreSQL while ensuring minimal code changes and maintaining parallel operation of both databases during the transition phase. The migration is motivated by the need to improve performance, handle higher load, and enhance concurrency capabilities while keeping the existing API endpoints and functionality intact.

## Business Value

- **Improved Performance**: PostgreSQL's advanced indexing and query optimization will enhance page load times
- **Better Concurrency**: PostgreSQL can handle multiple concurrent connections efficiently, reducing "database locked" errors
- **Scalability**: PostgreSQL provides a path to future growth as the application's data and traffic increase
- **Advanced Features**: PostgreSQL's JSONB support, full-text search, and other features provide future enhancement opportunities
- **Operational Readiness**: The parallel database approach ensures zero downtime and risk-free transition

## Migration Strategy

The migration will follow a phased approach:

1. **Preparation Phase**: Set up PostgreSQL schema and infrastructure
2. **Adaptation Phase**: Create a dual-database connection manager and adapt queries
3. **Independent Validation Phase**: Test both databases separately with runtime switching for validation only (no fallbacks or interdependencies)
4. **Testing & Validation Phase**: Ensure full compatibility and performance
5. **Cutover Phase**: Switch fully to PostgreSQL and remove SQLite dependencies

## Technical Approach

We will implement a "database agnostic" connection manager that maintains the same API but can connect to either SQLite or PostgreSQL based on runtime configuration. This allows us to:

- Keep existing code patterns and controller logic
- Minimize changes to API endpoints
- Run both databases in parallel for testing and validation
- Switch between databases using configuration rather than code changes

The parallel operation of both databases is strictly temporary for testing and validation purposes. There will be no interdependency between the databases or fallback mechanisms. Each database will be used independently based on configuration. Once PostgreSQL is fully validated, we will completely replace SQLite with a clean cutover approach. This ensures clear error reporting when issues arise and prevents silent failures that could mask problems.

## Key Data Type Considerations

The GitHub Explorer database uses several important data types that require special attention during the PostgreSQL migration:

### 1. UUID Fields

- **SQLite Implementation**: UUIDs are stored as TEXT fields
- **PostgreSQL Implementation**: We will use VARCHAR(255) for UUID fields
- **Important Tables**: All entity tables use UUID primary keys (repositories, contributors, merge_requests, etc.)
- **Migration Considerations**: 
  - Ensure all UUID fields maintain their exact string representation
  - Validate UUID format during data migration
  - Use VARCHAR instead of PostgreSQL's native UUID type to maintain compatibility with existing string format

### 2. GitHub ID Fields

- **SQLite Implementation**: GitHub IDs are stored as BIGINT fields
- **PostgreSQL Implementation**: We will use BIGINT for GitHub ID fields
- **Important Tables**: All entity tables have github_id fields (repositories.github_id, contributors.github_id, etc.)
- **Migration Considerations**:
  - Some GitHub IDs exceed the 32-bit integer range, requiring BIGINT (64-bit)
  - The dual reference pattern (having both UUID and GitHub ID) must be maintained
  - Unique constraints on github_id fields must be preserved

### 3. Boolean Fields

- **SQLite Implementation**: Booleans are stored as INTEGER (0/1)
- **PostgreSQL Implementation**: We will use native BOOLEAN type
- **Important Tables**: Fields like is_enriched, is_fork, is_archived, etc.
- **Migration Considerations**:
  - Convert 0/1 values to true/false during data migration
  - Update application code to handle boolean type differences

### 4. Timestamps

- **SQLite Implementation**: Uses TEXT fields with ISO format
- **PostgreSQL Implementation**: We will use TIMESTAMP type
- **Migration Considerations**:
  - Ensure proper conversion of SQLite timestamps to PostgreSQL format
  - Implement equivalent triggers for created_at and updated_at fields

By carefully handling these data types during schema creation and data migration, we can ensure a seamless transition while maintaining application compatibility.

## Stories and Tasks

### Story 1: PostgreSQL Schema Setup

**Description**: Create the PostgreSQL database schema identical to the current SQLite schema

#### Task 1.1: Set up PostgreSQL Environment

- Create a PostgreSQL instance (local or cloud-hosted service)
- Configure database access credentials
- Set up appropriate database users and permissions
- Document connection details in a secure location

#### Task 1.2: Extract Current SQLite Schema and Generate PostgreSQL Schema

1. Extract the full schema from the SQLite database using terminal commands:

```bash
# Navigate to the database directory
cd github-explorer/server/db

# Extract complete SQLite schema with table definitions, indices and triggers
sqlite3 github_explorer.db '.schema' > sqlite_schema.sql

# Extract table names to verify all tables are included
sqlite3 github_explorer.db '.tables' > table_list.txt

# For each table, get its detailed structure
for table in $(cat table_list.txt); do
  echo "Table: $table" >> table_structures.txt
  sqlite3 github_explorer.db "PRAGMA table_info($table);" >> table_structures.txt
  echo "" >> table_structures.txt
done

# Extract all indices for reference
sqlite3 github_explorer.db "SELECT * FROM sqlite_master WHERE type='index';" > sqlite_indices.txt

# Extract all triggers
sqlite3 github_explorer.db "SELECT * FROM sqlite_master WHERE type='trigger';" > sqlite_triggers.txt
```

2. Create PostgreSQL schema file with proper type mappings, paying special attention to:

```sql
-- Key type mappings for GitHub Explorer:
-- TEXT (UUID in SQLite) -> VARCHAR(255) in PostgreSQL (for primary keys and foreign keys)
-- BIGINT in SQLite -> BIGINT in PostgreSQL (for github_id fields)
-- INTEGER (0/1 for booleans in SQLite) -> BOOLEAN in PostgreSQL 
-- TEXT for JSON data -> JSONB in PostgreSQL (optional performance optimization)
-- TIMESTAMP -> TIMESTAMP in PostgreSQL

-- Example table creation with proper UUID and GitHub ID handling:
CREATE TABLE repositories (
  id VARCHAR(255) PRIMARY KEY,                 -- TEXT UUID in SQLite
  github_id BIGINT NOT NULL,                   -- BIGINT maintained for GitHub IDs
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT,
  api_url TEXT,
  stars INTEGER,
  forks INTEGER,
  is_enriched BOOLEAN DEFAULT FALSE,           -- Convert SQLite INTEGER (0/1) to BOOLEAN
  health_percentage INTEGER,
  open_issues_count INTEGER,
  last_updated TIMESTAMP,
  size_kb INTEGER,
  watchers_count INTEGER,
  primary_language VARCHAR(100),
  license TEXT,
  is_fork BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  default_branch VARCHAR(100) DEFAULT 'main',
  source VARCHAR(50) DEFAULT 'github_api',
  owner_id VARCHAR(255),                        -- Foreign key as VARCHAR(255)
  owner_github_id BIGINT,                       -- BIGINT for GitHub ID
  enrichment_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints should match SQLite
  CONSTRAINT repositories_github_id_unique UNIQUE (github_id),
  CONSTRAINT repositories_full_name_unique UNIQUE (full_name),
  CONSTRAINT fk_repositories_owner FOREIGN KEY (owner_id) REFERENCES contributors(id) ON DELETE SET NULL
);

-- Create corresponding indexes
CREATE INDEX idx_repositories_github_id ON repositories(github_id);
CREATE INDEX idx_repositories_full_name ON repositories(full_name);
CREATE INDEX idx_repositories_owner_github_id ON repositories(owner_github_id);
CREATE INDEX idx_repositories_owner_id ON repositories(owner_id);
```

3. Create all tables with consistent data type mappings:

- Ensure all primary keys use VARCHAR(255) for UUID fields
- Maintain BIGINT type for all github_id fields
- Create proper foreign key constraints with matching ON DELETE actions
- Convert SQLite INTEGER boolean fields (0/1) to PostgreSQL BOOLEAN
- Maintain consistent column names and purposes
- Create all unique constraints with identical semantics

4. Create all required triggers (especially for updated_at fields):

```sql
-- Example PostgreSQL trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_repositories_updated_at
BEFORE UPDATE ON repositories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

5. Create compound indices with the same structure:

```sql
-- Example compound index for merge_requests table
CREATE UNIQUE INDEX idx_merge_requests_repo_pr ON merge_requests(repository_github_id, github_id);
```

6. Maintain consistency with SQLite's dual reference pattern:
   - Keep both the UUID foreign keys (e.g., repository_id)
   - And the GitHub IDs (e.g., repository_github_id)
   - This pattern appears in merge_requests, commits, and contributor_repository tables

#### Task 1.3: Extract and Create PostgreSQL Triggers and Functions

1. Extract all SQLite triggers to understand their functionality:

```bash
# Extract all trigger definitions from SQLite
sqlite3 github_explorer.db "SELECT name, sql FROM sqlite_master WHERE type='trigger';" > sqlite_triggers_full.txt

# Analyze which tables have timestamp triggers
grep -i "updated_at\|created_at" sqlite_triggers_full.txt > timestamp_triggers.txt
```

2. Create a unified PostgreSQL timestamp trigger function:

```sql
-- Create a single reusable function for updated_at timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function for both created_at and updated_at timestamp management (for INSERT)
CREATE OR REPLACE FUNCTION set_timestamp_columns()
RETURNS TRIGGER AS $$
BEGIN
   NEW.created_at = CURRENT_TIMESTAMP;
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

3. Create triggers for each table:

```sql
-- Core Entity Tables
-- repositories table
CREATE TRIGGER update_repositories_timestamps
BEFORE INSERT ON repositories
FOR EACH ROW
EXECUTE FUNCTION set_timestamp_columns();

CREATE TRIGGER update_repositories_updated_at
BEFORE UPDATE ON repositories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- contributors table
CREATE TRIGGER update_contributors_timestamps
BEFORE INSERT ON contributors
FOR EACH ROW
EXECUTE FUNCTION set_timestamp_columns();

CREATE TRIGGER update_contributors_updated_at
BEFORE UPDATE ON contributors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- merge_requests table
CREATE TRIGGER update_merge_requests_timestamps
BEFORE INSERT ON merge_requests
FOR EACH ROW
EXECUTE FUNCTION set_timestamp_columns();

CREATE TRIGGER update_merge_requests_updated_at
BEFORE UPDATE ON merge_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- commits table
CREATE TRIGGER update_commits_timestamps
BEFORE INSERT ON commits
FOR EACH ROW
EXECUTE FUNCTION set_timestamp_columns();

CREATE TRIGGER update_commits_updated_at
BEFORE UPDATE ON commits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- contributor_repository table
CREATE TRIGGER update_contributor_repository_timestamps
BEFORE INSERT ON contributor_repository
FOR EACH ROW
EXECUTE FUNCTION set_timestamp_columns();

CREATE TRIGGER update_contributor_repository_updated_at
BEFORE UPDATE ON contributor_repository
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Raw Data Tables
-- closed_merge_requests_raw table
CREATE TRIGGER update_closed_merge_requests_raw_timestamps
BEFORE INSERT ON closed_merge_requests_raw
FOR EACH ROW
EXECUTE FUNCTION set_timestamp_columns();

CREATE TRIGGER update_closed_merge_requests_raw_updated_at
BEFORE UPDATE ON closed_merge_requests_raw
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Pipeline Management Tables
-- pipeline_schedules table
CREATE TRIGGER update_pipeline_schedules_timestamps
BEFORE INSERT ON pipeline_schedules
FOR EACH ROW
EXECUTE FUNCTION set_timestamp_columns();

CREATE TRIGGER update_pipeline_schedules_updated_at
BEFORE UPDATE ON pipeline_schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for all remaining tables with timestamp columns
```

4. Create a validation script to ensure all triggers are working:

```sql
-- Script to test timestamp triggers for each table
CREATE OR REPLACE FUNCTION test_timestamp_triggers() RETURNS TEXT AS $$
DECLARE
  test_record RECORD;
  test_id VARCHAR(255);
  insert_time TIMESTAMP;
  update_time TIMESTAMP;
  result TEXT := '';
BEGIN
  -- Test repositories table triggers
  test_id := 'test-' || gen_random_uuid();
  INSERT INTO repositories(id, github_id, name, full_name) 
  VALUES (test_id, 12345, 'test-repo', 'test-owner/test-repo')
  RETURNING created_at INTO insert_time;
  
  SELECT updated_at INTO update_time FROM repositories WHERE id = test_id;
  
  result := result || 'repositories: Insert trigger ' || 
    CASE WHEN insert_time IS NOT NULL THEN 'OK' ELSE 'FAILED' END || ', ';
  
  -- Wait 1 second to ensure timestamps will differ
  PERFORM pg_sleep(1);
  
  UPDATE repositories SET name = 'updated-name' WHERE id = test_id
  RETURNING updated_at INTO update_time;
  
  result := result || 'Update trigger ' || 
    CASE WHEN update_time > insert_time THEN 'OK' ELSE 'FAILED' END || E'\n';
  
  -- Cleanup test record
  DELETE FROM repositories WHERE id = test_id;
  
  -- Add similar tests for all other tables with timestamp columns
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Execute the test
SELECT test_timestamp_triggers();
```

5. Verify that all tables have consistent timestamp behavior:

```bash
# Run this PostgreSQL query to list all tables with timestamp columns and their triggers
psql -h $PG_HOST -U $PG_USER -d $PG_DATABASE -c "
SELECT
  t.table_name,
  c.column_name,
  EXISTS (
    SELECT 1 FROM pg_trigger trig
    JOIN pg_class rel ON trig.tgrelid = rel.oid
    WHERE rel.relname = t.table_name
    AND trig.tgname LIKE '%' || t.table_name || '%' || c.column_name || '%'
  ) AS has_trigger
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND c.column_name IN ('created_at', 'updated_at')
ORDER BY t.table_name, c.column_name;
"
```

#### Task 1.4: Test PostgreSQL Schema Setup

To verify the PostgreSQL schema setup is correct, run these terminal commands:

```bash
# Compare table structure between SQLite and PostgreSQL
echo "=== Comparing Tables ==="
echo "SQLite tables:"
sqlite3 github-explorer/server/db/github_explorer.db ".tables"

echo "PostgreSQL tables:"
PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -U $PG_USER -d $PG_DATABASE -c "\dt"

# Verify table count matches
sqlite_table_count=$(sqlite3 github-explorer/server/db/github_explorer.db "SELECT COUNT(name) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
pg_table_count=$(PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -U $PG_USER -d $PG_DATABASE -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
echo "SQLite table count: $sqlite_table_count"
echo "PostgreSQL table count: $pg_table_count"

# Verify column structure of key tables
echo -e "\n=== Comparing Schema Structure ==="
for table in repositories contributors merge_requests commits contributor_repository pipeline_schedules pipeline_history pipeline_status
do
  echo -e "\nComparing $table table:"
  echo "SQLite columns:"
  sqlite3 github-explorer/server/db/github_explorer.db "PRAGMA table_info($table);"
  
  echo "PostgreSQL columns:"
  PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -U $PG_USER -d $PG_DATABASE -c "\d $table"
done

# Verify index counts match
echo -e "\n=== Comparing Indices ==="
sqlite_index_count=$(sqlite3 github-explorer/server/db/github_explorer.db "SELECT COUNT(name) FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'")
pg_index_count=$(PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -U $PG_USER -d $PG_DATABASE -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public'")
echo "SQLite index count: $sqlite_index_count"
echo "PostgreSQL index count: $pg_index_count"

# Verify UUID type handling
echo -e "\n=== Testing UUID Fields ==="
# Insert a test repository with a UUID
test_uuid=$(uuidgen | tr -d '-')
echo "Test UUID: $test_uuid"
PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -U $PG_USER -d $PG_DATABASE -c "
INSERT INTO repositories (id, github_id, name, full_name) 
VALUES ('$test_uuid', 12345, 'test-repo', 'test-owner/test-repo');
SELECT id FROM repositories WHERE id = '$test_uuid';
"

# Verify GitHub ID handling (BIGINT)
echo -e "\n=== Testing GitHub ID Fields ==="
# Test with a large GitHub ID value
large_github_id=9223372036854775807  # Max BIGINT value
PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -U $PG_USER -d $PG_DATABASE -c "
INSERT INTO repositories (id, github_id, name, full_name) 
VALUES ('test-large-id', $large_github_id, 'test-large-id', 'test-owner/test-large-id');
SELECT github_id FROM repositories WHERE github_id = $large_github_id;
"

# Test trigger functionality for updated_at
echo -e "\n=== Testing Timestamp Triggers ==="
PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -U $PG_USER -d $PG_DATABASE -c "
INSERT INTO repositories (id, github_id, name, full_name) 
VALUES ('test-timestamp', 54321, 'test-timestamps', 'test-owner/test-timestamps');
SELECT created_at, updated_at FROM repositories WHERE id = 'test-timestamp';

-- Wait a second to ensure timestamp difference
SELECT pg_sleep(1);

UPDATE repositories SET name = 'updated-name' WHERE id = 'test-timestamp';
SELECT created_at, updated_at FROM repositories WHERE id = 'test-timestamp';
"

# Check foreign key constraints
echo -e "\n=== Testing Foreign Key Constraints ==="
PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -U $PG_USER -d $PG_DATABASE -c "
-- Try to insert a commit with non-existent repository_id
INSERT INTO commits (id, github_id, repository_id, contributor_id, message, committed_at, filename, status, additions, deletions) 
VALUES ('test-fk', 'abc123', 'non-existent-repo', NULL, 'test commit', CURRENT_TIMESTAMP, 'test.txt', 'added', 1, 0);
"

# Clean up test data
echo -e "\n=== Cleaning Up Test Data ==="
PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -U $PG_USER -d $PG_DATABASE -c "
DELETE FROM repositories WHERE id IN ('$test_uuid', 'test-large-id', 'test-timestamp');
"
```

**Expected Results:**
- Both databases should have the same number of tables
- Column names, types, and constraints should match with appropriate type conversions
- PostgreSQL should correctly handle UUIDs as VARCHAR(255)
- PostgreSQL should store GitHub IDs as BIGINT values
- After the UPDATE statement, the updated_at timestamp should be newer than created_at
- Foreign key constraints should properly prevent invalid data

### Story 2: Database Connection Manager Adaptation

**Description**: Update the database connection manager to support both SQLite and PostgreSQL

#### Task 2.1: Create PostgreSQL Connection Manager

- Implement a PostgreSQL-specific connection manager
- Ensure consistent API with the existing SQLite connection manager
- Set up proper connection pooling for PostgreSQL
- Implement PostgreSQL-specific error handling
- Configure appropriate connection parameters

```javascript
// Example PostgreSQL connection manager implementation
import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

let pgPool = null;

export async function getPostgresConnection() {
  if (!pgPool) {
    pgPool = new Pool({
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT || 5432,
      database: process.env.PG_DATABASE || 'github_explorer',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || 'postgres',
      max: process.env.PG_POOL_SIZE || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Log pool creation
    logger.info('PostgreSQL pool created');
    
    // Handle pool errors
    pgPool.on('error', (err) => {
      logger.error('Unexpected PostgreSQL pool error', { error: err });
    });
  }
  
  try {
    const client = await pgPool.connect();
    return client;
  } catch (error) {
    logger.error('Error connecting to PostgreSQL', { error });
    throw new Error(`Failed to connect to PostgreSQL: ${error.message}`);
  }
}

export async function releasePostgresConnection(client) {
  if (client) {
    client.release();
  }
}
```

#### Task 2.2: Create Unified Connection Manager

- Create a unified connection manager that supports both SQLite and PostgreSQL
- Implement a runtime configuration option to select the active database
- Ensure both database connections follow a similar API pattern
- Handle graceful fallback if one database is unavailable

```javascript
// Example unified connection manager
import { getConnection as getSqliteConnection } from './sqlite-connection-manager.js';
import { 
  getPostgresConnection, 
  releasePostgresConnection 
} from './postgres-connection-manager.js';
import { logger } from '../utils/logger.js';

// Determine which database to use
export function getDatabaseType() {
  const dbType = process.env.DATABASE_TYPE?.toLowerCase() || 'sqlite';
  return dbType === 'postgres' ? 'postgres' : 'sqlite';
}

export async function getConnection(options = {}) {
  // Use override if explicitly provided in options
  const dbType = options.dbType || getDatabaseType();
  
  // Allow overriding for specific operations
  if (dbType === 'postgres') {
    logger.debug('Using PostgreSQL connection');
    return getPostgresConnection();
  } else {
    logger.debug('Using SQLite connection');
    return getSqliteConnection();
  }
}

export async function releaseConnection(connection, options = {}) {
  const dbType = options.dbType || getDatabaseType();
  
  if (dbType === 'postgres' && connection) {
    await releasePostgresConnection(connection);
  }
  // SQLite doesn't need explicit release with our current pattern
}

// Helper wrapper for transaction-style operations
export async function withConnection(callback, options = {}) {
  const dbType = options.dbType || getDatabaseType();
  let connection;
  
  try {
    connection = await getConnection({ dbType });
    const result = await callback(connection, dbType);
    return result;
  } finally {
    if (connection) {
      await releaseConnection(connection, { dbType });
    }
  }
}
```

#### Task 2.3: Implement Database-Specific Query Functions

- Create a query adapter layer that handles database-specific SQL syntax differences
- Implement functions for common query operations (select, insert, update, delete)
- Ensure parameter binding is handled correctly for each database type
- Create utility functions to handle pagination, filtering, and sorting differences

```javascript
// Example query adapter implementation
export async function executeQuery(connection, query, params = [], options = {}) {
  const dbType = options.dbType || getDatabaseType();
  
  try {
    if (dbType === 'postgres') {
      const result = await connection.query(query, params);
      return result.rows;
    } else {
      // SQLite using the sqlite package
      if (query.trim().toLowerCase().startsWith('select')) {
        return await connection.all(query, params);
      } else {
        return await connection.run(query, params);
      }
    }
  } catch (error) {
    logger.error('Error executing database query', { error, query, dbType });
    throw error;
  }
}

// Paginated query helper
export async function executePaginatedQuery(
  connection, 
  baseQuery, 
  params = [], 
  { page = 1, limit = 10, dbType }
) {
  const offset = (page - 1) * limit;
  dbType = dbType || getDatabaseType();
  
  // Handle pagination syntax differences between SQLite and PostgreSQL
  let paginatedQuery;
  if (dbType === 'postgres') {
    paginatedQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
  } else {
    paginatedQuery = `${baseQuery} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
  }
  
  return executeQuery(connection, paginatedQuery, params, { dbType });
}
```

#### Task 2.4: Test Connection Manager Implementation

Create a simple test script and run it via terminal to verify the connection manager works with both databases:

```bash
# Create a test script to verify connection managers
cat > test-connection-manager.js << 'EOF'
import { getConnection, releaseConnection, executeQuery } from './server/src/db/unified-connection-manager.js';

async function testConnections() {
  console.log('Testing SQLite connection...');
  process.env.DATABASE_TYPE = 'sqlite';
  let sqliteConn;
  try {
    sqliteConn = await getConnection();
    const sqliteResult = await executeQuery(
      sqliteConn, 
      'SELECT COUNT(*) as count FROM repositories'
    );
    console.log('SQLite connection successful!');
    console.log('SQLite repository count:', sqliteResult[0].count);
  } catch (error) {
    console.error('SQLite connection test failed:', error);
  } finally {
    if (sqliteConn) await releaseConnection(sqliteConn);
  }

  console.log('\nTesting PostgreSQL connection...');
  process.env.DATABASE_TYPE = 'postgres';
  let pgConn;
  try {
    pgConn = await getConnection();
    const pgResult = await executeQuery(
      pgConn, 
      'SELECT COUNT(*) as count FROM repositories'
    );
    console.log('PostgreSQL connection successful!');
    console.log('PostgreSQL repository count:', pgResult[0].count);
  } catch (error) {
    console.error('PostgreSQL connection test failed:', error);
  } finally {
    if (pgConn) await releaseConnection(pgConn);
  }
}

testConnections().catch(console.error);
EOF

# Run the test script
node test-connection-manager.js
```

**Expected Results:**
- Both connection tests should succeed
- Both should return a repository count (numbers may differ if data migration isn't complete)
- No errors in connection handling or query execution

### Story 3: Database Query Adaptation

**Description**: Adapt all database queries to work with both SQLite and PostgreSQL

#### Task 3.1: Identify All Query Locations

- Scan the codebase for all locations where database queries are performed
- Document each query location, its purpose, and current implementation
- Categorize queries by complexity and database-specific features used

```
Location inventory:

1. Controllers:
   - server/src/controllers/api/repositories.js
   - server/src/controllers/api/contributors.js
   - server/src/controllers/api/merge-requests.js
   - server/src/controllers/api/commits.js
   - server/src/controllers/api/entity-counts.js
   - server/src/controllers/api/pipeline-operations.js
   - server/src/controllers/api/pipeline-history.js
   - server/src/controllers/api/rankings.js
   - server/src/controllers/api/sitemap.js

2. Pipeline Processors:
   - server/src/pipeline/processors/github-sync-processor.js
   - server/src/pipeline/processors/data-processing-processor.js
   - server/src/pipeline/processors/repository-enrichment-processor.js

3. Utility Scripts:
   - server/scripts/migrate-db.js
   - server/scripts/init-pipeline-status.js

4. Other Database Access:
   - server/src/utils/db-cleanup.js
   - server/src/utils/entity-utils.js
```

#### Task 3.2: Update API Controllers

- Modify each API controller to use the unified connection manager
- Update queries to handle database-specific syntax differences
- Ensure proper parameter binding for both database types
- Add database type detection and query adaptation where needed

```javascript
// Example controller with dual database support
import { 
  getConnection, 
  releaseConnection, 
  executeQuery 
} from '../../db/unified-connection-manager.js';
import { logger } from '../../utils/logger.js';

export async function getRepositories(req, res) {
  const { page = 1, limit = 10, order_by = 'created_at', order_direction = 'desc' } = req.query;
  let connection;
  
  try {
    connection = await getConnection();
    const dbType = req.query.db_type || process.env.DATABASE_TYPE || 'sqlite';
    
    // Adapt order_by column format for PostgreSQL if needed
    let formattedOrderBy = order_by;
    if (dbType === 'postgres' && order_by.includes('_')) {
      // Convert snake_case to camelCase if needed by PostgreSQL schema
      // (assuming we maintain the same column naming in both databases)
    }
    
    // Adapt order by clause based on database type
    let query;
    let params = [];
    
    if (dbType === 'postgres') {
      query = `
        SELECT * FROM repositories 
        ORDER BY ${formattedOrderBy} ${order_direction === 'asc' ? 'ASC' : 'DESC'}
        LIMIT $1 OFFSET $2
      `;
      params = [limit, (page - 1) * limit];
    } else {
      query = `
        SELECT * FROM repositories 
        ORDER BY ${formattedOrderBy} ${order_direction === 'asc' ? 'ASC' : 'DESC'}
        LIMIT ? OFFSET ?
      `;
      params = [limit, (page - 1) * limit];
    }
    
    const data = await executeQuery(connection, query, params, { dbType });
    
    // Get total count for pagination
    let countQuery;
    if (dbType === 'postgres') {
      countQuery = 'SELECT COUNT(*) as total FROM repositories';
    } else {
      countQuery = 'SELECT COUNT(*) as total FROM repositories';
    }
    
    const [countResult] = await executeQuery(connection, countQuery, [], { dbType });
    const total = dbType === 'postgres' ? Number(countResult.total) : countResult.total;
    
    res.json({
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error retrieving repositories', { error });
    res.status(500).json({ error: 'Failed to retrieve repositories' });
  } finally {
    if (connection) {
      await releaseConnection(connection);
    }
  }
}
```

#### Task 3.3: Update Pipeline Processors

- Modify pipeline processor code to use the unified connection manager
- Adapt bulk operations for PostgreSQL compatibility
- Ensure transaction handling works with both database types
- Test processors with each database type

```javascript
// Example pipeline processor with dual database support
import { 
  getConnection, 
  releaseConnection, 
  executeQuery 
} from '../../db/unified-connection-manager.js';
import { logger } from '../../utils/logger.js';

export async function processRepositories(items) {
  let connection;
  const results = { success: 0, failed: 0, details: [] };
  const dbType = process.env.DATABASE_TYPE || 'sqlite';
  
  try {
    connection = await getConnection({ dbType });
    
    // Begin transaction
    if (dbType === 'postgres') {
      await connection.query('BEGIN');
    } else {
      await connection.run('BEGIN TRANSACTION');
    }
    
    for (const item of items) {
      try {
        // Adapt insert/update query based on database type
        let query, params;
        
        if (dbType === 'postgres') {
          query = `
            INSERT INTO repositories (id, github_id, name, full_name, description, url, api_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (github_id) DO UPDATE SET
              name = $3,
              full_name = $4,
              description = $5,
              url = $6,
              api_url = $7,
              updated_at = CURRENT_TIMESTAMP
            RETURNING id
          `;
          params = [
            item.id,
            item.github_id,
            item.name,
            item.full_name,
            item.description,
            item.url,
            item.api_url
          ];
        } else {
          query = `
            INSERT INTO repositories (id, github_id, name, full_name, description, url, api_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (github_id) DO UPDATE SET
              name = ?,
              full_name = ?,
              description = ?,
              url = ?,
              api_url = ?,
              updated_at = CURRENT_TIMESTAMP
          `;
          params = [
            item.id,
            item.github_id,
            item.name,
            item.full_name,
            item.description,
            item.url,
            item.api_url,
            // For the UPDATE part in SQLite
            item.name,
            item.full_name,
            item.description,
            item.url,
            item.api_url
          ];
        }
        
        const result = await executeQuery(connection, query, params, { dbType });
        results.success++;
        results.details.push({
          id: item.id,
          github_id: item.github_id,
          status: 'success'
        });
      } catch (error) {
        logger.error(`Error processing repository ${item.github_id}`, { error });
        results.failed++;
        results.details.push({
          id: item.id,
          github_id: item.github_id,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Commit transaction
    if (dbType === 'postgres') {
      await connection.query('COMMIT');
    } else {
      await connection.run('COMMIT');
    }
    
    return results;
  } catch (error) {
    // Rollback transaction on error
    if (connection) {
      if (dbType === 'postgres') {
        await connection.query('ROLLBACK');
      } else {
        await connection.run('ROLLBACK');
      }
    }
    
    logger.error('Error in batch processing repositories', { error });
    throw error;
  } finally {
    if (connection) {
      await releaseConnection(connection);
    }
  }
}
```

#### Task 3.4: Test Query Adapter Implementation

Create a test script to validate that queries work correctly with both databases:

```bash
# Create a test script to verify query adaptation
cat > test-query-adapter.js << 'EOF'
import { getConnection, releaseConnection, executeQuery } from './server/src/db/unified-connection-manager.js';

async function testQueries() {
  // Test variety of query types on both databases
  const testCases = [
    {
      name: "Basic SELECT",
      query: "SELECT COUNT(*) as count FROM repositories",
      params: []
    },
    {
      name: "Parameterized query",
      query: "SELECT * FROM repositories WHERE stars > ? LIMIT 5",
      sqliteParams: [100],
      pgParams: [100]  // In real usage, the adapter would convert these
    },
    {
      name: "JOIN query",
      query: "SELECT r.name, COUNT(c.id) as commit_count FROM repositories r LEFT JOIN commits c ON r.id = c.repository_id GROUP BY r.id LIMIT 5",
      params: []
    },
    {
      name: "Date function",
      sqliteQuery: "SELECT strftime('%Y-%m', committed_at) as month, COUNT(*) as count FROM commits GROUP BY month LIMIT 5",
      pgQuery: "SELECT to_char(committed_at, 'YYYY-MM') as month, COUNT(*) as count FROM commits GROUP BY month LIMIT 5",
      params: []
    }
  ];

  // Test with SQLite
  process.env.DATABASE_TYPE = 'sqlite';
  console.log('Testing queries with SQLite...');
  let sqliteConn;
  try {
    sqliteConn = await getConnection();
    
    for (const test of testCases) {
      console.log(`\nSQLite - ${test.name}:`);
      try {
        const query = test.sqliteQuery || test.query;
        const params = test.sqliteParams || test.params;
        const result = await executeQuery(sqliteConn, query, params);
        console.log(JSON.stringify(result.slice(0, 1), null, 2)); // Show first result only
      } catch (error) {
        console.error(`  Failed: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('SQLite testing failed:', error);
  } finally {
    if (sqliteConn) await releaseConnection(sqliteConn);
  }

  // Test with PostgreSQL
  process.env.DATABASE_TYPE = 'postgres';
  console.log('\nTesting queries with PostgreSQL...');
  let pgConn;
  try {
    pgConn = await getConnection();
    
    for (const test of testCases) {
      console.log(`\nPostgreSQL - ${test.name}:`);
      try {
        const query = test.pgQuery || test.query;
        const params = test.pgParams || test.params;
        const result = await executeQuery(pgConn, query, params);
        console.log(JSON.stringify(result.slice(0, 1), null, 2)); // Show first result only
      } catch (error) {
        console.error(`  Failed: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('PostgreSQL testing failed:', error);
  } finally {
    if (pgConn) await releaseConnection(pgConn);
  }
}

testQueries().catch(console.error);
EOF

# Run the test script
node test-query-adapter.js
```

**Expected Results:**
- All query tests should execute successfully on both databases
- Result structures should be similar (though not identical due to data differences)
- Date function query should produce similar results despite using different syntax

### Story 4: API Endpoint Adaptation

**Description**: Update API endpoints to support database selection parameter

#### Task 4.1: Modify API Routes to Support Database Selection

- Update API route handling to support an optional `db_type` parameter
- Implement middleware to set database type based on request parameters
- Ensure default behavior maintains backward compatibility
- Add validation for the database type parameter

```javascript
// Example middleware for database selection
export function databaseSelectionMiddleware(req, res, next) {
  // Check for db_type in query parameters, headers, or defaults to environment variable
  const dbType = req.query.db_type || req.headers['x-database-type'] || process.env.DATABASE_TYPE || 'sqlite';
  
  // Validate database type
  if (dbType !== 'sqlite' && dbType !== 'postgres') {
    return res.status(400).json({ error: 'Invalid database type. Use "sqlite" or "postgres".' });
  }
  
  // Set for use in route handlers
  req.dbType = dbType;
  next();
}

// Apply to API routes
app.use('/api', databaseSelectionMiddleware);
```

#### Task 4.2: Update API Response Handlers

- Ensure API responses maintain consistent format regardless of database source
- Add database source indicators in responses during parallel operation phase
- Implement response time tracking for performance comparison
- Add logging for database operation metrics

```javascript
// Example response wrapper with metrics
function wrapWithMetrics(handler) {
  return async (req, res) => {
    const startTime = Date.now();
    const originalJson = res.json;
    
    // Override res.json to include metrics
    res.json = function(data) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // During parallel testing phase, include source database and timing
      if (process.env.PARALLEL_DB_TESTING === 'true') {
        const enhancedData = {
          ...data,
          _meta: {
            database: req.dbType,
            responseTimeMs: responseTime
          }
        };
        return originalJson.call(this, enhancedData);
      }
      
      // Log metrics but don't change response in production
      logger.debug('API response metrics', {
        path: req.path,
        database: req.dbType,
        responseTimeMs: responseTime
      });
      
      return originalJson.call(this, data);
    };
    
    return handler(req, res);
  };
}

// Apply to routes
app.get('/api/repositories', wrapWithMetrics(getRepositories));
```

#### Task 4.3: Test API Endpoint Database Selection

Create a script to test API endpoints with both database types:

```bash
# Start the server with PARALLEL_DB_TESTING enabled
# (Do this in a separate terminal)
PARALLEL_DB_TESTING=true npm start

# Test API endpoints with both database types
cat > test-api-endpoints.sh << 'EOF'
#!/bin/bash
set -e

SERVER_URL=${SERVER_URL:-http://localhost:3001}
ENDPOINTS=(
  "/api/entity-counts"
  "/api/repositories?limit=3"
  "/api/contributors?limit=3"
  "/api/merge-requests?limit=3"
)

echo "Testing API endpoints with SQLite..."
for endpoint in "${ENDPOINTS[@]}"; do
  echo -e "\n=== Testing $endpoint ==="
  curl -s "$SERVER_URL$endpoint&db_type=sqlite" | jq '.data? // .'
done

echo -e "\nTesting API endpoints with PostgreSQL..."
for endpoint in "${ENDPOINTS[@]}"; do
  echo -e "\n=== Testing $endpoint ==="
  curl -s "$SERVER_URL$endpoint&db_type=postgres" | jq '.data? // .'
done

echo -e "\nTesting response time comparison..."
echo -e "SQLite time:"
time curl -s "$SERVER_URL/api/repositories?limit=10&db_type=sqlite" > /dev/null
echo -e "\nPostgreSQL time:"
time curl -s "$SERVER_URL/api/repositories?limit=10&db_type=postgres" > /dev/null
EOF

chmod +x test-api-endpoints.sh
./test-api-endpoints.sh
```

**Expected Results:**
- All endpoints should return valid JSON for both database types
- The structure of the responses should be identical
- Performance metrics will help identify potential optimization needs

### Story 5: Data Synchronization and Testing

**Description**: Implement data synchronization between databases and setup testing

#### Task 5.1: Create Data Migration Scripts

- Develop scripts to migrate existing data from SQLite to PostgreSQL
- Implement data validation and integrity checks
- Create incremental sync for ongoing updates during parallel operation
- Add logging and error handling for migration process

```javascript
// Example data migration script
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import { logger } from '../utils/logger.js';
import fs from 'fs';

async function migrateRepositories() {
  // SQLite connection
  const sqliteDb = await open({
    filename: process.env.SQLITE_DB_PATH,
    driver: sqlite3.Database
  });
  
  // PostgreSQL connection
  const pgPool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD
  });
  
  try {
    // Get all repositories from SQLite
    const repositories = await sqliteDb.all('SELECT * FROM repositories');
    logger.info(`Migrating ${repositories.length} repositories to PostgreSQL`);
    
    // Verify UUID format in SQLite data
    const invalidUuids = repositories.filter(repo => !repo.id || typeof repo.id !== 'string' || repo.id.length > 255);
    if (invalidUuids.length > 0) {
      logger.warn(`Found ${invalidUuids.length} repositories with invalid UUID format`, {
        examples: invalidUuids.slice(0, 3).map(repo => repo.id)
      });
    }
    
    // Verify GitHub IDs in SQLite data
    const invalidGithubIds = repositories.filter(repo => repo.github_id === null || isNaN(repo.github_id));
    if (invalidGithubIds.length > 0) {
      logger.warn(`Found ${invalidGithubIds.length} repositories with invalid github_id format`, {
        examples: invalidGithubIds.slice(0, 3).map(repo => repo.github_id)
      });
    }
    
    // Write data type validation report
    const validationReport = {
      totalRecords: repositories.length,
      invalidUuids: {
        count: invalidUuids.length,
        examples: invalidUuids.slice(0, 5).map(repo => ({ id: repo.id, name: repo.name }))
      },
      invalidGithubIds: {
        count: invalidGithubIds.length,
        examples: invalidGithubIds.slice(0, 5).map(repo => ({ github_id: repo.github_id, name: repo.name }))
      },
      largeGithubIds: {
        count: repositories.filter(repo => repo.github_id > 2147483647).length,
        examples: repositories.filter(repo => repo.github_id > 2147483647).slice(0, 5).map(repo => repo.github_id)
      },
      uuidLengthStats: {
        min: Math.min(...repositories.filter(repo => repo.id).map(repo => repo.id.length)),
        max: Math.max(...repositories.filter(repo => repo.id).map(repo => repo.id.length)),
        avg: repositories.filter(repo => repo.id).reduce((sum, repo) => sum + repo.id.length, 0) / repositories.length
      }
    };
    
    fs.writeFileSync('data_migration_validation.json', JSON.stringify(validationReport, null, 2));
    logger.info('Data validation report created', { reportPath: 'data_migration_validation.json' });
    
    // Process in batches
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < repositories.length; i += batchSize) {
      const batch = repositories.slice(i, i + batchSize);
      
      // Use PostgreSQL's more efficient COPY command for bulk inserts
      const pgClient = await pgPool.connect();
      try {
        await pgClient.query('BEGIN');
        
        for (const repo of batch) {
          // Ensure UUID fields are properly formatted as strings
          const id = repo.id || `generated-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          
          // Ensure github_id is a valid BIGINT
          const github_id = repo.github_id != null ? BigInt(repo.github_id) : null;
          if (github_id === null) {
            logger.warn(`Repository ${repo.name} has null github_id, using placeholder`);
            github_id = i * batchSize + batch.indexOf(repo); // Use a placeholder ID
          }
          
          // Convert SQLite boolean (0/1) to PostgreSQL boolean
          const is_enriched = repo.is_enriched ? true : false;
          const is_fork = repo.is_fork ? true : false;
          const is_archived = repo.is_archived ? true : false;
          
          // Handle proper date format conversion if needed
          const created_at = repo.created_at ? new Date(repo.created_at) : new Date();
          const updated_at = repo.updated_at ? new Date(repo.updated_at) : new Date();
          
          await pgClient.query(`
            INSERT INTO repositories (
              id, github_id, name, full_name, description, url, api_url, 
              stars, forks, is_enriched, health_percentage, open_issues_count,
              last_updated, size_kb, watchers_count, primary_language, license,
              is_fork, is_archived, default_branch, source, owner_id, 
              owner_github_id, enrichment_attempts, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
                    $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
            ON CONFLICT (github_id) DO UPDATE SET
              name = EXCLUDED.name,
              updated_at = EXCLUDED.updated_at
            RETURNING id
          `, [
            id, github_id, repo.name, repo.full_name, repo.description,
            repo.url, repo.api_url, repo.stars || 0, repo.forks || 0, is_enriched,
            repo.health_percentage || 0, repo.open_issues_count || 0, repo.last_updated,
            repo.size_kb || 0, repo.watchers_count || 0, repo.primary_language, repo.license,
            is_fork, is_archived, repo.default_branch || 'main', repo.source || 'github_api',
            repo.owner_id, repo.owner_github_id, repo.enrichment_attempts || 0,
            created_at, updated_at
          ]);
          
          successCount++;
        }
        
        await pgClient.query('COMMIT');
        logger.info(`Successfully migrated batch ${i/batchSize + 1}/${Math.ceil(repositories.length/batchSize)}`);
      } catch (error) {
        errorCount++;
        await pgClient.query('ROLLBACK');
        logger.error(`Error migrating batch ${i/batchSize + 1}`, { error });
        
        // Log detailed error information for diagnosis
        if (error.code === '22P02') { // Invalid text representation
          logger.error('Invalid data format detected. This often happens with incompatible data types.');
          
          // Log the specific records in this batch that might have the issue
          const problemRecords = batch.map(repo => ({
            id: repo.id,
            github_id: repo.github_id,
            name: repo.name
          }));
          logger.error('Problem records in this batch:', { problemRecords });
        }
        
        // Continue with next batch rather than failing the whole migration
        logger.info('Continuing with next batch...');
      } finally {
        pgClient.release();
      }
    }
    
    // Verify counts match
    const sqliteCount = (await sqliteDb.get('SELECT COUNT(*) as count FROM repositories')).count;
    const pgCount = (await pgPool.query('SELECT COUNT(*) as count FROM repositories')).rows[0].count;
    
    logger.info('Migration complete', { 
      sqliteCount, 
      pgCount,
      successCount,
      errorCount,
      percentComplete: (sqliteCount > 0) ? (parseInt(pgCount) / sqliteCount * 100).toFixed(2) + '%' : '0%'
    });
    
    if (sqliteCount !== parseInt(pgCount)) {
      logger.warn('Count mismatch after migration', { sqliteCount, pgCount, difference: sqliteCount - parseInt(pgCount) });
      
      // Additional verification for UUID and github_id fields
      const pgUuidStats = await pgPool.query(`
        SELECT 
          MIN(LENGTH(id)) as min_length,
          MAX(LENGTH(id)) as max_length,
          AVG(LENGTH(id)) as avg_length,
          COUNT(*) FILTER (WHERE id IS NULL) as null_count
        FROM repositories
      `);
      
      const pgGithubIdStats = await pgPool.query(`
        SELECT 
          MIN(github_id) as min_id,
          MAX(github_id) as max_id,
          COUNT(*) FILTER (WHERE github_id IS NULL) as null_count,
          COUNT(*) FILTER (WHERE github_id > 2147483647) as large_ids
        FROM repositories
      `);
      
      logger.info('PostgreSQL UUID statistics', { stats: pgUuidStats.rows[0] });
      logger.info('PostgreSQL github_id statistics', { stats: pgGithubIdStats.rows[0] });
    }
    
    // Verify specific UUIDs and GitHub IDs migrated correctly (sample check)
    if (repositories.length > 0) {
      const sampleSize = Math.min(5, repositories.length);
      logger.info(`Verifying ${sampleSize} random records for data integrity...`);
      
      for (let i = 0; i < sampleSize; i++) {
        const randomIndex = Math.floor(Math.random() * repositories.length);
        const sampleRepo = repositories[randomIndex];
        
        const pgRepo = await pgPool.query('SELECT * FROM repositories WHERE id = $1', [sampleRepo.id]);
        
        if (pgRepo.rows.length === 0) {
          logger.warn(`Verification failed: UUID ${sampleRepo.id} not found in PostgreSQL`);
        } else if (pgRepo.rows[0].github_id !== BigInt(sampleRepo.github_id)) {
          logger.warn(`Verification failed: github_id mismatch for ${sampleRepo.id}`, {
            sqlite: sampleRepo.github_id,
            postgres: pgRepo.rows[0].github_id
          });
        } else {
          logger.info(`Verification passed for repository: ${sampleRepo.name} (${sampleRepo.id})`);
        }
      }
    }
  } catch (error) {
    logger.error('Migration failed', { error });
    throw error;
  } finally {
    await sqliteDb.close();
    await pgPool.end();
  }
}

// Execute migration
migrateRepositories().catch(console.error);
```

#### Task 5.2: Implement Dual-Write Mode for Ongoing Synchronization

- Create a "write to both" database adapter for parallel operation
- Implement write verification between databases
- Add monitoring for divergence between databases
- Create tools to reconcile differences when found

```javascript
// Example dual-write database adapter
export async function executeWriteQuery(query, params, options = {}) {
  const shouldWriteToBoth = process.env.DUAL_WRITE_MODE === 'true';
  let sqliteResult, pgResult;
  let sqliteError, pgError;
  
  // Execute on SQLite
  try {
    const sqliteConn = await getSqliteConnection();
    sqliteResult = await executeSqliteQuery(sqliteConn, query, params);
  } catch (error) {
    sqliteError = error;
    logger.error('SQLite write error', { error, query });
  }
  
  // If dual-write mode is enabled, also write to PostgreSQL
  if (shouldWriteToBoth) {
    try {
      const pgConn = await getPostgresConnection();
      const pgQuery = convertQueryToPostgres(query, params);
      pgResult = await executePgQuery(pgConn, pgQuery, params);
      await releasePostgresConnection(pgConn);
    } catch (error) {
      pgError = error;
      logger.error('PostgreSQL write error', { error, query });
    }
    
    // Log if results are inconsistent
    if (sqliteResult && pgResult && !areResultsConsistent(sqliteResult, pgResult)) {
      logger.warn('Inconsistent write results between databases', {
        sqliteResult,
        pgResult,
        query
      });
    }
  }
  
  // If primary database (SQLite) failed, throw error
  if (sqliteError) {
    throw sqliteError;
  }
  
  return sqliteResult;
}

// Helper to convert SQLite queries to PostgreSQL format
function convertQueryToPostgres(query, params) {
  // Replace SQLite-specific syntax with PostgreSQL syntax
  // For example, replace question mark parameters with $1, $2, etc.
  let pgQuery = query.replace(/\?/g, (match, index) => `$${index + 1}`);
  
  // Replace SQLite-specific functions
  pgQuery = pgQuery.replace(/IFNULL\(/gi, 'COALESCE(');
  
  // Handle other syntax differences as needed
  
  return pgQuery;
}
```

#### Task 5.3: Set Up Monitoring and Testing

- Create API endpoint for database comparison testing
- Implement automated tests to verify consistency between databases
- Add performance benchmarking tools to compare query times
- Create monitoring dashboard for parallel operation phase

```javascript
// Example database comparison endpoint
app.get('/api/admin/db-comparison', async (req, res) => {
  if (!req.headers.authorization || req.headers.authorization !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { endpoint, params } = req.query;
  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }
  
  try {
    // Call the same endpoint with both database types
    const sqliteResponse = await fetchWithDatabase(endpoint, 'sqlite', params);
    const pgResponse = await fetchWithDatabase(endpoint, 'postgres', params);
    
    // Compare results
    const comparisonResult = compareResponses(sqliteResponse, pgResponse);
    
    res.json({
      endpoint,
      params,
      isConsistent: comparisonResult.isConsistent,
      differences: comparisonResult.differences,
      performanceComparison: {
        sqlite: sqliteResponse.meta.responseTime,
        postgres: pgResponse.meta.responseTime,
        difference: sqliteResponse.meta.responseTime - pgResponse.meta.responseTime,
        percentageDifference: ((sqliteResponse.meta.responseTime - pgResponse.meta.responseTime) / sqliteResponse.meta.responseTime) * 100
      }
    });
  } catch (error) {
    logger.error('Error in database comparison', { error, endpoint });
    res.status(500).json({ error: 'Failed to compare database responses' });
  }
});

// Helper function to fetch data with specific database
async function fetchWithDatabase(endpoint, dbType, params) {
  const start = Date.now();
  const queryParams = new URLSearchParams(params);
  queryParams.append('db_type', dbType);
  
  const response = await fetch(`http://localhost:${process.env.PORT}/api/${endpoint}?${queryParams}`);
  const data = await response.json();
  
  return {
    data,
    meta: {
      responseTime: Date.now() - start,
      status: response.status
    }
  };
}
```

#### Task 5.4: Perform Comprehensive Data Consistency Checks

Run these tests to verify data consistency between the two databases:

```bash
# Create a comprehensive database comparison script
cat > compare-databases.js << 'EOF'
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import fs from 'fs';

// This should match environment variables used in production
const SQLITE_PATH = process.env.SQLITE_DB_PATH || './github-explorer/server/db/github_explorer.db';
const PG_CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'github_explorer',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres'
};

const TABLES = [
  'repositories',
  'contributors',
  'merge_requests',
  'commits',
  'contributor_repository',
  'pipeline_status',
  'pipeline_history',
  'pipeline_schedules'
];

async function compareDatabases() {
  console.log('Database Comparison Report');
  console.log('==========================\n');
  
  // Connect to both databases
  console.log('Connecting to databases...');
  const sqliteDb = await open({
    filename: SQLITE_PATH,
    driver: sqlite3.Database
  });
  
  const pgPool = new Pool(PG_CONFIG);
  
  let report = {
    summary: {},
    counts: {},
    samples: {},
    mismatches: {}
  };
  
  try {
    // Compare record counts for each table
    console.log('\nComparing record counts:');
    console.log('------------------------');
    
    for (const table of TABLES) {
      // Get counts
      const sqliteCount = (await sqliteDb.get(`SELECT COUNT(*) as count FROM ${table}`)).count;
      const pgCount = (await pgPool.query(`SELECT COUNT(*) as count FROM ${table}`)).rows[0].count;
      const match = parseInt(sqliteCount) === parseInt(pgCount);
      
      report.counts[table] = {
        sqlite: parseInt(sqliteCount),
        postgres: parseInt(pgCount),
        match
      };
      
      console.log(`${table}: SQLite = ${sqliteCount}, PostgreSQL = ${pgCount}, Match = ${match ? '✓' : '✗'}`);
      
      // Sample comparison for debugging
      if (!match && sqliteCount > 0 && pgCount > 0) {
        // Get primary key for the table
        const sqliteSchema = await sqliteDb.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`);
        const primaryKeyMatch = sqliteSchema.sql.match(/PRIMARY KEY\s*\(([^)]+)\)/i);
        const primaryKey = primaryKeyMatch ? primaryKeyMatch[1].trim() : 'id';
        
        // Sample the first 3 records from both databases
        const sqliteSample = await sqliteDb.all(`SELECT * FROM ${table} ORDER BY ${primaryKey} LIMIT 3`);
        const pgSample = (await pgPool.query(`SELECT * FROM ${table} ORDER BY ${primaryKey} LIMIT 3`)).rows;
        
        report.samples[table] = {
          sqlite: sqliteSample,
          postgres: pgSample
        };
        
        // Check for missing records
        if (sqliteCount > pgCount) {
          console.log(`  Finding records in SQLite missing from PostgreSQL...`);
          // This is a simplified example - in practice, you'd want to batch this for large tables
          const sqliteIds = (await sqliteDb.all(`SELECT ${primaryKey} FROM ${table}`)).map(r => r[primaryKey]);
          const placeholders = sqliteIds.map((_, i) => `$${i + 1}`).join(',');
          const pgIds = (await pgPool.query(`SELECT ${primaryKey} FROM ${table} WHERE ${primaryKey} IN (${placeholders})`, sqliteIds)).rows.map(r => r[primaryKey]);
          
          const missingIds = sqliteIds.filter(id => !pgIds.includes(id));
          if (missingIds.length > 0) {
            console.log(`  ${missingIds.length} records missing in PostgreSQL (first 5): ${missingIds.slice(0, 5).join(', ')}`);
            report.mismatches[table] = { missing_in_postgres: missingIds.slice(0, 10) }; // Store first 10 for the report
          }
        }
      }
    }
    
    // Generate summary
    const tableCount = TABLES.length;
    const matchingTables = Object.values(report.counts).filter(c => c.match).length;
    const totalSqliteRecords = Object.values(report.counts).reduce((sum, c) => sum + c.sqlite, 0);
    const totalPgRecords = Object.values(report.counts).reduce((sum, c) => sum + c.postgres, 0);
    const recordsMatch = totalSqliteRecords === totalPgRecords;
    
    report.summary = {
      database_comparison_date: new Date().toISOString(),
      tables_compared: tableCount,
      tables_matching: matchingTables,
      tables_mismatched: tableCount - matchingTables,
      total_sqlite_records: totalSqliteRecords,
      total_postgres_records: totalPgRecords,
      all_records_match: recordsMatch
    };
    
    console.log('\nSummary:');
    console.log('--------');
    console.log(`Tables compared: ${tableCount}`);
    console.log(`Tables with matching record counts: ${matchingTables} / ${tableCount}`);
    console.log(`Total SQLite records: ${totalSqliteRecords}`);
    console.log(`Total PostgreSQL records: ${totalPgRecords}`);
    console.log(`Overall match: ${recordsMatch ? '✓' : '✗'}`);
    
    // Save report to file
    fs.writeFileSync('database-comparison-report.json', JSON.stringify(report, null, 2));
    console.log('\nDetailed report saved to database-comparison-report.json');
    
  } catch (error) {
    console.error('Comparison failed:', error);
  } finally {
    await sqliteDb.close();
    await pgPool.end();
  }
}

compareDatabases().catch(console.error);
EOF

# Run the comparison script
node compare-databases.js
```

**Expected Results:**
- All tables should have matching record counts between SQLite and PostgreSQL
- If mismatches are found, the report will identify specific records for further investigation
- The overall summary will provide a quick health check of the migration status

### Story 6: Cutover to PostgreSQL

**Description**: Complete the migration by making PostgreSQL the primary database

#### Task 6.1: Performance Validation and Optimization

- Run comprehensive performance tests on PostgreSQL
- Identify and optimize slow queries
- Add additional indexes based on performance data
- Document performance improvements

#### Task 6.2: Update Configuration for PostgreSQL Primary

- Update environment variables to make PostgreSQL the default
- Remove dual-write mode configuration
- Update connection manager to prefer PostgreSQL
- Document the configuration changes

#### Task 6.3: SQLite Removal Plan

- Create plan for eventual removal of SQLite support
- Schedule code simplification after stabilization period
- Document SQLite removal steps and timeline
- Create database migration guide for developers

#### Task 6.4: Conduct Performance Benchmark Testing

Run comprehensive performance tests to ensure PostgreSQL performs adequately:

```bash
# Create a performance benchmark script
cat > benchmark-databases.js << 'EOF'
import { getConnection, releaseConnection } from './server/src/db/unified-connection-manager.js';
import { performance } from 'perf_hooks';

// Define test queries representing real application workloads
const TEST_QUERIES = [
  {
    name: "Simple Repository Count",
    query: "SELECT COUNT(*) as count FROM repositories"
  },
  {
    name: "Filtered Repository List",
    query: "SELECT * FROM repositories WHERE stars > 100 ORDER BY stars DESC LIMIT 20"
  },
  {
    name: "Contributor with Repositories",
    query: `
      SELECT c.*, COUNT(DISTINCT cr.repository_id) as repo_count 
      FROM contributors c
      LEFT JOIN contributor_repository cr ON c.id = cr.contributor_id
      GROUP BY c.id
      ORDER BY repo_count DESC
      LIMIT 20
    `
  },
  {
    name: "Repository with Complex Joins",
    query: `
      SELECT r.*, 
             COUNT(DISTINCT c.contributor_id) as contributor_count,
             COUNT(DISTINCT m.id) as merge_request_count,
             SUM(cm.additions) as total_additions,
             SUM(cm.deletions) as total_deletions
      FROM repositories r
      LEFT JOIN contributor_repository c ON r.id = c.repository_id
      LEFT JOIN merge_requests m ON r.id = m.repository_id
      LEFT JOIN commits cm ON r.id = cm.repository_id
      GROUP BY r.id
      ORDER BY contributor_count DESC
      LIMIT 10
    `
  },
  {
    name: "Complex Analytics Query",
    query: `
      WITH ranked_repos AS (
        SELECT r.id, r.name, r.stars, COUNT(c.id) as commit_count,
               ROW_NUMBER() OVER (ORDER BY r.stars DESC) as rank
        FROM repositories r
        LEFT JOIN commits c ON r.id = c.repository_id
        GROUP BY r.id
      )
      SELECT * FROM ranked_repos WHERE rank <= 20
    `
  }
];

// Number of runs for each query to get average
const RUNS_PER_QUERY = 5;

async function runBenchmark() {
  console.log('Database Performance Benchmark');
  console.log('=============================\n');
  
  // Run tests for both database types
  const results = {
    sqlite: {},
    postgres: {}
  };
  
  for (const dbType of ['sqlite', 'postgres']) {
    console.log(`Testing ${dbType.toUpperCase()}...`);
    process.env.DATABASE_TYPE = dbType;
    
    for (const testCase of TEST_QUERIES) {
      console.log(`  Running: ${testCase.name}`);
      const durations = [];
      
      let conn;
      try {
        conn = await getConnection();
        
        // Warm-up run (not measured)
        await conn.query(testCase.query);
        
        // Measured runs
        for (let i = 0; i < RUNS_PER_QUERY; i++) {
          const start = performance.now();
          await conn.query(testCase.query);
          const end = performance.now();
          durations.push(end - start);
        }
        
        // Calculate statistics
        const avg = durations.reduce((sum, time) => sum + time, 0) / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);
        
        results[dbType][testCase.name] = {
          average_ms: avg.toFixed(2),
          min_ms: min.toFixed(2),
          max_ms: max.toFixed(2),
          runs: durations.length
        };
        
        console.log(`    Avg: ${avg.toFixed(2)}ms, Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);
      } catch (error) {
        console.error(`    Error: ${error.message}`);
        results[dbType][testCase.name] = { error: error.message };
      } finally {
        if (conn) await releaseConnection(conn);
      }
    }
    
    console.log(''); // Empty line between database types
  }
  
  // Compare results
  console.log('\nPerformance Comparison (PostgreSQL vs SQLite)');
  console.log('-------------------------------------------');
  
  for (const testCase of TEST_QUERIES) {
    const sqliteResult = results.sqlite[testCase.name];
    const pgResult = results.postgres[testCase.name];
    
    if (sqliteResult.error || pgResult.error) {
      console.log(`${testCase.name}: Error occurred, can't compare`);
      continue;
    }
    
    const sqliteAvg = parseFloat(sqliteResult.average_ms);
    const pgAvg = parseFloat(pgResult.average_ms);
    const diff = ((pgAvg - sqliteAvg) / sqliteAvg * 100).toFixed(2);
    const fasterDb = diff < 0 ? 'PostgreSQL' : 'SQLite';
    const absDiff = Math.abs(diff);
    
    console.log(`${testCase.name}:`);
    console.log(`  SQLite: ${sqliteAvg}ms, PostgreSQL: ${pgAvg}ms`);
    console.log(`  ${fasterDb} is ${absDiff}% ${diff < 0 ? 'faster' : 'slower'}`);
  }
  
  console.log('\nBenchmark complete.');
}

runBenchmark().catch(console.error);
EOF

# Run the benchmark
node benchmark-databases.js
```

**Expected Results:**
- Performance metrics for each test query on both database systems
- Comparative analysis showing which database performs better for each query type
- Insights into areas where PostgreSQL might need optimization

By adding these comprehensive testing sections throughout the epic, we ensure we're validating our work at each step and have clear evidence that the PostgreSQL migration is proceeding correctly before making the final cutover.

## Files With Database Connections and Queries

This section details all files containing database connections or queries in the GitHub Explorer codebase:

### Connection Management

1. **`server/src/db/connection-manager.js`**
   - Core SQLite connection manager implementation
   - Implements singleton pattern for database connections
   - Used throughout the application for database access
   - Manages connection lifecycle and performance optimization

2. **`server/src/utils/sqlite.js`**
   - Legacy database connection utilities (deprecated)
   - May contain some SQLite-specific helper functions
   - Will need to be adapted or replaced for PostgreSQL

### Core Controllers

3. **`server/src/controllers/api/repositories.js`**
   - Implements `/api/repositories` endpoints
   - CRUD operations for repositories
   - Contains queries for repository listing, filtering, and retrieval
   - Used by frontend for repository browsing and details pages

4. **`server/src/controllers/api/contributors.js`**
   - Implements `/api/contributors` endpoints
   - Contains complex queries for contributor profiles and metrics
   - Aggregates data across multiple tables
   - Powers frontend contributor profile pages

5. **`server/src/controllers/api/merge-requests.js`**
   - Implements `/api/merge-requests` endpoints
   - Contains queries for merge request listing and details
   - Includes filtering, sorting, and pagination logic
   - Powers frontend merge request browsing and details

6. **`server/src/controllers/api/commits.js`**
   - Implements `/api/commits` endpoints
   - Contains queries for commit history and details
   - Includes file change logging and commit metrics
   - Used for displaying commit activity and details

7. **`server/src/controllers/api/entity-counts.js`**
   - Implements `/api/entity-counts` endpoint
   - Contains aggregation queries to count entities
   - Used for dashboard statistics and metrics
   - Called frequently for frontend status displays

8. **`server/src/controllers/api/pipeline-operations.js`**
   - Manages pipeline operations database interactions
   - Updates pipeline status and history tables
   - Contains transaction-based operations
   - Used by admin dashboard for pipeline control

9. **`server/src/controllers/api/pipeline-history.js`**
   - Retrieves pipeline execution history
   - Contains time-based filtering and aggregation
   - Used by admin dashboard for pipeline monitoring
   - Requires efficient timestamp handling

10. **`server/src/controllers/api/rankings.js`**
    - Implements contributor ranking calculations
    - Contains complex aggregation and scoring queries
    - Powers leaderboard displays and statistics
    - Requires optimization for performance

11. **`server/src/controllers/api/sitemap.js`**
    - Manages sitemap generation and status
    - Queries across multiple entity tables
    - Handles URL generation for SEO
    - Requires batched processing for large datasets

### Pipeline Processors

12. **`server/src/pipeline/processors/github-sync-processor.js`**
    - Fetches and saves GitHub API data
    - Contains insertion and update logic for raw data
    - Manages deduplication through upsert operations
    - Heavy database write operations

13. **`server/src/pipeline/processors/data-processing-processor.js`**
    - Processes raw GitHub data into structured entities
    - Complex transformation and relationship mapping
    - Heavy database write operations with transactions
    - Core data pipeline component

14. **`server/src/pipeline/processors/repository-enrichment-processor.js`**
    - Enriches repository data with additional information
    - Updates existing records with new data
    - Contains upsert operations and relationship management
    - Requires transaction support

### Utility Files

15. **`server/src/utils/db-cleanup.js`**
    - Database maintenance operations
    - Contains cleanup and optimization queries
    - May include database-specific commands
    - Used for periodic maintenance

16. **`server/src/utils/entity-utils.js`**
    - Helper functions for entity operations
    - May contain common query patterns
    - Used across multiple controllers
    - Good candidate for query adaptation

### Scripts

17. **`server/scripts/migrate-db.js`**
    - Database schema migration script
    - Contains DDL statements for schema updates
    - Critical for database structure management
    - Will need significant adaptation for PostgreSQL

18. **`server/scripts/init-pipeline-status.js`**
    - Initializes pipeline status tables
    - Contains insert operations for default values
    - Used during application setup
    - Simple to adapt

## Data Access Patterns

These are the main data access patterns identified in the codebase:

1. **Simple CRUD Operations**
   - Basic select, insert, update, delete operations
   - Used in almost all controllers
   - Relatively easy to adapt for PostgreSQL

2. **Complex Aggregations**
   - Used in ranking, statistics, and metrics
   - Often includes multiple joins and subqueries
   - May require optimization for PostgreSQL

3. **Pagination and Filtering**
   - Common pattern across list endpoints
   - Includes offset/limit, sorting, and filtering
   - Requires careful adaptation for consistency

4. **Transaction-Based Operations**
   - Used in pipeline processors and data importers
   - Ensures data consistency across related tables
   - Critical for migration to maintain data integrity

5. **Bulk Operations**
   - Used in data import and processing
   - May use SQLite-specific batch insert syntax
   - Performance-critical operations

6. **Full-Text Search**
   - Used in search endpoints
   - PostgreSQL offers more powerful text search capabilities
   - Opportunity for enhancement during migration

## Conclusion

This epic outlines a comprehensive plan to migrate from SQLite to PostgreSQL while maintaining parallel operation capability. By carefully adapting the connection manager and query patterns, we can ensure a smooth transition with minimal code disruption and zero downtime. The phased approach allows for thorough testing and validation before fully committing to PostgreSQL as the primary database.

## Migration Risks and Mitigation

The migration from SQLite to PostgreSQL involves several potential risks that need careful handling:

### 1. SQL Syntax and Function Differences

**Risk**: SQLite and PostgreSQL have different SQL dialects and function implementations.

**Examples**:
- Date/time functions: `datetime()` and `strftime()` in SQLite vs `now()` and `to_char()` in PostgreSQL
- Null handling: `IFNULL()` in SQLite vs `COALESCE()` in PostgreSQL (though PostgreSQL also recognizes `COALESCE()`)
- String concatenation: `||` operator works in both but might behave differently with NULL values

**Mitigation**:
- Create a comprehensive mapping of SQLite functions to PostgreSQL equivalents
- Implement function translation in the query adapter layer
- Use automated testing to verify query results match between both systems

### 2. Transaction Management Differences

**Risk**: Transaction syntax and behavior differ between SQLite and PostgreSQL.

**Examples**:
- SQLite uses `BEGIN TRANSACTION` while PostgreSQL uses `BEGIN`
- Error handling and transaction isolation levels work differently
- Connection locking behavior is different

**Mitigation**:
- Create abstracted transaction methods in the connection manager
- Ensure proper release of PostgreSQL connections after transactions
- Add extra validation in transaction-critical operations

### 3. Parameter Binding Differences

**Risk**: SQLite uses `?` placeholders while PostgreSQL uses `$1, $2, etc.`

**Examples**:
- `SELECT * FROM users WHERE id = ?` (SQLite)
- `SELECT * FROM users WHERE id = $1` (PostgreSQL)

**Mitigation**:
- Implement a parameter binding adapter that converts placeholders automatically
- Unit test parameter binding with various data types
- Consider implementing prepared statements for frequently used queries

### 4. Data Type Compatibility Issues

**Risk**: SQLite is loosely typed while PostgreSQL enforces strict typing.

**Examples**:
- Boolean values stored as 0/1 in SQLite vs TRUE/FALSE in PostgreSQL
- Date/time storage format differences
- JSON/BLOB handling differences

**Mitigation**:
- Review all schemas for type compatibility
- Implement type conversion in the data migration scripts
- Add validation for critical data types during parallel operation

### 5. Index and Constraint Syntax Variations

**Risk**: Creating indexes and constraints has slight syntax differences.

**Examples**:
- `CREATE INDEX` statement variations
- Unique constraint implementation differences
- Foreign key enforcement behavior

**Mitigation**:
- Create PostgreSQL-specific schema creation scripts
- Test index effectiveness with real-world query patterns
- Verify constraint behavior matches between both systems

### 6. Error Handling Code Adaptation

**Risk**: SQLite and PostgreSQL report errors differently with different error codes.

**Examples**:
- `SQLITE_BUSY` vs PostgreSQL's `55P03` (lock_not_available)
- Different constraint violation error formats
- Connection error handling differences

**Mitigation**:
- Update error handling to recognize PostgreSQL-specific error codes
- Create a database-agnostic error categorization system
- Enhance logging to capture database-specific error details

### 7. Connection Pooling Implementation

**Risk**: SQLite uses a singleton connection while PostgreSQL requires proper connection pooling.

**Examples**:
- Connection validation logic differs
- Resource management is more critical in PostgreSQL
- Connection timeouts and limits need configuration

**Mitigation**:
- Implement a robust PostgreSQL connection pool
- Add connection health checking and recovery
- Configure appropriate pool size and timeout settings

### 8. Upsert Operation Differences

**Risk**: The `INSERT ... ON CONFLICT` syntax varies between the databases.

**Examples**:
- Different column reference syntax in the ON CONFLICT clause
- Different capabilities for the UPDATE portion
- RETURNING clause behavior may differ

**Mitigation**:
- Create database-specific upsert operation helpers
- Test upsert operations with various conflict scenarios
- Verify data integrity during parallel operation

### 9. Performance Optimization Needs

**Risk**: Query patterns optimized for SQLite may perform poorly in PostgreSQL.

**Examples**:
- Index usage differences
- Query planner behavior variations
- Different optimization techniques needed

**Mitigation**:
- Benchmark key queries in both databases
- Implement PostgreSQL-specific index optimizations
- Add query monitoring during parallel operation phase

### 10. Data Migration Integrity Risks

**Risk**: Ensuring data consistency during large-scale data migration.

**Examples**:
- Referential integrity maintenance during migration
- Handling large tables with limited memory
- Dealing with migration interruptions

**Mitigation**:
- Implement transaction-based batched migration
- Add comprehensive validation after migration
- Create recovery procedures for interrupted migrations
- Implement checksums or row counts to verify completeness

By proactively addressing these risks in our implementation, we can ensure a smoother transition to PostgreSQL with minimal disruption to the application. 

## Cross-Environment Compatibility

The GitHub Explorer application uses a split architecture with the frontend deployed on Vercel and the backend deployed on Render.com. This section addresses critical considerations to ensure the PostgreSQL migration works consistently across both development and production environments.

### Environment Variable Management

#### Task 7.1: Update Environment Variables for Both Environments

| Environment | File | Required PostgreSQL Variables |
|-------------|------|-------------------------------|
| Development Frontend | `.env.local` | `NEXT_PUBLIC_DATABASE_TYPE` |
| Development Backend | `.env` | `DATABASE_TYPE`, `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD`, `PG_POOL_SIZE` |
| Production Frontend | `.env.production` | `NEXT_PUBLIC_DATABASE_TYPE` |
| Production Backend | Render.com Environment | `DATABASE_TYPE`, `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD`, `PG_POOL_SIZE` |

Example configuration for development `.env`:
```
# Database Configuration
DATABASE_TYPE=postgres  # or "sqlite" for legacy database
SQLITE_DB_PATH=./db/github_explorer.db  # Still needed for parallel operation or fallback

# PostgreSQL Configuration
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=github_explorer
PG_USER=postgres
PG_PASSWORD=your_password
PG_POOL_SIZE=20
```

Example configuration for Render.com production environment variables:
```
DATABASE_TYPE=postgres
PG_HOST=your-production-host.render.com
PG_PORT=5432
PG_DATABASE=github_explorer_prod
PG_USER=prod_user
PG_PASSWORD=secure_password
PG_POOL_SIZE=50
```

#### Task 7.2: Update Health Check Endpoint

Modify the health check endpoint to validate both database connections:

```javascript
// server/src/controllers/health-controller.js
import { getConnection, releaseConnection } from '../db/unified-connection-manager.js';
import { logger } from '../utils/logger.js';

export async function healthCheck(req, res) {
  const healthStatus = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    database: {
      type: process.env.DATABASE_TYPE || 'sqlite',
      connections: {}
    }
  };

  // Check SQLite connection if configured
  if (!process.env.DATABASE_TYPE || process.env.DATABASE_TYPE === 'sqlite') {
    try {
      const sqliteConn = await getConnection({ dbType: 'sqlite' });
      const sqliteResult = await sqliteConn.get('SELECT 1 as ok');
      healthStatus.database.connections.sqlite = { status: 'connected', ok: !!sqliteResult.ok };
      await releaseConnection(sqliteConn, { dbType: 'sqlite' });
    } catch (error) {
      logger.error('Health check SQLite connection error', { error });
      healthStatus.database.connections.sqlite = { status: 'error', message: error.message };
      healthStatus.status = 'degraded';
    }
  }

  // Check PostgreSQL connection if configured
  if (process.env.DATABASE_TYPE === 'postgres') {
    try {
      const pgConn = await getConnection({ dbType: 'postgres' });
      const pgResult = await pgConn.query('SELECT 1 as ok');
      healthStatus.database.connections.postgres = { status: 'connected', ok: !!pgResult.rows[0].ok };
      await releaseConnection(pgConn, { dbType: 'postgres' });
    } catch (error) {
      logger.error('Health check PostgreSQL connection error', { error });
      healthStatus.database.connections.postgres = { status: 'error', message: error.message };
      healthStatus.status = 'degraded';
    }
  } else {
    console.log('\n✗ PostgreSQL not configured (missing PG_HOST)');
  }

  const statusCode = healthStatus.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
}
```

### Server Entry Point Consistency

#### Task 7.3: Ensure Consistent Server Entry Point

A critical issue for environment parity is ensuring that both development and production use the same server entry point file. This is especially important for our migration since database connection logic needs to be consistent.

1. **Standardize Entry Point**:

```javascript
// server/src/server.js - The common entry point for both environments
import app from './app.js';
import { logger } from './utils/logger.js';

// Log critical environment configuration
logger.info(`Node environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`Database type: ${process.env.DATABASE_TYPE || 'sqlite'}`);
logger.info(`Server entry point: ${__filename}`);

// Validate critical environment variables
if (process.env.DATABASE_TYPE === 'postgres') {
  if (!process.env.PG_HOST || !process.env.PG_DATABASE || !process.env.PG_USER) {
    logger.error('Missing required PostgreSQL environment variables');
    process.exit(1);
  }
  logger.info(`PostgreSQL host: ${process.env.PG_HOST}`);
}

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
```

2. **Update package.json Scripts**:

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js"
}
```

3. **Update Render.com Start Command** to ensure it uses the same entry point:
   - Start Command: `node src/server.js`

### Deployment Configuration Changes

#### Task 7.4: Update Render.com Configuration for PostgreSQL

When deploying to Render.com in production, make these changes:

1. **PostgreSQL Service Setup**:
   - In the Render.com dashboard, create a new PostgreSQL service or use an existing one
   - Note the connection details (host, port, database name, username, password)

2. **Add PostgreSQL Environment Variables**:
   - In the Render.com dashboard for your web service, add all required PostgreSQL variables
   - Ensure `DATABASE_TYPE` is set to `postgres` to activate PostgreSQL mode

3. **Remove SQLite-specific Configuration** (when ready for full migration):
   - Once PostgreSQL has been validated, remove the SQLite disk configuration
   - Set `DATABASE_TYPE=postgres` permanently

#### Task 7.5: Implement Clean Database Selection without Fallbacks

To ensure proper error reporting and avoid silent failures, implement a clean database selection approach:

```javascript
// Clean implementation without fallbacks - ensuring failures are visible
export async function getConnection(options = {}) {
  // Use override if explicitly provided in options or from environment
  const dbType = options.dbType || getDatabaseType();
  
  try {
    if (dbType === 'postgres') {
      logger.debug('Using PostgreSQL connection');
      return await getPostgresConnection();
    } else if (dbType === 'sqlite') {
      logger.debug('Using SQLite connection');
      return await getSqliteConnection();
    } else {
      throw new Error(`Invalid database type: ${dbType}. Must be 'postgres' or 'sqlite'.`);
    }
  } catch (error) {
    // Log error but don't attempt any fallbacks - let the error propagate
    logger.error(`Failed to establish ${dbType} database connection`, { error });
    throw error;
  }
}

// Ensure getPostgresConnection has robust error handling
export async function getPostgresConnection() {
  if (!pgPool) {
    // Check for required environment variables
    if (!process.env.PG_HOST || !process.env.PG_DATABASE || !process.env.PG_USER) {
      throw new Error('Missing required PostgreSQL environment variables');
    }
    
    try {
      pgPool = new Pool({
        host: process.env.PG_HOST,
        port: process.env.PG_PORT || 5432,
        database: process.env.PG_DATABASE,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD || '',
        max: process.env.PG_POOL_SIZE || 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      
      // Log pool creation
      logger.info('PostgreSQL pool created');
      
      // Handle pool errors
      pgPool.on('error', (err) => {
        logger.error('PostgreSQL pool error', { error: err });
        // On fatal errors, null out the pool so we can recreate it
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
          logger.warn('Fatal PostgreSQL connection error, will recreate pool on next attempt');
          pgPool = null;
        }
      });
      
      // Test connection
      const client = await pgPool.connect();
      client.release();
      logger.info('PostgreSQL connection test successful');
    } catch (error) {
      logger.error('Failed to create PostgreSQL connection pool', { error });
      pgPool = null; // Reset for next attempt
      throw error;
    }
  }
  
  try {
    return await pgPool.connect();
  } catch (error) {
    logger.error('Error connecting to PostgreSQL', { error });
    throw new Error(`Failed to connect to PostgreSQL: ${error.message}`);
  }
}
```

### Migration Execution Plan

#### Task 7.8: Create Clean Migration Plan with Hard Cutover

This plan provides a clear path to fully migrate from SQLite to PostgreSQL without ongoing compatibility:

1. **Development Phase**:
   - Develop with `DATABASE_TYPE=sqlite` as default
   - Test PostgreSQL with `DATABASE_TYPE=postgres` environment variable
   - Implement monitoring to verify both databases independently (no fallbacks)

2. **Testing Phase**:
   - Implement parallel database operation for validation only
   - Run API comparison tests between databases
   - Fix any discrepancies in PostgreSQL implementation

3. **Validation Phase**:
   - Deploy to staging with `DATABASE_TYPE=postgres`
   - Run complete test suite against PostgreSQL
   - Monitor performance and reliability metrics

4. **Production Cutover**:
   - Schedule maintenance window for cutover
   - Migrate all data from SQLite to PostgreSQL
   - Update environment variables to `DATABASE_TYPE=postgres`
   - Deploy with PostgreSQL as the only database
   - Monitor closely for any issues

5. **Cleanup Phase**:
   - Remove all SQLite-specific code (after a verification period)
   - Simplify the connection manager to use PostgreSQL only
   - Remove dual-database capability from API endpoints
   - Update documentation to reflect PostgreSQL-only operation

This approach ensures a clean cutover with proper error reporting and no silent fallbacks or interdependency between the databases.