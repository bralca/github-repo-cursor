import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Set debug mode for sqlite3 when in development
if (process.env.NODE_ENV === 'development') {
  sqlite3.verbose();
  console.log('SQLite verbose mode enabled for development');
}

// Connection cache to reuse database connections
let dbInstance: Database | null = null;

/**
 * Get a SQLite database connection
 * This creates a connection if one doesn't exist, or returns the cached one
 */
export async function getSQLiteDb(): Promise<Database> {
  if (dbInstance) {
    console.log('Reusing existing database connection');
    return dbInstance;
  }
  
  // Use the DB_PATH environment variable
  if (!process.env.DB_PATH) {
    console.error('DB_PATH environment variable is not set');
    throw new Error('DB_PATH environment variable is not set. Please configure it in your .env file.');
  }
  
  const dbPath = process.env.DB_PATH;
  console.log(`Current CWD: ${process.cwd()}`);
  console.log(`DB_PATH from environment: ${dbPath}`);
  console.log(`SQLITE_DB_PATH from environment: ${process.env.SQLITE_DB_PATH || 'not set'}`);
  
  // Check if the file exists
  try {
    const fs = require('fs');
    const exists = fs.existsSync(dbPath);
    console.log(`Database file exists: ${exists}`);
    if (exists) {
      const stats = fs.statSync(dbPath);
      console.log(`Database file size: ${stats.size} bytes`);
    }
  } catch (err) {
    console.error('Error checking if database file exists:', err);
  }
  
  // Log database connection for debugging
  console.log(`Opening SQLite database at: ${dbPath}`);
  
  try {
    // Open the database
    console.log('Attempting to open database connection...');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    
    // Cache the database instance
    console.log('Database connection opened successfully, caching connection');
    dbInstance = db;
    
    // Set some pragmas for performance
    console.log('Setting database pragmas...');
    await db.exec('PRAGMA journal_mode = WAL;');     // Write-Ahead Logging for better concurrency
    await db.exec('PRAGMA synchronous = NORMAL;');   // Slightly higher performance with decent safety
    await db.exec('PRAGMA foreign_keys = ON;');      // Enforce foreign key constraints
    await db.exec('PRAGMA temp_store = MEMORY;');    // Store temp tables and indices in memory
    
    console.log('SQLite database connection established successfully');
    
    // Test query to verify connection
    try {
      const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('Found tables in database:', tables.map(t => t.name).join(', '));
    } catch (err) {
      console.error('Error listing tables:', err);
    }
    
    return db;
  } catch (error) {
    console.error('Error opening SQLite database:', error);
    throw error;
  }
}

/**
 * Alias for getSQLiteDb for better readability in query files
 * @returns A database connection
 */
export const getDBConnection = getSQLiteDb;

/**
 * Execute a database operation with a connection
 * @param callback The operation to execute with the database connection
 * @returns The result of the callback
 */
export async function withDb<T>(callback: (db: Database) => Promise<T>): Promise<T> {
  console.log('withDb called, getting database connection');
  const db = await getSQLiteDb();
  
  try {
    // Execute the callback with the database connection
    console.log('Executing database operation');
    return await callback(db);
  } catch (error) {
    console.error('Error executing database operation:', error);
    throw error;
  }
} 