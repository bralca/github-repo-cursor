# Database Connection Manager

## Overview

The Database Connection Manager is a core component of the GitHub Explorer application that provides a centralized, efficient way to manage SQLite database connections. It implements a singleton pattern to maintain a single, persistent connection throughout the application lifecycle, which is shared across all requests and operations.

## Why a Connection Manager?

Using a connection manager instead of opening/closing connections for each operation offers several important advantages:

1. **Reduced Overhead**: Opening and closing database connections is expensive in terms of performance
2. **Improved Stability**: Prevents "database is locked" errors that can occur with multiple connections
3. **Better Resource Management**: Avoids connection thrashing and memory leaks
4. **Simplified Code**: Removes boilerplate connection handling from business logic
5. **Consistent Access**: Ensures all components access the database in a uniform way

## Technical Implementation

The connection manager is implemented in `github-explorer/server/src/db/connection-manager.js`:

```javascript
// Simplified implementation overview
let db = null;
let isInvalidating = false;

export async function getConnection() {
  if (db && !isInvalidating) {
    try {
      // Validate connection is still good
      await db.get('SELECT 1');
      return db;
    } catch (error) {
      // Connection is invalid, create a new one
      logger.warn('Existing connection is invalid, creating a new one', { error });
      db = null;
    }
  }

  // Create a new connection if needed
  const dbPath = getDbPath();
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  // Set pragmas for better performance
  await db.exec('PRAGMA journal_mode = WAL;');
  await db.exec('PRAGMA synchronous = NORMAL;');
  await db.exec('PRAGMA foreign_keys = ON;');
  
  return db;
}
```

### Key Design Principles

1. **Lazy Initialization**: The connection is only established when first needed
2. **Validation Before Use**: Each request checks that the connection is still valid
3. **Automatic Recovery**: If a connection becomes invalid, a new one is created
4. **Single Source of Truth**: All connection management logic is in one place
5. **Graceful Shutdown**: Handles proper connection cleanup during application shutdown

## Usage Guide

### Basic Usage

```javascript
import { getConnection } from '../../db/connection-manager.js';

async function getDatabaseData() {
  const db = await getConnection();
  return db.all('SELECT * FROM my_table');
}
```

### Do's and Don'ts

✅ **DO**:
- Always use `getConnection()` to obtain a database connection
- Handle database errors properly with try-catch blocks
- Use proper parameterized queries to prevent SQL injection
- Keep database operations focused and efficient

❌ **DON'T**:
- Don't call `db.close()` on connections from the manager
- Don't create direct connections with `new sqlite.Database()` or similar
- Don't store the connection object for long periods
- Don't use the deprecated `openSQLiteConnection()` function

### Error Handling

```javascript
import { getConnection } from '../../db/connection-manager.js';
import { logger } from '../../utils/logger.js';

async function getDatabaseData() {
  try {
    const db = await getConnection();
    return await db.all('SELECT * FROM my_table WHERE id = ?', [id]);
  } catch (error) {
    logger.error('Error retrieving data', { error, id });
    throw new Error(`Failed to get data: ${error.message}`);
  }
}
```

## Migrating from Legacy Code

If you encounter code using the old connection pattern, here's how to update it:

### Old Pattern (Deprecated)

```javascript
import { openSQLiteConnection, closeSQLiteConnection } from '../../utils/sqlite.js';

async function oldPattern() {
  const db = await openSQLiteConnection();
  try {
    return await db.all('SELECT * FROM my_table');
  } finally {
    await closeSQLiteConnection(db);
  }
}
```

### New Pattern (Recommended)

```javascript
import { getConnection } from '../../db/connection-manager.js';

async function newPattern() {
  const db = await getConnection();
  return db.all('SELECT * FROM my_table');
  // No need to close the connection
}
```

## Performance Considerations

- **Connection Reuse**: Reusing connections avoids the overhead of establishing new ones
- **Connection Validation**: Quick validation ensures the connection is always valid
- **Transaction Support**: The connection supports transactions for atomic operations
- **WAL Mode**: Write-Ahead Logging improves concurrent access performance
- **Connection Cleanup**: The manager handles proper cleanup to prevent memory leaks

## Troubleshooting

### Common Issues and Solutions

1. **"Database is locked" Errors**
   - Cause: Multiple operations trying to write to the database simultaneously
   - Solution: Use transactions for multiple write operations

2. **"Database handle is closed" Errors**
   - Cause: Attempting to use a connection after it has been closed
   - Solution: Ensure no code is manually closing connections

3. **Slow Query Performance**
   - Cause: Missing indices or inefficient queries
   - Solution: Add appropriate indices and optimize query patterns

4. **Memory Leaks**
   - Cause: Creating but not properly managing database connections
   - Solution: Always use the connection manager

## Conclusion

The connection manager is a critical part of the GitHub Explorer application's performance and stability. By following the best practices outlined in this document, you'll ensure efficient database access and prevent common issues related to database connections. 