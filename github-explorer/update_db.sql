-- Drop the table if it exists
DROP TABLE IF EXISTS closed_merge_requests_raw;

-- Create the table with the simplified schema
CREATE TABLE closed_merge_requests_raw (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  is_processed INTEGER NOT NULL DEFAULT 0
);

-- Create an index on is_processed for faster queries
CREATE INDEX IF NOT EXISTS idx_closed_mr_is_processed ON closed_merge_requests_raw(is_processed);

-- Verify the schema
.schema closed_merge_requests_raw

-- Add is_processed column if it doesn't exist
PRAGMA foreign_keys=off;
BEGIN TRANSACTION;

-- Check if column exists before adding
SELECT CASE 
  WHEN COUNT(*) = 0 THEN
    -- Column doesn't exist, add it
    (SELECT 'ALTER TABLE closed_merge_requests_raw ADD COLUMN is_processed INTEGER NOT NULL DEFAULT 0')
  ELSE
    -- Column exists, do nothing
    (SELECT 'SELECT 1')
END as sql_to_execute
FROM pragma_table_info('closed_merge_requests_raw') 
WHERE name = 'is_processed'
LIMIT 1;

-- Drop tables that should not exist
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS raw_data;

COMMIT;
PRAGMA foreign_keys=on; 