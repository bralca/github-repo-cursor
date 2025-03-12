/**
 * Database Checker Utility
 * 
 * Provides utilities for checking database state and structure.
 */

import { supabaseClientFactory } from '../services/supabase/supabase-client.js';
import { logger } from './logger.js';

/**
 * Check if a table exists in the database
 * @param {string} tableName - Name of the table to check
 * @returns {Promise<boolean>} True if table exists, false otherwise
 */
export async function tableExists(tableName) {
  try {
    const supabase = supabaseClientFactory.getClient();
    
    // If using a mock client for testing, return false
    if (supabase.isMock) {
      return false;
    }
    
    // Check if table exists by querying it
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    // If no error, table exists
    if (!error) {
      return true;
    }
    
    // Check if error is due to table not existing
    if (error.message && error.message.includes('does not exist')) {
      return false;
    }
    
    // Other error - log and assume table might exist
    logger.warn(`Error checking if table ${tableName} exists: ${error.message}`);
    return false;
  } catch (error) {
    logger.error(`Failed to check if table ${tableName} exists`, { error });
    return false;
  }
}

/**
 * Get tables that are missing from a list of required tables
 * @param {string[]} requiredTables - List of tables that should exist
 * @returns {Promise<string[]>} List of tables that don't exist
 */
export async function getMissingTables(requiredTables) {
  try {
    const missingTables = [];
    
    for (const table of requiredTables) {
      const exists = await tableExists(table);
      if (!exists) {
        missingTables.push(table);
      }
    }
    
    return missingTables;
  } catch (error) {
    logger.error('Failed to check for missing tables', { error });
    return requiredTables; // Assume all are missing
  }
}

/**
 * Check if all required tables exist
 * @param {string[]} requiredTables - List of tables that should exist
 * @returns {Promise<boolean>} True if all tables exist, false otherwise
 */
export async function allTablesExist(requiredTables) {
  try {
    const missingTables = await getMissingTables(requiredTables);
    return missingTables.length === 0;
  } catch (error) {
    logger.error('Failed to check if all tables exist', { error });
    return false;
  }
}

/**
 * Create a fallback table if it doesn't exist
 * @param {string} tableName - Name of the table to create
 * @param {string} createTableSql - SQL to create the table
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function createFallbackTable(tableName, createTableSql) {
  try {
    // Check if table exists
    const exists = await tableExists(tableName);
    
    if (exists) {
      logger.info(`Table ${tableName} already exists`);
      return true;
    }
    
    logger.info(`Creating fallback table ${tableName}`);
    
    const supabase = supabaseClientFactory.getClient();
    
    // Try to execute the SQL directly
    try {
      // Try using the exec_sql function
      const { error } = await supabase.rpc('exec_sql', { sql: createTableSql });
      
      if (error) {
        throw new Error(error.message);
      }
      
      logger.info(`Successfully created table ${tableName}`);
      return true;
    } catch (error) {
      // If that fails, try using the PostgreSQL extension if available
      try {
        const { error: pgError } = await supabase.rpc('pg_execute', { query: createTableSql });
        
        if (pgError) {
          throw new Error(pgError.message);
        }
        
        logger.info(`Successfully created table ${tableName} using pg_execute`);
        return true;
      } catch (pgError) {
        logger.error(`Failed to create table ${tableName}`, { error: pgError });
        return false;
      }
    }
  } catch (error) {
    logger.error(`Failed to create fallback table ${tableName}`, { error });
    return false;
  }
}

/**
 * Get the schema for a fallback table
 * @param {string} tableName - Name of the table
 * @returns {string} SQL schema for the table
 */
export function getFallbackTableSchema(tableName) {
  // Return simplified schemas for common tables
  switch (tableName) {
    case 'pipeline_schedules':
      return `
        CREATE TABLE IF NOT EXISTS pipeline_schedules (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          pipeline_type TEXT NOT NULL,
          schedule_name TEXT NOT NULL,
          cron_expression TEXT NOT NULL,
          configuration_id UUID,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          last_run_at TIMESTAMPTZ,
          next_run_at TIMESTAMPTZ,
          last_result JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          time_zone TEXT NOT NULL DEFAULT 'UTC'
        );
      `;
    
    case 'pipeline_configurations':
      return `
        CREATE TABLE IF NOT EXISTS pipeline_configurations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          pipeline_type TEXT NOT NULL,
          configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
      
    case 'notification_settings':
      return `
        CREATE TABLE IF NOT EXISTS notification_settings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          level TEXT NOT NULL,
          email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          webhook_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `;
      
    default:
      return '';
  }
} 