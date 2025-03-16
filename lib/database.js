import { createClient } from '@supabase/supabase-js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const DEFAULT_DB_PATH = path.join(__dirname, '..', 'github_explorer.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;

// SQLite database instance
let sqliteDb = null;

// Supabase client for auth
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Determine the database type from environment
const dbType = process.env.DB_TYPE || 'supabase';

/**
 * Get the Supabase client (used for authentication)
 */
export function getSupabaseClient() {
  // Check if credentials are available
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key are required for Supabase operations. Check your .env file.');
  }
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get a SQLite database connection
 */
export async function getSQLiteDb() {
  if (sqliteDb) {
    return sqliteDb;
  }

  console.log(`Opening database at: ${DB_PATH}`);
  
  // Open and cache the database connection
  sqliteDb = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await sqliteDb.exec('PRAGMA foreign_keys = ON;');

  return sqliteDb;
}

/**
 * Get a database connection based on the configured database type
 */
export async function getDb() {
  if (dbType === 'sqlite') {
    return getSQLiteDb();
  } else {
    return getSupabaseClient();
  }
}

/**
 * Fetch GitHub raw data from the database
 * @param {string} entityType - The type of entity (repository, contributor, etc.)
 * @param {string} githubId - The GitHub ID of the entity
 */
export async function fetchGithubRawData(entityType, githubId) {
  if (dbType === 'sqlite') {
    const db = await getSQLiteDb();
    
    const row = await db.get(
      'SELECT * FROM closed_merge_requests_raw WHERE entity_type = ? AND github_id = ?',
      [entityType, githubId]
    );

    if (row) {
      // Parse the JSON data stored as text
      row.data = JSON.parse(row.data);
      return row;
    }
    
    return null;
  } else {
    // Use Supabase
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('github_raw_data')
      .select('*')
      .eq('entity_type', entityType)
      .eq('github_id', githubId)
      .single();

    if (error) {
      console.error('Error fetching data from Supabase:', error);
      return null;
    }

    return data;
  }
}

/**
 * Fetch closed merge request data from the database
 * @param {string} entityType - The type of entity (optional)
 * @param {string} githubId - The GitHub ID of the entity (optional)
 */
export async function fetchClosedMergeRequest(entityType, githubId) {
  if (dbType === 'sqlite') {
    const db = await getSQLiteDb();
    
    let query = 'SELECT * FROM closed_merge_requests_raw';
    const params = [];
    
    if (entityType && githubId) {
      query += ' WHERE entity_type = ? AND github_id = ?';
      params.push(entityType, githubId);
    } else if (entityType) {
      query += ' WHERE entity_type = ?';
      params.push(entityType);
    } else if (githubId) {
      query += ' WHERE github_id = ?';
      params.push(githubId);
    }
    
    query += ' LIMIT 1';
    
    const row = await db.get(query, params);

    if (row) {
      // Parse the JSON data stored as text
      row.data = JSON.parse(row.data);
      return row;
    }
    
    return null;
  } else {
    // For Supabase, continue using the github_raw_data table
    return fetchGithubRawData(entityType, githubId);
  }
}

/**
 * Store raw GitHub data in the database
 * @param {Object} record - The record to store
 */
export async function storeGithubRawData(record) {
  if (!record.entity_type || !record.github_id || !record.data) {
    throw new Error('entity_type, github_id, and data are required fields');
  }

  // Ensure record.data is a string for storage
  const jsonData = typeof record.data === 'object' 
    ? JSON.stringify(record.data) 
    : record.data;

  if (dbType === 'sqlite') {
    const db = await getSQLiteDb();
    const etag = record.etag || null;
    const apiEndpoint = record.api_endpoint || null;
    const fetchedAt = record.fetched_at || new Date().toISOString();
    const createdAt = new Date().toISOString();

    try {
      // For SQLite, use the closed_merge_requests_raw table
      await db.run(
        `INSERT OR REPLACE INTO closed_merge_requests_raw 
        (entity_type, github_id, data, fetched_at, api_endpoint, etag, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [record.entity_type, record.github_id, jsonData, fetchedAt, apiEndpoint, etag, createdAt]
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error storing data in SQLite:', error);
      return { success: false, error };
    }
  } else {
    // Use Supabase
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('github_raw_data')
      .upsert(
        {
          entity_type: record.entity_type,
          github_id: record.github_id,
          data: jsonData,
          fetched_at: record.fetched_at || new Date().toISOString(),
          api_endpoint: record.api_endpoint || null,
          etag: record.etag || null,
        },
        { onConflict: 'entity_type,github_id' }
      );

    if (error) {
      console.error('Error storing data in Supabase:', error);
      return { success: false, error };
    }

    return { success: true };
  }
}

/**
 * Store closed merge request data in the database
 * @param {Object} record - The data to store
 */
export async function storeClosedMergeRequest(record) {
  if (dbType === 'sqlite') {
    const db = await getSQLiteDb();
    
    // SQLite doesn't store JSON directly, so stringify it
    const jsonData = JSON.stringify(record.data);
    
    try {
      // Insert with auto-incrementing ID
      await db.run(
        `INSERT INTO closed_merge_requests_raw 
         (entity_type, github_id, data, fetched_at, api_endpoint, etag, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          record.entity_type,
          record.github_id,
          jsonData,
          record.fetched_at || new Date().toISOString(),
          record.api_endpoint,
          record.etag,
          record.created_at || new Date().toISOString()
        ]
      );
      
      return true;
    } catch (err) {
      console.error('Error storing merge request data in SQLite:', err);
      return false;
    }
  } else {
    // For Supabase, continue using the github_raw_data table
    return storeGithubRawData(record);
  }
}

/**
 * Query GitHub raw data from the database
 * @param {string} entityType - The type of entity (repository, contributor, etc.)
 * @param {Object} options - Query options (limit, offset, orderBy, etc.)
 */
export async function queryGithubRawData(entityType, options = {}) {
  const limit = options.limit || 10;
  const offset = options.offset || 0;
  const orderBy = options.orderBy || 'fetched_at';
  const order = options.order === 'asc' ? 'ASC' : 'DESC';
  
  if (dbType === 'sqlite') {
    const db = await getSQLiteDb();
    
    // For SQLite, use the closed_merge_requests_raw table
    let query = 'SELECT * FROM closed_merge_requests_raw';
    const params = [];
    
    if (entityType) {
      query += ' WHERE entity_type = ?';
      params.push(entityType);
    }
    
    query += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    try {
      const rows = await db.all(query, params);
      
      // Parse JSON data for each row
      return rows.map(row => {
        if (row.data) {
          try {
            row.data = JSON.parse(row.data);
          } catch (e) {
            console.error(`Error parsing JSON for row ${row.id}:`, e);
          }
        }
        return row;
      });
    } catch (error) {
      console.error('Error querying SQLite:', error);
      return [];
    }
  } else {
    // Use Supabase
    const supabase = getSupabaseClient();
    
    let query = supabase
      .from('github_raw_data')
      .select('*');
    
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    
    const { data, error } = await query
      .order(orderBy, { ascending: order === 'ASC' })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error querying data from Supabase:', error);
      return [];
    }
    
    return data || [];
  }
}

/**
 * Query closed merge requests data
 * @param {string} entityType - The type of entity to query (optional)
 * @param {Object} options - Query options (limit, offset, order)
 */
export async function queryClosedMergeRequests(entityType = null, options = {}) {
  const { limit = 10, offset = 0, orderBy = 'id', order = 'asc' } = options;
  
  if (dbType === 'sqlite') {
    const db = await getSQLiteDb();

    try {
      let query = 'SELECT * FROM closed_merge_requests_raw';
      const params = [];
      
      if (entityType) {
        query += ' WHERE entity_type = ?';
        params.push(entityType);
      }
      
      query += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      const rows = await db.all(query, params);

      // Parse the JSON data for each row
      return rows.map(row => ({
        ...row,
        data: JSON.parse(row.data)
      }));
    } catch (err) {
      console.error('Error querying merge requests from SQLite:', err);
      return [];
    }
  } else {
    // For Supabase, continue using the github_raw_data table
    return queryGithubRawData(entityType, options);
  }
}

/**
 * Close the database connection (for cleanup)
 */
export async function closeDb() {
  if (dbType === 'sqlite' && sqliteDb) {
    await sqliteDb.close();
    sqliteDb = null;
  }
} 