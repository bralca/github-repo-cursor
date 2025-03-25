/**
 * Database Checker Utility
 * 
 * Provides utilities for checking database state and structure.
 */

import { logger } from './logger.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path is relative to the server directory
const DEFAULT_DB_PATH = path.join(dirname(__dirname), 'db', 'github_explorer.db');

// Get database path from environment or use default
const DB_PATH = process.env.SQLITE_DB_PATH || DEFAULT_DB_PATH;

/**
 * Get a database connection
 * @returns {Promise<Object>} SQLite database connection
 */
async function getDbConnection() {
  try {
    return await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
  } catch (error) {
    logger.error('Failed to open SQLite database', { error, path: DB_PATH });
    throw error;
  }
}

/**
 * Check if a table exists in the database
 * @param {string} tableName - Name of the table to check
 * @returns {Promise<boolean>} True if table exists, false otherwise
 */
export async function tableExists(tableName) {
  try {
    const db = await getDbConnection();
    
    // Check if table exists by querying the sqlite_master table
    const result = await db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName]
    );
    
    await db.close();
    
    // If result exists, table exists
    return !!result;
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
    
    const db = await getDbConnection();
    
    // Execute the SQL to create the table
    await db.exec(createTableSql);
    await db.close();
    
    logger.info(`Successfully created table ${tableName}`);
    return true;
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
  // Return simplified schemas for common tables as SQLite compatible schemas
  switch (tableName) {
    case 'pipeline_schedules':
      return `
        CREATE TABLE IF NOT EXISTS pipeline_schedules (
          id TEXT PRIMARY KEY,
          pipeline_type TEXT NOT NULL,
          schedule_name TEXT NOT NULL,
          cron_expression TEXT NOT NULL,
          configuration_id TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          last_run_at TEXT,
          next_run_at TEXT,
          last_result TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          time_zone TEXT NOT NULL DEFAULT 'UTC'
        );
      `;
    
    case 'pipeline_configurations':
      return `
        CREATE TABLE IF NOT EXISTS pipeline_configurations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          pipeline_type TEXT NOT NULL,
          configuration TEXT NOT NULL DEFAULT '{}',
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
    case 'notification_settings':
      return `
        CREATE TABLE IF NOT EXISTS notification_settings (
          id TEXT PRIMARY KEY,
          level TEXT NOT NULL,
          email_enabled INTEGER NOT NULL DEFAULT 0,
          webhook_enabled INTEGER NOT NULL DEFAULT 0,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
    default:
      return '';
  }
} 