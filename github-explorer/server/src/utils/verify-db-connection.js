/**
 * Database Connection Verification Script
 * 
 * This script verifies the database connection by checking:
 * 1. If the database path exists
 * 2. If we can connect to it and run a simple query
 */

import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { getDbPath } from './db-path.js';

async function verifyDbConnection() {
  const dbPath = getDbPath();
  
  console.log('Database verification script');
  console.log('============================');
  console.log(`Database path: ${dbPath}`);
  
  // Check if file exists
  if (!fs.existsSync(dbPath)) {
    console.error(`ERROR: Database file not found at ${dbPath}`);
    process.exit(1);
  }
  
  console.log(`Database file exists (${(fs.statSync(dbPath).size / (1024 * 1024)).toFixed(2)} MB)`);
  
  // Try to connect
  try {
    console.log('Opening database connection...');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connection established successfully');
    
    // Run test query
    console.log('Running test query...');
    const tables = await db.all(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
    console.log(`Found ${tables.length} tables:`);
    tables.forEach(table => console.log(`- ${table.name}`));
    
    // Check repositories
    const repoCount = await db.get('SELECT COUNT(*) as count FROM repositories');
    console.log(`Repository count: ${repoCount.count}`);
    
    // Close connection
    await db.close();
    console.log('Database connection closed');
    console.log('Verification completed successfully');
  } catch (error) {
    console.error('ERROR connecting to database:', error);
    process.exit(1);
  }
}

// Run the verification
verifyDbConnection().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 