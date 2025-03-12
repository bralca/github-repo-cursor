/**
 * Test script for the SupabaseSchemaManager
 * 
 * This script tests the functionality of the SupabaseSchemaManager
 * to ensure it can properly manage Supabase database schemas.
 */

import 'dotenv/config';
import { schemaManager } from '../services/supabase/supabase-schema-manager.js';
import { logger } from '../utils/logger.js';

// Sample test schemas
const TEST_TABLE_NAME = 'test_schema_manager';
const TEST_SCHEMA = {
  columns: {
    id: { type: 'UUID', primaryKey: true, default: 'uuid_generate_v4()' },
    name: { type: 'TEXT', notNull: true },
    description: { type: 'TEXT' },
    created_at: { type: 'TIMESTAMPTZ', notNull: true, default: 'NOW()' },
    is_active: { type: 'BOOLEAN', notNull: true, default: 'TRUE' }
  },
  indexes: [
    { columns: ['name'] }
  ]
};

// Test data for upsert
const TEST_DATA = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Test 1', description: 'First test record' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Test 2', description: 'Second test record' }
];

// Update data for testing upsert
const UPDATE_DATA = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Test 1 Updated', description: 'Updated description' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Test 3', description: 'New test record' }
];

/**
 * Run the test suite
 */
async function runTests() {
  try {
    logger.info('==============================================');
    logger.info('Starting SupabaseSchemaManager Tests');
    logger.info('==============================================');
    
    // Initialize the schema manager
    await schemaManager.initialize();
    logger.info('Schema manager initialized');
    
    // Test table check - first check if it exists
    let exists = await schemaManager.tableExists(TEST_TABLE_NAME);
    logger.info(`Test table exists: ${exists}`);
    
    if (exists) {
      // Drop the test table if it exists
      logger.info('Dropping test table to start fresh');
      const dropResult = await schemaManager.executeSql(`DROP TABLE IF EXISTS ${TEST_TABLE_NAME}`);
      if (dropResult.success) {
        logger.info('Test table dropped successfully');
      } else {
        logger.error('Failed to drop test table', { error: dropResult.error });
        process.exit(1);
      }
    }
    
    // Test table creation
    logger.info('Testing table creation...');
    const sql = schemaManager.generateTableSql(TEST_TABLE_NAME, TEST_SCHEMA);
    logger.debug('Generated SQL:', { sql });
    
    const created = await schemaManager.createTableIfNotExists(TEST_TABLE_NAME, sql);
    if (created) {
      logger.info('✅ Table creation test PASSED');
    } else {
      logger.error('❌ Table creation test FAILED');
      process.exit(1);
    }
    
    // Verify table exists after creation
    exists = await schemaManager.tableExists(TEST_TABLE_NAME);
    if (exists) {
      logger.info('✅ Table existence verification PASSED');
    } else {
      logger.error('❌ Table existence verification FAILED');
      process.exit(1);
    }
    
    // Test getting column information
    logger.info('Testing column information retrieval...');
    const columns = await schemaManager.getTableColumns(TEST_TABLE_NAME);
    
    if (columns && Object.keys(columns).length === Object.keys(TEST_SCHEMA.columns).length) {
      logger.info('✅ Column information test PASSED');
      logger.debug('Retrieved columns:', { columns });
    } else {
      logger.error('❌ Column information test FAILED', { 
        expected: Object.keys(TEST_SCHEMA.columns).length,
        found: columns ? Object.keys(columns).length : 0
      });
      if (columns) {
        logger.debug('Retrieved columns:', { columns });
      }
      process.exit(1);
    }
    
    // Test data insertion with upsert
    logger.info('Testing data upsert...');
    const upsertResult = await schemaManager.upsertData(TEST_TABLE_NAME, TEST_DATA, ['id']);
    
    if (upsertResult && upsertResult.data && upsertResult.data.length === TEST_DATA.length) {
      logger.info('✅ Data upsert test PASSED');
      logger.debug('Upsert result:', { count: upsertResult.data.length });
    } else {
      logger.error('❌ Data upsert test FAILED', { error: upsertResult.error });
      process.exit(1);
    }
    
    // Test data retrieval
    logger.info('Testing data retrieval...');
    const retrieveResult = await schemaManager.supabase.from(TEST_TABLE_NAME).select('*');
    
    if (retrieveResult.data && retrieveResult.data.length === TEST_DATA.length) {
      logger.info('✅ Data retrieval test PASSED');
      logger.debug('Retrieved data:', { count: retrieveResult.data.length });
    } else {
      logger.error('❌ Data retrieval test FAILED', { 
        error: retrieveResult.error,
        found: retrieveResult.data ? retrieveResult.data.length : 0,
        expected: TEST_DATA.length
      });
      process.exit(1);
    }
    
    // Test update with upsert (should update existing and insert new)
    logger.info('Testing update with upsert...');
    const updateResult = await schemaManager.upsertData(TEST_TABLE_NAME, UPDATE_DATA, ['id']);
    
    if (updateResult && updateResult.data && updateResult.data.length === UPDATE_DATA.length) {
      logger.info('✅ Update with upsert test PASSED');
    } else {
      logger.error('❌ Update with upsert test FAILED', { error: updateResult.error });
      process.exit(1);
    }
    
    // Verify data after update
    logger.info('Verifying data after update...');
    const afterUpdateResult = await schemaManager.supabase.from(TEST_TABLE_NAME).select('*');
    
    // We should have 3 records now (2 original + 1 new, with 1 updated)
    if (afterUpdateResult.data && afterUpdateResult.data.length === 3) {
      // Check that the update worked
      const updatedRecord = afterUpdateResult.data.find(
        r => r.id === '00000000-0000-0000-0000-000000000001'
      );
      
      if (updatedRecord && updatedRecord.name === 'Test 1 Updated') {
        logger.info('✅ Data verification after update PASSED');
      } else {
        logger.error('❌ Data verification after update FAILED - update didn\'t take effect');
        process.exit(1);
      }
    } else {
      logger.error('❌ Data verification after update FAILED', { 
        error: afterUpdateResult.error,
        found: afterUpdateResult.data ? afterUpdateResult.data.length : 0,
        expected: 3
      });
      process.exit(1);
    }
    
    // Clean up - drop the test table
    logger.info('Cleaning up - dropping test table');
    const finalDropResult = await schemaManager.executeSql(`DROP TABLE IF EXISTS ${TEST_TABLE_NAME}`);
    
    if (finalDropResult.success) {
      logger.info('Test table dropped successfully');
    } else {
      logger.warn('Failed to drop test table during cleanup', { error: finalDropResult.error });
    }
    
    // Final verification that the table no longer exists
    const finalExists = await schemaManager.tableExists(TEST_TABLE_NAME);
    if (!finalExists) {
      logger.info('✅ Final cleanup verification PASSED');
    } else {
      logger.warn('⚠️ Final cleanup verification FAILED - table still exists');
    }
    
    logger.info('==============================================');
    logger.info('SupabaseSchemaManager Tests Complete');
    logger.info('RESULT: All tests passed successfully');
    logger.info('==============================================');
    
    process.exit(0);
  } catch (error) {
    logger.error('Test failed with an unexpected error', { error });
    process.exit(1);
  }
}

// Run the tests
runTests(); 