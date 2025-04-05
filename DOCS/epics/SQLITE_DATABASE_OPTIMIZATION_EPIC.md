# Epic: SQLite Database Optimization

## Overview

This epic covers the optimization of SQLite database usage in the GitHub Explorer application to eliminate database locking issues, improve performance, and enhance reliability. The current implementation creates a new database connection for each query, leading to "SQLITE_BUSY: database is locked" errors during concurrent operations like processing multiple GitHub PRs simultaneously.

## Data Access Strategy

### Current Implementation Issues
- Each query opens and immediately closes a new database connection
- Multiple concurrent operations cause database locking errors
- No retry mechanism for handling temporary locks
- No transaction management for related operations

### Optimized Implementation
- Use a single persistent connection or small connection pool
- Configure SQLite with Write-Ahead Logging (WAL) mode for better concurrency
- Set appropriate busy timeouts to handle temporary locks
- Implement retry logic with exponential backoff for operations that might fail
- Use transactions to group related operations

## Acceptance Criteria

1. Eliminate or significantly reduce "database is locked" errors
2. Implement proper connection pooling for SQLite
3. Optimize SQLite configuration for concurrent operations
4. Add resilience through retry mechanisms for database operations
5. Ensure proper database connection lifecycle management
6. Maintain backward compatibility with existing database operations

## Stories

### Story 1: Implement SQLite Connection Management

Create a robust connection management system that maintains persistent connections rather than opening and closing for each query.

#### Task 1.1: Create Connection Manager Module

**Description:**  
Create a new connection manager module that maintains a persistent SQLite connection with optimized settings for concurrency.

**Acceptance Criteria:**
- Create a singleton connection manager
- Implement WAL mode and busy timeout settings
- Add proper initialization and connection management functions
- Include logging for connection lifecycle events

**Implementation Notes:**
- Place in `github-explorer/server/src/db/connection-manager.js`
- Use WAL journal mode and a 5000ms busy timeout
- Ensure settings are applied immediately after connection creation

**Implementation Prompt:**
```
Create a connection manager module that implements the singleton pattern for SQLite connections with these requirements:
1. Maintain a single shared database connection
2. Configure the connection with WAL mode and busy timeout settings
3. Provide functions to get the shared connection and properly close it
4. Include proper error handling and logging
5. Follow the module pattern to encapsulate the implementation details

The connection manager should be designed to eliminate the "database is locked" errors by properly configuring SQLite and maintaining persistent connections.
```

#### Task 1.2: Update Database Pool Implementation

**Description:**  
Modify the existing database pool implementation to use the new connection manager instead of creating new connections for each query.

**Acceptance Criteria:**
- Refactor db-pool.js to use the shared connection
- Maintain the existing API for backward compatibility
- Remove connection opening/closing for each query
- Ensure all database operations use the shared connection

**Implementation Notes:**
- Update `github-explorer/server/src/db/db-pool.js`
- Keep the query method signature unchanged for compatibility
- Add appropriate error handling and logging

**Implementation Prompt:**
```
Refactor the existing db-pool.js file to use the new connection manager instead of creating and closing connections for each query. Maintain the existing API while eliminating the connection churn that contributes to database locking issues.

The updated implementation should:
1. Import and use the getConnection function from the connection manager
2. Maintain the same pool.query() method signature
3. Remove the open/close pattern for each query
4. Add appropriate error handling and logging
5. Ensure backward compatibility with existing code that uses this pool
```

### Story 2: Implement Resilience for Database Operations

Add retry logic and transaction management to make database operations more resilient against temporary locks.

#### Task 2.1: Create Retry Utility

**Description:**  
Create a utility function that implements retry logic with exponential backoff for database operations.

**Acceptance Criteria:**
- Create a reusable utility for retrying database operations
- Implement exponential backoff with jitter
- Make the utility configurable for different retry scenarios
- Add proper logging for retry attempts

**Implementation Notes:**
- Place in `github-explorer/server/src/utils/retry.js`
- Default to 5 retries with 100ms initial delay
- Include configurable error types for retry conditions
- Use jitter to prevent thundering herd problems

**Implementation Prompt:**
```
Create a retry utility that can wrap database operations and automatically retry them on specified error types like "database is locked" errors. The utility should implement exponential backoff with jitter to prevent synchronization of retry attempts.

The utility should:
1. Accept a function to execute and retry options
2. Catch errors and check if they match retryable error types
3. Use exponential backoff with random jitter for retry delays
4. Log retry attempts for debugging
5. Eventually throw the error if all retries fail
```

#### Task 2.2: Implement Transaction Manager

**Description:**  
Create a transaction manager to group related database operations and ensure atomic execution.

**Acceptance Criteria:**
- Create a utility for managing database transactions
- Support nested transactions via savepoints
- Provide automatic rollback on errors
- Include proper error handling and propagation

**Implementation Notes:**
- Place in `github-explorer/server/src/db/transaction-manager.js`
- Use proper savepoint naming for nested transactions
- Handle transaction management complexity for the caller
- Integrate with the connection manager

**Implementation Prompt:**
```
Create a transaction manager that makes it easy to group related database operations into atomic transactions. The manager should handle the complexity of transaction management including BEGIN, COMMIT, ROLLBACK, and nested transactions via savepoints.

The implementation should:
1. Integrate with the connection manager
2. Provide a withTransaction() function that handles begin/commit/rollback
3. Support nested transactions through savepoints
4. Include proper error handling and logging
5. Be easy to use in controllers and services
```

### Story 3: Update GitHub Data Processing Code

Update the data processing code that handles GitHub webhooks and data synchronization to use the new database utilities.

#### Task 3.1: Update GitHub PR Processing Code

**Description:**  
Update the code that processes GitHub pull requests to use the improved database access patterns.

**Acceptance Criteria:**
- Modify PR processor to use retry logic for database operations
- Implement transactions for related PR data
- Remove any direct database connection management
- Ensure proper error handling and reporting

**Implementation Notes:**
- Focus on PR processing pipeline components
- Use withRetry() for operations that can fail due to locking
- Group related operations into transactions
- Maintain existing functionality while improving reliability

**Implementation Prompt:**
```
Update the GitHub PR processing code to use the new database utilities including retry logic and transaction management. This code currently encounters "database is locked" errors during concurrent processing.

The changes should:
1. Replace direct database operations with calls wrapped in withRetry()
2. Group related operations (e.g., PR data and associated entities) into transactions
3. Remove any direct database connection management
4. Maintain existing functionality while improving resilience
5. Add appropriate error handling and logging
```

#### Task 3.2: Update Other Database Writers

**Description:**  
Update other database writer components to use the improved database access patterns.

**Acceptance Criteria:**
- Identify and update all database writers
- Apply retry logic and transaction management consistently
- Remove direct database connection management
- Ensure proper error handling and reporting

**Implementation Notes:**
- Focus on pipeline database writers
- Use the same patterns as in the PR processor updates
- Consider batch operations where appropriate
- Test changes with concurrent processing

**Implementation Prompt:**
```
Identify and update all database writer components to use the improved database access patterns with retry logic and transaction management. Apply the same patterns used in the PR processor update to ensure consistency.

The changes should:
1. Use the retry utility for operations that might fail due to locking
2. Implement transactions for related data operations
3. Remove any direct database connection management
4. Consider batching operations where appropriate
5. Add appropriate error handling and logging
```

### Story 4: Implement Application Lifecycle Management

Ensure proper initialization and shutdown of database connections throughout the application lifecycle.

#### Task 4.1: Add Shutdown Handlers

**Description:**  
Implement proper shutdown handlers to ensure database connections are closed cleanly when the application exits.

**Acceptance Criteria:**
- Add signal handlers for SIGINT and SIGTERM
- Include handlers for uncaught exceptions
- Ensure all database connections are properly closed
- Implement graceful shutdown with timeout

**Implementation Notes:**
- Update `github-explorer/server/src/app.js`
- Use connection manager's closeConnection function
- Add appropriate logging for shutdown process
- Include a timeout for forced shutdown

**Implementation Prompt:**
```
Implement proper shutdown handlers that ensure database connections are closed cleanly when the application exits. This prevents potential database corruption and resource leaks.

The implementation should:
1. Add signal handlers for SIGINT, SIGTERM, and uncaught exceptions
2. Use the connection manager's closeConnection function
3. Implement a graceful shutdown sequence with timeout
4. Add appropriate logging throughout the shutdown process
5. Ensure all resources are properly released
```

#### Task 4.2: Update Server Initialization

**Description:**  
Update the server initialization code to ensure proper database connection setup at startup.

**Acceptance Criteria:**
- Ensure database connection is initialized early in startup
- Add validation of database connection
- Include proper error handling for connection failures
- Add detailed logging for initialization process

**Implementation Notes:**
- Update `github-explorer/server/src/server.js`
- Use connection manager's getConnection function
- Add connection validation before starting server
- Improve error messages for connection issues

**Implementation Prompt:**
```
Update the server initialization code to ensure proper database connection setup at startup. This ensures the application doesn't start serving requests until the database connection is properly established and configured.

The changes should:
1. Initialize the database connection early in the startup process
2. Validate the connection by executing a simple query
3. Add proper error handling for connection failures
4. Include detailed logging for the initialization process
5. Ensure server only starts after successful database initialization
```

## Testing Strategy

To verify the improvements:

1. **Concurrent Operations Test**: Run multiple concurrent GitHub webhook processing operations and verify no locking errors occur
2. **Error Recovery Test**: Simulate database locking and verify retry mechanism works correctly
3. **Shutdown Test**: Verify connections are properly closed during application shutdown
4. **Performance Test**: Compare query performance before and after changes

## Migration Strategy

These changes should be implemented with minimal disruption:

1. First implement the connection manager and update the pool implementation
2. Then add the retry utility and gradually update consumers
3. Add shutdown handlers last after other changes are stable
4. Deploy changes in a controlled environment before production

## Expected Outcomes

After implementing this epic:

1. "Database is locked" errors should be eliminated or significantly reduced
2. Database operations should be more reliable under concurrent load
3. Related operations will be properly grouped in transactions
4. Application will handle database errors more gracefully
5. Database connections will be properly managed throughout the application lifecycle

This will result in more reliable GitHub data processing and synchronization, improving the overall stability and performance of the application. 