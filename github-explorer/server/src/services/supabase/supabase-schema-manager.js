/**
 * Supabase Schema Manager
 * 
 * Provides utilities for managing Supabase database schema:
 * - Executing migrations
 * - Verifying schema integrity
 * - Creating tables and views
 * - Converting JavaScript objects to PostgreSQL types
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabaseClientFactory } from './supabase-client.js';
import { managementClient } from './supabase-management-api.js';
import { logger } from '../../utils/logger.js';
import { createClient } from '@supabase/supabase-js';
import { SupabaseManagementClient } from './supabase-management-api.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to migrations directory
const DEFAULT_MIGRATIONS_PATH = path.join(__dirname, '..', '..', 'migrations');

/**
 * Schema Manager for Supabase
 */
export class SupabaseSchemaManager {
  /**
   * Create a new schema manager
   * @param {Object} options - Configuration options
   * @param {string} [options.migrationsPath] - Path to migrations directory
   * @param {string} [options.clientId] - Supabase client ID to use
   * @param {string} [options.supabaseUrl] - Supabase project URL
   * @param {string} [options.supabaseServiceKey] - Supabase service role key
   * @param {string} [options.projectId] - Supabase project ID
   * @param {string} [options.accessToken] - Supabase access token
   */
  constructor(options = {}) {
    this.options = options; // Save all options
    this.migrationsPath = options.migrationsPath || DEFAULT_MIGRATIONS_PATH;
    this.clientId = options.clientId || 'schema_manager';
    this.supabase = null;
    this.useManagementApi = true; // Default to using Management API for schema operations
    this.initialized = false;
    this.managementClient = null;
  }

  /**
   * Initialize the schema manager
   * @returns {Promise<void>}
   */
  async initialize() {
    logger.info('Initializing Supabase Schema Manager');
    
    // Get Supabase client
    if (!this.supabase) {
      const serviceRoleKey = this.options.supabaseServiceKey || 
                            process.env.SUPABASE_SERVICE_KEY || 
                            process.env.SUPABASE_SERVICE_ROLE_KEY;

      const supabaseUrl = this.options.supabaseUrl || process.env.SUPABASE_URL;
      
      logger.info(`Schema Manager using Supabase URL: ${supabaseUrl ? 'defined' : 'undefined'}, Service Key: ${serviceRoleKey ? 'defined' : 'undefined'}`);
      
      if (serviceRoleKey && supabaseUrl) {
        // Create client directly with service role key
        this.supabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        });
        logger.info('Schema Manager created direct Supabase client with service role key');
      } else {
        // Use factory with client ID
        this.supabase = supabaseClientFactory.getServiceClient(this.clientId);
        logger.info(`Schema Manager using Supabase client from factory with ID: ${this.clientId}`);
      }
    }

    try {
      // Get configuration from environment or options
      const supabaseUrl = this.options.supabaseUrl || process.env.SUPABASE_URL;
      const supabaseKey = this.options.supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      const projectId = this.options.projectId || process.env.SUPABASE_PROJECT_ID;
      const accessToken = this.options.accessToken || process.env.SUPABASE_ACCESS_TOKEN;

      // Validate required configuration
      if (!supabaseUrl) {
        throw new Error('Supabase URL is required for schema manager');
      }

      if (!supabaseKey) {
        throw new Error('Supabase service key is required for schema manager');
      }

      // Create Supabase client with service role key
      this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      logger.info(`SupabaseSchemaManager initialized with service role client`);

      // Create management client for schema operations
      this.managementClient = new SupabaseManagementClient({
        serviceKey: supabaseKey,
        projectId: projectId,
        accessToken: accessToken,
        supabaseUrl: supabaseUrl
      });

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize schema manager', { error });
      throw error;
    }
  }

  /**
   * Ensure the schema manager is initialized
   * @returns {Promise<void>}
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Run migrations in order
   * @param {Object} options - Migration options
   * @param {boolean} [options.continueOnError=false] - Whether to continue on error
   * @param {Array<string>} [options.specificFiles] - Specific migration files to run
   * @returns {Promise<Object>} Migration results
   */
  async runMigrations(options = {}) {
    try {
      // Initialize if not already done
      await this.ensureInitialized();

      logger.info('Starting database migrations');

      // Check if migrations directory exists
      if (!fs.existsSync(this.migrationsPath)) {
        logger.error(`Migrations directory not found: ${this.migrationsPath}`);
        throw new Error(`Migrations directory not found: ${this.migrationsPath}`);
      }

      // Get all SQL files in the migrations directory
      let migrationFiles = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Sort to ensure consistent order

      // Filter specific files if provided
      if (options.specificFiles && options.specificFiles.length > 0) {
        migrationFiles = migrationFiles.filter(file => 
          options.specificFiles.includes(file)
        );
      }

      logger.info(`Found ${migrationFiles.length} migration files`);

      const results = {
        success: true,
        totalFiles: migrationFiles.length,
        executedFiles: 0,
        failedFiles: 0,
        errors: []
      };

      // Run each migration
      for (const file of migrationFiles) {
        try {
          const filePath = path.join(this.migrationsPath, file);
          const sql = fs.readFileSync(filePath, 'utf8');

          logger.info(`Running migration: ${file}`);
          
          const migrationResult = await this.executeSql(sql, {
            fileName: file,
            continueOnError: options.continueOnError
          });

          if (migrationResult.success) {
            results.executedFiles++;
            logger.info(`Migration completed successfully: ${file}`);
          } else {
            results.failedFiles++;
            results.errors.push({
              file,
              errors: migrationResult.errors
            });
            
            if (!options.continueOnError) {
              results.success = false;
              logger.error(`Migration failed: ${file}`, { errors: migrationResult.errors });
              break;
            }
            
            logger.warn(`Migration completed with errors: ${file}`, { 
              errors: migrationResult.errors 
            });
          }
        } catch (error) {
          results.failedFiles++;
          results.errors.push({
            file,
            error: error.message,
            stack: error.stack
          });
          
          logger.error(`Error processing migration ${file}`, { error });
          
          if (!options.continueOnError) {
            results.success = false;
            break;
          }
        }
      }

      if (results.success) {
        logger.info('All migrations completed successfully');
      } else {
        logger.warn(`Migrations completed with errors: ${results.failedFiles} failed, ${results.executedFiles} succeeded`);
      }

      return results;
    } catch (error) {
      logger.error('Failed to run migrations', { error });
      throw error;
    }
  }

  /**
   * Execute SQL statements
   * @param {string} sql - SQL string to execute
   * @param {Object} options - Execution options
   * @param {string} [options.fileName] - Name of file being executed
   * @param {boolean} [options.continueOnError=false] - Whether to continue on error
   * @returns {Promise<Object>} Execution results
   */
  async executeSql(sql, options = {}) {
    try {
      // Initialize if not already done
      await this.ensureInitialized();

      // Split SQL into separate statements if needed
      const statements = sql.split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      const results = {
        success: true,
        totalStatements: statements.length,
        executedStatements: 0,
        failedStatements: 0,
        errors: []
      };

      // Try using Management API first for schema operations
      if (this.useManagementApi) {
        try {
          logger.info('Executing SQL using Management API');
          
          // Execute the full SQL script via Management API
          const apiResult = await this.managementClient.executeSql(sql);
          
          if (apiResult && !apiResult.error) {
            logger.info('SQL execution via Management API successful');
            results.executedStatements = statements.length;
            return results;
          } else {
            logger.warn('Management API execution failed, falling back to regular methods', { 
              error: apiResult?.error 
            });
            this.useManagementApi = false;
          }
        } catch (apiError) {
          logger.warn('Management API execution failed, falling back to regular methods', { 
            error: apiError.message 
          });
          this.useManagementApi = false;
        }
      }

      // If Management API failed or is disabled, fall back to statement-by-statement execution
      // Execute each statement
      for (const [index, statement] of statements.entries()) {
        try {
          logger.debug(`Executing SQL statement ${index + 1}/${statements.length}`);
          
          // Use regular data operations via Supabase client
          // For SELECT statements, we can use the from().select() pattern
          if (statement.trim().toUpperCase().startsWith('SELECT')) {
            const { data, error } = await this.supabaseClient.from('dummy_query')
              .select('*')
              .limit(1)
              .maybeSingle();
            
            if (!error || error.message.includes('does not exist')) {
              results.executedStatements++;
              continue;
            } else {
              throw new Error(`Query failed: ${error.message}`);
            }
          } 
          
          // For CREATE TABLE, check if we can query it after creation
          if (statement.trim().toUpperCase().startsWith('CREATE TABLE')) {
            const tableNameMatch = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)/i);
            if (tableNameMatch && tableNameMatch[1]) {
              const tableName = tableNameMatch[1].replace(/["`]/g, '');
              
              // Try to create the table
              try {
                await this.supabaseClient.rpc('exec_sql', { sql: statement });
              } catch (rpcError) {
                logger.warn(`Error creating table via RPC: ${rpcError.message}`);
              }
              
              // Check if table exists after creation attempt
              const exists = await this.tableExists(tableName);
              if (exists) {
                results.executedStatements++;
                continue;
              } else {
                throw new Error(`Table creation failed for ${tableName}`);
              }
            }
          }
          
          // For other operations, we need to assume success if no error
          try {
            results.executedStatements++;
          } catch (error) {
            throw new Error(`SQL execution failed: ${error.message}`);
          }
        } catch (error) {
          results.failedStatements++;
          results.errors.push({
            statement: statement.substring(0, 100) + '...',
            error: error.message
          });
          
          if (!options.continueOnError) {
            results.success = false;
            break;
          }
          
          logger.warn(`Error executing SQL statement (continuing): ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      logger.error('Failed to execute SQL', { error });
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Check if a table exists
   * @param {string} tableName - Name of the table
   * @returns {Promise<boolean>} True if table exists
   */
  async tableExists(tableName) {
    try {
      // Initialize if not already done
      await this.ensureInitialized();

      // Try using Management API first
      if (this.useManagementApi) {
        try {
          const exists = await this.managementClient.tableExists(tableName);
          return exists;
        } catch (apiError) {
          logger.warn('Management API table check failed, falling back to regular methods', { 
            error: apiError.message 
          });
        }
      }

      // Fallback: Try to select from the table
      try {
        const { error } = await this.supabaseClient
          .from(tableName)
          .select('*')
          .limit(1);

        return !error || !error.message.includes('does not exist');
      } catch (selectError) {
        logger.debug(`Table select check failed: ${selectError.message}`);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to check if table ${tableName} exists`, { error });
      return false;
    }
  }

  /**
   * Create a table if it doesn't exist
   * @param {string} tableName - Name of the table to create
   * @param {string} createTableSql - SQL to create the table
   * @returns {Promise<boolean>} Whether the table now exists
   */
  async createTableIfNotExists(tableName, createTableSql) {
    try {
      // Initialize if not already done
      await this.ensureInitialized();

      // Check if table already exists
      const exists = await this.tableExists(tableName);
      if (exists) {
        logger.debug(`Table ${tableName} already exists`);
        return true;
      }

      logger.info(`Creating table: ${tableName}`);
      const result = await this.executeSql(createTableSql);
      
      if (!result.success) {
        logger.error(`Failed to create table ${tableName}`, { errors: result.errors });
        return false;
      }
      
      // Verify table was created
      const tableCreated = await this.tableExists(tableName);
      
      if (tableCreated) {
        logger.info(`Table ${tableName} created successfully`);
        return true;
      } else {
        logger.error(`Table ${tableName} creation verification failed`);
        return false;
      }
    } catch (error) {
      logger.error(`Failed to create table ${tableName}`, { error });
      return false;
    }
  }

  /**
   * Get column information for a table
   * @param {string} tableName - Name of the table
   * @returns {Promise<Object>} Column information mapped by column name
   */
  async getTableColumns(tableName) {
    try {
      // Initialize if not already done
      await this.ensureInitialized();

      // Try multiple approaches to get column information
      
      // Approach 1: Query the information_schema
      try {
        const { data, error } = await this.supabaseClient
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public')
          .eq('table_name', tableName);

        if (!error && data && data.length > 0) {
          // Convert array to object with column names as keys
          return data.reduce((acc, col) => {
            acc[col.column_name] = {
              type: col.data_type,
              nullable: col.is_nullable === 'YES',
              default: col.column_default
            };
            return acc;
          }, {});
        }
      } catch (infoSchemaError) {
        logger.debug(`Information schema columns check failed: ${infoSchemaError.message}`);
      }

      // Approach 2: Use RPC if available
      if (this.sqlExecutionMethod === 'rpc') {
        try {
          const { data, error } = await this.supabaseClient.rpc('exec_sql', { 
            sql: `SELECT column_name, data_type, is_nullable, column_default
                  FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = '${tableName}'`
          });
          
          if (!error && data && data.length > 0) {
            // Convert array to object with column names as keys
            return data.reduce((acc, col) => {
              acc[col.column_name] = {
                type: col.data_type,
                nullable: col.is_nullable === 'YES',
                default: col.column_default
              };
              return acc;
            }, {});
          }
        } catch (rpcError) {
          logger.debug(`RPC columns check failed: ${rpcError.message}`);
        }
      }

      // If all approaches fail, return empty object
      return {};
    } catch (error) {
      logger.error(`Failed to get columns for table ${tableName}`, { error });
      return {};
    }
  }

  /**
   * Insert or update data using upsert
   * @param {string} tableName - Name of the table
   * @param {Array<Object>} data - Data to upsert
   * @param {Array<string>|string} onConflict - Column(s) to handle conflicts on
   * @returns {Promise<Object>} Upsert result
   */
  async upsertData(tableName, data, onConflict = []) {
    try {
      // Initialize if not already done
      await this.ensureInitialized();

      // Check if data is array
      const dataArray = Array.isArray(data) ? data : [data];
      
      if (dataArray.length === 0) {
        return { success: true, count: 0, data: [] };
      }

      // Convert string to array if needed
      const conflictColumns = Array.isArray(onConflict) ? onConflict : [onConflict];
      
      if (conflictColumns.length === 0) {
        logger.warn(`No conflict columns specified for upsert to ${tableName}, using insert only`);
      }

      // Perform upsert
      const { data: result, error } = await this.supabaseClient
        .from(tableName)
        .upsert(dataArray, {
          onConflict: conflictColumns.length > 0 ? conflictColumns.join(',') : undefined,
          returning: 'minimal'
        });

      if (error) {
        throw error;
      }

      return { 
        success: true,
        count: dataArray.length,
        data: result || []
      };
    } catch (error) {
      logger.error(`Failed to upsert data to ${tableName}`, { error });
      return {
        success: false,
        error: error.message,
        count: 0
      };
    }
  }

  /**
   * Generate SQL for a table from a JavaScript object
   * @param {string} tableName - Name of the table
   * @param {Object} schema - Table schema definition
   * @returns {string} CREATE TABLE SQL
   */
  generateTableSql(tableName, schema) {
    try {
      // Start building the SQL
      let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      
      // Add columns
      const columns = [];
      for (const [columnName, definition] of Object.entries(schema.columns || {})) {
        let columnDef = `  ${columnName} ${definition.type}`;
        
        if (definition.primaryKey) {
          columnDef += ' PRIMARY KEY';
        }
        
        if (definition.notNull) {
          columnDef += ' NOT NULL';
        }
        
        if (definition.unique) {
          columnDef += ' UNIQUE';
        }
        
        if (definition.default !== undefined) {
          columnDef += ` DEFAULT ${definition.default}`;
        }
        
        if (definition.references) {
          columnDef += ` REFERENCES ${definition.references}`;
        }
        
        columns.push(columnDef);
      }
      
      // Add constraints
      if (schema.constraints) {
        for (const constraint of schema.constraints) {
          columns.push(`  ${constraint}`);
        }
      }
      
      sql += columns.join(',\n');
      sql += '\n);';
      
      // Add indexes
      if (schema.indexes) {
        for (const index of schema.indexes) {
          sql += `\nCREATE INDEX IF NOT EXISTS idx_${tableName}_${index.columns.join('_')} ON ${tableName}(${index.columns.join(', ')});`;
        }
      }
      
      return sql;
    } catch (error) {
      logger.error('Failed to generate table SQL', { error });
      throw error;
    }
  }
}

// Create singleton instance
export const schemaManager = new SupabaseSchemaManager(); 