# Documentation Cleanup Plan for DOCS/data-systems/

After implementing the updated SQLite database schema based on our `DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md` documentation, some cleanup is needed in the database documentation folder. Here's the recommended plan for each file:

## Files to Keep (as is or with minor updates)

1. **DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md** (KEEP)
   - This is now our single source of truth for database schema and access patterns
   - It contains the most up-to-date schema documentation with field descriptions
   - It includes SQLite-specific access patterns and best practices
   - No changes needed as we just updated it

2. **SQLITE_SQL_CHEATSHEET.md** (KEEP)
   - Contains useful SQL queries specific to SQLite for the GitHub Explorer database
   - Supports developers working with the database directly
   - Still relevant with our updated schema

3. **DATA_PIPELINE_ARCHITECTURE.md** (KEEP with UPDATE)
   - Important architectural documentation for the data pipeline
   - Should be updated to reflect the use of SQLite instead of Supabase
   - Update references to table names (e.g., github_raw_data → closed_merge_requests_raw)

## Files to Remove (obsolete)

1. **DATABASE_DOCUMENTATION.md** (REMOVE)
   - Duplicates information now contained in DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md
   - Has been superseded by our new comprehensive documentation

2. **SQLITE_DATABASE_DOCUMENTATION.md** (REMOVE)
   - Contains outdated schema information
   - Our new DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md now includes all SQLite-specific details

3. **LOCAL_POSTGRESS_MIGRATION_PLAN.md** (REMOVE)
   - No longer relevant as we've moved to SQLite instead of local PostgreSQL
   - The migration approach described is obsolete

4. **DATABASE_STANDARDIZATION_PLAN.md** (REMOVE)
   - The standardization plan has been fully implemented in our new schema
   - The principles are now documented in DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md
   - Historical reference no longer needed as the plan has been executed

5. **PIPELINE_ARCHITECTURE.md** (REMOVE)
   - Appears to be a duplicate or earlier version of DATA_PIPELINE_ARCHITECTURE.md
   - Redundant with the more comprehensive DATA_PIPELINE_ARCHITECTURE.md

## Implementation Steps

1. Archive files marked for removal (move to an archive folder or delete if repository history is sufficient)
2. Update DATA_PIPELINE_ARCHITECTURE.md to reflect SQLite changes
3. Create a README.md in the data-systems folder to point to the main documentation files
4. Ensure any references to database documentation in other parts of the application point to DATABASE_SCHEMA_AND_ACCESS_PATTERNS.md 