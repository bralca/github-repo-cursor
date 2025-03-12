-- Migration to create a table for tracking executed migrations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table for tracking executed migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  migration_name TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum TEXT,
  execution_time INTEGER,
  success BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create index on migration_name
CREATE INDEX IF NOT EXISTS schema_migrations_name_idx ON schema_migrations (migration_name);

-- Create function to log a migration execution
CREATE OR REPLACE FUNCTION log_migration_execution(
  p_migration_name TEXT,
  p_checksum TEXT DEFAULT NULL,
  p_execution_time INTEGER DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO schema_migrations (
    migration_name,
    checksum,
    execution_time,
    success
  ) VALUES (
    p_migration_name,
    p_checksum,
    p_execution_time,
    p_success
  )
  ON CONFLICT (migration_name) 
  DO UPDATE SET
    executed_at = NOW(),
    checksum = p_checksum,
    execution_time = p_execution_time,
    success = p_success
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$; 