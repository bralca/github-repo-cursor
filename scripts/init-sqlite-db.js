/**
 * SQLite Database Initialization Script
 * 
 * This script creates the necessary pipeline tables in the SQLite database
 * if they don't already exist. It's meant to be run once during setup.
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get database path from environment or use default
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'github_explorer.db');

async function initializeDatabase() {
  console.log(`Initializing SQLite database at: ${dbPath}`);
  
  // Check if the database directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Open database connection
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  try {
    console.log('Creating pipeline tables if they don\'t exist...');
    
    // Create pipeline_schedules table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS pipeline_schedules (
        id TEXT PRIMARY KEY,
        pipeline_type TEXT NOT NULL,
        cron_expression TEXT,
        is_active BOOLEAN DEFAULT 0,
        parameters TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(pipeline_type)
      );
    `);
    
    // Create pipeline_history table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS pipeline_history (
        id TEXT PRIMARY KEY,
        pipeline_type TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        items_processed INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes for faster queries
    console.log('Creating indexes...');
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_type ON pipeline_schedules(pipeline_type);
      CREATE INDEX IF NOT EXISTS idx_pipeline_schedules_active ON pipeline_schedules(is_active);
      
      CREATE INDEX IF NOT EXISTS idx_pipeline_history_type ON pipeline_history(pipeline_type);
      CREATE INDEX IF NOT EXISTS idx_pipeline_history_status ON pipeline_history(status);
      CREATE INDEX IF NOT EXISTS idx_pipeline_history_started_at ON pipeline_history(started_at);
    `);
    
    // Insert default pipeline schedules if they don't exist
    console.log('Inserting default pipeline schedules...');
    
    const pipelineTypes = [
      { id: uuidv4(), type: 'github_sync', cron: '0 0 * * *', active: 0 },
      { id: uuidv4(), type: 'data_processing', cron: '0 */3 * * *', active: 0 },
      { id: uuidv4(), type: 'data_enrichment', cron: '0 */6 * * *', active: 0 },
      { id: uuidv4(), type: 'ai_analysis', cron: '0 */12 * * *', active: 0 }
    ];
    
    for (const pipeline of pipelineTypes) {
      await db.run(`
        INSERT OR IGNORE INTO pipeline_schedules 
        (id, pipeline_type, cron_expression, is_active, parameters) 
        VALUES (?, ?, ?, ?, ?)
      `, [pipeline.id, pipeline.type, pipeline.cron, pipeline.active, '{}']);
    }
    
    // Verify tables were created
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Database tables:');
    tables.forEach(table => console.log(`- ${table.name}`));
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Run the initialization
initializeDatabase().catch(err => {
  console.error('Unhandled error during database initialization:', err);
  process.exit(1);
}); 