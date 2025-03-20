/**
 * Run Migration Script
 * 
 * This script runs a specific migration file against the SQLite database.
 * Usage: node run-migration.js <migration-file>
 */

import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDbPath } from '../utils/db-path.js';

// Get the migration file from command line arguments
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Error: No migration file specified');
  console.error('Usage: node run-migration.js <migration-file>');
  process.exit(1);
}

// Get the database path using our standardized utility
const dbPath = getDbPath();

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the migration file path
const migrationPath = path.resolve(__dirname, migrationFile);

if (!fs.existsSync(migrationPath)) {
  console.error(`Error: Migration file not found: ${migrationPath}`);
  process.exit(1);
}

// Read the migration SQL
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

async function runMigration() {
  console.log(`Running migration: ${migrationFile}`);
  console.log(`Database path: ${dbPath}`);
  
  try {
    // Open database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Start a transaction
    await db.exec('BEGIN TRANSACTION');
    
    try {
      // Run the migration SQL
      await db.exec(migrationSql);
      
      // If successful, commit the transaction
      await db.exec('COMMIT');
      console.log('Migration completed successfully');
    } catch (error) {
      // If there's an error, roll back the transaction
      await db.exec('ROLLBACK');
      console.error('Migration failed:', error);
      process.exit(1);
    } finally {
      // Close the database connection
      await db.close();
    }
  } catch (error) {
    console.error('Error opening database:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 