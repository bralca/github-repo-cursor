# Data Systems Documentation

This folder contains documentation for the data systems used in the GitHub Explorer application.

## Key Documentation Files

### [DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md](./DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md)

This is the **single source of truth** for the GitHub Explorer database schema and access patterns. It includes:

- Complete schema documentation for all tables
- Field descriptions and relationships
- SQLite-specific implementation details
- Common access patterns and query examples
- Best practices for database operations

This should be your first reference for any database-related questions.

### [SQLITE_SQL_CHEATSHEET.md](./SQLITE_SQL_CHEATSHEET.md)

A practical reference for working with the SQLite database:

- Common SQL queries for the GitHub Explorer schema
- Examples for retrieving and manipulating data
- Performance tips for complex queries

### [DATA_PIPELINE_ARCHITECTURE.md](./DATA_PIPELINE_ARCHITECTURE.md)

Documentation for the data pipeline architecture:

- Overview of the data synchronization and enrichment pipeline
- Components and workflows for data processing
- Integration between the pipeline and the database

## Database Implementation

The GitHub Explorer application uses SQLite as its primary database. The database schema follows standardized patterns:

1. **Primary Keys**: All tables use auto-generated UUIDs as primary keys
2. **GitHub Identifiers**: All entities have a `github_id` field storing the original GitHub identifier
3. **Dual Reference**: All relationships include both UUID foreign keys AND GitHub IDs for direct querying
4. **Complete Relationships**: Every relationship between entities is fully traceable in both directions

For implementation details, see the [database schema documentation](./DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md). 