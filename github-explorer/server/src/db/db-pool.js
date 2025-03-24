import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { getDbPath } from '../utils/db-path.js';

// Create database connection pool
const pool = {
  async query(sql, params = []) {
    const dbPath = getDbPath();
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    try {
      // For SELECT queries
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const result = await db.all(sql, params);
        return { rows: result };
      } 
      // For other queries (INSERT, UPDATE, DELETE, etc.)
      else {
        const result = await db.run(sql, params);
        return { 
          rowCount: result.changes,
          lastID: result.lastID
        };
      }
    } finally {
      await db.close();
    }
  }
};

export { pool }; 