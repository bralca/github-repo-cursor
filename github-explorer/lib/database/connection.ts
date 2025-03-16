import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

// Set debug mode for sqlite3 when in development
if (process.env.NODE_ENV === 'development') {
  sqlite3.verbose();
}

// Connection cache to reuse database connections
let dbInstance: Database | null = null;

/**
 * Get a SQLite database connection
 * This creates a connection if one doesn't exist, or returns the cached one
 */
export async function getSQLiteDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }
  
  // Get database path from environment variable or use default at the root level
  const dbPath = process.env.SQLITE_DB_PATH || path.join(path.dirname(process.cwd()), 'github_explorer.db');
  
  // Log database connection for debugging
  console.log(`Opening SQLite database at: ${dbPath}`);
  
  // Ensure the directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  try {
    // Open the database with improved settings
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    
    // Cache the database instance
    dbInstance = db;
    
    // Set some pragmas for performance
    await db.exec('PRAGMA journal_mode = WAL;');     // Write-Ahead Logging for better concurrency
    await db.exec('PRAGMA synchronous = NORMAL;');   // Slightly higher performance with decent safety
    await db.exec('PRAGMA foreign_keys = ON;');      // Enforce foreign key constraints
    await db.exec('PRAGMA temp_store = MEMORY;');    // Store temp tables and indices in memory
    
    console.log('SQLite database connection established successfully');
    return db;
  } catch (error) {
    console.error('Error opening SQLite database:', error);
    throw new Error(`Failed to open SQLite database at ${dbPath}: ${error}`);
  }
}

/**
 * Execute a database operation with a connection
 * @param callback The operation to execute with the database connection
 * @returns The result of the callback
 */
export async function withDb<T>(callback: (db: Database) => Promise<T>): Promise<T> {
  const db = await getSQLiteDb();
  
  try {
    // Execute the callback with the database connection
    return await callback(db);
  } catch (error) {
    console.error('Error executing database operation:', error);
    throw error;
  }
} 