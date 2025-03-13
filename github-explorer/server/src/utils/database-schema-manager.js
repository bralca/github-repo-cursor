/**
 * Database Schema Manager
 * 
 * A utility for managing database schema operations using the Supabase Management API
 * with proper authentication via Personal Access Token (PAT).
 * 
 * This utility provides a standardized way to:
 * 1. Execute schema migration SQL
 * 2. Add/remove/alter tables and columns
 * 3. Manage constraints and indexes
 * 4. Track migration history
 * 
 * IMPORTANT: This utility requires a Supabase Personal Access Token (PAT) with appropriate permissions.
 */

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { logger } from './logger.js';

class DatabaseSchemaManager {
  constructor(config) {
    // Required configuration
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseKey = config.supabaseKey; // Service role key for regular operations
    this.personalAccessToken = config.personalAccessToken; // PAT for management API
    this.projectId = config.projectId;
    
    // Extract API URL from Supabase URL
    this.apiUrl = this.supabaseUrl.replace('.supabase.co', '');
    this.managementApiUrl = 'https://api.supabase.com';
    
    // Initialize Supabase client for regular operations
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    // Track initialization state
    this.initialized = false;
  }
  
  /**
   * Initialize the Schema Manager
   * Validates connection and permissions
   */
  async initialize() {
    try {
      // Verify PAT by making a simple API call
      await this.verifyPersonalAccessToken();
      
      // Verify database connection
      const { data, error } = await this.supabase.from('schema_migrations').select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        logger.warn('Could not verify schema_migrations table exists', { error: error.message });
        // Create migrations table if it doesn't exist
        await this.createMigrationsTable();
      }
      
      this.initialized = true;
      logger.info('Database Schema Manager initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Database Schema Manager', { error: error.message });
      throw new Error(`Failed to initialize Database Schema Manager: ${error.message}`);
    }
  }
  
  /**
   * Verify that the Personal Access Token is valid and has appropriate permissions
   */
  async verifyPersonalAccessToken() {
    if (!this.personalAccessToken) {
      throw new Error('Personal Access Token (PAT) is required for schema operations');
    }
    
    try {
      const response = await axios.get(`${this.managementApiUrl}/v1/projects`, {
        headers: {
          'Authorization': `Bearer ${this.personalAccessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Invalid PAT response status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to verify Personal Access Token', { 
        error: error.response ? error.response.data : error.message 
      });
      throw new Error('Personal Access Token verification failed. Check if the token is valid and has appropriate permissions.');
    }
  }
  
  /**
   * Create the schema_migrations table if it doesn't exist
   */
  async createMigrationsTable() {
    const sql = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        migration_name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        checksum TEXT,
        execution_time INTEGER,
        success BOOLEAN NOT NULL DEFAULT TRUE
      );
    `;
    
    return this.executeSQL(sql);
  }
  
  /**
   * Execute SQL using the Management API with PAT authentication
   */
  async executeSQL(sql) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.projectId) {
      throw new Error('Project ID is required for Management API operations');
    }
    
    try {
      // Execute SQL using the Management API
      const response = await axios.post(
        `${this.managementApiUrl}/v1/projects/${this.projectId}/sql`,
        { query: sql },
        {
          headers: {
            'Authorization': `Bearer ${this.personalAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      logger.info('SQL executed successfully via Management API');
      return response.data;
    } catch (error) {
      logger.error('Failed to execute SQL via Management API', { 
        error: error.response ? error.response.data : error.message,
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : '')
      });
      
      // Try using REST endpoint as fallback if appropriate
      return this.executeViaRESTFallback(sql);
    }
  }
  
  /**
   * Fallback method to execute SQL via REST API
   * This is a fallback in case the Management API fails
   */
  async executeViaRESTFallback(sql) {
    try {
      logger.info('Attempting SQL execution via REST fallback');
      const { data, error } = await this.supabase.rpc('exec_sql', { sql });
      
      if (error) {
        // If exec_sql function doesn't exist, try to create it first
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          logger.info('exec_sql function not found, attempting to create it');
          await this.createExecSQLFunction();
          
          // Try again with the newly created function
          const retryResult = await this.supabase.rpc('exec_sql', { sql });
          if (retryResult.error) {
            throw new Error(`Failed to execute SQL after creating exec_sql function: ${retryResult.error.message}`);
          }
          return retryResult.data;
        }
        
        throw new Error(`Failed to execute SQL via REST: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      logger.error('Failed to execute SQL via REST fallback', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Create the exec_sql function if it doesn't exist
   */
  async createExecSQLFunction() {
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text) 
      RETURNS void AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // We need to use direct SQL here as the function doesn't exist yet
    try {
      const response = await axios.post(
        `${this.managementApiUrl}/v1/projects/${this.projectId}/sql`,
        { query: createFunctionSQL },
        {
          headers: {
            'Authorization': `Bearer ${this.personalAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      logger.info('exec_sql function created successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to create exec_sql function', { 
        error: error.response ? error.response.data : error.message 
      });
      throw new Error(`Failed to create exec_sql function: ${error.message}`);
    }
  }
  
  /**
   * Check if a table exists in the database
   */
  async tableExists(tableName) {
    try {
      const { data, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .limit(1);
      
      if (error) {
        logger.error('Error checking if table exists', { error: error.message });
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      logger.error('Failed to check if table exists', { error: error.message });
      return false;
    }
  }
  
  /**
   * Check if a column exists in a table
   */
  async columnExists(tableName, columnName) {
    try {
      const { data, error } = await this.supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .eq('column_name', columnName)
        .limit(1);
      
      if (error) {
        logger.error('Error checking if column exists', { error: error.message });
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      logger.error('Failed to check if column exists', { error: error.message });
      return false;
    }
  }
  
  /**
   * Check if a migration has been executed
   */
  async migrationExists(migrationName) {
    try {
      const { data, error } = await this.supabase
        .from('schema_migrations')
        .select('id')
        .eq('migration_name', migrationName)
        .limit(1);
      
      if (error) {
        logger.error('Error checking if migration exists', { error: error.message });
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      logger.error('Failed to check if migration exists', { error: error.message });
      return false;
    }
  }
  
  /**
   * Record a migration execution in the schema_migrations table
   */
  async recordMigration({ migrationName, checksum, executionTime, success = true }) {
    try {
      const { data, error } = await this.supabase
        .from('schema_migrations')
        .upsert([
          {
            migration_name: migrationName,
            checksum,
            execution_time: executionTime,
            success,
            executed_at: new Date().toISOString()
          }
        ], {
          onConflict: 'migration_name'
        });
      
      if (error) {
        logger.error('Error recording migration', { error: error.message });
        throw error;
      }
      
      logger.info(`Migration ${migrationName} recorded successfully`);
      return data;
    } catch (error) {
      logger.error('Failed to record migration', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Add a column to a table if it doesn't exist
   */
  async addColumnIfNotExists(tableName, columnName, columnDefinition) {
    const columnExists = await this.columnExists(tableName, columnName);
    
    if (columnExists) {
      logger.info(`Column ${columnName} already exists in table ${tableName}`);
      return true;
    }
    
    const sql = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnDefinition};`;
    
    try {
      await this.executeSQL(sql);
      logger.info(`Column ${columnName} added to table ${tableName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to add column ${columnName} to table ${tableName}`, { error: error.message });
      throw error;
    }
  }
  
  /**
   * Create a table if it doesn't exist
   */
  async createTableIfNotExists(tableName, tableDefinition) {
    const tableExists = await this.tableExists(tableName);
    
    if (tableExists) {
      logger.info(`Table ${tableName} already exists`);
      return true;
    }
    
    // Extract just the CREATE TABLE statement from the definition
    let sql = tableDefinition;
    if (!sql.trim().toUpperCase().startsWith('CREATE TABLE')) {
      sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${tableDefinition});`;
    }
    
    try {
      await this.executeSQL(sql);
      logger.info(`Table ${tableName} created successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to create table ${tableName}`, { error: error.message });
      throw error;
    }
  }
  
  /**
   * Run a migration file and record its execution
   */
  async runMigration(migrationName, migrationSQL) {
    // Check if migration has already been executed
    const migrationExists = await this.migrationExists(migrationName);
    
    if (migrationExists) {
      logger.info(`Migration ${migrationName} has already been executed`);
      return true;
    }
    
    // Execute the migration
    const startTime = Date.now();
    try {
      await this.executeSQL(migrationSQL);
      const executionTime = Date.now() - startTime;
      
      // Record the migration
      await this.recordMigration({
        migrationName,
        checksum: 'calculated-checksum', // Implement proper checksum calculation if needed
        executionTime,
        success: true
      });
      
      logger.info(`Migration ${migrationName} executed successfully in ${executionTime}ms`);
      return true;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Record the failed migration
      await this.recordMigration({
        migrationName,
        checksum: 'calculated-checksum',
        executionTime,
        success: false
      });
      
      logger.error(`Migration ${migrationName} failed`, { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get a list of all executed migrations
   */
  async getExecutedMigrations() {
    try {
      const { data, error } = await this.supabase
        .from('schema_migrations')
        .select('*')
        .order('executed_at', { ascending: false });
      
      if (error) {
        logger.error('Error fetching executed migrations', { error: error.message });
        throw error;
      }
      
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch executed migrations', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Refresh the database schema cache
   * This is crucial after schema changes to ensure clients see the updated schema
   */
  async refreshSchemaCache() {
    if (!this.projectId) {
      throw new Error('Project ID is required to refresh schema cache');
    }
    
    try {
      const response = await axios.post(
        `${this.managementApiUrl}/v1/projects/${this.projectId}/database/refresh-schema-cache`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.personalAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      logger.info('Schema cache refreshed successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to refresh schema cache', { 
        error: error.response ? error.response.data : error.message 
      });
      throw new Error(`Failed to refresh schema cache: ${error.message}`);
    }
  }
}

export { DatabaseSchemaManager }; 