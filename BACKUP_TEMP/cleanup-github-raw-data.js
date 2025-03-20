// cleanup-github-raw-data.js
// This script safely removes the github_raw_data table after verifying
// that the closed_merge_requests_raw table is properly set up.

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const DEFAULT_DB_PATH = path.join(__dirname, 'github_explorer.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;
const BACKUP_DB_PATH = `${DB_PATH}.backup-${Date.now()}.db`;

async function cleanup() {
  try {
    console.log('Starting database cleanup process...');
    console.log(`Database path: ${DB_PATH}`);
    
    // Check if the database file exists
    if (!fs.existsSync(DB_PATH)) {
      console.error(`Database file not found at ${DB_PATH}`);
      process.exit(1);
    }
    
    // Get the initial file size for comparison
    const initialSizeInBytes = fs.statSync(DB_PATH).size;
    const initialSizeInGB = (initialSizeInBytes / (1024 * 1024 * 1024)).toFixed(2);
    console.log(`Current database size: ${initialSizeInGB} GB`);
    
    // Open the database connection
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    
    // Check if the tables exist
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    
    const tableNames = tables.map(t => t.name);
    console.log('Existing tables:', tableNames);
    
    // Verify the closed_merge_requests_raw table exists
    if (!tableNames.includes('closed_merge_requests_raw')) {
      console.error('The closed_merge_requests_raw table does not exist. Aborting process.');
      await db.close();
      process.exit(1);
    }
    
    // Get record count in closed_merge_requests_raw
    const recordCount = await db.get('SELECT COUNT(*) as count FROM closed_merge_requests_raw');
    console.log(`Records in closed_merge_requests_raw: ${recordCount.count}`);
    
    // If the github_raw_data table exists, remove it
    if (tableNames.includes('github_raw_data')) {
      // Create a backup before making changes
      console.log(`Creating database backup at ${BACKUP_DB_PATH}`);
      fs.copyFileSync(DB_PATH, BACKUP_DB_PATH);
      console.log('Database backup created successfully.');
      
      // Get the count of records in the old table for comparison
      const oldCount = await db.get('SELECT COUNT(*) as count FROM github_raw_data');
      console.log(`Records in github_raw_data: ${oldCount.count}`);
      
      // Drop the old table
      console.log('Dropping github_raw_data table...');
      await db.exec('DROP TABLE IF EXISTS github_raw_data');
      console.log('Table dropped successfully.');
      
      // Run VACUUM to reclaim space
      console.log('Running VACUUM to reclaim disk space (this may take a while)...');
      await db.exec('VACUUM');
      console.log('VACUUM completed successfully.');
      
      // Get the new file size for comparison
      const finalSizeInBytes = fs.statSync(DB_PATH).size;
      const finalSizeInGB = (finalSizeInBytes / (1024 * 1024 * 1024)).toFixed(2);
      const savedSizeInGB = (initialSizeInBytes - finalSizeInBytes) / (1024 * 1024 * 1024);
      const percentReduction = ((initialSizeInBytes - finalSizeInBytes) / initialSizeInBytes * 100).toFixed(2);
      
      console.log(`Final database size: ${finalSizeInGB} GB`);
      console.log(`Space saved: ${savedSizeInGB.toFixed(2)} GB (${percentReduction}% reduction)`);
    } else {
      console.log('The github_raw_data table does not exist. Nothing to clean up.');
      
      // Run VACUUM anyway to ensure the database is optimized
      console.log('Running VACUUM to optimize the database...');
      await db.exec('VACUUM');
      console.log('VACUUM completed successfully.');
      
      // Get the optimized file size
      const finalSizeInBytes = fs.statSync(DB_PATH).size;
      const finalSizeInGB = (finalSizeInBytes / (1024 * 1024 * 1024)).toFixed(2);
      console.log(`Optimized database size: ${finalSizeInGB} GB`);
      
      // Calculate the size difference from a known previous size (11GB was the original approximate size)
      const originalSizeInGB = 11.0; // Approximate original size with github_raw_data
      const estimatedSavingsInGB = originalSizeInGB - finalSizeInGB;
      const estimatedPercentReduction = ((originalSizeInGB - finalSizeInGB) / originalSizeInGB * 100).toFixed(2);
      
      if (estimatedSavingsInGB > 0) {
        console.log(`Estimated space saved: ${estimatedSavingsInGB.toFixed(2)} GB (${estimatedPercentReduction}% reduction from original ~11GB size)`);
      }
    }
    
    // Verify that the closed_merge_requests_raw table still exists and has the expected count
    const verifyCount = await db.get('SELECT COUNT(*) as count FROM closed_merge_requests_raw');
    console.log(`Verified records in closed_merge_requests_raw: ${verifyCount.count}`);
    
    // Close the database connection
    await db.close();
    console.log('Database connection closed.');
    console.log('Process completed successfully.');
    
  } catch (error) {
    console.error('Error during process:', error);
    process.exit(1);
  }
}

// Run the process
cleanup(); 