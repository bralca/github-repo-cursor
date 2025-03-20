// cleanup_database.js
// Script to remove the original github_raw_data table to save space
// This should only be run after verifying the closed_merge_requests_raw table works correctly

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import { exec } from 'child_process';
import readline from 'readline';

// Configuration
const DB_PATH = 'github_explorer.db';
const SOURCE_TABLE = 'github_raw_data';
const TARGET_TABLE = 'closed_merge_requests_raw';

async function main() {
  try {
    console.log('Starting database cleanup process...');
    
    // Connect to database
    console.log(`Connecting to database: ${DB_PATH}...`);
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    
    // Verify both tables exist
    const sourceExists = await checkTableExists(db, SOURCE_TABLE);
    const targetExists = await checkTableExists(db, TARGET_TABLE);
    
    if (!sourceExists) {
      console.error(`Error: Source table ${SOURCE_TABLE} doesn't exist!`);
      process.exit(1);
    }
    
    if (!targetExists) {
      console.error(`Error: Target table ${TARGET_TABLE} doesn't exist!`);
      console.error('You must run the migration script first.');
      process.exit(1);
    }
    
    // Check record counts in both tables
    const { sourceCount } = await db.get(`SELECT COUNT(*) as sourceCount FROM ${SOURCE_TABLE}`);
    const { targetCount } = await db.get(`SELECT COUNT(*) as targetCount FROM ${TARGET_TABLE}`);
    
    console.log(`Source table (${SOURCE_TABLE}) count: ${sourceCount}`);
    console.log(`Target table (${TARGET_TABLE}) count: ${targetCount}`);
    
    if (targetCount < sourceCount) {
      console.error(`Error: Target table has fewer records (${targetCount}) than source table (${sourceCount})!`);
      console.error('Migration may be incomplete. Aborting cleanup.');
      process.exit(1);
    }
    
    // Get the current database size
    const originalSize = fs.statSync(DB_PATH).size;
    console.log(`Current database size: ${formatSize(originalSize)}`);
    
    // Ask for confirmation
    if (!process.argv.includes('--force')) {
      const confirmed = await confirmAction(`Are you sure you want to remove the ${SOURCE_TABLE} table? This action cannot be undone. (y/n) `);
      if (!confirmed) {
        console.log('Operation cancelled by user.');
        process.exit(0);
      }
    }
    
    // Create a backup before removing the table
    console.log('Creating database backup...');
    const backupPath = `${DB_PATH}_backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`Backup created at: ${backupPath}`);
    
    // Drop the table
    console.log(`Removing ${SOURCE_TABLE} table...`);
    await db.exec(`DROP TABLE IF EXISTS ${SOURCE_TABLE}`);
    
    // Run VACUUM to reclaim space
    console.log('Running VACUUM to reclaim space...');
    await db.exec('VACUUM');
    
    // Close database connection
    await db.close();
    
    // Check new size
    const newSize = fs.statSync(DB_PATH).size;
    const savedSpace = originalSize - newSize;
    const percentSaved = (savedSpace / originalSize) * 100;
    
    console.log(`\nCleanup complete!`);
    console.log(`Original database size: ${formatSize(originalSize)}`);
    console.log(`New database size: ${formatSize(newSize)}`);
    console.log(`Space saved: ${formatSize(savedSpace)} (${percentSaved.toFixed(2)}%)`);
    console.log(`\nThe table ${SOURCE_TABLE} has been successfully removed.`);
    console.log(`A backup of the original database was created at: ${backupPath}`);
    console.log(`You should now update your code to use ${TARGET_TABLE} instead.`);
    
  } catch (error) {
    console.error('Error during database cleanup:', error);
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

function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

async function confirmAction(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 