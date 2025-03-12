# Database Migrations

This directory contains all database migrations for the GitHub Explorer application. 

## Migration Naming Convention

Migrations should follow this naming pattern:

```
YYYYMMDD_HHMMSS_description.sql
```

For example:
- `20240315_120000_create_pipeline_schedules.sql`
- `20240315_120100_create_pipeline_configurations.sql`
- `20240315_120200_add_timezone_column.sql`

This ensures that migrations are executed in the correct chronological order.

## Migration Types

We use the following types of migrations:

1. **Schema migrations**: Create or alter database tables and structures
2. **Reference data migrations**: Add or update reference data
3. **Function migrations**: Create or update database functions or procedures

## Running Migrations

Migrations can be run using the setup script:

```bash
npm run setup:db
```

The SupabaseSchemaManager handles migration execution:
- Tracks which migrations have been executed
- Ensures migrations are run in the correct order
- Handles errors during migration

## Creating New Migrations

When adding a new migration:

1. Create a new SQL file in this directory with the appropriate timestamp
2. Add the necessary SQL statements
3. Test the migration locally before committing

## Best Practices

1. Each migration should be atomic and focused on a single change
2. Always include `IF NOT EXISTS` or `IF EXISTS` checks to make migrations idempotent
3. Include comments explaining complex changes
4. Use transactions for complex migrations
5. Consider backward compatibility when altering existing tables
6. Add appropriate indexes for performance

## Manual Migration Rollback

If a migration needs to be rolled back, create a new migration with a `rollback_` prefix, for example:
`20240315_130000_rollback_add_timezone_column.sql`

The rollback migration should undo the changes made in the original migration. 