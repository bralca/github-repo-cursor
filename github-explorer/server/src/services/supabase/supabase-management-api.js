/**
 * Supabase Management API Client
 * 
 * Provides access to Supabase Management API for administrative operations
 * such as schema management, function creation, and other operations
 * not supported by the standard Supabase client.
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { logger } from '../../utils/logger.js';

// Load environment variables
dotenv.config();

export class SupabaseManagementClient {
  /**
   * Create a new Supabase Management API client
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || process.env.SUPABASE_API_URL || 'https://api.supabase.io';
    this.serviceKey = options.serviceKey || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.projectId = options.projectId || process.env.SUPABASE_PROJECT_ID;
    this.accessToken = options.accessToken || process.env.SUPABASE_ACCESS_TOKEN;
    this.supabaseUrl = options.supabaseUrl || process.env.SUPABASE_URL;
    
    // Log environment variable values for debugging
    logger.debug('Management API Configuration', {
      apiUrl: this.apiUrl,
      hasServiceKey: !!this.serviceKey,
      projectId: this.projectId,
      hasAccessToken: !!this.accessToken
    });
    
    if (!this.accessToken) {
      logger.warn('No access token provided for Supabase Management API - falling back to service key');
    }
    
    if (!this.projectId) {
      logger.warn('No project ID provided for Supabase Management API');
    }
    
    // Track if we've created the SQL execution function
    this.execSqlFunctionCreated = false;
  }
  
  /**
   * Get the authorization header to use for API requests
   * @returns {Object} Headers object with authorization
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else if (this.serviceKey) {
      // Fallback to using service key (this might not work for all Management API endpoints)
      headers['apikey'] = this.serviceKey;
      headers['Authorization'] = `Bearer ${this.serviceKey}`;
    }
    
    return headers;
  }
  
  /**
   * Get headers for RPC requests
   * @returns {Object} Headers object
   */
  getRpcHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.serviceKey,
      'Authorization': `Bearer ${this.serviceKey}`,
      'Prefer': 'return=representation'
    };
  }
  
  /**
   * Create the SQL execution function in the database
   * This function is required for the RPC method to work
   * @returns {Promise<boolean>} Whether the function was created successfully
   */
  async createExecSqlFunction() {
    if (this.execSqlFunctionCreated) {
      return true;
    }

    try {
      logger.info('Creating exec_sql function in the database');
      
      // SQL to create the function
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql;
          RETURN json_build_object('success', true);
        EXCEPTION WHEN OTHERS THEN
          RETURN json_build_object('success', false, 'error', SQLERRM);
        END;
        $$;
      `;
      
      // Try to create the function using a direct SQL POST
      const response = await fetch(`${this.supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: this.getRpcHeaders(),
        body: JSON.stringify({
          query: createFunctionSql
        })
      });
      
      if (response.ok) {
        logger.info('Successfully created exec_sql function');
        this.execSqlFunctionCreated = true;
        return true;
      } else {
        const errorText = await response.text();
        logger.warn('Could not create exec_sql function via direct SQL', { error: errorText });
        
        // Try to execute the SQL directly using REST API
        const alternateResponse = await fetch(`${this.supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: this.getRpcHeaders(),
          body: JSON.stringify({ sql: createFunctionSql })
        });
        
        if (alternateResponse.ok) {
          logger.info('Successfully created exec_sql function via RPC');
          this.execSqlFunctionCreated = true;
          return true;
        } else {
          const altErrorText = await alternateResponse.text();
          logger.warn('Could not create exec_sql function via RPC', { error: altErrorText });
          return false;
        }
      }
    } catch (error) {
      logger.warn('Error creating exec_sql function', { error: error.message });
      return false;
    }
  }
  
  /**
   * Execute a SQL query using the RPC method
   * @param {string} sql - SQL query to execute
   * @returns {Promise<Object>} Query results
   */
  async executeSqlViaRPC(sql) {
    try {
      // First ensure the function exists
      await this.createExecSqlFunction();
      
      logger.info('Executing SQL via RPC', { sqlPreview: sql.substring(0, 100) });
      
      const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: this.getRpcHeaders(),
        body: JSON.stringify({ sql })
      });
      
      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        logger.error('SQL execution via RPC failed', { error: errorText });
        return { success: false, error: errorText };
      }
    } catch (error) {
      logger.error('Error executing SQL via RPC', { error: error.message });
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Execute a direct SQL query using the REST API
   * @param {string} sql - SQL query to execute
   * @returns {Promise<Object>} Query results
   */
  async executeSqlViaDirect(sql) {
    try {
      logger.info('Executing SQL via direct REST', { sqlPreview: sql.substring(0, 100) });
      
      const response = await fetch(`${this.supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: this.getRpcHeaders(),
        body: JSON.stringify({ query: sql })
      });
      
      if (response.ok) {
        const responseText = await response.text();
        try {
          // Try to parse as JSON if possible
          const result = JSON.parse(responseText);
          return { success: true, data: result };
        } catch (e) {
          // Return as text if not JSON
          return { success: true, data: responseText };
        }
      } else {
        const errorText = await response.text();
        logger.error('SQL execution via direct REST failed', { error: errorText });
        return { success: false, error: errorText };
      }
    } catch (error) {
      logger.error('Error executing SQL via direct REST', { error: error.message });
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Execute a SQL query using the Management API
   * @param {string} sql - SQL query to execute
   * @returns {Promise<Object>} Query result
   */
  async executeSql(sql) {
    try {
      logger.info('Attempting SQL execution through multiple methods');
      
      // First try direct SQL execution (most reliable method)
      const directResult = await this.executeSqlViaDirect(sql);
      if (directResult.success) {
        logger.info('SQL execution via direct REST successful');
        return directResult;
      }
      
      // If direct fails, try RPC
      logger.info('Direct SQL execution failed, trying RPC method');
      const rpcResult = await this.executeSqlViaRPC(sql);
      if (rpcResult.success) {
        logger.info('SQL execution via RPC successful');
        return rpcResult;
      }
      
      // If both methods fail, log an error and return the last error
      logger.error('All SQL execution methods failed');
      return { success: false, error: 'All SQL execution methods failed' };
    } catch (error) {
      logger.error('Error executing SQL', { error: error.message });
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get database schema information
   * @returns {Promise<Object>} Schema information
   */
  async getSchemaInfo() {
    try {
      if (!this.projectId) {
        throw new Error('Project ID is required for Management API');
      }
      
      try {
        // Try using Management API
        const response = await fetch(`${this.apiUrl}/v1/projects/${this.projectId}/database/schema`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Management API error: ${JSON.stringify(errorData)}`);
        }
        
        return await response.json();
      } catch (mgmtError) {
        logger.warn('Management API schema info failed, falling back to SQL-based method', { 
          error: mgmtError.message 
        });
        
        // Fallback to using SQL to get schema info
        const sql = `
          SELECT 
            table_name as name,
            table_schema as schema
          FROM 
            information_schema.tables 
          WHERE 
            table_schema = 'public'
        `;
        
        const result = await this.executeSqlViaRPC(sql);
        
        if (result && result.data) {
          return { tables: result.data };
        } else {
          throw new Error('Failed to retrieve schema information');
        }
      }
    } catch (error) {
      logger.error('Failed to get schema info', { error });
      throw error;
    }
  }
  
  /**
   * Check if a table exists
   * @param {string} tableName - Name of the table
   * @returns {Promise<boolean>} True if table exists
   */
  async tableExists(tableName) {
    try {
      logger.info(`Checking if table exists: ${tableName}`);
      
      const sql = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        ) as exists
      `;
      
      const result = await this.executeSql(sql);
      
      if (result.success && result.data) {
        // Handle different response formats
        if (typeof result.data === 'string') {
          logger.info(`Table exists check result (string): ${result.data}`);
          return result.data.includes('true');
        } else if (Array.isArray(result.data)) {
          logger.info(`Table exists check result (array): ${JSON.stringify(result.data)}`);
          return result.data.some(row => row.exists);
        } else if (result.data.exists !== undefined) {
          logger.info(`Table exists check result (object): ${JSON.stringify(result.data)}`);
          return result.data.exists;
        }
      }
      
      logger.warn(`Table existence check failed: ${tableName}`);
      return false;
    } catch (error) {
      logger.error('Error checking if table exists', { error: error.message });
      return false;
    }
  }
  
  /**
   * Get column information for a table
   * @param {string} tableName - Name of the table
   * @returns {Promise<Array<Object>>} Column information
   */
  async getTableColumns(tableName) {
    try {
      try {
        // Try using Management API
        const schemaInfo = await this.getSchemaInfo();
        
        // Look for the table in the schema
        const tables = schemaInfo.tables || [];
        const table = tables.find(table => table.name === tableName);
        
        if (!table) {
          return [];
        }
        
        return table.columns || [];
      } catch (schemaError) {
        logger.warn('Schema info method failed, falling back to direct SQL check', { 
          error: schemaError.message 
        });
        
        // Fallback to direct SQL check
        const sql = `
          SELECT 
            column_name, 
            data_type,
            is_nullable,
            column_default
          FROM 
            information_schema.columns 
          WHERE 
            table_schema = 'public' 
            AND table_name = '${tableName}'
        `;
        
        const result = await this.executeSqlViaRPC(sql);
        
        if (result && result.data) {
          return result.data;
        }
        
        return [];
      }
    } catch (error) {
      logger.error(`Failed to get columns for table ${tableName}`, { error });
      return [];
    }
  }
  
  /**
   * Create a database function
   * @param {string} functionName - Name of the function
   * @param {string} functionBody - SQL body of the function
   * @returns {Promise<Object>} Creation result
   */
  async createFunction(functionName, functionBody) {
    try {
      const sql = `
        CREATE OR REPLACE FUNCTION ${functionName}
        ${functionBody}
      `;
      
      return await this.executeSql(sql);
    } catch (error) {
      logger.error(`Failed to create function ${functionName}`, { error });
      throw error;
    }
  }
  
  /**
   * Run a migration script
   * @param {string} migrationSql - SQL migration script
   * @returns {Promise<Object>} Migration result
   */
  async runMigration(migrationSql) {
    try {
      return await this.executeSql(migrationSql);
    } catch (error) {
      logger.error('Failed to run migration', { error });
      throw error;
    }
  }
}

// Create singleton instance
export const managementClient = new SupabaseManagementClient(); 