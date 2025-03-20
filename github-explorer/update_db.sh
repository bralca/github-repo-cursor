#!/bin/bash
# Use relative path to workspace root
DB_PATH="../../github_explorer.db"

echo "Checking for database file at $DB_PATH"
if [ ! -f "$DB_PATH" ]; then
  echo "Database file not found at $DB_PATH"
  exit 1
fi

echo "Running update script against database at $DB_PATH"
# Add your database update commands here
# Example: sqlite3 $DB_PATH < update.sql

echo "Database update completed"

# Create SQL commands
sql_commands="
DROP TABLE IF EXISTS closed_merge_requests_raw;

CREATE TABLE closed_merge_requests_raw (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  is_processed INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_closed_mr_is_processed ON closed_merge_requests_raw(is_processed);

SELECT 'Table schema updated successfully.' as message;
"

# Execute SQL commands
echo "$sql_commands" | sqlite3 "$DB_PATH"

# Show tables in the database
echo "Tables in the database:"
echo ".tables" | sqlite3 "$DB_PATH"

# Show schema of the table
echo "Schema of closed_merge_requests_raw:"
echo ".schema closed_merge_requests_raw" | sqlite3 "$DB_PATH" 