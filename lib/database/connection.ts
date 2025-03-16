import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

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
  
  const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'github_explorer.db');
  console.log(`Opening SQLite database at: ${dbPath}`);
  
  try {
    // Open the database
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    
    // Cache the database instance
    dbInstance = db;
    
    // Set some pragmas for performance
    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec('PRAGMA synchronous = NORMAL;');
    
    return db;
  } catch (error) {
    console.error('Error opening SQLite database:', error);
    throw error;
  }
}

/**
 * Execute a database operation with a connection and ensure it's closed properly
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