/**
 * Database Setup Script
 * 
 * This script sets up the database for the GitHub Explorer application.
 * It uses the SupabaseSchemaManager with Management API to execute migrations 
 * and ensure all required tables exist.
 */

import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { SupabaseSchemaManager } from '../services/supabase/supabase-schema-manager.js';
import { managementClient } from '../services/supabase/supabase-management-api.js';
import { logger } from '../utils/logger.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to migrations directory
const MIGRATIONS_PATH = path.join(__dirname, '..', 'migrations');

/**
 * Required tables for the application to function
 */
const REQUIRED_TABLES = [
  'pipeline_schedules',
  'pipeline_configurations',
  'notification_settings'
];

/**
 * Run the database setup
 */
async function setupDatabase() {
  logger.info('====================================');
  logger.info('Starting GitHub Explorer Database Setup');
  logger.info('====================================');
  
  try {
    // Check for required environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      logger.error('Missing required environment variables: SUPABASE_URL and SUPABASE_KEY must be set');
      process.exit(1);
    }
    
    if (!process.env.SUPABASE_SERVICE_KEY) {
      logger.warn('SUPABASE_SERVICE_KEY not set - some schema operations may fail');
    }
    
    if (!process.env.SUPABASE_PROJECT_ID) {
      logger.warn('SUPABASE_PROJECT_ID not set - Management API operations will not work');
    }
    
    // Create and initialize the schema manager
    const schemaManager = new SupabaseSchemaManager({
      migrationsPath: MIGRATIONS_PATH,
      clientId: 'setup_database'
    });
    await schemaManager.initialize();
    
    // Run migrations using Management API
    logger.info('Running database migrations...');
    const migrationResults = await schemaManager.runMigrations({
      continueOnError: true  // Continue even if some migrations fail
    });
    
    if (migrationResults.failedFiles > 0) {
      logger.warn(`${migrationResults.failedFiles} migration(s) failed. See logs for details.`);
    } else {
      logger.info(`Successfully executed ${migrationResults.executedFiles} migration files`);
    }
    
    // Verify required tables
    logger.info('Verifying required tables...');
    let allTablesExist = true;
    
    for (const tableName of REQUIRED_TABLES) {
      // Check using Management API first
      const exists = await schemaManager.tableExists(tableName);
      
      if (!exists) {
        allTablesExist = false;
        logger.warn(`Required table does not exist: ${tableName}`);
        
        // Try to create the missing table using fallback schema
        logger.info(`Attempting to create ${tableName} table...`);
        
        // Get the SQL for the table
        const schema = getTableSchema(tableName);
        if (!schema) {
          logger.error(`No schema definition found for table: ${tableName}`);
          continue;
        }
        
        // Generate the SQL
        const sql = generateTableSql(tableName, schema);
        
        // Create the table
        const created = await schemaManager.createTableIfNotExists(tableName, sql);
        
        if (created) {
          logger.info(`Successfully created table: ${tableName}`);
        } else {
          logger.error(`Failed to create table: ${tableName}`);
        }
      } else {
        logger.info(`Table exists: ${tableName}`);
      }
    }
    
    if (allTablesExist) {
      logger.info('All required tables exist');
    }
    
    // Database setup summary
    logger.info('====================================');
    logger.info('Database Setup Summary:');
    logger.info(`Total migrations: ${migrationResults.totalFiles}`);
    logger.info(`Successful migrations: ${migrationResults.executedFiles}`);
    logger.info(`Failed migrations: ${migrationResults.failedFiles}`);
    logger.info('====================================');
    
    if (migrationResults.failedFiles > 0 && !allTablesExist) {
      logger.warn('Database setup completed with warnings. Some required tables may be missing.');
      process.exit(1);
    } else {
      logger.info('Database setup completed successfully');
      process.exit(0);
    }
  } catch (error) {
    logger.error('Database setup failed', { error });
    process.exit(1);
  }
}

/**
 * Get the schema definition for a table
 * @param {string} tableName - Name of the table
 * @returns {Object|null} Schema definition
 */
function getTableSchema(tableName) {
  // Define schemas for required tables
  const schemas = {
    'pipeline_schedules': {
      columns: {
        id: { 
          type: 'UUID', 
          primaryKey: true, 
          default: 'uuid_generate_v4()' 
        },
        pipeline_type: { 
          type: 'TEXT', 
          notNull: true 
        },
        schedule_name: { 
          type: 'TEXT', 
          notNull: true 
        },
        cron_expression: { 
          type: 'TEXT', 
          notNull: true 
        },
        configuration_id: { 
          type: 'UUID' 
        },
        is_active: { 
          type: 'BOOLEAN', 
          notNull: true, 
          default: 'TRUE' 
        },
        last_run_at: { 
          type: 'TIMESTAMPTZ' 
        },
        next_run_at: { 
          type: 'TIMESTAMPTZ' 
        },
        last_result: { 
          type: 'JSONB' 
        },
        created_by: { 
          type: 'UUID' 
        },
        created_at: { 
          type: 'TIMESTAMPTZ', 
          notNull: true, 
          default: 'NOW()' 
        },
        updated_at: { 
          type: 'TIMESTAMPTZ' 
        },
        time_zone: { 
          type: 'TEXT', 
          notNull: true, 
          default: "'UTC'" 
        }
      },
      indexes: [
        { columns: ['pipeline_type'] },
        { columns: ['is_active'] },
        { columns: ['next_run_at'] }
      ]
    },
    
    'pipeline_configurations': {
      columns: {
        id: { 
          type: 'UUID', 
          primaryKey: true, 
          default: 'uuid_generate_v4()' 
        },
        name: { 
          type: 'TEXT', 
          notNull: true 
        },
        pipeline_type: { 
          type: 'TEXT', 
          notNull: true 
        },
        description: { 
          type: 'TEXT' 
        },
        configuration: { 
          type: 'JSONB', 
          notNull: true, 
          default: "'{}'::jsonb" 
        },
        is_active: { 
          type: 'BOOLEAN', 
          notNull: true, 
          default: 'TRUE' 
        },
        is_default: { 
          type: 'BOOLEAN', 
          notNull: true, 
          default: 'FALSE' 
        },
        created_by: { 
          type: 'UUID' 
        },
        created_at: { 
          type: 'TIMESTAMPTZ', 
          notNull: true, 
          default: 'NOW()' 
        },
        updated_at: { 
          type: 'TIMESTAMPTZ' 
        },
        version: { 
          type: 'INTEGER', 
          notNull: true, 
          default: '1' 
        }
      },
      indexes: [
        { columns: ['pipeline_type'] },
        { columns: ['is_active'] },
        { columns: ['is_default'] }
      ]
    },
    
    'notification_settings': {
      columns: {
        id: { 
          type: 'UUID', 
          primaryKey: true, 
          default: 'uuid_generate_v4()' 
        },
        level: { 
          type: 'TEXT', 
          notNull: true 
        },
        email_enabled: { 
          type: 'BOOLEAN', 
          notNull: true, 
          default: 'FALSE' 
        },
        email_recipients: { 
          type: 'TEXT' 
        },
        webhook_enabled: { 
          type: 'BOOLEAN', 
          notNull: true, 
          default: 'FALSE' 
        },
        webhook_url: { 
          type: 'TEXT' 
        },
        is_active: { 
          type: 'BOOLEAN', 
          notNull: true, 
          default: 'TRUE' 
        },
        created_at: { 
          type: 'TIMESTAMPTZ', 
          notNull: true, 
          default: 'NOW()' 
        },
        updated_at: { 
          type: 'TIMESTAMPTZ' 
        }
      },
      indexes: [
        { columns: ['level'] }
      ],
      constraints: [
        'UNIQUE(level)'
      ]
    }
  };
  
  return schemas[tableName] || null;
}

/**
 * Generate SQL to create a table from a schema definition
 * @param {string} tableName - Name of the table
 * @param {Object} schema - Schema definition
 * @returns {string} SQL to create the table
 */
function generateTableSql(tableName, schema) {
  try {
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    
    // Add columns
    const columnDefs = [];
    for (const [columnName, columnDef] of Object.entries(schema.columns)) {
      let columnSql = `  "${columnName}" ${columnDef.type}`;
      
      if (columnDef.primaryKey) {
        columnSql += ' PRIMARY KEY';
      }
      
      if (columnDef.notNull) {
        columnSql += ' NOT NULL';
      }
      
      if (columnDef.default) {
        columnSql += ` DEFAULT ${columnDef.default}`;
      }
      
      columnDefs.push(columnSql);
    }
    
    sql += columnDefs.join(',\n');
    sql += '\n);\n';
    
    // Add indexes
    if (schema.indexes && schema.indexes.length > 0) {
      for (let i = 0; i < schema.indexes.length; i++) {
        const idx = schema.indexes[i];
        const indexName = `${tableName}_${idx.columns.join('_')}_idx`;
        
        sql += `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${idx.columns.join(', ')});\n`;
      }
    }
    
    return sql;
  } catch (error) {
    logger.error(`Error generating SQL for table ${tableName}`, { error });
    return null;
  }
}

// Run the setup
setupDatabase(); 