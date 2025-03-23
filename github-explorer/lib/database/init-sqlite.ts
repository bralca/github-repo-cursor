import { getSQLiteDb } from './connection';
import { randomUUID } from 'crypto';

/**
 * Initialize SQLite database with required tables
 * This sets up all the tables needed for the pipeline management
 */
export async function initSQLiteDatabase() {
  console.log('Initializing SQLite database...');
  
  const db = await getSQLiteDb();
  
  try {
    // Enable foreign keys support
    await db.exec('PRAGMA foreign_keys = ON;');
    
    // Pipeline Status Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS pipeline_status (
        pipeline_type TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        is_running INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Pipeline History Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS pipeline_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pipeline_type TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        items_processed INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Pipeline Schedules Table - Create without description column first to ensure compatibility
    await db.exec(`
      CREATE TABLE IF NOT EXISTS pipeline_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pipeline_type TEXT UNIQUE NOT NULL,
        cron_expression TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Check if description column exists and add it if it doesn't
    try {
      // First check if the column exists
      const stmt = await db.prepare(
        "SELECT COUNT(*) as count FROM pragma_table_info('pipeline_schedules') WHERE name = 'description'"
      );
      const columnCheck = await stmt.get();
      await stmt.finalize();
      
      // If the column doesn't exist, add it
      if (columnCheck && columnCheck.count === 0) {
        console.log('Adding description column to pipeline_schedules table');
        await db.exec('ALTER TABLE pipeline_schedules ADD COLUMN description TEXT');
      }
    } catch (error: any) {
      console.error('Error checking or adding description column:', error);
    }
    
    // Insert default pipeline schedules if they don't exist - Simplified to avoid issues
    await db.exec(`
      INSERT OR IGNORE INTO pipeline_schedules 
        (pipeline_type, cron_expression, is_active) 
      VALUES 
        ('github_sync', '0 */2 * * *', 0),
        ('data_processing', '15 */2 * * *', 0),
        ('data_enrichment', '30 */4 * * *', 0),
        ('ai_analysis', '0 2 * * *', 0)
    `);
    
    // Update descriptions separately to handle tables with or without the column
    try {
      await db.exec(`
        UPDATE pipeline_schedules SET description = 'Sync GitHub data every 2 hours' WHERE pipeline_type = 'github_sync';
        UPDATE pipeline_schedules SET description = 'Process raw data every 2 hours' WHERE pipeline_type = 'data_processing';
        UPDATE pipeline_schedules SET description = 'Enrich entities every 4 hours' WHERE pipeline_type = 'data_enrichment';
        UPDATE pipeline_schedules SET description = 'Run AI analysis daily at 2 AM' WHERE pipeline_type = 'ai_analysis';
      `);
    } catch (error: any) {
      console.warn('Warning: Unable to update descriptions. This is expected if the column does not exist:', error.message);
    }
    
    // Insert default pipeline status records if they don't exist
    await db.exec(`
      INSERT OR IGNORE INTO pipeline_status 
        (pipeline_type, status, is_running, updated_at) 
      VALUES 
        ('github_sync', 'idle', 0, datetime('now')),
        ('data_processing', 'idle', 0, datetime('now')),
        ('data_enrichment', 'idle', 0, datetime('now')),
        ('ai_analysis', 'idle', 0, datetime('now'))
    `);
    
    // Raw Data Tables
    
    // Closed Merge Requests Raw Table with is_processed field
    await db.exec(`
      CREATE TABLE IF NOT EXISTS closed_merge_requests_raw (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        github_id TEXT NOT NULL,
        data TEXT NOT NULL,
        fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
        api_endpoint TEXT,
        etag TEXT,
        is_processed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    
    // Core Entity Tables - Create with minimal required fields
    
    // Repositories Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS repositories (
        id TEXT PRIMARY KEY,
        github_id BIGINT NOT NULL,
        name TEXT NOT NULL,
        full_name TEXT NOT NULL,
        description TEXT,
        is_enriched INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Contributors Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS contributors (
        id TEXT PRIMARY KEY,
        github_id BIGINT NOT NULL,
        username TEXT,
        name TEXT,
        avatar TEXT,
        is_enriched INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Merge Requests Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS merge_requests (
        id TEXT PRIMARY KEY,
        github_id INTEGER NOT NULL,
        repository_id TEXT NOT NULL,
        title TEXT NOT NULL,
        state TEXT NOT NULL,
        is_enriched INTEGER DEFAULT 0,
        author_id TEXT NOT NULL,
        author_github_id BIGINT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (repository_id) REFERENCES repositories(id),
        FOREIGN KEY (author_id) REFERENCES contributors(id)
      )
    `);
    
    // Commits Table with is_enriched field
    await db.exec(`
      CREATE TABLE IF NOT EXISTS commits (
        id TEXT PRIMARY KEY,
        github_id TEXT NOT NULL,
        sha TEXT NOT NULL,
        repository_id TEXT NOT NULL,
        message TEXT NOT NULL,
        complexity_score INTEGER,
        contributor_id TEXT,
        is_enriched INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (repository_id) REFERENCES repositories(id)
      )
    `);
    
    // Contributor Rankings Table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS contributor_rankings (
        id TEXT PRIMARY KEY,
        contributor_id TEXT NOT NULL,
        contributor_github_id INTEGER NOT NULL,
        rank_position INTEGER NOT NULL,
        total_score REAL NOT NULL,
        code_volume_score REAL NOT NULL,
        code_efficiency_score REAL NOT NULL,
        commit_impact_score REAL NOT NULL,
        collaboration_score REAL NOT NULL,
        repo_popularity_score REAL NOT NULL,
        repo_influence_score REAL NOT NULL,
        followers_score REAL NOT NULL,
        profile_completeness_score REAL NOT NULL,
        followers_count INTEGER,
        raw_lines_added INTEGER,
        raw_lines_removed INTEGER,
        raw_commits_count INTEGER,
        repositories_contributed INTEGER,
        calculation_timestamp TIMESTAMP NOT NULL
      )
    `);
    
    // Create indices for efficient querying of contributor rankings
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_contributor_rankings_contributor_id ON contributor_rankings(contributor_id)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_contributor_rankings_timestamp ON contributor_rankings(calculation_timestamp)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_contributor_rankings_rank ON contributor_rankings(rank_position)`);
    
    // Insert sample data for testing purposes if tables are empty
    const reposCount = await db.get('SELECT COUNT(*) as count FROM repositories');
    if (reposCount.count === 0) {
      console.log('Inserting sample data for testing...');
      
      // Sample repository
      const repoId = randomUUID();
      await db.run(`
        INSERT INTO repositories 
          (id, github_id, name, full_name, description, is_enriched) 
        VALUES 
          (?, 12345, 'sample-repo', 'org/sample-repo', 'A sample repository', 1)
      `, [repoId]);
      
      // Sample contributor
      const contributorId = randomUUID();
      await db.run(`
        INSERT INTO contributors 
          (id, github_id, username, name, avatar, is_enriched) 
        VALUES 
          (?, 67890, 'user1', 'User One', 'https://github.com/avatar.png', 1)
      `, [contributorId]);
      
      // Sample merge request
      const mrId = randomUUID();
      await db.run(`
        INSERT INTO merge_requests 
          (id, github_id, repository_id, title, state, is_enriched, author_id, author_github_id, description) 
        VALUES 
          (?, 100, ?, 'Add new feature', 'merged', 1, ?, 67890, 'This is a sample merge request')
      `, [mrId, repoId, contributorId]);
      
      // Sample commit
      const commitId = randomUUID();
      await db.run(`
        INSERT INTO commits 
          (id, github_id, sha, repository_id, message, complexity_score, contributor_id, is_enriched) 
        VALUES 
          (?, 'abc123', 'abc123def456', ?, 'Implement new feature', 75, ?, 1)
      `, [commitId, repoId, contributorId]);
      
      // Sample closed merge requests raw data
      await db.run(`
        INSERT INTO closed_merge_requests_raw 
          (entity_type, github_id, data, fetched_at, api_endpoint, is_processed) 
        VALUES 
          ('merge_request', '456', '{"id": 456, "title": "Another Sample PR"}', datetime('now', '-1 day'), 'api/pulls/456', 0)
      `);
      
      // Sample pipeline history entries
      await db.run(`
        INSERT INTO pipeline_history 
          (pipeline_type, status, started_at, completed_at, items_processed) 
        VALUES 
          ('github_sync', 'completed', datetime('now', '-1 day'), datetime('now', '-23 hours'), 10)
      `);
      
      console.log('Sample data inserted successfully!');
    }
    
    console.log('SQLite database schema initialized successfully!');
  } catch (error) {
    console.error('Error initializing SQLite database:', error);
    throw error;
  }
}

// Initialize the database when this module is imported
initSQLiteDatabase().catch(console.error); 