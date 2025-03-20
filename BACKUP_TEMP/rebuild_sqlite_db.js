// rebuild_sqlite_db.js
// Script to rebuild the SQLite database with proper IDs
// This extracts data from the current database and re-imports it with auto-incrementing IDs

import fs from 'fs';
import { exec } from 'child_process';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Configuration
const ORIGINAL_DB_PATH = 'github_explorer.db';
const NEW_DB_PATH = 'github_explorer_new.db';
const SCHEMA_FILE = 'manual_schema.sql';
const BATCH_SIZE = 500;

async function main() {
  try {
    console.log('Starting database rebuild process...');
    
    // Step 1: Make sure the original database exists
    if (!fs.existsSync(ORIGINAL_DB_PATH)) {
      console.error(`Error: Original database ${ORIGINAL_DB_PATH} not found`);
      process.exit(1);
    }
    
    // Step 2: Remove new database if it already exists
    if (fs.existsSync(NEW_DB_PATH)) {
      console.log(`Removing existing ${NEW_DB_PATH}...`);
      fs.unlinkSync(NEW_DB_PATH);
    }
    
    // Step 3: Create new database with schema
    console.log(`Creating new database with schema...`);
    await createDatabaseWithSchema();
    
    // Step 4: Connect to both databases
    console.log('Connecting to databases...');
    const srcDb = await open({
      filename: ORIGINAL_DB_PATH,
      driver: sqlite3.Database
    });
    
    const destDb = await open({
      filename: NEW_DB_PATH,
      driver: sqlite3.Database
    });
    
    // Step 5: Copy github_raw_data with new IDs
    console.log('Copying github_raw_data with proper IDs...');
    await copyGithubRawData(srcDb, destDb);
    
    // Step 6: Close databases
    await srcDb.close();
    await destDb.close();
    
    console.log('\nDatabase rebuild complete!');
    console.log(`New database created at: ${NEW_DB_PATH}`);
    console.log('You can now rename this database to replace the original, if desired.');
    
  } catch (error) {
    console.error('Error during database rebuild:', error);
    process.exit(1);
  }
}

async function createDatabaseWithSchema() {
  return new Promise((resolve, reject) => {
    exec(`sqlite3 ${NEW_DB_PATH} < ${SCHEMA_FILE}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error creating database: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`Schema creation stderr: ${stderr}`);
      }
      resolve();
    });
  });
}

async function copyGithubRawData(srcDb, destDb) {
  try {
    // Get total count
    const { count } = await srcDb.get('SELECT COUNT(*) as count FROM github_raw_data');
    console.log(`Found ${count} records to migrate`);
    
    // Process in batches
    const totalBatches = Math.ceil(count / BATCH_SIZE);
    let processedCount = 0;
    let lastId = 0;
    
    // Prepare insert statement
    const insertStmt = await destDb.prepare(`
      INSERT INTO github_raw_data 
      (entity_type, github_id, data, fetched_at, api_endpoint, etag, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Begin transaction
    await destDb.exec('BEGIN TRANSACTION');
    
    // Process all batches
    for (let batch = 0; batch < totalBatches; batch++) {
      // Get a batch of records
      const rows = await srcDb.all(`
        SELECT * FROM github_raw_data LIMIT ${BATCH_SIZE} OFFSET ${batch * BATCH_SIZE}
      `);
      
      // Process each record
      for (const row of rows) {
        try {
          // Extract proper values from the record
          const entity_type = row.entity_type || null;
          const github_id = row.github_id || null;
          const data = row.data;
          const fetched_at = row.fetched_at || null;
          const api_endpoint = row.api_endpoint || null;
          const etag = row.etag || null;
          const created_at = row.created_at || new Date().toISOString();
          
          // Insert with new auto-incrementing ID
          await insertStmt.run(
            entity_type, 
            github_id, 
            data, 
            fetched_at, 
            api_endpoint, 
            etag, 
            created_at
          );
          
          processedCount++;
        } catch (err) {
          console.error(`Error processing record:`, err.message);
        }
      }
      
      // Commit in batches to avoid transaction getting too large
      if (batch % 10 === 0) {
        await destDb.exec('COMMIT');
        await destDb.exec('BEGIN TRANSACTION');
      }
      
      // Log progress
      const progress = Math.round((processedCount / count) * 100);
      console.log(`Processed ${processedCount}/${count} records (${progress}%)`);
    }
    
    // Final commit
    await destDb.exec('COMMIT');
    
    // Verify final count
    const { newCount } = await destDb.get('SELECT COUNT(*) as newCount FROM github_raw_data');
    console.log(`\nMigration complete: ${newCount} records in new database`);
    
    return true;
  } catch (error) {
    console.error('Error copying data:', error);
    await destDb.exec('ROLLBACK');
    throw error;
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 