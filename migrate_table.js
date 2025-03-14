// migrate_table.js
// Script to create a new table with proper structure and migrate data
// This creates closed_merge_requests_raw with auto-incrementing IDs

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Configuration
const DB_PATH = 'github_explorer.db';
const SOURCE_TABLE = 'github_raw_data';
const TARGET_TABLE = 'closed_merge_requests_raw';
const BATCH_SIZE = 500;

async function main() {
  try {
    console.log('Starting table migration process...');
    
    // Connect to database
    console.log(`Connecting to database: ${DB_PATH}...`);
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    
    // Check if target table already exists
    const tableExists = await checkTableExists(db, TARGET_TABLE);
    if (tableExists) {
      console.log(`Target table ${TARGET_TABLE} already exists.`);
      const dropTable = process.argv.includes('--force-drop');
      if (dropTable) {
        console.log(`Dropping existing table ${TARGET_TABLE}...`);
        await db.exec(`DROP TABLE IF EXISTS ${TARGET_TABLE}`);
      } else {
        console.log('Use --force-drop argument to drop and recreate the table.');
        process.exit(1);
      }
    }
    
    // Create new table with proper structure
    console.log(`Creating new table: ${TARGET_TABLE}...`);
    await createTargetTable(db);
    
    // Count source records
    const { count } = await db.get(`SELECT COUNT(*) as count FROM ${SOURCE_TABLE}`);
    console.log(`Found ${count} records to migrate from ${SOURCE_TABLE}`);
    
    // Copy data
    await migrateData(db, count);
    
    // Create indexes
    console.log('Creating indexes on the new table...');
    await createIndexes(db);
    
    // Close database
    await db.close();
    
    console.log('\nMigration complete!');
    console.log(`Table ${TARGET_TABLE} created with proper IDs.`);
    console.log('You can now update your code to use this table instead of the original.');
    
  } catch (error) {
    console.error('Error during table migration:', error);
    process.exit(1);
  }
}

async function checkTableExists(db, tableName) {
  const result = await db.get(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [tableName]
  );
  return !!result;
}

async function createTargetTable(db) {
  const createTableSQL = `
    CREATE TABLE ${TARGET_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT,
      github_id TEXT,
      data TEXT NOT NULL,
      fetched_at TEXT,
      api_endpoint TEXT,
      etag TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `;
  
  await db.exec(createTableSQL);
  console.log(`Table ${TARGET_TABLE} created successfully.`);
}

async function createIndexes(db) {
  const indexSQL = [
    `CREATE INDEX IF NOT EXISTS idx_${TARGET_TABLE}_entity_github_id ON ${TARGET_TABLE}(entity_type, github_id)`,
    `CREATE INDEX IF NOT EXISTS idx_${TARGET_TABLE}_fetched_at ON ${TARGET_TABLE}(fetched_at)`
  ];
  
  for (const sql of indexSQL) {
    await db.exec(sql);
  }
  
  console.log('Indexes created successfully.');
}

async function migrateData(db, totalCount) {
  try {
    // Process in batches
    const totalBatches = Math.ceil(totalCount / BATCH_SIZE);
    let processedCount = 0;
    
    // Prepare insert statement
    const insertStmt = await db.prepare(`
      INSERT INTO ${TARGET_TABLE} 
      (entity_type, github_id, data, fetched_at, api_endpoint, etag, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Begin transaction
    await db.exec('BEGIN TRANSACTION');
    
    // Process all batches
    for (let batch = 0; batch < totalBatches; batch++) {
      // Get a batch of records
      const rows = await db.all(`
        SELECT * FROM ${SOURCE_TABLE} LIMIT ${BATCH_SIZE} OFFSET ${batch * BATCH_SIZE}
      `);
      
      // Process each record
      for (const row of rows) {
        try {
          // Try to extract entity_type and github_id from the data if they're not present
          let entity_type = row.entity_type;
          let github_id = row.github_id;
          
          // If data is a JSON string, try to parse it
          if (row.data && typeof row.data === 'string') {
            try {
              const dataObj = JSON.parse(row.data);
              
              // For repository data, extract ID and set entity type
              if (!entity_type && dataObj.repository) {
                entity_type = 'repository';
              }
              
              if (!github_id && dataObj.repository && dataObj.repository.id) {
                github_id = dataObj.repository.id.toString();
              }
            } catch (e) {
              // If JSON parsing fails, just continue with existing values
            }
          }
          
          // Insert with auto-incrementing ID
          await insertStmt.run(
            entity_type || null, 
            github_id || null, 
            row.data, 
            row.fetched_at || null, 
            row.api_endpoint || null, 
            row.etag || null, 
            row.created_at || new Date().toISOString()
          );
          
          processedCount++;
        } catch (err) {
          console.error(`Error processing record:`, err.message);
        }
      }
      
      // Commit in batches to avoid transaction getting too large
      if (batch % 10 === 0) {
        await db.exec('COMMIT');
        await db.exec('BEGIN TRANSACTION');
      }
      
      // Log progress
      const progress = Math.round((processedCount / totalCount) * 100);
      console.log(`Processed ${processedCount}/${totalCount} records (${progress}%)`);
    }
    
    // Final commit
    await db.exec('COMMIT');
    
    // Verify final count
    const { newCount } = await db.get(`SELECT COUNT(*) as newCount FROM ${TARGET_TABLE}`);
    console.log(`\nMigration complete: ${newCount} records in new table`);
    
    if (newCount < totalCount) {
      console.warn(`Warning: Only ${newCount} out of ${totalCount} records were migrated!`);
    }
    
    return true;
  } catch (error) {
    console.error('Error migrating data:', error);
    await db.exec('ROLLBACK');
    throw error;
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 